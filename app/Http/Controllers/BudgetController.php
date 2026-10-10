<?php

namespace App\Http\Controllers;

use App\Models\Budget;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class BudgetController extends Controller
{
    public function index()
    {
        Carbon::setLocale('id');
        $currentMonth = ucfirst(Carbon::now()->translatedFormat('F Y'));
        $user = auth()->user();

        // Cek dan gandakan anggaran berulang (recurring) dari masa lalu ke bulan ini
        $recurringPastBudgets = Budget::where('user_id', $user->id)
            ->where('is_recurring', true)
            ->where('type', '!=', 'Pengeluaran')
            ->where('month', '!=', $currentMonth)
            ->get()
            ->groupBy('name');

        $existingNamesThisMonth = Budget::where('user_id', $user->id)
            ->where('month', $currentMonth)
            ->pluck('name')
            ->toArray();

        foreach ($recurringPastBudgets as $name => $group) {
            // Cek apakah bulan ini sudah ada anggaran dengan nama tersebut
            if (!in_array($name, $existingNamesThisMonth)) {
                // Gandakan dari yang paling baru
                $latest = $group->sortByDesc('created_at')->first();
                Budget::create([
                    'user_id' => $user->id,
                    'type' => $latest->type,
                    'name' => $latest->name,
                    'target_amount' => $latest->target_amount,
                    'current_amount' => 0,
                    'month' => $currentMonth,
                    'status' => 'Berjalan',
                    'is_recurring' => true
                ]);
            }
        }

        $currentMonthNum = Carbon::now()->month;
        $currentYear = Carbon::now()->year;

        // Ambil data bulan ini
        $budgets = Budget::where('user_id', $user->id)
            ->where('type', '!=', 'Pengeluaran')
            ->where('month', $currentMonth)
            ->get();
            
        $budgetNames = $budgets->pluck('name')->toArray();
        
        $actualSavings = \App\Models\Transaction::where('user_id', $user->id)
            ->where('type', 'tabungan')
            ->whereIn('category', $budgetNames)
            ->whereMonth('date', $currentMonthNum)
            ->whereYear('date', $currentYear)
            ->selectRaw('category, SUM(amount) as total')
            ->groupBy('category')
            ->pluck('total', 'category');
            
        $targetDataList = \App\Models\Target::where('user_id', $user->id)
            ->whereIn('name', $budgetNames)
            ->get()
            ->keyBy('name');

        $currentBudgets = $budgets->map(function($budget) use ($actualSavings, $targetDataList) {
                $color = 'emerald'; 
                if ($budget->type === 'Tabungan') {
                    $color = 'blue';
                }
                
                $savings = (float)($actualSavings[$budget->name] ?? 0);
                    
                $budget->current_amount = $savings;
                
                $status = 'Berjalan';
                if ($savings >= $budget->target_amount) {
                    $status = 'Terpenuhi';
                }
                
                // Update ke database jika berbeda
                if ($budget->current_amount != $savings || $budget->status != $status) {
                    $budget->update(['current_amount' => $savings, 'status' => $status]);
                }
                
                $targetData = $targetDataList[$budget->name] ?? null;

                return [
                    'id' => $budget->id,
                    'type' => $budget->type,
                    'name' => $budget->name,
                    'target' => $budget->target_amount,
                    'current' => $budget->current_amount,
                    'color' => $color,
                    'status' => $budget->status,
                    'is_recurring' => $budget->is_recurring,
                    'total_target' => $targetData ? $targetData->target_amount : 0,
                    'total_saved' => $targetData ? $targetData->current_amount : 0,
                ];
            });

        // Ambil riwayat bulan-bulan sebelumnya
        $historyBudgets = Budget::where('user_id', $user->id)
            ->where('type', '!=', 'Pengeluaran')
            ->where('month', '!=', $currentMonth)
            ->orderBy('created_at', 'desc')
            ->get()->map(function($budget) {
                $status = $budget->status;
                if ($status === 'Berjalan') {
                    $status = ($budget->current_amount >= $budget->target_amount) ? 'Terpenuhi' : 'Gagal';
                    $budget->update(['status' => $status]);
                }

                return [
                    'id' => $budget->id,
                    'month' => $budget->month,
                    'type' => $budget->type,
                    'name' => $budget->name,
                    'target' => $budget->target_amount,
                    'current' => $budget->current_amount,
                    'status' => $status,
                ];
            });

        $historyMonths = $historyBudgets->pluck('month')->unique()->values();

        $activeTargets = \App\Models\Target::where('user_id', $user->id)
            ->where('status', 'Berjalan')
            ->orderBy('created_at', 'desc')
            ->get();

        $usedTargets = $currentBudgets->pluck('name')->toArray();
        $availableTargets = $activeTargets->filter(function($t) use ($usedTargets) {
            return !in_array($t->name, $usedTargets);
        })->values();

        return Inertia::render('Anggaran/Investasi', [
            'currentMonth' => $currentMonth,
            'currentBudgets' => $currentBudgets,
            'historyData' => $historyBudgets,
            'historyMonths' => $historyMonths,
            'activeTargets' => $activeTargets,
            'availableTargets' => $availableTargets
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

        $exists = Budget::where('user_id', auth()->id())
            ->where('month', $currentMonth)
            ->where('name', $request->name)
            ->exists();

        if ($exists) {
            return redirect()->back()->withErrors(['name' => 'Anggaran untuk target ini sudah ada di bulan ini.']);
        }
        
        $targetData = \App\Models\Target::where('user_id', auth()->id())->where('name', $request->name)->first();
        $type = $targetData ? $targetData->category : 'Tabungan';

        Budget::create([
            'user_id' => auth()->id(),
            'type' => $type,
            'name' => $request->name,
            'target_amount' => $request->target_amount,
            'current_amount' => 0,
            'month' => $currentMonth,
            'status' => 'Berjalan',
            'is_recurring' => $request->boolean('is_recurring', false)
        ]);

        return redirect()->back()->with('success', 'Anggaran baru berhasil disimpan.');
    }

    public function update(Request $request, Budget $budget)
    {
        if ($budget->user_id !== auth()->id()) abort(403);

        $request->validate([
            'name' => 'required|string|max:255',
            'target_amount' => 'required|numeric|min:1',
            'is_recurring' => 'boolean'
        ]);
        
        $exists = Budget::where('user_id', auth()->id())
            ->where('month', $budget->month)
            ->where('name', $request->name)
            ->where('id', '!=', $budget->id)
            ->exists();

        if ($exists) {
            return redirect()->back()->withErrors(['name' => 'Anggaran untuk target ini sudah ada di bulan ini.']);
        }
        
        $targetData = \App\Models\Target::where('user_id', auth()->id())->where('name', $request->name)->first();
        $type = $targetData ? $targetData->category : 'Tabungan';

        $budget->update([
            'type' => $type,
            'name' => $request->name,
            'target_amount' => $request->target_amount,
            'is_recurring' => $request->boolean('is_recurring', false)
        ]);

        return redirect()->back()->with('success', 'Anggaran berhasil diubah.');
    }

    public function destroy(Budget $budget)
    {
        if ($budget->user_id !== auth()->id()) abort(403);

        $budget->delete();

        return redirect()->back()->with('success', 'Anggaran berhasil dihapus.');
    }
}
