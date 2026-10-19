<?php

namespace App\Http\Controllers;

use App\Events\TransactionRecorded;
use App\Models\Bill;
use App\Models\BillPayment;
use App\Models\Category;
use App\Models\Debt;
use App\Models\PaymentMethod;
use App\Models\Target;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class TransactionController extends Controller
{
    public function index(Request $request)
    {
        $targets = Target::where('user_id', Auth::id())->get(['id', 'name']);

        $transactions = Transaction::where('user_id', Auth::id())
            ->orderBy('date', 'desc')
            ->orderBy('created_at', 'desc')
            ->limit(30) // Optimal payload for fast input/edit/delete feedback; full history in /transaksi/history
            ->get()
            ->map(function ($t) {
                return [
                    'id' => $t->id,
                    'type' => $t->type,
                    'amount' => (float) $t->amount,
                    'category' => $t->category,
                    'payment_method' => $t->payment_method,
                    'title' => $t->title,
                    'description' => $t->description,
                    'date' => $t->date,
                    'date_formatted' => Carbon::parse($t->date)->translatedFormat('d F Y'),
                ];
            });

        // Calculate totals for the current month using SQL aggregates
        $currentMonth = Carbon::now()->month;
        $currentYear = Carbon::now()->year;

        $totals = Transaction::where('user_id', Auth::id())
            ->whereMonth('date', $currentMonth)
            ->whereYear('date', $currentYear)
            ->selectRaw('type, SUM(amount) as total')
            ->groupBy('type')
            ->pluck('total', 'type');

        $totalPemasukan = $totals->get('pemasukan', 0);
        $totalPengeluaran = $totals->get('pengeluaran', 0);
        $totalTabungan = $totals->get('tabungan', 0);

        // Get categories from database (auto-seed if empty)
        $currentUser = Auth::user();
        if ($currentUser && Category::where('user_id', $currentUser->id)->count() === 0) {
            $currentUser->seedDefaultCategoriesAndPaymentMethods();
        }
        $userCategories = Category::where('user_id', Auth::id())->get();
        $pemasukanCategories = $userCategories->where('type', 'pemasukan')->map(fn ($c) => ['id' => $c->name, 'label' => $c->name])->toArray();
        $pengeluaranCategories = $userCategories->where('type', 'pengeluaran')->map(fn ($c) => ['id' => $c->name, 'label' => $c->name])->toArray();

        // Inject active Debts/Receivables into categories in 1 efficient query
        $activeDebts = Debt::where('user_id', Auth::id())
            ->whereIn('type', ['hutang', 'piutang'])
            ->where('status', 'belum_lunas')
            ->get(['name', 'type']);

        $activeHutang = $activeDebts->where('type', 'hutang')->map(fn ($d) => ['id' => $d->name, 'label' => 'Hutang: '.$d->name])->toArray();
        $activePiutang = $activeDebts->where('type', 'piutang')->map(fn ($d) => ['id' => $d->name, 'label' => 'Piutang: '.$d->name])->toArray();

        $currentMonthStr = Carbon::now()->format('Y-m');

        // Ensure active bills are loaded for Tagihan Rutin dropdown with payment history
        $activeBills = Bill::where('user_id', Auth::id())
            ->where('is_active', true)
            ->with('payments')
            ->orderBy('due_day', 'asc')
            ->get();

        $activeBillsData = $activeBills->map(function ($b) use ($currentMonthStr) {
            $paidMonths = $b->payments
                ->filter(fn ($p) => (float) $p->amount >= (float) $b->amount)
                ->pluck('month')
                ->values()
                ->toArray();

            $isPaidCurrentMonth = in_array($currentMonthStr, $paidMonths, true);

            return [
                'id' => $b->id,
                'name' => $b->name,
                'category_name' => 'Tagihan Rutin',
                'amount' => (float) $b->amount,
                'due_day' => (int) $b->due_day,
                'is_paid' => $isPaidCurrentMonth,
                'paid_months' => $paidMonths,
            ];
        })->values()->toArray();

        // Add 'Tagihan Rutin' category to pengeluaran categories if not already present
        $tagihanCategory = ['id' => 'Tagihan Rutin', 'label' => 'Tagihan Rutin'];
        $pengeluaranCategories = collect(array_merge([$tagihanCategory], $pengeluaranCategories, $activeHutang))->unique('id')->values()->toArray();
        $pemasukanCategories = collect(array_merge($pemasukanCategories, $activePiutang))->unique('id')->values()->toArray();

        $paymentMethods = PaymentMethod::where('user_id', Auth::id())->pluck('name')->toArray();

        return Inertia::render('Transaksi/Index', [
            'transactions' => $transactions,
            'summary' => [
                'pemasukan' => (float) $totalPemasukan,
                'pengeluaran' => (float) $totalPengeluaran,
                'tabungan' => (float) $totalTabungan,
                'saldo' => (float) ($totalPemasukan - $totalPengeluaran - $totalTabungan),
            ],
            'currentMonthName' => Carbon::now()->translatedFormat('F Y'),
            'targets' => $targets,
            'pemasukanCategories' => $pemasukanCategories,
            'pengeluaranCategories' => $pengeluaranCategories,
            'paymentMethods' => $paymentMethods,
            'activeBills' => $activeBillsData,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:pemasukan,pengeluaran,tabungan',
            'amount' => 'required|numeric|min:0',
            'category' => 'required|string|max:255',
            'bill_id' => 'nullable|integer',
            'payment_method' => 'nullable|string|max:255',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'date' => 'required|date',
        ]);

        $billId = $request->input('bill_id');
        $validated['user_id'] = Auth::id();
        unset($validated['bill_id']);

        // If bill_id is provided, ensure category is Tagihan Rutin and sync nominal
        if ($validated['type'] === 'pengeluaran' && $billId) {
            $matchingBill = Bill::where('user_id', Auth::id())
                ->where('is_active', true)
                ->find($billId);

            if ($matchingBill) {
                $validated['category'] = 'Tagihan Rutin';
                $validated['amount'] = (float) $matchingBill->amount;
            }
        }

        $transaction = Transaction::create($validated);

        if ($validated['type'] === 'tabungan') {
            $target = Target::where('user_id', Auth::id())
                ->where('name', $validated['category'])
                ->first();
            if ($target) {
                $target->current_amount += $validated['amount'];
                if ($target->current_amount >= $target->target_amount) {
                    $target->status = 'Tercapai';
                }
                $target->save();
            }
        }

        // Sync debt if it's a debt payment
        if (in_array($validated['type'], ['pengeluaran', 'pemasukan'])) {
            $this->syncDebtAmount($validated['category'], $validated['amount'], $validated['type']);
        }

        // Sync recurring bill payment if it's an expense matching a bill
        if ($validated['type'] === 'pengeluaran') {
            $this->syncBillPayment($transaction->user_id, $transaction->category, $transaction->date, $billId ? (int) $billId : null, $transaction);
        }

        try {
            broadcast(new TransactionRecorded(
                userId: (int) Auth::id(),
                transaction: $transaction,
                action: 'created',
                source: 'web'
            ));
        } catch (\Throwable $e) {
            // silent fallback if websocket offline
        }

        return redirect()->back()->with('success', 'Transaksi berhasil ditambahkan.');
    }

    public function update(Request $request, Transaction $transaction)
    {
        if ($transaction->user_id !== Auth::id()) {
            abort(403);
        }

        $oldCategory = $transaction->category;
        $oldDate = $transaction->date;
        $oldType = $transaction->type;

        $validated = $request->validate([
            'type' => 'required|in:pemasukan,pengeluaran,tabungan',
            'amount' => 'required|numeric|min:0',
            'category' => 'required|string|max:255',
            'bill_id' => 'nullable|integer',
            'payment_method' => 'nullable|string|max:255',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'date' => 'required|date',
        ]);

        $billId = $request->input('bill_id');
        unset($validated['bill_id']);

        // Revert old tabungan
        if ($transaction->type === 'tabungan') {
            $oldTarget = Target::where('user_id', Auth::id())->where('name', $transaction->category)->first();
            if ($oldTarget) {
                $oldTarget->current_amount -= $transaction->amount;
                if ($oldTarget->current_amount < $oldTarget->target_amount) {
                    $oldTarget->status = 'Berjalan';
                }
                $oldTarget->save();
            }
        } elseif (in_array($transaction->type, ['pengeluaran', 'pemasukan'])) {
            // Revert old debt payment
            $this->syncDebtAmount($transaction->category, $transaction->amount, $transaction->type, true);
        }

        // If bill_id is provided, ensure category is Tagihan Rutin
        if ($validated['type'] === 'pengeluaran' && $billId) {
            $matchingBill = Bill::where('user_id', Auth::id())
                ->where('is_active', true)
                ->find($billId);

            if ($matchingBill) {
                $validated['category'] = 'Tagihan Rutin';
                $validated['amount'] = (float) $matchingBill->amount;
            }
        }

        $transaction->update($validated);

        // Apply new tabungan
        if ($validated['type'] === 'tabungan') {
            $newTarget = Target::where('user_id', Auth::id())->where('name', $validated['category'])->first();
            if ($newTarget) {
                $newTarget->current_amount += $validated['amount'];
                if ($newTarget->current_amount >= $newTarget->target_amount) {
                    $newTarget->status = 'Tercapai';
                }
                $newTarget->save();
            }
        } elseif (in_array($validated['type'], ['pengeluaran', 'pemasukan'])) {
            // Apply new debt payment
            $this->syncDebtAmount($validated['category'], $validated['amount'], $validated['type']);
        }

        // Sync recurring bill payments for old and new category / month
        if ($oldType === 'pengeluaran') {
            $this->syncBillPayment($transaction->user_id, $oldCategory, $oldDate);
        }
        if ($validated['type'] === 'pengeluaran') {
            $this->syncBillPayment($transaction->user_id, $validated['category'], $validated['date'], $billId ? (int) $billId : null, $transaction);
        }

        try {
            broadcast(new TransactionRecorded(
                userId: (int) $transaction->user_id,
                transaction: $transaction,
                action: 'updated',
                source: 'web'
            ));
        } catch (\Throwable $e) {
            // silent fallback if websocket offline
        }

        return redirect()->back()->with('success', 'Transaksi berhasil diperbarui.');
    }

    public function destroy(Transaction $transaction)
    {
        if ($transaction->user_id !== Auth::id()) {
            abort(403);
        }

        $category = $transaction->category;
        $date = $transaction->date;
        $type = $transaction->type;
        $userId = $transaction->user_id;

        if ($transaction->type === 'tabungan') {
            $target = Target::where('user_id', Auth::id())->where('name', $transaction->category)->first();
            if ($target) {
                $target->current_amount -= $transaction->amount;
                if ($target->current_amount < $target->target_amount) {
                    $target->status = 'Berjalan';
                }
                $target->save();
            }
        } elseif (in_array($transaction->type, ['pengeluaran', 'pemasukan'])) {
            // Revert debt payment when transaction is deleted
            $this->syncDebtAmount($transaction->category, $transaction->amount, $transaction->type, true);
        }

        $transactionId = $transaction->id;
        $transaction->delete();

        // Delete linked bill payment if any
        BillPayment::where('transaction_id', $transactionId)->delete();

        if ($type === 'pengeluaran') {
            $this->syncBillPayment($userId, $category, $date);
        }

        try {
            broadcast(new TransactionRecorded(
                userId: (int) $userId,
                transaction: $transaction,
                action: 'deleted',
                source: 'web'
            ));
        } catch (\Throwable $e) {
            // silent fallback if websocket offline
        }

        return redirect()->back()->with('success', 'Transaksi berhasil dihapus.');
    }

    private function syncDebtAmount($category, $amount, $type, $isRevert = false)
    {
        $debt = Debt::where('user_id', Auth::id())
            ->where('name', $category)
            ->first();

        if ($debt) {
            if ($type === 'pengeluaran' && $debt->type === 'hutang') {
                $debt->remaining_amount += $isRevert ? $amount : -$amount;
            } elseif ($type === 'pemasukan' && $debt->type === 'piutang') {
                $debt->remaining_amount += $isRevert ? $amount : -$amount;
            }

            // Prevent negative remaining amount and update status
            if ($debt->remaining_amount <= 0) {
                $debt->remaining_amount = 0;
                $debt->status = 'lunas';
            } else {
                $debt->status = 'belum_lunas';
            }

            // Prevent remaining amount from exceeding original amount
            if ($debt->remaining_amount > $debt->amount) {
                $debt->remaining_amount = $debt->amount;
            }

            $debt->save();
        }
    }

    /**
     * Synchronize recurring bill payments (Tagihan Rutin) when an expense transaction is created/updated/deleted.
     */
    public function syncBillPayment(int $userId, string $category, string $date, ?int $billId = null, ?Transaction $transaction = null): void
    {
        $normalizedCategory = strtolower(trim($category));
        $monthStr = Carbon::parse($date)->format('Y-m');

        if ($billId) {
            $matchingBills = Bill::where('user_id', $userId)
                ->where('id', $billId)
                ->where('is_active', true)
                ->get();
        } elseif ($normalizedCategory === 'tagihan rutin') {
            if ($transaction) {
                $titleDesc = strtolower(($transaction->title ?? '').' '.($transaction->description ?? ''));
                $matchingBills = Bill::where('user_id', $userId)
                    ->where('is_active', true)
                    ->get()
                    ->filter(function ($b) use ($titleDesc) {
                        return stripos($titleDesc, strtolower(trim($b->name))) !== false;
                    });
            } else {
                $matchingBills = Bill::where('user_id', $userId)
                    ->where('is_active', true)
                    ->get();
            }
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

        foreach ($matchingBills as $bill) {
            $billName = strtolower(trim($bill->name ?? ''));

            // Check if existing payment is already linked to a transaction
            $existingPayment = BillPayment::where('bill_id', $bill->id)
                ->where('month', $monthStr)
                ->first();

            if ($transaction && $billId && (int) $bill->id === (int) $billId) {
                BillPayment::updateOrCreate(
                    [
                        'bill_id' => $bill->id,
                        'month' => $monthStr,
                    ],
                    [
                        'user_id' => $userId,
                        'transaction_id' => $transaction->id,
                        'amount' => $transaction->amount,
                        'paid_at' => $transaction->date,
                        'payment_method' => $transaction->payment_method ?? 'Cash',
                        'notes' => $transaction->description ?: "Dibayar via transaksi Pengeluaran: {$transaction->title}",
                    ]
                );

                continue;
            }

            $monthParts = explode('-', $monthStr);
            $queryYear = (int) ($monthParts[0] ?? date('Y'));
            $queryMonth = (int) ($monthParts[1] ?? date('m'));

            $matchingTransactions = Transaction::where('user_id', $userId)
                ->where('type', 'pengeluaran')
                ->whereYear('date', $queryYear)
                ->whereMonth('date', $queryMonth)
                ->where(function ($q) use ($billName, $existingPayment) {
                    if ($existingPayment && $existingPayment->transaction_id) {
                        $q->where('id', $existingPayment->transaction_id);
                    } else {
                        $q->where(function ($sub) use ($billName) {
                            $sub->whereRaw('LOWER(TRIM(category)) = ?', ['tagihan rutin'])
                                ->where(function ($inner) use ($billName) {
                                    $inner->whereRaw('LOWER(title) LIKE ?', ['%'.$billName.'%'])
                                        ->orWhereRaw('LOWER(description) LIKE ?', ['%'.$billName.'%']);
                                });
                        })
                            ->orWhereRaw('LOWER(TRIM(category)) = ?', [$billName]);
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
            } else {
                if ($existingPayment) {
                    if ($existingPayment->transaction_id && ! Transaction::where('id', $existingPayment->transaction_id)->exists()) {
                        $existingPayment->delete();
                    } elseif ($existingPayment->notes && str_contains($existingPayment->notes, 'transaksi Pengeluaran')) {
                        $existingPayment->delete();
                    }
                }
            }
        }
    }
}
