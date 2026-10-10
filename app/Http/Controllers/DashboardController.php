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
        ]);
    }
}
