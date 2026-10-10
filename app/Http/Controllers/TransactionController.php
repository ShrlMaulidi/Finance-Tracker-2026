<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\Target;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class TransactionController extends Controller
{
    public function index(Request $request)
    {
        $targets = Target::where('user_id', Auth::id())->get(['id', 'name']);

        $transactions = Transaction::where('user_id', Auth::id())
            ->orderBy('date', 'desc')
            ->orderBy('created_at', 'desc')
            ->limit(300) // Prevent loading thousands of records into memory at once
            ->get()
            ->map(function ($t) {
                return [
                    'id' => $t->id,
                    'type' => $t->type,
                    'amount' => (float)$t->amount,
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

        // Get categories from database
        $userCategories = \App\Models\Category::where('user_id', Auth::id())->get();
        $pemasukanCategories = $userCategories->where('type', 'pemasukan')->map(fn($c) => ['id' => $c->name, 'label' => $c->name])->toArray();
        $pengeluaranCategories = $userCategories->where('type', 'pengeluaran')->map(fn($c) => ['id' => $c->name, 'label' => $c->name])->toArray();

        // Inject active Debts/Receivables into categories
        $activeHutang = \App\Models\Debt::where('user_id', Auth::id())->where('type', 'hutang')->where('status', 'belum_lunas')->get()->map(fn($d) => ['id' => $d->name, 'label' => 'Hutang: ' . $d->name])->toArray();
        $activePiutang = \App\Models\Debt::where('user_id', Auth::id())->where('type', 'piutang')->where('status', 'belum_lunas')->get()->map(fn($d) => ['id' => $d->name, 'label' => 'Piutang: ' . $d->name])->toArray();

        $pengeluaranCategories = collect(array_merge($pengeluaranCategories, $activeHutang))->unique('id')->values()->toArray();
        $pemasukanCategories = collect(array_merge($pemasukanCategories, $activePiutang))->unique('id')->values()->toArray();

        $paymentMethods = \App\Models\PaymentMethod::where('user_id', Auth::id())->pluck('name')->toArray();

        return Inertia::render('Transaksi/Index', [
            'transactions' => $transactions,
            'summary' => [
                'pemasukan' => (float)$totalPemasukan,
                'pengeluaran' => (float)$totalPengeluaran,
                'tabungan' => (float)$totalTabungan,
                'saldo' => (float)($totalPemasukan - $totalPengeluaran - $totalTabungan)
            ],
            'currentMonthName' => Carbon::now()->translatedFormat('F Y'),
            'targets' => $targets,
            'pemasukanCategories' => $pemasukanCategories,
            'pengeluaranCategories' => $pengeluaranCategories,
            'paymentMethods' => $paymentMethods
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:pemasukan,pengeluaran,tabungan',
            'amount' => 'required|numeric|min:0',
            'category' => 'required|string|max:255',
            'payment_method' => 'nullable|string|max:255',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'date' => 'required|date',
        ]);

        $validated['user_id'] = Auth::id();

        Transaction::create($validated);

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

        return redirect()->back()->with('success', 'Transaksi berhasil ditambahkan.');
    }

    public function update(Request $request, Transaction $transaction)
    {
        if ($transaction->user_id !== Auth::id()) {
            abort(403);
        }

        $validated = $request->validate([
            'type' => 'required|in:pemasukan,pengeluaran,tabungan',
            'amount' => 'required|numeric|min:0',
            'category' => 'required|string|max:255',
            'payment_method' => 'nullable|string|max:255',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'date' => 'required|date',
        ]);

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

        return redirect()->back()->with('success', 'Transaksi berhasil diperbarui.');
    }

    public function destroy(Transaction $transaction)
    {
        if ($transaction->user_id !== Auth::id()) {
            abort(403);
        }

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

        $transaction->delete();

        return redirect()->back()->with('success', 'Transaksi berhasil dihapus.');
    }

    private function syncDebtAmount($category, $amount, $type, $isRevert = false)
    {
        $debt = \App\Models\Debt::where('user_id', Auth::id())
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
}
