<?php

namespace App\Http\Controllers;

use App\Events\TransactionRecorded;
use App\Models\Bill;
use App\Models\BillPayment;
use App\Models\Category;
use App\Models\PaymentMethod;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class BillController extends Controller
{
    /**
     * Display a listing of bills and monthly status.
     */
    public function index(Request $request)
    {
        Carbon::setLocale('id');

        $monthQuery = $request->query('month', Carbon::now()->format('Y-m'));
        try {
            $selectedDate = Carbon::createFromFormat('Y-m', $monthQuery)->startOfMonth();
        } catch (\Exception $e) {
            $selectedDate = Carbon::now()->startOfMonth();
            $monthQuery = $selectedDate->format('Y-m');
        }

        $year = $selectedDate->year;
        $month = $selectedDate->month;
        $daysInMonth = $selectedDate->daysInMonth;
        $today = Carbon::today();
        $isCurrentMonth = $selectedDate->isSameMonth($today);

        // Auto-reconcile bills with transactions for the selected month
        $this->autoReconcileBillsForMonth(Auth::id(), $monthQuery);

        // Fetch bills for current user
        $rawBills = Bill::where('user_id', Auth::id())
            ->where('is_active', true)
            ->with(['payments' => function ($q) use ($monthQuery) {
                $q->where('month', $monthQuery);
            }])
            ->orderBy('due_day', 'asc')
            ->get();

        $bills = $rawBills->map(function ($bill) use ($year, $month, $daysInMonth, $today, $selectedDate) {
            $clampedDay = min($bill->due_day, $daysInMonth);
            $dueDate = Carbon::create($year, $month, $clampedDay);
            $payment = $bill->payments->first();
            $isPaid = $payment && ((float) $payment->amount >= (float) $bill->amount);

            // Status and countdown calculation
            $diffDays = (int) $today->diffInDays($dueDate, false); // negative if past

            if ($isPaid) {
                $status = 'lunas';
                $countdownText = 'Lunas';
                $badgeText = 'Sudah Dibayar';
            } elseif ($payment && (float) $payment->amount > 0) {
                $status = $diffDays < 0 ? 'terlambat' : 'segera';
                $remaining = max(0, (float) $bill->amount - (float) $payment->amount);
                $countdownText = 'Kurang Rp '.number_format($remaining, 0, ',', '.');
                $badgeText = 'Kurang Rp '.number_format($remaining, 0, ',', '.');
            } elseif ($selectedDate->isPast() && ! $selectedDate->isCurrentMonth()) {
                $status = 'terlambat';
                $countdownText = 'Belum dibayar';
                $badgeText = 'Lewat Jatuh Tempo';
            } elseif ($diffDays < 0) {
                $status = 'terlambat';
                $countdownText = 'Terlambat '.abs($diffDays).' hari';
                $badgeText = 'Lewat Jatuh Tempo';
            } elseif ($diffDays === 0) {
                $status = 'hari_ini';
                $countdownText = 'Hari Ini!';
                $badgeText = 'Jatuh Tempo Hari Ini';
            } elseif ($diffDays <= $bill->reminder_days) {
                $status = 'segera';
                $countdownText = $diffDays.' hari lagi';
                $badgeText = 'Segera Jatuh Tempo';
            } else {
                $status = 'mendatang';
                $countdownText = $diffDays.' hari lagi';
                $badgeText = 'Mendatang';
            }

            return [
                'id' => $bill->id,
                'name' => $bill->name,
                'amount' => (float) $bill->amount,
                'due_day' => (int) $bill->due_day,
                'due_date' => $dueDate->toDateString(),
                'due_date_formatted' => $dueDate->translatedFormat('d F Y'),
                'category_name' => $bill->category_name ?? $bill->name,
                'reminder_days' => (int) $bill->reminder_days,
                'account_number' => $bill->account_number,
                'notes' => $bill->notes,
                'is_paid' => $isPaid,
                'status' => $status,
                'countdown_text' => $countdownText,
                'badge_text' => $badgeText,
                'paid_at' => $payment ? $payment->paid_at->translatedFormat('d F Y') : null,
                'paid_amount' => $payment ? (float) $payment->amount : null,
                'paid_payment_method' => $payment ? $payment->payment_method : null,
            ];
        });

        // Summary statistics
        $totalTagihan = $bills->sum('amount');
        $totalDibayar = $bills->where('is_paid', true)->sum(fn ($b) => $b['paid_amount'] ?? $b['amount']);
        $totalSisa = max(0, $totalTagihan - $totalDibayar);
        $countTotal = $bills->count();
        $countLunas = $bills->where('is_paid', true)->count();
        $countBelum = $countTotal - $countLunas;
        $countTerlambat = $bills->where('status', 'terlambat')->count();
        $countSegera = $bills->whereIn('status', ['hari_ini', 'segera'])->count();

        // Calendar matrix data for the selected month
        $startDayOfWeek = $selectedDate->copy()->startOfMonth()->dayOfWeekIso; // 1 (Mon) - 7 (Sun)
        $calendarDays = [];

        // Pre-fill empty days from previous month to align with Monday
        for ($i = 1; $i < $startDayOfWeek; $i++) {
            $calendarDays[] = [
                'day' => null,
                'is_current_month' => false,
                'is_today' => false,
                'bills' => [],
            ];
        }

        // Days of current month
        for ($day = 1; $day <= $daysInMonth; $day++) {
            $currentDate = Carbon::create($year, $month, $day);
            $dayBills = $bills->filter(function ($b) use ($day, $daysInMonth) {
                return $b['due_day'] === $day || ($b['due_day'] > $daysInMonth && $day === $daysInMonth);
            })->values()->toArray();

            $calendarDays[] = [
                'day' => $day,
                'date' => $currentDate->toDateString(),
                'is_current_month' => true,
                'is_today' => $isCurrentMonth && $today->day === $day,
                'bills' => $dayBills,
            ];
        }

        // Payment history across months
        $paymentHistory = BillPayment::where('user_id', Auth::id())
            ->with('bill')
            ->orderBy('paid_at', 'desc')
            ->limit(50)
            ->get()
            ->map(function ($p) {
                return [
                    'id' => $p->id,
                    'bill_name' => $p->bill ? $p->bill->name : 'Tagihan',
                    'category_name' => $p->bill ? ($p->bill->category_name ?? $p->bill->name) : 'Tagihan',
                    'month_label' => Carbon::parse($p->month.'-01')->translatedFormat('F Y'),
                    'amount' => (float) $p->amount,
                    'paid_at' => $p->paid_at->translatedFormat('d F Y'),
                    'payment_method' => $p->payment_method ?? 'Default',
                    'notes' => $p->notes,
                ];
            });

        // Ensure 'Tagihan Rutin' category exists for this user
        Category::firstOrCreate([
            'user_id' => Auth::id(),
            'name' => 'Tagihan Rutin',
            'type' => 'pengeluaran',
        ]);

        // User categories of type 'pengeluaran'
        $categories = Category::where('user_id', Auth::id())
            ->where('type', 'pengeluaran')
            ->pluck('name')
            ->toArray();

        // Payment methods
        $paymentMethods = PaymentMethod::where('user_id', Auth::id())->pluck('name')->toArray();
        if (empty($paymentMethods)) {
            $paymentMethods = ['Tunai / Cash', 'Transfer Bank BCA', 'Transfer Bank Mandiri', 'GoPay', 'OVO', 'ShopeePay', 'DANA'];
        }

        $userBillsCount = Bill::where('user_id', Auth::id())->where('is_active', true)->count();
        $billLimit = Auth::user()->getLimit('bill');
        $isUnlimited = $billLimit < 0;
        $canAdd = $isUnlimited || $userBillsCount < $billLimit;

        return Inertia::render('Tagihan/Index', [
            'bills' => $bills,
            'isFree' => Auth::user()->isFree(),
            'canAdd' => $canAdd,
            'maxLimit' => $isUnlimited ? null : $billLimit,
            'currentCount' => $userBillsCount,
            'summary' => [
                'total_tagihan' => (float) $totalTagihan,
                'total_dibayar' => (float) $totalDibayar,
                'total_sisa' => (float) $totalSisa,
                'count_total' => $countTotal,
                'count_lunas' => $countLunas,
                'count_belum' => $countBelum,
                'count_terlambat' => $countTerlambat,
                'count_segera' => $countSegera,
            ],
            'selectedMonth' => $monthQuery,
            'selectedMonthLabel' => $selectedDate->translatedFormat('F Y'),
            'calendarDays' => $calendarDays,
            'paymentHistory' => $paymentHistory,
            'categories' => $categories,
            'paymentMethods' => $paymentMethods,
        ]);
    }

    /**
     * Store a newly created bill.
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        $count = Bill::where('user_id', $user->id)->where('is_active', true)->count();
        if ($user->hasReachedLimit('bill', $count)) {
            $limit = $user->getLimit('bill');

            return redirect()->back()->withErrors([
                'name' => "Batas maksimal Tagihan Rutin untuk paket Anda telah tercapai (maksimal {$limit} data). Silakan upgrade ke paket Pro untuk menambah tanpa batas.",
            ]);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'amount' => 'required|numeric|min:1',
            'due_day' => 'required|integer|min:1|max:31',
            'category_name' => 'nullable|string|max:255',
            'reminder_days' => 'nullable|integer|min:1|max:14',
            'account_number' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:500',
        ], [
            'name.required' => 'Nama tagihan wajib diisi.',
            'amount.required' => 'Nominal tagihan wajib diisi.',
            'due_day.required' => 'Tanggal jatuh tempo wajib dipilih (1-31).',
            'due_day.min' => 'Tanggal jatuh tempo minimal tanggal 1.',
            'due_day.max' => 'Tanggal jatuh tempo maksimal tanggal 31.',
        ]);

        // Automatically register as 'Tagihan Rutin' expense category if not exists
        Category::firstOrCreate([
            'user_id' => Auth::id(),
            'name' => 'Tagihan Rutin',
            'type' => 'pengeluaran',
        ]);

        Bill::create([
            'user_id' => Auth::id(),
            'name' => $validated['name'],
            'amount' => $validated['amount'],
            'due_day' => $validated['due_day'],
            'category_name' => 'Tagihan Rutin',
            'reminder_days' => $validated['reminder_days'] ?? 3,
            'account_number' => $validated['account_number'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'is_active' => true,
        ]);

        $this->autoReconcileBillsForMonth(Auth::id(), Carbon::now()->format('Y-m'));

        try {
            broadcast(new TransactionRecorded(
                userId: (int) Auth::id(),
                action: 'created',
                source: 'web',
                message: "Tagihan '{$validated['name']}' berhasil ditambahkan"
            ));
        } catch (\Throwable $e) {
        }

        return back()->with('success', "Tagihan '{$validated['name']}' berhasil ditambahkan ke Kategori Tagihan Rutin!");
    }

    /**
     * Update the specified bill.
     */
    public function update(Request $request, Bill $bill)
    {
        if ($bill->user_id !== Auth::id()) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'amount' => 'required|numeric|min:1',
            'due_day' => 'required|integer|min:1|max:31',
            'category_name' => 'nullable|string|max:255',
            'reminder_days' => 'nullable|integer|min:1|max:14',
            'account_number' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:500',
        ]);

        // Automatically ensure "Tagihan Rutin" category exists
        Category::firstOrCreate([
            'user_id' => Auth::id(),
            'name' => 'Tagihan Rutin',
            'type' => 'pengeluaran',
        ]);

        $bill->update([
            'name' => $validated['name'],
            'amount' => $validated['amount'],
            'due_day' => $validated['due_day'],
            'category_name' => 'Tagihan Rutin',
            'reminder_days' => $validated['reminder_days'] ?? 3,
            'account_number' => $validated['account_number'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        $this->autoReconcileBillsForMonth(Auth::id(), Carbon::now()->format('Y-m'));

        try {
            broadcast(new TransactionRecorded(
                userId: (int) Auth::id(),
                action: 'updated',
                source: 'web',
                message: "Tagihan '{$bill->name}' berhasil diperbarui"
            ));
        } catch (\Throwable $e) {
        }

        return back()->with('success', "Tagihan '{$bill->name}' berhasil diperbarui!");
    }

    public function destroy(Bill $bill)
    {
        if ($bill->user_id !== Auth::id()) {
            abort(403);
        }

        $name = $bill->name;

        // Clean up any associated payments explicitly
        $bill->payments()->delete();
        $bill->delete();

        return redirect()->route('tagihan.index')->with('success', "Tagihan '{$name}' berhasil dihapus.");
    }

    /**
     * Quick Pay: Pay a bill for the specified month and record transaction.
     */
    public function pay(Request $request, Bill $bill)
    {
        if ($bill->user_id !== Auth::id()) {
            abort(403);
        }

        $validated = $request->validate([
            'amount' => 'nullable|numeric|min:0',
            'paid_at' => 'required|date',
            'payment_method' => 'required|string|max:255',
            'month' => 'required|string|regex:/^\d{4}-\d{2}$/',
            'notes' => 'nullable|string|max:500',
        ], [
            'paid_at.required' => 'Tanggal pembayaran wajib diisi.',
            'payment_method.required' => 'Metode pembayaran wajib dipilih.',
            'month.required' => 'Bulan tagihan tidak valid.',
        ]);

        // Lock amount to the exact bill amount
        $validated['amount'] = (float) $bill->amount;

        Carbon::setLocale('id');
        $monthLabel = Carbon::parse($validated['month'].'-01')->translatedFormat('F Y');

        DB::transaction(function () use ($bill, $validated, $monthLabel) {
            // 1. Ensure 'Tagihan Rutin' category exists
            Category::firstOrCreate([
                'user_id' => Auth::id(),
                'name' => 'Tagihan Rutin',
                'type' => 'pengeluaran',
            ]);

            // 2. Record transaction in pengeluaran under 'Tagihan Rutin'
            $transaction = Transaction::create([
                'user_id' => Auth::id(),
                'type' => 'pengeluaran',
                'amount' => $validated['amount'],
                'category' => 'Tagihan Rutin',
                'payment_method' => $validated['payment_method'],
                'title' => 'Bayar Tagihan '.$bill->name,
                'description' => $validated['notes'] ?? ("Pembayaran tagihan {$bill->name} untuk periode {$monthLabel}"),
                'date' => $validated['paid_at'],
            ]);

            // 3. Record bill payment
            BillPayment::updateOrCreate(
                [
                    'bill_id' => $bill->id,
                    'month' => $validated['month'],
                ],
                [
                    'user_id' => Auth::id(),
                    'transaction_id' => $transaction->id,
                    'amount' => $validated['amount'],
                    'paid_at' => $validated['paid_at'],
                    'payment_method' => $validated['payment_method'],
                    'notes' => $validated['notes'] ?? null,
                ]
            );
        });

        try {
            broadcast(new TransactionRecorded(
                userId: (int) Auth::id(),
                transaction: $transaction ?? null,
                action: 'created',
                source: 'web',
                message: "Pembayaran tagihan '{$bill->name}' berhasil dicatat"
            ));
        } catch (\Throwable $e) {
            // silent fallback
        }

        return back()->with('success', "Pembayaran tagihan '{$bill->name}' sebesar Rp ".number_format($validated['amount'], 0, ',', '.').' berhasil dicatat ke Pengeluaran!');
    }

    /**
     * Delete a bill payment record and reset the recurring bill status.
     */
    public function destroyPayment(BillPayment $payment)
    {
        if ($payment->user_id !== Auth::id()) {
            abort(403);
        }

        $billName = $payment->bill ? $payment->bill->name : 'Tagihan';
        $transactionId = $payment->transaction_id;
        $userId = Auth::id();
        $bill = $payment->bill;
        $month = $payment->month;

        DB::transaction(function () use ($payment, $transactionId, $userId, $bill, $month) {
            // 1. Delete payment record
            $payment->delete();

            // 2. If there's an associated transaction, delete it too so autoReconcile doesn't recreate payment
            if ($transactionId) {
                Transaction::where('id', $transactionId)
                    ->where('user_id', $userId)
                    ->delete();
            }

            // 3. Clean up any leftover transactions for this bill and month under 'Tagihan Rutin'
            if ($bill && $month) {
                $monthParts = explode('-', $month);
                $queryYear = (int) ($monthParts[0] ?? date('Y'));
                $queryMonth = (int) ($monthParts[1] ?? date('m'));
                $cleanBillName = strtolower(trim($bill->name));

                Transaction::where('user_id', $userId)
                    ->where('type', 'pengeluaran')
                    ->whereYear('date', $queryYear)
                    ->whereMonth('date', $queryMonth)
                    ->where(function ($q) use ($cleanBillName) {
                        $q->where(function ($sub) use ($cleanBillName) {
                            $sub->whereRaw('LOWER(TRIM(category)) = ?', ['tagihan rutin'])
                                ->where(function ($inner) use ($cleanBillName) {
                                    $inner->whereRaw('LOWER(title) LIKE ?', ['%'.$cleanBillName.'%'])
                                        ->orWhereRaw('LOWER(description) LIKE ?', ['%'.$cleanBillName.'%']);
                                });
                        })
                            ->orWhereRaw('LOWER(TRIM(category)) = ?', [$cleanBillName]);
                    })
                    ->delete();
            }
        });

        try {
            broadcast(new TransactionRecorded(
                userId: (int) Auth::id(),
                action: 'deleted',
                source: 'web',
                message: "Riwayat pembayaran tagihan '{$billName}' dihapus"
            ));
        } catch (\Throwable $e) {
        }

        return redirect()->back()->with('success', "Riwayat pembayaran tagihan '{$billName}' berhasil dihapus. Status tagihan telah direset ke belum bayar.");
    }

    /**
     * Automatically reconcile active bills with existing expense transactions for the given month.
     */
    private function autoReconcileBillsForMonth(int $userId, string $monthQuery): void
    {
        $activeBills = Bill::where('user_id', $userId)
            ->where('is_active', true)
            ->get();

        foreach ($activeBills as $bill) {
            $billName = strtolower(trim($bill->name ?? ''));

            // Check if existing payment exists
            $existingPayment = BillPayment::where('bill_id', $bill->id)
                ->where('month', $monthQuery)
                ->first();

            $monthParts = explode('-', $monthQuery);
            $queryYear = (int) ($monthParts[0] ?? date('Y'));
            $queryMonth = (int) ($monthParts[1] ?? date('m'));

            // Find matching transactions: either category 'Tagihan Rutin' containing bill name, or matching category name
            $matchingTransactions = Transaction::where('user_id', $userId)
                ->where('type', 'pengeluaran')
                ->whereYear('date', $queryYear)
                ->whereMonth('date', $queryMonth)
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
                        'month' => $monthQuery,
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
                    $existingPayment->delete();
                }
            }
        }
    }
}
