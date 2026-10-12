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
        $user = Auth::user();
        if (!$user->canAccess('budget')) {
            return Inertia::render('LockedFeature', [
                'feature' => 'anggaran',
                'title' => 'Menu Pengeluaran Bulanan Terkunci',
                'subtitle' => 'Fitur Perencanaan & Batas Belanja Eksklusif Member Pro',
                'description' => 'Kendalikan keuangan Anda dengan menentukan batas anggaran pengeluaran bulanan per kategori agar tidak boros atau boncos.',
                'benefits' => [
                    'Tetapkan batas anggaran pengeluaran bulanan per kategori belanja',
                    'Sistem anggaran berulang (recurring) otomatis setiap awal bulan',
                    'Visual bar real-time sisa saldo budget & peringatan batas pengeluaran',
                    'Evaluasi efisiensi pos belanja dan riwayat per bulan',
                ],
            ]);
        }

        Carbon::setLocale('id');
        $currentMonth = ucfirst(Carbon::now()->translatedFormat('F Y'));
        $currentMonthNum = Carbon::now()->month;
        $currentYear = Carbon::now()->year;

        // Ambil kategori pengeluaran dari tabel categories
        $expenseCategories = \App\Models\Category::where('user_id', $user->id)
            ->where('type', 'pengeluaran')
            ->orderBy('name')
            ->pluck('name')
            ->toArray();

        // Cek dan gandakan anggaran berulang (recurring) secara efisien
        $recurringPastBudgets = Budget::where('user_id', $user->id)
            ->where('type', 'Pengeluaran')
            ->where('is_recurring', true)
            ->where('month', '!=', $currentMonth)
            ->get()
            ->groupBy('name');

        $existingNamesThisMonth = Budget::where('user_id', $user->id)
            ->where('month', $currentMonth)
            ->where('type', 'Pengeluaran')
            ->pluck('name')
            ->toArray();

        foreach ($recurringPastBudgets as $name => $group) {
            if (!in_array($name, $existingNamesThisMonth)) {
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

        // Ambil pengeluaran aktual dari seluruh kategori sekaligus dalam 1 query SQL
        $actualExpenses = Transaction::where('user_id', $user->id)
            ->where('type', 'pengeluaran')
            ->whereMonth('date', $currentMonthNum)
            ->whereYear('date', $currentYear)
            ->selectRaw('category, SUM(amount) as total')
            ->groupBy('category')
            ->pluck('total', 'category');

        // Ambil data budget bulan ini tanpa N+1 query dan tanpa DB writes berulang
        $currentBudgets = Budget::where('user_id', $user->id)
            ->where('month', $currentMonth)
            ->where('type', 'Pengeluaran')
            ->get()->map(function($budget) use ($actualExpenses) {
                $actualExpense = (float) ($actualExpenses[$budget->name] ?? 0);
                
                $status = 'Berjalan';
                if ($actualExpense > $budget->target_amount) {
                    $status = 'Melebihi';
                } elseif ($actualExpense == $budget->target_amount) {
                    $status = 'Terpenuhi';
                }

                return [
                    'id' => $budget->id,
                    'type' => $budget->type,
                    'name' => $budget->name,
                    'target' => (float)$budget->target_amount,
                    'current' => $actualExpense,
                    'status' => $status,
                    'is_recurring' => (bool)$budget->is_recurring,
                    'percentage' => $budget->target_amount > 0 ? min(100, round(($actualExpense / $budget->target_amount) * 100)) : 0
                ];
            });

        // Calculate history data
        $historyBudgets = Budget::where('user_id', $user->id)
            ->where('type', 'Pengeluaran')
            ->where('month', '!=', $currentMonth)
            ->orderBy('created_at', 'desc')
            ->get();
            
        $historyData = $historyBudgets->map(function($budget) {
            return [
                'id' => $budget->id,
                'name' => $budget->name,
                'target' => (float)$budget->target_amount,
                'used' => (float)$budget->current_amount,
                'month' => $budget->month
            ];
        });
        
        $historyMonths = collect($historyData)->pluck('month')->unique()->values();

        $usedCategories = $currentBudgets->pluck('name')->toArray();
        $availableCategories = array_values(array_diff($expenseCategories, $usedCategories));

        return Inertia::render('Anggaran/PengeluaranBulanan', [
            'currentMonth' => $currentMonth,
            'currentBudgets' => $currentBudgets,
            'expenseCategories' => $expenseCategories,
            'availableCategories' => $availableCategories,
            'historyData' => $historyData,
            'historyMonths' => $historyMonths
        ]);
    }

    public function store(Request $request)
    {
        if (!Auth::user()->canAccess('budget')) {
            abort(403, 'Fitur anggaran hanya tersedia untuk akun Pro.');
        }

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
        if (!Auth::user()->canAccess('budget')) {
            abort(403, 'Fitur anggaran hanya tersedia untuk akun Pro.');
        }

        if ($budget->user_id !== auth()->id() || $budget->type !== 'Pengeluaran') abort(403);

        $request->validate([
            'name' => 'required|string|max:255',
            'target_amount' => 'required|numeric|min:1',
            'is_recurring' => 'boolean'
        ]);

        $exists = Budget::where('user_id', auth()->id())
            ->where('type', 'Pengeluaran')
            ->where('name', $request->name)
            ->where('month', $budget->month)
            ->where('id', '!=', $budget->id)
            ->exists();
            
        if ($exists) {
            return redirect()->back()->withErrors(['name' => 'Anggaran untuk kategori ini sudah ada.']);
        }

        $budget->update([
            'name' => $request->name,
            'target_amount' => $request->target_amount,
            'is_recurring' => $request->boolean('is_recurring', false)
        ]);

        return redirect()->back()->with('success', 'Anggaran pengeluaran berhasil diubah.');
    }

    public function destroy(Budget $budget)
    {
        if (!Auth::user()->canAccess('budget')) {
            abort(403, 'Fitur anggaran hanya tersedia untuk akun Pro.');
        }

        if ($budget->user_id !== auth()->id() || $budget->type !== 'Pengeluaran') abort(403);

        $budget->delete();

        return redirect()->back()->with('success', 'Anggaran pengeluaran berhasil dihapus.');
    }
}
