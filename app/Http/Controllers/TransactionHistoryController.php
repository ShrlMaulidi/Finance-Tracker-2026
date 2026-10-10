<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

class TransactionHistoryController extends Controller
{
    public function index(Request $request, $type = 'semua')
    {
        Carbon::setLocale('id');
        $user_id = Auth::id();
        
        $filterType = $request->input('filter_type', 'month'); // month, year, all
        $filterMonth = $request->input('filter_month', Carbon::now()->month);
        $filterYear = $request->input('filter_year', Carbon::now()->year);

        $query = Transaction::where('user_id', $user_id);
        
        if ($type === 'pengeluaran') {
            $query->where('type', 'pengeluaran');
            $title = 'Riwayat Pengeluaran';
        } elseif ($type === 'pemasukan') {
            $query->where('type', 'pemasukan');
            $title = 'Riwayat Pemasukan';
        } elseif ($type === 'tabungan') {
            $query->where('type', 'tabungan');
            $title = 'Riwayat Tabungan';
        } else {
            $title = 'Semua Transaksi';
        }
        
        if ($filterType === 'month') {
            $query->whereMonth('date', $filterMonth)->whereYear('date', $filterYear);
        } elseif ($filterType === 'year') {
            $query->whereYear('date', $filterYear);
        }

        $transactions = $query->orderBy('date', 'desc')->orderBy('created_at', 'desc')->get()->map(function ($t) {
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

        return Inertia::render('Transaksi/History', [
            'title' => $title,
            'currentType' => $type, // semua, pengeluaran, pemasukan
            'filters' => [
                'type' => $filterType,
                'month' => (int)$filterMonth,
                'year' => (int)$filterYear,
            ],
            'availableYears' => $availableYears,
            'transactions' => $transactions,
        ]);
    }
}
