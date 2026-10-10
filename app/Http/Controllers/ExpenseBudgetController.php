<?php

namespace App\Http\Controllers;

use App\Models\Budget;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

class ExpenseBudgetController extends Controller
{
    public function index()
    {
        Carbon::setLocale('id');
        $currentMonth = ucfirst(Carbon::now()->translatedFormat('F Y'));
        $user = Auth::user();
        $currentMonthNum = Carbon::now()->month;
        $currentYear = Carbon::now()->year;

        // Ambil kategori pengeluaran dari tabel categories
        $expenseCategories = \App\Models\Category::where('user_id', $user->id)
            ->where('type', 'pengeluaran')
            ->orderBy('name')
            ->pluck('name')
            ->toArray();

        // Cek dan gandakan anggaran berulang (recurring)
        $recurringPastBudgets = Budget::where('user_id', $user->id)
            ->where('type', 'Pengeluaran')
            ->where('is_recurring', true)
            ->where('month', '!=', $currentMonth)
            ->get()
            ->groupBy('name');

        foreach ($recurringPastBudgets as $name => $group) {
            $existsThisMonth = Budget::where('user_id', $user->id)
                ->where('month', $currentMonth)
                ->where('type', 'Pengeluaran')
                ->where('name', $name)
                ->exists();

            if (!$existsThisMonth) {
                $latest = $group->sortByDesc('created_at')->first();
                Budget::create([
                    'user_id' => $user->id,
                    'type' => 'Pengeluaran',
                    'name' => $latest->name,
                    'target_amount' => $latest->target_amount,
                    'current_amount' => 0,
                    'month' => $currentMonth,
                    'status' => 'Berjalan',
                    'is_recurring' => true
                ]);
            }
        }

        // Ambil data bulan ini
        $currentBudgets = Budget::where('user_id', $user->id)
            ->where('month', $currentMonth)
            ->where('type', 'Pengeluaran')
            ->get()->map(function($budget) use ($user, $currentMonthNum, $currentYear) {
                
                // Hitung pengeluaran aktual dari transaksi
                $actualExpense = Transaction::where('user_id', $user->id)
                    ->where('type', 'pengeluaran')
                    ->where('category', $budget->name)
                    ->whereMonth('date', $currentMonthNum)
                    ->whereYear('date', $currentYear)
                    ->sum('amount');
                    
                $budget->current_amount = $actualExpense;
                
                // Update status
                $status = 'Berjalan';
                if ($actualExpense > $budget->target_amount) {
                    $status = 'Melebihi';
                } elseif ($actualExpense == $budget->target_amount) {
                    $status = 'Terpenuhi';
                }
                
                // Save updated current amount if needed, though we can just render it
                if ($budget->current_amount != $actualExpense || $budget->status != $status) {
                    $budget->update(['current_amount' => $actualExpense, 'status' => $status]);
                }

                return [
                    'id' => $budget->id,
                    'type' => $budget->type,
                    'name' => $budget->name,
                    'target' => $budget->target_amount,
                    'current' => $budget->current_amount,
                    'status' => $budget->status,
                    'is_recurring' => $budget->is_recurring,
                    'percentage' => $budget->target_amount > 0 ? min(100, round(($budget->current_amount / $budget->target_amount) * 100)) : 0
                ];
            });

        return Inertia::render('Anggaran/PengeluaranBulanan', [
            'currentMonth' => $currentMonth,
            'currentBudgets' => $currentBudgets,
            'expenseCategories' => $expenseCategories
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'target_amount' => 'required|numeric|min:1',
            'is_recurring' => 'boolean'
        ]);

        Carbon::setLocale('id');
        $currentMonth = ucfirst(Carbon::now()->translatedFormat('F Y'));

        // Cek apakah sudah ada budget untuk kategori ini di bulan ini
        $exists = Budget::where('user_id', auth()->id())
            ->where('type', 'Pengeluaran')
            ->where('name', $request->name)
            ->where('month', $currentMonth)
            ->exists();
            
        if ($exists) {
            return redirect()->back()->withErrors(['name' => 'Anggaran untuk kategori ini sudah ada di bulan ini.']);
        }

        Budget::create([
            'user_id' => auth()->id(),
            'type' => 'Pengeluaran',
            'name' => $request->name,
            'target_amount' => $request->target_amount,
            'current_amount' => 0,
            'month' => $currentMonth,
            'status' => 'Berjalan',
            'is_recurring' => $request->boolean('is_recurring', false)
        ]);

        return redirect()->back()->with('success', 'Anggaran pengeluaran berhasil disimpan.');
    }

    public function update(Request $request, Budget $budget)
    {
        if ($budget->user_id !== auth()->id() || $budget->type !== 'Pengeluaran') abort(403);

        $request->validate([
            'name' => 'required|string|max:255',
            'target_amount' => 'required|numeric|min:1',
            'is_recurring' => 'boolean'
        ]);

        $budget->update([
            'name' => $request->name,
            'target_amount' => $request->target_amount,
            'is_recurring' => $request->boolean('is_recurring', false)
        ]);

        return redirect()->back()->with('success', 'Anggaran pengeluaran berhasil diubah.');
    }

    public function destroy(Budget $budget)
    {
        if ($budget->user_id !== auth()->id() || $budget->type !== 'Pengeluaran') abort(403);

        $budget->delete();

        return redirect()->back()->with('success', 'Anggaran pengeluaran berhasil dihapus.');
    }
}
