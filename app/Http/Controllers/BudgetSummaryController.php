<?php

namespace App\Http\Controllers;

use App\Models\Budget;
use App\Models\Debt;
use App\Models\DebtBudget;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class BudgetSummaryController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();

        if (! $user->canAccess('budget')) {
            return Inertia::render('LockedFeature', [
                'feature' => 'anggaran',
                'title' => 'Menu Ringkasan Anggaran Terkunci',
                'subtitle' => 'Pusat Kontrol & Konsolidasi Anggaran Khusus Member Pro',
                'description' => 'Pantau seluruh alokasi anggaran belanja bulanan, cicilan hutang, dan tabungan dalam satu dashboard ringkasan komprehensif.',
                'benefits' => [
                    'Total estimasi dana anggaran yang harus disiapkan bulan ini',
                    'Tracking total pengeluaran & cicilan yang sudah terbayar secara real-time',
                    'Konsolidasi menyeluruh dari pengeluaran, hutang, dan target tabungan',
                    'Status pemenuhan per pos anggaran untuk menghindari defisit atau overbudget',
                ],
            ]);
        }

        Carbon::setLocale('id');
        $now = Carbon::now();
        $currentMonthName = ucfirst($now->translatedFormat('F Y'));
        $selectedMonth = $request->query('month', $currentMonthName);

        // Tentukan bulan & tahun untuk filter transaksi
        $monthNum = $now->month;
        $yearNum = $now->year;

        if ($selectedMonth !== $currentMonthName) {
            try {
                $parsedDate = Carbon::createFromLocaleIsoFormat('!MMMM YYYY', 'id', $selectedMonth);
                if ($parsedDate) {
                    $monthNum = $parsedDate->month;
                    $yearNum = $parsedDate->year;
                }
            } catch (\Exception $e) {
                $selectedMonth = $currentMonthName;
            }
        }

        // 1. Sinkronisasi anggaran berulang (recurring) bulan ini jika pengguna membuka halaman ringkasan pertama kali
        if ($selectedMonth === $currentMonthName) {
            $this->syncRecurringBudgets($user->id, $currentMonthName);
        }

        // 2. Query transaksi aktual bulan berjalan menggunakan SQL aggregation (Efisien, 0 N+1)
        $actualExpenses = Transaction::where('user_id', $user->id)
            ->where('type', 'pengeluaran')
            ->whereMonth('date', $monthNum)
            ->whereYear('date', $yearNum)
            ->selectRaw('category, SUM(amount) as total')
            ->groupBy('category')
            ->pluck('total', 'category');

        $actualSavings = Transaction::where('user_id', $user->id)
            ->where('type', 'tabungan')
            ->whereMonth('date', $monthNum)
            ->whereYear('date', $yearNum)
            ->selectRaw('category, SUM(amount) as total')
            ->groupBy('category')
            ->pluck('total', 'category');

        // 3. Pos Anggaran: Pengeluaran Bulanan
        $rawExpenseBudgets = Budget::where('user_id', $user->id)
            ->where('month', $selectedMonth)
            ->where('type', 'Pengeluaran')
            ->orderBy('name')
            ->get();

        $expenseBudgets = $rawExpenseBudgets->map(function ($b) use ($actualExpenses) {
            $target = (float) $b->target_amount;
            $paid = (float) ($actualExpenses[$b->name] ?? 0);
            $remaining = max(0, $target - $paid);
            $overbudget = max(0, $paid - $target);
            $percentage = $target > 0 ? round(($paid / $target) * 100) : 0;

            $status = 'Berjalan';
            if ($paid > $target) {
                $status = 'Melebihi';
            } elseif ($paid == $target && $target > 0) {
                $status = 'Terpenuhi';
            }

            return [
                'id' => 'expense_'.$b->id,
                'raw_id' => $b->id,
                'source_menu' => 'pengeluaran',
                'source_label' => 'Pengeluaran Bulanan',
                'name' => $b->name,
                'target' => $target,
                'paid' => $paid,
                'remaining' => $remaining,
                'overbudget' => $overbudget,
                'percentage' => $percentage,
                'status' => $status,
                'is_recurring' => (bool) $b->is_recurring,
                'action_url' => route('anggaran.pengeluaran'),
            ];
        });

        // 4. Pos Anggaran: Anggaran Hutang
        $rawDebtBudgets = DebtBudget::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        $debtNames = $rawDebtBudgets->pluck('name')->toArray();
        $debtsList = Debt::where('user_id', $user->id)
            ->whereIn('name', $debtNames)
            ->get()
            ->keyBy('name');

        $debtBudgets = $rawDebtBudgets->map(function ($b) use ($actualExpenses, $debtsList) {
            $target = (float) $b->target_amount;
            $paid = (float) ($actualExpenses[$b->name] ?? 0);
            $remaining = max(0, $target - $paid);
            $overbudget = max(0, $paid - $target);
            $percentage = $target > 0 ? min(100, round(($paid / $target) * 100)) : 0;

            $status = 'Berjalan';
            if ($paid >= $target && $target > 0) {
                $status = 'Terpenuhi';
            }

            $debtInfo = $debtsList[$b->name] ?? null;

            return [
                'id' => 'debt_'.$b->id,
                'raw_id' => $b->id,
                'source_menu' => 'hutang',
                'source_label' => 'Anggaran Hutang',
                'name' => $b->name,
                'target' => $target,
                'paid' => $paid,
                'remaining' => $remaining,
                'overbudget' => $overbudget,
                'percentage' => $percentage,
                'status' => $status,
                'is_recurring' => (bool) $b->is_recurring,
                'total_debt' => $debtInfo ? (float) $debtInfo->remaining_amount : 0,
                'debt_type' => $debtInfo ? $debtInfo->type : 'hutang',
                'action_url' => route('anggaran.hutang'),
            ];
        });

        // 5. Pos Anggaran: Anggaran Tabungan & Target
        $rawSavingsBudgets = Budget::where('user_id', $user->id)
            ->where('month', $selectedMonth)
            ->where('type', '!=', 'Pengeluaran')
            ->orderBy('name')
            ->get();

        $savingsBudgets = $rawSavingsBudgets->map(function ($b) use ($actualSavings) {
            $target = (float) $b->target_amount;
            $paid = (float) ($actualSavings[$b->name] ?? 0);
            $remaining = max(0, $target - $paid);
            $percentage = $target > 0 ? min(100, round(($paid / $target) * 100)) : 0;

            $status = 'Berjalan';
            if ($paid >= $target && $target > 0) {
                $status = 'Terpenuhi';
            }

            return [
                'id' => 'savings_'.$b->id,
                'raw_id' => $b->id,
                'source_menu' => 'investasi',
                'source_label' => 'Tabungan & Target',
                'name' => $b->name,
                'target' => $target,
                'paid' => $paid,
                'remaining' => $remaining,
                'overbudget' => 0,
                'percentage' => $percentage,
                'status' => $status,
                'is_recurring' => (bool) $b->is_recurring,
                'action_url' => route('anggaran.investasi'),
            ];
        });

        // 6. Ringkasan per pilar
        $summaryPengeluaran = [
            'target' => (float) $expenseBudgets->sum('target'),
            'paid' => (float) $expenseBudgets->sum('paid'),
            'remaining' => (float) $expenseBudgets->sum('remaining'),
            'count' => $expenseBudgets->count(),
            'percentage' => $expenseBudgets->sum('target') > 0 ? round(($expenseBudgets->sum('paid') / $expenseBudgets->sum('target')) * 100) : 0,
        ];

        $summaryHutang = [
            'target' => (float) $debtBudgets->sum('target'),
            'paid' => (float) $debtBudgets->sum('paid'),
            'remaining' => (float) $debtBudgets->sum('remaining'),
            'count' => $debtBudgets->count(),
            'total_debt' => (float) $debtBudgets->sum('total_debt'),
            'percentage' => $debtBudgets->sum('target') > 0 ? round(($debtBudgets->sum('paid') / $debtBudgets->sum('target')) * 100) : 0,
        ];

        $summaryTabungan = [
            'target' => (float) $savingsBudgets->sum('target'),
            'paid' => (float) $savingsBudgets->sum('paid'),
            'remaining' => (float) $savingsBudgets->sum('remaining'),
            'count' => $savingsBudgets->count(),
            'percentage' => $savingsBudgets->sum('target') > 0 ? round(($savingsBudgets->sum('paid') / $savingsBudgets->sum('target')) * 100) : 0,
        ];

        // 7. Grand Total Bulan Berjalan
        $grandTotalTarget = $summaryPengeluaran['target'] + $summaryHutang['target'] + $summaryTabungan['target'];
        $grandTotalPaid = $summaryPengeluaran['paid'] + $summaryHutang['paid'] + $summaryTabungan['paid'];
        $grandTotalRemaining = $summaryPengeluaran['remaining'] + $summaryHutang['remaining'] + $summaryTabungan['remaining'];
        $grandPercentage = $grandTotalTarget > 0 ? round(($grandTotalPaid / $grandTotalTarget) * 100) : 0;

        // Gabungkan seluruh item ke dalam satu daftar konsolidasi
        $allBudgets = $expenseBudgets->concat($debtBudgets)->concat($savingsBudgets)->values();

        $overbudgetCount = $allBudgets->where('status', 'Melebihi')->count();
        $completedCount = $allBudgets->where('status', 'Terpenuhi')->count();

        // Daftar bulan yang tersedia untuk filter riwayat
        $availableMonths = Budget::where('user_id', $user->id)
            ->pluck('month')
            ->unique()
            ->filter()
            ->values()
            ->toArray();

        if (! in_array($currentMonthName, $availableMonths)) {
            array_unshift($availableMonths, $currentMonthName);
        }

        return Inertia::render('Anggaran/RingkasanAnggaran', [
            'currentMonth' => $currentMonthName,
            'selectedMonth' => $selectedMonth,
            'isCurrentMonth' => ($selectedMonth === $currentMonthName),
            'availableMonths' => $availableMonths,
            'grandSummary' => [
                'totalTarget' => $grandTotalTarget,
                'totalPaid' => $grandTotalPaid,
                'totalRemaining' => $grandTotalRemaining,
                'percentage' => $grandPercentage,
                'totalItems' => $allBudgets->count(),
                'overbudgetCount' => $overbudgetCount,
                'completedCount' => $completedCount,
            ],
            'pillarSummaries' => [
                'pengeluaran' => $summaryPengeluaran,
                'hutang' => $summaryHutang,
                'tabungan' => $summaryTabungan,
            ],
            'allBudgets' => $allBudgets,
            'expenseBudgets' => $expenseBudgets,
            'debtBudgets' => $debtBudgets,
            'savingsBudgets' => $savingsBudgets,
        ]);
    }

    /**
     * Otomatisasi kloning anggaran berulang (recurring) untuk bulan berjalan jika belum ada
     */
    private function syncRecurringBudgets(int $userId, string $currentMonth): void
    {
        // 1. Pengeluaran berulang
        $recurringExpenses = Budget::where('user_id', $userId)
            ->where('type', 'Pengeluaran')
            ->where('is_recurring', true)
            ->where('month', '!=', $currentMonth)
            ->get()
            ->groupBy('name');

        $existingExpenseNames = Budget::where('user_id', $userId)
            ->where('month', $currentMonth)
            ->where('type', 'Pengeluaran')
            ->pluck('name')
            ->toArray();

        foreach ($recurringExpenses as $name => $group) {
            if (! in_array($name, $existingExpenseNames)) {
                $latest = $group->sortByDesc('created_at')->first();
                Budget::create([
                    'user_id' => $userId,
                    'type' => 'Pengeluaran',
                    'name' => $latest->name,
                    'target_amount' => $latest->target_amount,
                    'current_amount' => 0,
                    'month' => $currentMonth,
                    'status' => 'Berjalan',
                    'is_recurring' => true,
                ]);
            }
        }

        // 2. Tabungan berulang
        $recurringSavings = Budget::where('user_id', $userId)
            ->where('type', '!=', 'Pengeluaran')
            ->where('is_recurring', true)
            ->where('month', '!=', $currentMonth)
            ->get()
            ->groupBy('name');

        $existingSavingsNames = Budget::where('user_id', $userId)
            ->where('month', $currentMonth)
            ->where('type', '!=', 'Pengeluaran')
            ->pluck('name')
            ->toArray();

        foreach ($recurringSavings as $name => $group) {
            if (! in_array($name, $existingSavingsNames)) {
                $latest = $group->sortByDesc('created_at')->first();
                Budget::create([
                    'user_id' => $userId,
                    'type' => $latest->type,
                    'name' => $latest->name,
                    'target_amount' => $latest->target_amount,
                    'current_amount' => 0,
                    'month' => $currentMonth,
                    'status' => 'Berjalan',
                    'is_recurring' => true,
                ]);
            }
        }
    }
}
