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
            ->where('month', '!=', $currentMonth)
            ->get()
            ->groupBy('name');

        foreach ($recurringPastBudgets as $name => $group) {
            // Cek apakah bulan ini sudah ada anggaran dengan nama tersebut
            $existsThisMonth = Budget::where('user_id', $user->id)
                ->where('month', $currentMonth)
                ->where('name', $name)
                ->exists();

            if (!$existsThisMonth) {
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

        // Ambil data bulan ini
        $currentBudgets = Budget::where('user_id', $user->id)
            ->where('month', $currentMonth)
            ->get()->map(function($budget) {
                $color = 'emerald'; 
                if ($budget->type === 'Tabungan') {
                    $color = 'blue';
                }
                
                return [
                    'id' => $budget->id,
                    'type' => $budget->type,
                    'name' => $budget->name,
                    'target' => $budget->target_amount,
                    'current' => $budget->current_amount,
                    'color' => $color,
                    'status' => $budget->status,
                    'is_recurring' => $budget->is_recurring
                ];
            });

        // Ambil riwayat bulan-bulan sebelumnya
        $historyBudgets = Budget::where('user_id', $user->id)
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

        return Inertia::render('Anggaran/Investasi', [
            'currentMonth' => $currentMonth,
            'currentBudgets' => $currentBudgets,
            'historyData' => $historyBudgets,
            'historyMonths' => $historyMonths
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'type' => 'required|in:Tabungan,Investasi',
            'name' => 'required|string|max:255',
            'target_amount' => 'required|numeric|min:1',
            'is_recurring' => 'boolean'
        ]);

        Carbon::setLocale('id');
        $currentMonth = ucfirst(Carbon::now()->translatedFormat('F Y'));

        Budget::create([
            'user_id' => auth()->id(),
            'type' => $request->type,
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
            'type' => 'required|in:Tabungan,Investasi',
            'name' => 'required|string|max:255',
            'target_amount' => 'required|numeric|min:1',
            'is_recurring' => 'boolean'
        ]);

        $budget->update([
            'type' => $request->type,
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
