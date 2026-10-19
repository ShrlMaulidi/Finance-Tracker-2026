<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class TransactionHistoryController extends Controller
{
    private const PER_PAGE = 50;

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
            $query->inMonth($filterYear, $filterMonth);
        } elseif ($filterType === 'year') {
            $query->inYear($filterYear);
        }

        // Period totals come from one SQL aggregate, so they stay correct no matter how many rows exist
        $totals = (clone $query)
            ->selectRaw('type, SUM(amount) as total, COUNT(*) as count')
            ->groupBy('type')
            ->get()
            ->keyBy('type');

        // Rows are streamed in pages via infinite scroll instead of shipping every transaction at once
        $transactions = $query->orderBy('date', 'desc')
            ->orderBy('id', 'desc')
            ->simplePaginate(self::PER_PAGE, ['id', 'type', 'amount', 'category', 'payment_method', 'title', 'description', 'date'])
            ->withQueryString()
            ->through(fn (Transaction $t) => [
                'id' => $t->id,
                'type' => $t->type,
                'amount' => (float) $t->amount,
                'category' => $t->category,
                'payment_method' => $t->payment_method,
                'title' => $t->title,
                'description' => $t->description,
                'date' => $t->date,
                'date_formatted' => Carbon::parse($t->date)->translatedFormat('d F Y'),
            ]);

        // Available options for filter
        $availableYears = Transaction::availableYearsFor($user_id);

        return Inertia::render('Transaksi/History', [
            'title' => $title,
            'currentType' => $type, // semua, pengeluaran, pemasukan
            'filters' => [
                'type' => $filterType,
                'month' => (int) $filterMonth,
                'year' => (int) $filterYear,
            ],
            'availableYears' => $availableYears,
            'summary' => [
                'count' => (int) $totals->sum('count'),
                'pemasukan' => (float) ($totals->get('pemasukan')->total ?? 0),
                'pengeluaran' => (float) ($totals->get('pengeluaran')->total ?? 0),
                'tabungan' => (float) ($totals->get('tabungan')->total ?? 0),
            ],
            'transactions' => Inertia::scroll($transactions),
        ]);
    }
}
