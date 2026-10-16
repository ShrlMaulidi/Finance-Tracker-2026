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
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class WhatsAppAIWebhookController extends Controller
{
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

        // 1. Prioritize lookup by sender_id / WhatsApp LID
        $user = null;
        if ($senderId) {
            $user = User::findByWhatsAppIdentifier($senderId);
        }

        // 2. Fallback to sender_phone
        if (! $user && $senderPhone) {
            $user = User::findByWhatsAppIdentifier($senderPhone);
        }

        // Auto-link whatsapp_lid if user was matched by phone and has no LID yet
        if ($user && empty($user->whatsapp_lid)) {
            if ($senderId && str_contains($senderId, '@lid')) {
                $user->update(['whatsapp_lid' => $senderId]);
            } elseif ($senderPhone && str_contains($senderPhone, '@lid')) {
                $user->update(['whatsapp_lid' => $senderPhone]);
            }
        }

        // Debug logging to trace transaction attribution
        Log::info('WhatsApp AI Webhook: Incoming transaction request', [
            'raw_sender_phone' => $senderPhone,
            'raw_sender_id' => $senderId,
            'user_found' => (bool) $user,
            'user_id' => $user?->id,
            'user_name' => $user?->name,
            'user_phone' => $user?->phone_number,
            'user_lid' => $user?->whatsapp_lid,
            'title' => $validated['title'] ?? 'N/A',
            'amount' => $validated['amount'] ?? 0,
            'ip' => $request->ip(),
        ]);

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

        // Auto-seed default categories & payment methods if user has none
        if (Category::where('user_id', $user->id)->count() === 0) {
            $user->seedDefaultCategoriesAndPaymentMethods();
        }

        // Smart Category Normalization & Matching
        $userCategories = Category::where('user_id', $user->id)->get();
        $inputCat = trim($validated['category'] ?? '');
        $finalCategory = 'Lainnya';

        if ($validated['type'] === 'tabungan') {
            // For tabungan, prefer matching an existing active target
            $activeTargets = Target::where('user_id', $user->id)->where('status', 'Berjalan')->get();
            if ($inputCat !== '') {
                $matchedTarget = $activeTargets->first(fn ($t) => strcasecmp($t->name, $inputCat) === 0);
                $finalCategory = $matchedTarget ? $matchedTarget->name : ($activeTargets->first()?->name ?? $inputCat);
            } else {
                $finalCategory = $activeTargets->first()?->name ?? 'Tabungan Impian';
            }
        } else {
            // Match with existing categories of the specified type
            $typeCategories = $userCategories->where('type', $validated['type']);
            if ($inputCat !== '') {
                $matched = $typeCategories->first(fn ($c) => strcasecmp($c->name, $inputCat) === 0);
                if ($matched) {
                    $finalCategory = $matched->name;
                } else {
                    // Check if it matches an active Debt or Bill
                    $matchedDebt = Debt::where('user_id', $user->id)->where('status', 'belum_lunas')->get()->first(fn ($d) => strcasecmp($d->name, $inputCat) === 0);
                    $matchedBill = Bill::where('user_id', $user->id)->where('is_active', true)->get()->first(fn ($b) => strcasecmp($b->category_name ?? $b->name, $inputCat) === 0);

                    if ($matchedDebt) {
                        $finalCategory = $matchedDebt->name;
                    } elseif ($matchedBill) {
                        $finalCategory = $matchedBill->category_name ?? $matchedBill->name;
                    } else {
                        // Create category if user limits allow
                        $catCount = Category::where('user_id', $user->id)->count();
                        if (! $user->hasReachedLimit('category', $catCount)) {
                            Category::create([
                                'user_id' => $user->id,
                                'name' => $inputCat,
                                'type' => $validated['type'],
                            ]);
                            $finalCategory = $inputCat;
                        } else {
                            $finalCategory = $typeCategories->first()?->name ?? 'Lainnya';
                        }
                    }
                }
            } else {
                $finalCategory = $typeCategories->first()?->name ?? 'Lainnya';
            }
        }

        // Smart Payment Method Matching
        $userMethods = PaymentMethod::where('user_id', $user->id)->get();
        $inputMethod = trim($validated['payment_method'] ?? '');
        $finalMethod = 'Cash';

        if ($inputMethod !== '') {
            $matchedMethod = $userMethods->first(fn ($m) => strcasecmp($m->name, $inputMethod) === 0);
            if ($matchedMethod) {
                $finalMethod = $matchedMethod->name;
            } else {
                // If user has a method containing the keyword (e.g., 'bca' in 'Transfer Bank BCA')
                $subMatch = $userMethods->first(fn ($m) => stripos($m->name, $inputMethod) !== false);
                $finalMethod = $subMatch ? $subMatch->name : $inputMethod;
            }
        } else {
            $finalMethod = $userMethods->first()?->name ?? 'Cash';
        }

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

        // Broadcast realtime update to user's browser via Reverb
        try {
            broadcast(new TransactionRecorded(
                userId: $user->id,
                transaction: $transaction,
                action: 'created',
                source: 'whatsapp',
                message: "Transaksi baru masuk via WhatsApp Bot: {$transaction->title} (Rp ".number_format($transaction->amount, 0, ',', '.').')'
            ));
        } catch (\Throwable $e) {
            Log::warning('Failed to broadcast transaction to Reverb: '.$e->getMessage());
        }

        // Calculate up-to-date balances for instant user feedback
        $totals = Transaction::where('user_id', $user->id)
            ->selectRaw('type, SUM(amount) as total')
            ->groupBy('type')
            ->pluck('total', 'type');

        $allPemasukan = (float) $totals->get('pemasukan', 0);
        $allPengeluaran = (float) $totals->get('pengeluaran', 0);
        $allTabungan = (float) $totals->get('tabungan', 0);
        $activeBalance = $allPemasukan - $allPengeluaran - $allTabungan;

        // Current month expense
        $now = Carbon::parse($trxDate);
        $monthlyExpense = (float) Transaction::where('user_id', $user->id)
            ->where('type', 'pengeluaran')
            ->whereMonth('date', $now->month)
            ->whereYear('date', $now->year)
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

        $user = null;
        if ($senderId) {
            $user = User::findByWhatsAppIdentifier($senderId);
        }
        if (! $user && $senderPhone) {
            $user = User::findByWhatsAppIdentifier($senderPhone);
        }

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

        $senderId = $request->input('sender_id') ?? $request->input('sender_lid');
        $senderPhone = $request->input('sender_phone');

        $user = null;
        if ($senderId) {
            $user = User::findByWhatsAppIdentifier($senderId);
        }
        if (! $user && $senderPhone) {
            $user = User::findByWhatsAppIdentifier($senderPhone);
        }

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
            ->whereMonth('date', $now->month)
            ->whereYear('date', $now->year)
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
        $cleanCategory = trim(preg_replace('/^tagihan:\s*/i', '', $normalizedCategory));

        $matchingBills = Bill::where('user_id', $userId)
            ->where('is_active', true)
            ->where(function ($query) use ($normalizedCategory, $cleanCategory) {
                $query->whereRaw('LOWER(TRIM(category_name)) = ?', [$normalizedCategory])
                    ->orWhereRaw('LOWER(TRIM(name)) = ?', [$normalizedCategory])
                    ->orWhereRaw('LOWER(TRIM(category_name)) = ?', [$cleanCategory])
                    ->orWhereRaw('LOWER(TRIM(name)) = ?', [$cleanCategory]);
            })
            ->get();

        if ($matchingBills->isEmpty()) {
            return;
        }

        $monthStr = Carbon::parse($date)->format('Y-m');

        foreach ($matchingBills as $bill) {
            $billCat = strtolower(trim($bill->category_name ?? ''));
            $billName = strtolower(trim($bill->name ?? ''));

            $matchingTransactions = Transaction::where('user_id', $userId)
                ->where('type', 'pengeluaran')
                ->whereRaw("DATE_FORMAT(date, '%Y-%m') = ?", [$monthStr])
                ->where(function ($q) use ($billCat, $billName) {
                    if ($billCat !== '') {
                        $q->whereRaw('LOWER(TRIM(category)) = ?', [$billCat]);
                    }
                    if ($billName !== '' && $billName !== $billCat) {
                        $q->orWhereRaw('LOWER(TRIM(category)) = ?', [$billName]);
                    }
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
