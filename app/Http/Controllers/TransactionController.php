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
            ->get()
            ->map(function ($t) {
                return [
                    'id' => $t->id,
                    'type' => $t->type, // pemasukan, pengeluaran
                    'amount' => (float)$t->amount,
                    'category' => $t->category,
                    'title' => $t->title,
                    'description' => $t->description,
                    'date' => $t->date,
                    'date_formatted' => Carbon::parse($t->date)->translatedFormat('d F Y'),
                ];
            });

        // Calculate totals for the current month
        $currentMonth = Carbon::now()->month;
        $currentYear = Carbon::now()->year;
        
        $monthTransactions = Transaction::where('user_id', Auth::id())
            ->whereMonth('date', $currentMonth)
            ->whereYear('date', $currentYear)
            ->get();
            
        $totalPemasukan = $monthTransactions->where('type', 'pemasukan')->sum('amount');
        $totalPengeluaran = $monthTransactions->where('type', 'pengeluaran')->sum('amount');
        $totalTabungan = $monthTransactions->where('type', 'tabungan')->sum('amount');

        // Get categories from database
        $userCategories = \App\Models\Category::where('user_id', Auth::id())->get();
        $pemasukanCategories = $userCategories->where('type', 'pemasukan')->pluck('name')->toArray();
        $pengeluaranCategories = $userCategories->where('type', 'pengeluaran')->pluck('name')->toArray();
        
        if (empty($pemasukanCategories)) {
            $pemasukanCategories = ['Gaji Bulanan', 'Bonus', 'Hasil Usaha'];
        }
        if (empty($pengeluaranCategories)) {
            $pengeluaranCategories = ['Makanan & Minuman', 'Transportasi', 'Tagihan', 'Belanja', 'Hiburan', 'Lainnya'];
        }

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
            'pengeluaranCategories' => $pengeluaranCategories
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:pemasukan,pengeluaran,tabungan',
            'amount' => 'required|numeric|min:0',
            'category' => 'required|string|max:255',
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
        }

        $transaction->delete();

        return redirect()->back()->with('success', 'Transaksi berhasil dihapus.');
    }
}
