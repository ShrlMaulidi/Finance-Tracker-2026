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
use App\Services\TransactionEffects;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class TransactionController extends Controller
{
    public function __construct(private TransactionEffects $effects) {}

    public function index(Request $request)
    {
        $targets = Target::where('user_id', Auth::id())->get(['id', 'name']);

        // Every transaction of the running month (older months live in /transaksi/history)
        $transactions = Transaction::where('user_id', Auth::id())
            ->inMonth(Carbon::now()->year, Carbon::now()->month)
            ->orderBy('date', 'desc')
            ->orderBy('id', 'desc') // id (not created_at) lets MySQL read the newest rows straight from the (user_id, date) index
            ->get(['id', 'type', 'amount', 'category', 'debt_id', 'payment_method', 'title', 'description', 'date'])
            ->map(function ($t) {
                return [
                    'id' => $t->id,
                    'type' => $t->type,
                    'amount' => (float) $t->amount,
                    'category' => $t->category,
                    'debt_id' => $t->debt_id,
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
            ->inMonth($currentYear, $currentMonth)
            ->selectRaw('type, SUM(amount) as total')
            ->groupBy('type')
            ->pluck('total', 'type');

        $totalPemasukan = $totals->get('pemasukan', 0);
        $totalPengeluaran = $totals->get('pengeluaran', 0);
        $totalTabungan = $totals->get('tabungan', 0);

        // Get categories from database (auto-seed if empty)
        $userCategories = Category::where('user_id', Auth::id())->get(['name', 'type']);
        if ($userCategories->isEmpty()) {
            Auth::user()->seedDefaultCategoriesAndPaymentMethods();
            $userCategories = Category::where('user_id', Auth::id())->get(['name', 'type']);
        }
        $pemasukanCategories = $userCategories->where('type', 'pemasukan')->map(fn ($c) => ['id' => $c->name, 'label' => $c->name])->toArray();
        $pengeluaranCategories = $userCategories->where('type', 'pengeluaran')->map(fn ($c) => ['id' => $c->name, 'label' => $c->name])->toArray();

        // Active debts (hutang) for transaction dropdown
        $activeDebts = Debt::where('user_id', Auth::id())
            ->where('type', 'hutang')
            ->where(function ($query) {
                $query->where('status', 'belum_lunas')
                    ->orWhereIn('id', Transaction::where('user_id', Auth::id())->whereNotNull('debt_id')->select('debt_id'));
            })
            ->orderBy('due_date', 'asc')
            ->get();

        $activeDebtsData = $activeDebts->map(function ($d) {
            $rem = $d->remaining_amount !== null ? (float) $d->remaining_amount : (float) $d->amount;

            return [
                'id' => $d->id,
                'name' => $d->name,
                'amount' => (float) $d->amount,
                'remaining_amount' => $rem,
                'due_date' => $d->due_date ? Carbon::parse($d->due_date)->translatedFormat('d M Y') : null,
                'due_date_raw' => $d->due_date,
                'status' => $d->status,
            ];
        })->values()->toArray();

        $currentMonthStr = Carbon::now()->format('Y-m');

        // Ensure active bills are loaded for Tagihan Rutin dropdown with payment history
        $activeBills = Bill::where('user_id', Auth::id())
            ->where('is_active', true)
            // Only recent months matter for the "already paid" check in the input form; keeps the payload flat as history grows
            ->with(['payments' => fn ($query) => $query
                ->select(['id', 'bill_id', 'month', 'amount'])
                ->where('month', '>=', Carbon::now()->subMonths(24)->format('Y-m'))])
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

        // Add 'Tagihan Rutin' and 'Hutang' category to pengeluaran categories if not already present
        $tagihanCategory = ['id' => 'Tagihan Rutin', 'label' => 'Tagihan Rutin'];
        $hutangCategory = ['id' => 'Hutang', 'label' => 'Hutang'];
        $pengeluaranCategories = collect(array_merge([$tagihanCategory, $hutangCategory], $pengeluaranCategories))->unique('id')->values()->toArray();
        $pemasukanCategories = collect($pemasukanCategories)->unique('id')->values()->toArray();

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
            'currentMonthKey' => Carbon::now()->format('Y-m'),
            'targets' => $targets,
            'pemasukanCategories' => $pemasukanCategories,
            'pengeluaranCategories' => $pengeluaranCategories,
            'paymentMethods' => $paymentMethods,
            'activeBills' => $activeBillsData,
            'activeDebts' => $activeDebtsData,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:pemasukan,pengeluaran,tabungan',
            'amount' => 'required|numeric|min:0',
            'category' => 'required|string|max:255',
            'bill_id' => 'nullable|integer',
            'debt_id' => 'nullable|integer',
            'payment_method' => 'nullable|string|max:255',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'date' => 'required|date',
        ]);

        $billId = $request->input('bill_id');
        $debtId = $request->input('debt_id');
        $validated['user_id'] = Auth::id();
        unset($validated['bill_id']);
        unset($validated['debt_id']);

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

        // If debt_id is provided, ensure category is Hutang and link debt_id
        // NOTE: Nominal ($validated['amount']) is user-editable to allow partial payments (cicilan)!
        if ($validated['type'] === 'pengeluaran' && $debtId) {
            $matchingDebt = Debt::where('user_id', Auth::id())
                ->where('type', 'hutang')
                ->find($debtId);

            if ($matchingDebt) {
                $validated['category'] = 'Hutang';
                $validated['debt_id'] = $matchingDebt->id;
            }
        }

        $transaction = DB::transaction(function () use ($validated, $billId) {
            $transaction = Transaction::create($validated);

            // Savings target / debt balance
            $this->effects->apply($transaction);

            // Sync recurring bill payment if it's an expense matching a bill
            if ($validated['type'] === 'pengeluaran') {
                $this->effects->syncBillPayment($transaction->user_id, $transaction->category, $transaction->date, $billId ? (int) $billId : null, $transaction);
            }

            return $transaction;
        });

        TransactionRecorded::broadcastAfterResponse(
            userId: (int) Auth::id(),
            transaction: $transaction,
            action: 'created',
            source: 'web'
        );

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
            'debt_id' => 'nullable|integer',
            'payment_method' => 'nullable|string|max:255',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'date' => 'required|date',
        ]);

        $billId = $request->input('bill_id');
        $debtId = $request->input('debt_id');
        unset($validated['bill_id']);
        unset($validated['debt_id']);

        DB::transaction(function () use ($transaction, $validated, $billId, $debtId, $oldCategory, $oldDate, $oldType) {
            // Undo the old savings target / debt effect
            $this->effects->revert($transaction);

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

            // If debt_id is provided, ensure category is Hutang and link debt_id
            if ($validated['type'] === 'pengeluaran' && $debtId) {
                $matchingDebt = Debt::where('user_id', Auth::id())
                    ->where('type', 'hutang')
                    ->find($debtId);

                if ($matchingDebt) {
                    $validated['category'] = 'Hutang';
                    $validated['debt_id'] = $matchingDebt->id;
                } else {
                    $validated['debt_id'] = null;
                }
            } else {
                $validated['debt_id'] = null;
            }

            $transaction->update($validated);

            // Apply the new savings target / debt effect
            $this->effects->apply($transaction);

            // Sync recurring bill payments for old and new category / month
            if ($oldType === 'pengeluaran') {
                $this->effects->syncBillPayment($transaction->user_id, $oldCategory, $oldDate);
            }
            if ($validated['type'] === 'pengeluaran') {
                $this->effects->syncBillPayment($transaction->user_id, $validated['category'], $validated['date'], $billId ? (int) $billId : null, $transaction);
            }
        });

        TransactionRecorded::broadcastAfterResponse(
            userId: (int) $transaction->user_id,
            transaction: $transaction,
            action: 'updated',
            source: 'web'
        );

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

        DB::transaction(function () use ($transaction, $category, $date, $type, $userId) {
            $this->effects->revert($transaction);

            // Delete linked bill payment FIRST before deleting transaction to avoid nullOnDelete FK race condition
            BillPayment::where('transaction_id', $transaction->id)->delete();

            $transaction->delete();

            if ($type === 'pengeluaran') {
                $this->effects->syncBillPayment($userId, $category, $date);
            }
        });

        TransactionRecorded::broadcastAfterResponse(
            userId: (int) $userId,
            transaction: $transaction,
            action: 'deleted',
            source: 'web'
        );

        return redirect()->back()->with('success', 'Transaksi berhasil dihapus.');
    }
}
