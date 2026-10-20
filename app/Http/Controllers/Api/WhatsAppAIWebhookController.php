<?php

namespace App\Http\Controllers\Api;

use App\Events\TransactionRecorded;
use App\Http\Controllers\Controller;
use App\Models\Bill;
use App\Models\BillPayment;
use App\Models\Category;
use App\Models\Debt;
use App\Models\PaymentMethod;
use App\Models\Target;
use App\Models\Transaction;
use App\Models\User;
use App\Services\TransactionEffects;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class WhatsAppAIWebhookController extends Controller
{
    public function __construct(private TransactionEffects $effects) {}

    /**
     * Verify the AI webhook secret token.
     */
    protected function verifySecretToken(Request $request): ?JsonResponse
    {
        $expectedSecret = config('services.ai_agent.secret');

        // Check header 'X-AI-Secret-Key' or 'Authorization: Bearer ...' or query param 'secret'
        $providedSecret = $request->header('X-AI-Secret-Key');
        if (! $providedSecret) {
            $bearer = $request->bearerToken();
            $providedSecret = $bearer ?: $request->query('secret');
        }

        if (empty($expectedSecret) || empty($providedSecret) || ! hash_equals((string) $expectedSecret, (string) $providedSecret)) {
            Log::warning('WhatsApp AI Webhook: Unauthorized access attempt', [
                'ip' => $request->ip(),
                'has_secret' => ! empty($providedSecret),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized: Token rahasia AI Agent tidak valid atau belum dikirimkan.',
            ], 401);
        }

        return null;
    }

    /**
     * Resolve user by sender_id, sender_phone, or phone number embedded in message text.
     * Also auto-links whatsapp_lid if newly discovered.
     */
    protected function resolveUser(Request $request): ?User
    {
        $senderId = $request->input('sender_id') ?? $request->input('sender_lid');
        $senderPhone = $request->input('sender_phone');
        $message = $request->input('message') ?? $request->input('text') ?? $request->input('title') ?? '';

        $user = null;
        if ($senderId) {
            $user = User::findByWhatsAppIdentifier($senderId);
        }

        if (! $user && $senderPhone) {
            $user = User::findByWhatsAppIdentifier($senderPhone);
        }

        // 3. Fallback: Check if message contains a registered phone number (e.g. "Halo FinanceTrack! (081234567890)")
        if (! $user && ! empty($message)) {
            if (preg_match('/(?:08|628|\+628)\d{7,13}/', (string) $message, $matches)) {
                $user = User::findByWhatsAppIdentifier($matches[0]);
            }
        }

        // Auto-link whatsapp_lid if user was matched by phone and has no LID yet
        if ($user && empty($user->whatsapp_lid)) {
            if ($senderId && str_contains($senderId, '@lid')) {
                $user->update(['whatsapp_lid' => $senderId]);
            } elseif ($senderPhone && str_contains($senderPhone, '@lid')) {
                $user->update(['whatsapp_lid' => $senderPhone]);
            }
        }

        return $user;
    }

    /**
     * Store a transaction recorded by WhatsApp AI Agent.
     */
    public function storeTransaction(Request $request): JsonResponse
    {
        if ($authError = $this->verifySecretToken($request)) {
            return $authError;
        }

        $validated = $request->validate([
            'sender_phone' => 'nullable|string',
            'sender_id' => 'nullable|string',
            'sender_lid' => 'nullable|string',
            'type' => 'required|in:pengeluaran,pemasukan,tabungan',
            'amount' => 'required|numeric|min:1',
            'title' => 'required|string|max:255',
            'category' => 'nullable|string|max:255',
            'payment_method' => 'nullable|string|max:255',
            'date' => 'nullable|date',
            'description' => 'nullable|string|max:1000',
        ]);

        $senderId = $request->input('sender_id') ?? $request->input('sender_lid');
        $senderPhone = $request->input('sender_phone');

        if (empty($senderId) && empty($senderPhone)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Parameter pengirim (sender_phone atau sender_id) wajib dikirimkan.',
            ], 422);
        }

        $user = $this->resolveAuthorizedUser($request);

        // Debug logging to trace transaction attribution
        Log::info('WhatsApp AI Webhook: Incoming transaction request', [
            'raw_sender_phone' => $senderPhone,
            'raw_sender_id' => $senderId,
            'user_found' => $user instanceof User,
            'user_id' => $user instanceof User ? $user->id : null,
            'user_name' => $user instanceof User ? $user->name : null,
            'user_phone' => $user instanceof User ? $user->phone_number : null,
            'user_lid' => $user instanceof User ? $user->whatsapp_lid : null,
            'title' => $validated['title'] ?? 'N/A',
            'amount' => $validated['amount'] ?? 0,
            'ip' => $request->ip(),
        ]);

        if ($user instanceof JsonResponse) {
            return $user;
        }

        // Auto-seed default categories & payment methods if user has none
        if (Category::where('user_id', $user->id)->count() === 0) {
            $user->seedDefaultCategoriesAndPaymentMethods();
        }

        $finalCategory = $this->resolveCategory($user, $validated['type'], $validated['category'] ?? null);
        $finalMethod = $this->resolvePaymentMethod($user, $validated['payment_method'] ?? null);

        $trxDate = ! empty($validated['date']) ? Carbon::parse($validated['date'])->toDateString() : Carbon::now()->toDateString();
        $desc = ! empty($validated['description']) ? trim($validated['description']) : 'Dicatat otomatis via AI Agent WhatsApp';

        // Save transaction & execute reactive cross-entity sync in database transaction
        $transaction = null;
        DB::transaction(function () use ($user, $validated, $finalCategory, $finalMethod, $trxDate, $desc, &$transaction) {
            $transaction = Transaction::create([
                'user_id' => $user->id,
                'type' => $validated['type'],
                'amount' => (float) $validated['amount'],
                'category' => $finalCategory,
                'payment_method' => $finalMethod,
                'title' => $validated['title'],
                'description' => $desc,
                'date' => $trxDate,
            ]);

            // 1. Sync Tabungan
            if ($validated['type'] === 'tabungan') {
                $target = Target::where('user_id', $user->id)->where('name', $finalCategory)->first();
                if ($target) {
                    $target->current_amount += (float) $validated['amount'];
                    if ($target->current_amount >= $target->target_amount) {
                        $target->status = 'Tercapai';
                    }
                    $target->save();
                }
            }

            // 2. Sync Hutang / Piutang
            if (in_array($validated['type'], ['pengeluaran', 'pemasukan'])) {
                $this->syncDebtAmount($user->id, $finalCategory, (float) $validated['amount'], $validated['type']);
            }

            // 3. Sync Tagihan Rutin (Bill Payment)
            if ($validated['type'] === 'pengeluaran') {
                $this->syncBillPayment($user->id, $finalCategory, $trxDate);
            }
        });

        TransactionRecorded::broadcastAfterResponse(
            userId: $user->id,
            transaction: $transaction,
            action: 'created',
            source: 'whatsapp',
            message: "Transaksi baru masuk via WhatsApp Bot: {$transaction->title} (Rp ".number_format($transaction->amount, 0, ',', '.').')'
        );

        // Calculate up-to-date balances for instant user feedback
        $activeBalance = $this->activeBalance($user);

        // Current month expense
        $now = Carbon::parse($trxDate);
        $monthlyExpense = (float) Transaction::where('user_id', $user->id)
            ->where('type', 'pengeluaran')
            ->inMonth($now->year, $now->month)
            ->sum('amount');

        Carbon::setLocale('id');
        $dateFormatted = Carbon::parse($trxDate)->translatedFormat('d F Y');
        $amountFormatted = 'Rp '.number_format($transaction->amount, 0, ',', '.');
        $balanceFormatted = 'Rp '.number_format($activeBalance, 0, ',', '.');
        $monthlyExpFormatted = 'Rp '.number_format($monthlyExpense, 0, ',', '.');

        $typeIcon = match ($transaction->type) {
            'pemasukan' => '📈 *Pemasukan*',
            'pengeluaran' => '📉 *Pengeluaran*',
            'tabungan' => '🎯 *Tabungan*',
        };

        $replyMessage = "✅ *Transaksi Berhasil Dicatat!*\n\n"
            ."{$typeIcon}: {$transaction->title}\n"
            ."💰 *Nominal:* {$amountFormatted}\n"
            ."🏷 *Kategori:* {$transaction->category}\n"
            ."💳 *Metode:* {$transaction->payment_method}\n"
            ."📅 *Tanggal:* {$dateFormatted}\n\n"
            ."📊 *Status Dompet Anda:*\n"
            ."• Sisa Saldo Kas: *{$balanceFormatted}*\n"
            .'• Total Pengeluaran ('.$now->translatedFormat('F')."): *{$monthlyExpFormatted}*\n\n"
            .'Lihat pembukuan lengkap di web: '.url('/dashboard');

        return response()->json([
            'status' => 'success',
            'user' => [
                'name' => $user->name,
                'phone' => $user->phone_number,
                'tier' => $user->active_tier,
            ],
            'transaction' => [
                'id' => $transaction->id,
                'type' => $transaction->type,
                'amount' => (float) $transaction->amount,
                'amount_formatted' => $amountFormatted,
                'title' => $transaction->title,
                'category' => $transaction->category,
                'payment_method' => $transaction->payment_method,
                'date' => $transaction->date,
                'date_formatted' => $dateFormatted,
            ],
            'balance' => [
                'saldo_kas' => $activeBalance,
                'saldo_kas_formatted' => $balanceFormatted,
                'pengeluaran_bulan_ini' => $monthlyExpense,
                'pengeluaran_bulan_ini_formatted' => $monthlyExpFormatted,
            ],
            'message' => $replyMessage,
        ]);
    }

    /**
     * Get user context (categories, payment methods, targets, debts, bills)
     * so that Hermes AI can ground its natural language extraction in user-specific options.
     */
    public function getUserContext(Request $request): JsonResponse
    {
        if ($authError = $this->verifySecretToken($request)) {
            return $authError;
        }

        $validated = $request->validate([
            'sender_phone' => 'nullable|string',
            'sender_id' => 'nullable|string',
            'sender_lid' => 'nullable|string',
        ]);

        $senderId = $request->input('sender_id') ?? $request->input('sender_lid');
        $senderPhone = $request->input('sender_phone');

        $user = $this->resolveUser($request);

        Log::info('WhatsApp AI Webhook: Check-user request', [
            'raw_sender_phone' => $senderPhone,
            'raw_sender_id' => $senderId,
            'user_found' => (bool) $user,
            'user_id' => $user?->id,
            'user_name' => $user?->name,
            'user_phone' => $user?->phone_number,
            'user_lid' => $user?->whatsapp_lid,
            'ip' => $request->ip(),
        ]);

        if (! $user) {
            return response()->json([
                'status' => 'unregistered_phone',
                'message' => 'Akun WhatsApp belum terdaftar di FinanceTrack.',
                'can_transact' => false,
            ], 404);
        }

        $canTransact = $user->is_active && $user->canAccess('ai_agent');

        $categories = Category::where('user_id', $user->id)->get();
        $methods = PaymentMethod::where('user_id', $user->id)->pluck('name')->toArray();
        $targets = Target::where('user_id', $user->id)->where('status', 'Berjalan')->pluck('name')->toArray();
        $debts = Debt::where('user_id', $user->id)->where('status', 'belum_lunas')->pluck('name')->toArray();
        $bills = Bill::where('user_id', $user->id)->where('is_active', true)->pluck('name')->toArray();

        // Calculate active balance
        $totals = Transaction::where('user_id', $user->id)
            ->selectRaw('type, SUM(amount) as total')
            ->groupBy('type')
            ->pluck('total', 'type');

        $activeBalance = (float) $totals->get('pemasukan', 0) - (float) $totals->get('pengeluaran', 0) - (float) $totals->get('tabungan', 0);

        return response()->json([
            'status' => 'success',
            'user' => [
                'name' => $user->name,
                'phone' => $user->phone_number,
                'whatsapp_lid' => $user->whatsapp_lid,
                'is_active' => (bool) $user->is_active,
                'tier' => $user->active_tier,
                'can_transact' => $canTransact,
            ],
            'categories' => [
                'pemasukan' => $categories->where('type', 'pemasukan')->pluck('name')->values()->toArray(),
                'pengeluaran' => $categories->where('type', 'pengeluaran')->pluck('name')->values()->toArray(),
            ],
            'payment_methods' => ! empty($methods) ? $methods : ['Cash', 'E-Banking', 'E-Wallet'],
            'active_targets' => $targets,
            'active_debts' => $debts,
            'active_bills' => $bills,
            'current_balance' => $activeBalance,
            'current_balance_formatted' => 'Rp '.number_format($activeBalance, 0, ',', '.'),
            'message' => "Halo kak {$user->name}! 👋 Selamat datang di FinanceTrack.\n\nAkun Pro Plus Anda sudah aktif dan terhubung. Saya Fina, asisten keuangan pribadi Anda.\n\nAnda bisa langsung mencatat keuangan dengan mengetik santai (contoh: *Makan siang 25rb cash*) atau ketik *Cek saldo*.\n\nAda yang ingin Fina bantu catat hari ini?",
        ]);
    }

    /**
     * Get financial summary for "Cek Saldo" or "Ringkasan" commands.
     */
    public function getSummary(Request $request): JsonResponse
    {
        if ($authError = $this->verifySecretToken($request)) {
            return $authError;
        }

        $validated = $request->validate([
            'sender_phone' => 'nullable|string',
            'sender_id' => 'nullable|string',
            'sender_lid' => 'nullable|string',
        ]);

        $user = $this->resolveUser($request);

        if (! $user || ! $user->canAccess('ai_agent')) {
            return response()->json([
                'status' => 'error',
                'message' => 'Akun tidak ditemukan atau belum berlangganan Pro Plus.',
            ], 403);
        }

        Carbon::setLocale('id');
        $now = Carbon::now();

        // Current month metrics
        $monthTotals = Transaction::where('user_id', $user->id)
            ->inMonth($now->year, $now->month)
            ->selectRaw('type, SUM(amount) as total')
            ->groupBy('type')
            ->pluck('total', 'type');

        $inMonth = (float) $monthTotals->get('pemasukan', 0);
        $outMonth = (float) $monthTotals->get('pengeluaran', 0);
        $saveMonth = (float) $monthTotals->get('tabungan', 0);

        // All time balance
        $allTotals = Transaction::where('user_id', $user->id)
            ->selectRaw('type, SUM(amount) as total')
            ->groupBy('type')
            ->pluck('total', 'type');

        $balance = (float) $allTotals->get('pemasukan', 0) - (float) $allTotals->get('pengeluaran', 0) - (float) $allTotals->get('tabungan', 0);
        $totalTabungan = (float) Target::where('user_id', $user->id)->sum('current_amount');

        $message = '📊 *Ringkasan Keuangan Anda ('.$now->translatedFormat('F Y').")*\n\n"
            .'💰 *Saldo Kas Siap Pakai:* Rp '.number_format($balance, 0, ',', '.')."\n"
            .'🎯 *Total Tabungan Tersimpan:* Rp '.number_format($totalTabungan, 0, ',', '.')."\n\n"
            .'📈 *Pemasukan Bulan Ini:* Rp '.number_format($inMonth, 0, ',', '.')."\n"
            .'📉 *Pengeluaran Bulan Ini:* Rp '.number_format($outMonth, 0, ',', '.')."\n"
            .'🏦 *Tabungan Bulan Ini:* Rp '.number_format($saveMonth, 0, ',', '.')."\n\n"
            .'Selengkapnya kunjungi: '.url('/dashboard');

        return response()->json([
            'status' => 'success',
            'user_name' => $user->name,
            'balance' => $balance,
            'summary' => [
                'pemasukan' => $inMonth,
                'pengeluaran' => $outMonth,
                'tabungan' => $saveMonth,
            ],
            'message' => $message,
        ]);
    }

    /**
     * List the user's latest transactions so the AI can ask "which one?" before editing or deleting.
     */
    public function recentTransactions(Request $request): JsonResponse
    {
        if ($authError = $this->verifySecretToken($request)) {
            return $authError;
        }

        $validated = $request->validate([
            'sender_phone' => 'nullable|string',
            'sender_id' => 'nullable|string',
            'sender_lid' => 'nullable|string',
            'limit' => 'nullable|integer|min:1|max:20',
        ]);

        $user = $this->resolveAuthorizedUser($request);
        if ($user instanceof JsonResponse) {
            return $user;
        }

        Carbon::setLocale('id');
        $transactions = Transaction::where('user_id', $user->id)
            ->orderByDesc('id')
            ->limit($validated['limit'] ?? 5)
            ->get();

        if ($transactions->isEmpty()) {
            return response()->json([
                'status' => 'success',
                'transactions' => [],
                'message' => 'Belum ada transaksi yang tercatat.',
            ]);
        }

        $lines = $transactions->values()->map(fn (Transaction $t, int $index) => ($index + 1).'. '.$this->describeTransaction($t));

        return response()->json([
            'status' => 'success',
            'transactions' => $transactions->map(fn (Transaction $t) => $this->transactionPayload($t))->values(),
            'message' => "🧾 *Transaksi Terakhir Anda:*\n\n".$lines->implode("\n")."\n\nSebutkan nomor transaksi yang ingin diubah atau dihapus.",
        ]);
    }

    /**
     * Edit a transaction (default: the most recently recorded one), e.g. "tadi 10rb bukan 100rb".
     * Savings targets, debts and bill payments are re-synced exactly like editing on the web.
     */
    public function updateTransaction(Request $request): JsonResponse
    {
        if ($authError = $this->verifySecretToken($request)) {
            return $authError;
        }

        $validated = $request->validate([
            'sender_phone' => 'nullable|string',
            'sender_id' => 'nullable|string',
            'sender_lid' => 'nullable|string',
            'transaction_id' => 'nullable|integer',
            'type' => 'nullable|in:pengeluaran,pemasukan,tabungan',
            'amount' => 'nullable|numeric|min:1',
            'title' => 'nullable|string|max:255',
            'category' => 'nullable|string|max:255',
            'payment_method' => 'nullable|string|max:255',
            'date' => 'nullable|date',
            'description' => 'nullable|string|max:1000',
        ]);

        $changedFields = array_keys(array_filter(
            Arr::only($validated, ['type', 'amount', 'title', 'category', 'payment_method', 'date', 'description']),
            fn ($value) => $value !== null && $value !== ''
        ));

        if ($changedFields === []) {
            return response()->json([
                'status' => 'error',
                'message' => 'Tidak ada data yang diubah. Kirim minimal salah satu: type, amount, title, category, payment_method, date, atau description.',
            ], 422);
        }

        $user = $this->resolveAuthorizedUser($request);
        if ($user instanceof JsonResponse) {
            return $user;
        }

        $transaction = $this->findUserTransaction($user, $validated['transaction_id'] ?? null);
        if (! $transaction) {
            return $this->transactionNotFoundResponse();
        }

        $before = $this->describeTransaction($transaction);
        $oldType = $transaction->type;
        $oldCategory = $transaction->category;
        $oldDate = (string) $transaction->date;

        $newType = $validated['type'] ?? $transaction->type;
        $changes = Arr::only($validated, ['amount', 'title', 'description']);
        $changes = array_filter($changes, fn ($value) => $value !== null && $value !== '');
        $changes['type'] = $newType;

        if (! empty($validated['date'])) {
            $changes['date'] = Carbon::parse($validated['date'])->toDateString();
        }
        if (! empty($validated['payment_method'])) {
            $changes['payment_method'] = $this->resolvePaymentMethod($user, $validated['payment_method']);
        }
        // A new type needs a category of that type; otherwise only re-match when the AI sent one
        if (! empty($validated['category']) || $newType !== $oldType) {
            $changes['category'] = $this->resolveCategory($user, $newType, $validated['category'] ?? null);
        }

        $finalCategory = $changes['category'] ?? $transaction->category;
        // The installment link to a debt only stays valid for an expense still filed under "Hutang"
        if ($transaction->debt_id && ($newType !== 'pengeluaran' || $finalCategory !== 'Hutang')) {
            $changes['debt_id'] = null;
        }

        DB::transaction(function () use ($transaction, $changes, $oldType, $oldCategory, $oldDate, $user) {
            $this->effects->revert($transaction);
            $transaction->update($changes);
            $this->effects->apply($transaction);

            if ($oldType === 'pengeluaran') {
                $this->effects->syncBillPayment($user->id, $oldCategory, $oldDate);
            }
            if ($transaction->type === 'pengeluaran') {
                $this->effects->syncBillPayment($user->id, $transaction->category, (string) $transaction->date);
            }
        });

        TransactionRecorded::broadcastAfterResponse(
            userId: $user->id,
            transaction: $transaction,
            action: 'updated',
            source: 'whatsapp',
            message: "Transaksi diperbarui via WhatsApp Bot: {$transaction->title}"
        );

        $balance = $this->activeBalance($user);

        return response()->json([
            'status' => 'success',
            'transaction' => $this->transactionPayload($transaction),
            'balance' => [
                'saldo_kas' => $balance,
                'saldo_kas_formatted' => $this->formatRupiah($balance),
            ],
            'message' => "✏️ *Transaksi Berhasil Diperbarui!*\n\n"
                ."Sebelumnya: {$before}\n"
                .'Sekarang: '.$this->describeTransaction($transaction)."\n\n"
                .'💰 Sisa Saldo Kas: *'.$this->formatRupiah($balance).'*',
        ]);
    }

    /**
     * Delete a transaction (default: the most recently recorded one), e.g. "batalkan transaksi barusan".
     * Savings targets, debts and bill payments are rolled back exactly like deleting on the web.
     */
    public function deleteTransaction(Request $request): JsonResponse
    {
        if ($authError = $this->verifySecretToken($request)) {
            return $authError;
        }

        $validated = $request->validate([
            'sender_phone' => 'nullable|string',
            'sender_id' => 'nullable|string',
            'sender_lid' => 'nullable|string',
            'transaction_id' => 'nullable|integer',
        ]);

        $user = $this->resolveAuthorizedUser($request);
        if ($user instanceof JsonResponse) {
            return $user;
        }

        $transaction = $this->findUserTransaction($user, $validated['transaction_id'] ?? null);
        if (! $transaction) {
            return $this->transactionNotFoundResponse();
        }

        $description = $this->describeTransaction($transaction);
        $deletedPayload = $this->transactionPayload($transaction);

        DB::transaction(function () use ($transaction, $user) {
            $this->effects->revert($transaction);

            // Delete the linked bill payment first, then re-check the bill for that month
            BillPayment::where('transaction_id', $transaction->id)->delete();
            $transaction->delete();

            if ($transaction->type === 'pengeluaran') {
                $this->effects->syncBillPayment($user->id, $transaction->category, (string) $transaction->date);
            }
        });

        TransactionRecorded::broadcastAfterResponse(
            userId: $user->id,
            transaction: $transaction,
            action: 'deleted',
            source: 'whatsapp',
            message: "Transaksi dihapus via WhatsApp Bot: {$transaction->title}"
        );

        $balance = $this->activeBalance($user);

        return response()->json([
            'status' => 'success',
            'transaction' => $deletedPayload,
            'balance' => [
                'saldo_kas' => $balance,
                'saldo_kas_formatted' => $this->formatRupiah($balance),
            ],
            'message' => "🗑️ *Transaksi Berhasil Dihapus!*\n\n{$description}\n\n"
                .'💰 Sisa Saldo Kas: *'.$this->formatRupiah($balance).'*',
        ]);
    }

    /**
     * The user's transaction by id, or their most recently recorded one. Never another user's transaction.
     */
    protected function findUserTransaction(User $user, ?int $transactionId): ?Transaction
    {
        $query = Transaction::where('user_id', $user->id);

        return $transactionId
            ? $query->find($transactionId)
            : $query->orderByDesc('id')->first();
    }

    protected function transactionNotFoundResponse(): JsonResponse
    {
        return response()->json([
            'status' => 'transaction_not_found',
            'message' => 'Transaksi tidak ditemukan. Ketik *riwayat transaksi* untuk melihat daftar transaksi terakhir Anda.',
        ], 404);
    }

    /**
     * One-line WhatsApp description, e.g. "📉 Kopi — Rp 30.000 (Makanan, 20 Okt 2026)".
     */
    protected function describeTransaction(Transaction $transaction): string
    {
        $icon = match ($transaction->type) {
            'pemasukan' => '📈',
            'tabungan' => '🎯',
            default => '📉',
        };

        $date = Carbon::parse($transaction->date)->locale('id')->translatedFormat('d M Y');

        return "{$icon} {$transaction->title} — ".$this->formatRupiah((float) $transaction->amount)." ({$transaction->category}, {$date})";
    }

    /**
     * @return array<string, mixed>
     */
    protected function transactionPayload(Transaction $transaction): array
    {
        return [
            'id' => $transaction->id,
            'type' => $transaction->type,
            'amount' => (float) $transaction->amount,
            'amount_formatted' => $this->formatRupiah((float) $transaction->amount),
            'title' => $transaction->title,
            'category' => $transaction->category,
            'payment_method' => $transaction->payment_method,
            'date' => (string) $transaction->date,
        ];
    }

    protected function formatRupiah(float $amount): string
    {
        return 'Rp '.number_format($amount, 0, ',', '.');
    }

    /**
     * Resolve the sender and make sure they may use the AI Agent.
     * Returns the WhatsApp-ready error response when the number is unknown, suspended or not on Pro Plus.
     */
    protected function resolveAuthorizedUser(Request $request): User|JsonResponse
    {
        $user = $this->resolveUser($request);
        $senderId = $request->input('sender_id') ?? $request->input('sender_lid');
        $senderPhone = $request->input('sender_phone');

        // Case 1: Phone / LID not linked to any user
        if (! $user) {
            $identifier = $senderPhone ?? $senderId;

            return response()->json([
                'status' => 'unregistered_phone',
                'sender_identifier' => $identifier,
                'message' => "⚠️ *Akun WhatsApp Belum Terdaftar*\n\nAkun WhatsApp Anda ({$identifier}) belum ditautkan ke akun FinanceTrack mana pun.\n\nSilakan login ke web FinanceTrack lalu buka menu *Integrasi Agent AI* untuk menautkan nomor Anda.",
            ], 404);
        }

        // Case 2: User is suspended
        if (! $user->is_active) {
            return response()->json([
                'status' => 'account_suspended',
                'user_name' => $user->name,
                'message' => "⛔ *Akun Dinonaktifkan*\n\nHalo {$user->name}, akun FinanceTrack Anda sedang dinonaktifkan. Silakan hubungi admin kami untuk bantuan.",
            ], 403);
        }

        // Case 3: User is not Pro Plus
        if (! $user->canAccess('ai_agent')) {
            $currentTier = strtoupper($user->active_tier);

            return response()->json([
                'status' => 'tier_locked',
                'user_name' => $user->name,
                'current_tier' => $user->active_tier,
                'message' => "🔒 *Fitur Khusus Paket Pro Plus*\n\nHalo {$user->name}! Nomor Anda terdaftar pada paket *{$currentTier}*.\n\nPencatatan instan otomatis via WhatsApp Bot adalah fitur eksklusif untuk member *Paket Pro Plus*.\n\nSilakan upgrade paket langganan Anda di web: ".url('/berlangganan'),
            ], 403);
        }

        return $user;
    }

    /**
     * Match the AI's category against the user's own categories, active targets, debts and bills.
     */
    protected function resolveCategory(User $user, string $type, ?string $inputCategory): string
    {
        // Auto-seed default categories & payment methods if user has none
        if (Category::where('user_id', $user->id)->count() === 0) {
            $user->seedDefaultCategoriesAndPaymentMethods();
        }

        $inputCat = trim((string) $inputCategory);

        if ($type === 'tabungan') {
            // For tabungan, prefer matching an existing active target
            $activeTargets = Target::where('user_id', $user->id)->where('status', 'Berjalan')->get();
            if ($inputCat !== '') {
                $matchedTarget = $activeTargets->first(fn ($t) => strcasecmp($t->name, $inputCat) === 0);

                return $matchedTarget ? $matchedTarget->name : ($activeTargets->first()?->name ?? $inputCat);
            }

            return $activeTargets->first()?->name ?? 'Tabungan Impian';
        }

        // Match with existing categories of the specified type
        $typeCategories = Category::where('user_id', $user->id)->where('type', $type)->get();
        if ($inputCat === '') {
            return $typeCategories->first()?->name ?? 'Lainnya';
        }

        $matched = $typeCategories->first(fn ($c) => strcasecmp($c->name, $inputCat) === 0);
        if ($matched) {
            return $matched->name;
        }

        // Check if it matches an active Debt or Bill
        $matchedDebt = Debt::where('user_id', $user->id)->where('status', 'belum_lunas')->get()->first(fn ($d) => strcasecmp($d->name, $inputCat) === 0);
        if ($matchedDebt) {
            return $matchedDebt->name;
        }

        $matchedBill = Bill::where('user_id', $user->id)->where('is_active', true)->get()->first(fn ($b) => strcasecmp($b->category_name ?? $b->name, $inputCat) === 0);
        if ($matchedBill) {
            return 'Tagihan Rutin';
        }

        // Create category if user limits allow
        $catCount = Category::where('user_id', $user->id)->count();
        if (! $user->hasReachedLimit('category', $catCount)) {
            Category::create([
                'user_id' => $user->id,
                'name' => $inputCat,
                'type' => $type,
            ]);

            return $inputCat;
        }

        return $typeCategories->first()?->name ?? 'Lainnya';
    }

    /**
     * Match the AI's payment method against the user's methods (exact, then partial, e.g. "bca").
     */
    protected function resolvePaymentMethod(User $user, ?string $inputMethod): string
    {
        $userMethods = PaymentMethod::where('user_id', $user->id)->get();
        $inputMethod = trim((string) $inputMethod);

        if ($inputMethod === '') {
            return $userMethods->first()?->name ?? 'Cash';
        }

        $matchedMethod = $userMethods->first(fn ($m) => strcasecmp($m->name, $inputMethod) === 0)
            ?? $userMethods->first(fn ($m) => stripos($m->name, $inputMethod) !== false);

        return $matchedMethod ? $matchedMethod->name : $inputMethod;
    }

    /**
     * All-time cash balance: income minus expenses minus savings.
     */
    protected function activeBalance(User $user): float
    {
        $totals = Transaction::where('user_id', $user->id)
            ->selectRaw('type, SUM(amount) as total')
            ->groupBy('type')
            ->pluck('total', 'type');

        return (float) $totals->get('pemasukan', 0) - (float) $totals->get('pengeluaran', 0) - (float) $totals->get('tabungan', 0);
    }

    /**
     * Helper to sync debt amounts when transactions are recorded via AI.
     */
    protected function syncDebtAmount(int $userId, string $category, float $amount, string $type): void
    {
        $debt = Debt::where('user_id', $userId)
            ->where('name', $category)
            ->first();

        if ($debt) {
            if ($type === 'pengeluaran' && $debt->type === 'hutang') {
                $debt->remaining_amount -= $amount;
            } elseif ($type === 'pemasukan' && $debt->type === 'piutang') {
                $debt->remaining_amount -= $amount;
            }

            if ($debt->remaining_amount <= 0) {
                $debt->remaining_amount = 0;
                $debt->status = 'lunas';
            } else {
                $debt->status = 'belum_lunas';
            }

            $debt->save();
        }
    }

    /**
     * Helper to sync bill payments when an expense matches an active bill.
     */
    protected function syncBillPayment(int $userId, string $category, string $date): void
    {
        $normalizedCategory = strtolower(trim($category));

        if ($normalizedCategory === 'tagihan rutin') {
            $matchingBills = Bill::where('user_id', $userId)
                ->where('is_active', true)
                ->get();
        } else {
            $cleanCategory = trim(preg_replace('/^tagihan:\s*/i', '', $normalizedCategory));
            $matchingBills = Bill::where('user_id', $userId)
                ->where('is_active', true)
                ->where(function ($query) use ($normalizedCategory, $cleanCategory) {
                    $query->whereRaw('LOWER(TRIM(name)) = ?', [$normalizedCategory])
                        ->orWhereRaw('LOWER(TRIM(name)) = ?', [$cleanCategory]);
                })
                ->get();
        }

        if ($matchingBills->isEmpty()) {
            return;
        }

        $monthStr = Carbon::parse($date)->format('Y-m');

        foreach ($matchingBills as $bill) {
            $billName = strtolower(trim($bill->name ?? ''));

            $monthParts = explode('-', $monthStr);
            $queryYear = (int) ($monthParts[0] ?? date('Y'));
            $queryMonth = (int) ($monthParts[1] ?? date('m'));

            $matchingTransactions = Transaction::where('user_id', $userId)
                ->where('type', 'pengeluaran')
                ->inMonth($queryYear, $queryMonth)
                ->where(function ($q) use ($billName) {
                    $q->where(function ($sub) use ($billName) {
                        $sub->whereRaw('LOWER(TRIM(category)) = ?', ['tagihan rutin'])
                            ->where(function ($inner) use ($billName) {
                                $inner->whereRaw('LOWER(title) LIKE ?', ['%'.$billName.'%'])
                                    ->orWhereRaw('LOWER(description) LIKE ?', ['%'.$billName.'%']);
                            });
                    })
                        ->orWhereRaw('LOWER(TRIM(category)) = ?', [$billName]);
                })
                ->orderBy('date', 'desc')
                ->orderBy('id', 'desc')
                ->get();

            if ($matchingTransactions->isNotEmpty()) {
                $totalPaid = (float) $matchingTransactions->sum('amount');
                $latestTx = $matchingTransactions->first();

                BillPayment::updateOrCreate(
                    [
                        'bill_id' => $bill->id,
                        'month' => $monthStr,
                    ],
                    [
                        'user_id' => $userId,
                        'transaction_id' => $latestTx->id,
                        'amount' => $totalPaid,
                        'paid_at' => $latestTx->date,
                        'payment_method' => $latestTx->payment_method ?? 'Cash',
                        'notes' => $latestTx->description ?: "Dibayar via transaksi Pengeluaran: {$latestTx->title}",
                    ]
                );
            }
        }
    }
}
