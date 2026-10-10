<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Transaction;
use App\Models\Debt;
use App\Models\Target;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        Carbon::setLocale('id');
        $user_id = Auth::id();
        
        $filterType = $request->input('filter_type', 'month'); // month, year, all
        $filterMonth = $request->input('filter_month', Carbon::now()->month);
        $filterYear = $request->input('filter_year', Carbon::now()->year);

        $query = Transaction::where('user_id', $user_id);
        
        if ($filterType === 'month') {
            $query->whereMonth('date', $filterMonth)->whereYear('date', $filterYear);
        } elseif ($filterType === 'year') {
            $query->whereYear('date', $filterYear);
        }

        $transactions = $query->orderBy('date', 'desc')->get();

        // 1. Total Pemasukan & Pengeluaran (Filtered)
        $totalPemasukan = $transactions->where('type', 'pemasukan')->sum('amount');
        $totalPengeluaran = $transactions->where('type', 'pengeluaran')->sum('amount');

        // 2. Breakdown by Payment Method (Filtered)
        $pemasukanByMethod = $transactions->where('type', 'pemasukan')->groupBy('payment_method')->map->sum('amount');
        $pengeluaranByMethod = $transactions->where('type', 'pengeluaran')->groupBy('payment_method')->map->sum('amount');

        // 3. All-time Balance & Balance by Method (All Time)
        // Note: The user asked for "Total sisa saldo Aktif berdasarkan Kategori Jenis Metode"
        // This is usually all-time balance, not filtered balance, because balance accumulates over time.
        $allTransactions = Transaction::where('user_id', $user_id)->get();
        $allPemasukan = $allTransactions->where('type', 'pemasukan')->sum('amount');
        $allPengeluaran = $allTransactions->where('type', 'pengeluaran')->sum('amount');
        $allTabungan = $allTransactions->where('type', 'tabungan')->sum('amount');
        
        $totalSaldoAktif = $allPemasukan - $allPengeluaran - $allTabungan;
        
        $methods = $allTransactions->pluck('payment_method')->filter()->unique()->values();
        $saldoByMethod = [];
        foreach ($methods as $method) {
            $in = $allTransactions->where('payment_method', $method)->where('type', 'pemasukan')->sum('amount');
            $out = $allTransactions->where('payment_method', $method)->where('type', 'pengeluaran')->sum('amount');
            $tab = $allTransactions->where('payment_method', $method)->where('type', 'tabungan')->sum('amount');
            $saldoByMethod[$method] = $in - $out - $tab;
        }

        // 4. Total Hutang & Piutang (All Time Active)
        $totalHutang = Debt::where('user_id', $user_id)->where('type', 'hutang')->where('status', 'belum_lunas')->sum('remaining_amount');
        $totalPiutang = Debt::where('user_id', $user_id)->where('type', 'piutang')->where('status', 'belum_lunas')->sum('remaining_amount');

        // 5. Total Tabungan & Target (All Time)
        $totalTabunganTarget = Target::where('user_id', $user_id)->sum('current_amount');

        // Available options for filter
        $availableYears = Transaction::where('user_id', $user_id)
            ->selectRaw('YEAR(date) as year')
            ->distinct()
            ->pluck('year')
            ->toArray();
            
        if (empty($availableYears)) {
            $availableYears = [Carbon::now()->year];
        }
        rsort($availableYears);

        return Inertia::render('Laporan/Index', [
            'filters' => [
                'type' => $filterType,
                'month' => (int)$filterMonth,
                'year' => (int)$filterYear,
            ],
            'availableYears' => $availableYears,
            'summary' => [
                'pemasukan' => $totalPemasukan,
                'pengeluaran' => $totalPengeluaran,
                'pemasukan_by_method' => $pemasukanByMethod,
                'pengeluaran_by_method' => $pengeluaranByMethod,
                'saldo_aktif' => $totalSaldoAktif,
                'saldo_by_method' => $saldoByMethod,
                'hutang' => $totalHutang,
                'piutang' => $totalPiutang,
                'tabungan' => $totalTabunganTarget,
            ],
            'transactions' => $transactions->values()->take(50), // Latest 50 from the filtered period
        ]);
    }
}
