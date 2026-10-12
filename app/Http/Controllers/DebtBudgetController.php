<?php

namespace App\Http\Controllers;

use App\Models\DebtBudget;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class DebtBudgetController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        if (!$user->canAccess('budget')) {
            return Inertia::render('LockedFeature', [
                'feature' => 'anggaran',
                'title' => 'Menu Anggaran Hutang Terkunci',
                'subtitle' => 'Strategi Pelunasan Kewajiban Terencana Khusus Member Pro',
                'description' => 'Tetapkan alokasi dana khusus setiap bulan untuk melunasi cicilan dan kewajiban hutang secara disiplin hingga tuntas.',
                'benefits' => [
                    'Tetapkan target anggaran pelunasan cicilan bulanan',
                    'Monitoring sisa pokok hutang dan tempo pembayaran',
                    'Integrasi otomatis dengan pencatatan pengeluaran',
                    'Bebas dari beban hutang dengan perencanaan terstruktur',
                ],
            ]);
        }

        Carbon::setLocale('id');
        $currentMonth = Carbon::now()->month;
        $currentYear = Carbon::now()->year;
        $currentMonthName = Carbon::now()->translatedFormat('F Y');

        $budgets = DebtBudget::where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->get();

        $transactions = Transaction::where('user_id', Auth::id())
            ->where('type', 'pengeluaran')
            ->whereMonth('date', $currentMonth)
            ->whereYear('date', $currentYear)
            ->get();

        $budgetNames = $budgets->pluck('name')->toArray();
        $debtsList = \App\Models\Debt::where('user_id', Auth::id())
            ->whereIn('name', $budgetNames)
            ->get()
            ->keyBy('name');

        $currentBudgets = $budgets->map(function ($budget) use ($transactions, $debtsList) {
            $used = $transactions->where('category', $budget->name)->sum('amount');
            $debt = $debtsList[$budget->name] ?? null;
            
            return [
                'id' => $budget->id,
                'name' => $budget->name,
                'target' => (float)$budget->target_amount,
                'used' => (float)$used,
                'is_recurring' => (bool)$budget->is_recurring,
                'total_debt' => $debt ? (float)$debt->remaining_amount : 0,
                'debt_type' => $debt ? $debt->type : 'hutang'
            ];
        });

        // Calculate history for the last 6 months (excluding current month) using SQL aggregation
        $historyData = [];
        
        $sixMonthsAgo = Carbon::now()->subMonths(6)->startOfMonth();
        $lastMonth = Carbon::now()->subMonths(1)->endOfMonth();
        
        $historySummary = Transaction::where('user_id', Auth::id())
            ->where('type', 'pengeluaran')
            ->whereBetween('date', [$sixMonthsAgo, $lastMonth])
            ->selectRaw("DATE_FORMAT(date, '%Y-%m') as ym, category, SUM(amount) as total")
            ->groupBy('ym', 'category')
            ->get()
            ->groupBy('ym');
            
        for ($i = 1; $i <= 6; $i++) {
            $date = Carbon::now()->subMonths($i);
            $month = $date->month;
            $year = $date->year;
            $monthKey = $date->format('Y-m');
            $monthName = $date->translatedFormat('F Y');

            $monthMap = $historySummary->get($monthKey, collect())->pluck('total', 'category');

            foreach ($budgets as $budget) {
                if (!$budget->is_recurring && ($month !== $currentMonth || $year !== $currentYear)) {
                    continue; // Skip non-recurring for past months
                }
                
                // Skip if the budget was created AFTER this history month
                $budgetCreatedAt = Carbon::parse($budget->created_at);
                if ($year < $budgetCreatedAt->year || ($year === $budgetCreatedAt->year && $month < $budgetCreatedAt->month)) {
                    continue;
                }
                
                $used = (float) ($monthMap->get($budget->name, 0));
                $historyData[] = [
                    'month' => $monthName,
                    'name' => $budget->name,
                    'target' => (float)$budget->target_amount,
                    'used' => $used,
                ];
            }
        }
        
        $historyMonths = collect($historyData)->pluck('month')->unique()->values();

        $activeDebts = \App\Models\Debt::where('user_id', Auth::id())
            ->where('status', 'belum_lunas')
            ->orderBy('created_at', 'desc')
            ->get();

        $usedDebts = $currentBudgets->pluck('name')->toArray();
        $availableDebts = $activeDebts->filter(function($debt) use ($usedDebts) {
            return !in_array($debt->name, $usedDebts);
        })->values();

        $totalHutang = $activeDebts->where('type', 'hutang')->sum('remaining_amount');
        $totalPiutang = $activeDebts->where('type', 'piutang')->sum('remaining_amount');

        return Inertia::render('Anggaran/AnggaranHutang', [
            'currentMonth' => $currentMonthName,
            'currentBudgets' => $currentBudgets,
            'historyData' => $historyData,
            'historyMonths' => $historyMonths,
            'activeDebts' => $activeDebts,
            'availableDebts' => $availableDebts,
            'totalHutang' => $totalHutang,
            'totalPiutang' => $totalPiutang
        ]);
    }

    public function store(Request $request)
    {
        if (!Auth::user()->canAccess('budget')) {
            abort(403, 'Fitur anggaran hanya tersedia untuk akun Pro.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'target_amount' => 'required|numeric|min:0',
            'is_recurring' => 'boolean'
        ]);

        $exists = DebtBudget::where('user_id', Auth::id())
            ->where('name', $request->name)
            ->exists();
            
        if ($exists) {
            return redirect()->back()->withErrors(['name' => 'Anggaran untuk hutang/piutang ini sudah ada.']);
        }

        $validated['user_id'] = Auth::id();

        DebtBudget::create($validated);

        return redirect()->back()->with('success', 'Anggaran hutang berhasil ditambahkan.');
    }

    public function update(Request $request, DebtBudget $budget)
    {
        if (!Auth::user()->canAccess('budget')) {
            abort(403, 'Fitur anggaran hanya tersedia untuk akun Pro.');
        }

        if ($budget->user_id !== Auth::id()) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'target_amount' => 'required|numeric|min:0',
            'is_recurring' => 'boolean'
        ]);

        $exists = DebtBudget::where('user_id', Auth::id())
            ->where('name', $request->name)
            ->where('id', '!=', $budget->id)
            ->exists();
            
        if ($exists) {
            return redirect()->back()->withErrors(['name' => 'Anggaran untuk hutang/piutang ini sudah ada.']);
        }

        $budget->update($validated);

        return redirect()->back()->with('success', 'Anggaran hutang berhasil diperbarui.');
    }

    public function destroy(DebtBudget $budget)
    {
        if (!Auth::user()->canAccess('budget')) {
            abort(403, 'Fitur anggaran hanya tersedia untuk akun Pro.');
        }

        if ($budget->user_id !== Auth::id()) {
            abort(403);
        }

        $budget->delete();

        return redirect()->back()->with('success', 'Anggaran hutang berhasil dihapus.');
    }
}
