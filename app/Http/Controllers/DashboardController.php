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
        
        $transactions = $query->get();
        
        $totalPemasukan = $transactions->where('type', 'pemasukan')->sum('amount');
        $totalPengeluaran = $transactions->where('type', 'pengeluaran')->sum('amount');
        $totalTabungan = $transactions->where('type', 'tabungan')->sum('amount');
        
        // Prepare graph data
        $chartData = [];
        
        if ($filter === 'bulan') {
            // Group by day
            $activeDate = Carbon::create($yearQuery, $monthQuery, 1);
            $daysInMonth = $activeDate->daysInMonth;
            for ($i = 1; $i <= $daysInMonth; $i++) {
                $dayTransactions = $transactions->filter(function($item) use ($i) {
                    return Carbon::parse($item->date)->day == $i;
                });
                $chartData[] = [
                    'name' => (string)$i,
                    'pemasukan' => $dayTransactions->where('type', 'pemasukan')->sum('amount'),
                    'pengeluaran' => $dayTransactions->where('type', 'pengeluaran')->sum('amount'),
                    'tabungan' => $dayTransactions->where('type', 'tabungan')->sum('amount'),
                ];
            }
        } elseif ($filter === 'tahun') {
            // Group by month
            for ($i = 1; $i <= 12; $i++) {
                $monthTransactions = $transactions->filter(function($item) use ($i) {
                    return Carbon::parse($item->date)->month == $i;
                });
                $chartData[] = [
                    'name' => Carbon::create()->month($i)->translatedFormat('M'),
                    'pemasukan' => $monthTransactions->where('type', 'pemasukan')->sum('amount'),
                    'pengeluaran' => $monthTransactions->where('type', 'pengeluaran')->sum('amount'),
                    'tabungan' => $monthTransactions->where('type', 'tabungan')->sum('amount'),
                ];
            }
        } else {
            // Group by Year
            $years = $transactions->map(function($item) {
                return Carbon::parse($item->date)->year;
            })->unique()->sort()->values();
            
            if ($years->isEmpty()) {
                $years = collect([$now->year]);
            }
            
            foreach ($years as $year) {
                $yearTransactions = $transactions->filter(function($item) use ($year) {
                    return Carbon::parse($item->date)->year == $year;
                });
                $chartData[] = [
                    'name' => (string)$year,
                    'pemasukan' => $yearTransactions->where('type', 'pemasukan')->sum('amount'),
                    'pengeluaran' => $yearTransactions->where('type', 'pengeluaran')->sum('amount'),
                    'tabungan' => $yearTransactions->where('type', 'tabungan')->sum('amount'),
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
