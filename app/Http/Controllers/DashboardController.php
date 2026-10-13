<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\Request;
use App\Models\Transaction;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $filter = $request->query('filter', 'bulan'); // bulan, tahun, semua
        
        $now = Carbon::now();
        $monthQuery = $request->query('month', $now->month);
        $yearQuery = $request->query('year', $now->year);
        
        $query = Transaction::where('user_id', Auth::id());
        
        if ($filter === 'bulan') {
            $query->whereMonth('date', $monthQuery)
                  ->whereYear('date', $yearQuery);
        } elseif ($filter === 'tahun') {
            $query->whereYear('date', $yearQuery);
        }
        
        $totals = (clone $query)->selectRaw('type, SUM(amount) as total')->groupBy('type')->pluck('total', 'type');
        
        $totalPemasukan = $totals->get('pemasukan', 0);
        $totalPengeluaran = $totals->get('pengeluaran', 0);
        $totalTabungan = $totals->get('tabungan', 0);
        
        // Prepare graph data
        $chartData = [];
        
        if ($filter === 'bulan') {
            // Group by day using SQL
            $grouped = (clone $query)
                ->selectRaw('DAY(date) as day, type, SUM(amount) as total')
                ->groupBy('day', 'type')
                ->get();
                
            $activeDate = Carbon::create($yearQuery, $monthQuery, 1);
            $daysInMonth = $activeDate->daysInMonth;
            
            for ($i = 1; $i <= $daysInMonth; $i++) {
                $dayData = $grouped->where('day', $i);
                $chartData[] = [
                    'name' => (string)$i,
                    'pemasukan' => (float)$dayData->where('type', 'pemasukan')->sum('total'),
                    'pengeluaran' => (float)$dayData->where('type', 'pengeluaran')->sum('total'),
                    'tabungan' => (float)$dayData->where('type', 'tabungan')->sum('total'),
                ];
            }
        } elseif ($filter === 'tahun') {
            // Group by month using SQL
            $grouped = (clone $query)
                ->selectRaw('MONTH(date) as month, type, SUM(amount) as total')
                ->groupBy('month', 'type')
                ->get();
                
            for ($i = 1; $i <= 12; $i++) {
                $monthData = $grouped->where('month', $i);
                $chartData[] = [
                    'name' => Carbon::create()->month($i)->translatedFormat('M'),
                    'pemasukan' => (float)$monthData->where('type', 'pemasukan')->sum('total'),
                    'pengeluaran' => (float)$monthData->where('type', 'pengeluaran')->sum('total'),
                    'tabungan' => (float)$monthData->where('type', 'tabungan')->sum('total'),
                ];
            }
        } else {
            // Group by year using SQL
            $grouped = (clone $query)
                ->selectRaw('YEAR(date) as year, type, SUM(amount) as total')
                ->groupBy('year', 'type')
                ->get();
                
            $years = $grouped->pluck('year')->unique()->sort()->values();
            if ($years->isEmpty()) {
                $years = collect([$now->year]);
            }
            
            foreach ($years as $year) {
                $yearData = $grouped->where('year', $year);
                $chartData[] = [
                    'name' => (string)$year,
                    'pemasukan' => (float)$yearData->where('type', 'pemasukan')->sum('total'),
                    'pengeluaran' => (float)$yearData->where('type', 'pengeluaran')->sum('total'),
                    'tabungan' => (float)$yearData->where('type', 'tabungan')->sum('total'),
                ];
            }
        }

        // 1. Kategori Pengeluaran (Top breakdown for Donut chart & legend)
        $expenseQuery = (clone $query)->where('type', 'pengeluaran');
        $expenseTransactions = $expenseQuery->select('category', 'amount')->get();
        $totalPengeluaranFloat = (float) $totalPengeluaran;

        $groupedCategories = $expenseTransactions
            ->groupBy('category')
            ->map(function ($items, $cat) use ($totalPengeluaranFloat) {
                $sum = (float) $items->sum('amount');
                return [
                    'name' => $cat ?: 'Lainnya',
                    'amount' => $sum,
                    'count' => $items->count(),
                    'percentage' => $totalPengeluaranFloat > 0 ? round(($sum / $totalPengeluaranFloat) * 100) : 0,
                ];
            })
            ->sortByDesc('amount')
            ->values();

        if ($groupedCategories->count() > 4) {
            $topCategories = $groupedCategories->take(3);
            $others = $groupedCategories->slice(3);
            $otherSum = (float) $others->sum('amount');
            $otherCount = (int) $others->sum('count');
            $otherPercentage = $totalPengeluaranFloat > 0 ? round(($otherSum / $totalPengeluaranFloat) * 100) : 0;

            $categoryExpenses = $topCategories->push([
                'name' => 'Lainnya',
                'amount' => $otherSum,
                'count' => $otherCount,
                'percentage' => $otherPercentage,
            ])->values()->all();
        } else {
            $categoryExpenses = $groupedCategories->all();
        }

        // 2. Riwayat Transaksi Terbaru
        $recentTransactions = (clone $query)
            ->orderBy('date', 'desc')
            ->orderBy('id', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($t) {
                return [
                    'id' => $t->id,
                    'type' => $t->type,
                    'amount' => (float) $t->amount,
                    'category' => $t->category ?: 'Lainnya',
                    'payment_method' => $t->payment_method ?: 'Cash',
                    'title' => $t->title ?: ($t->description ?: $t->category ?: 'Transaksi'),
                    'description' => $t->description,
                    'date' => $t->date,
                    'date_formatted' => Carbon::parse($t->date)->translatedFormat('d F Y'),
                ];
            });

        return Inertia::render('Dashboard/Index', [
            'summary' => [
                'pemasukan' => (float)$totalPemasukan,
                'pengeluaran' => (float)$totalPengeluaran,
                'tabungan' => (float)$totalTabungan,
                'saldo' => (float)($totalPemasukan - $totalPengeluaran - $totalTabungan),
            ],
            'chartData' => $chartData,
            'currentFilter' => $filter,
            'selectedMonth' => (int)$monthQuery,
            'selectedYear' => (int)$yearQuery,
            'categoryExpenses' => $categoryExpenses,
            'recentTransactions' => $recentTransactions,
        ]);
    }
}
