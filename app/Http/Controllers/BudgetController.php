<?php

namespace App\Http\Controllers;

use App\Events\TransactionRecorded;
use App\Models\Budget;
use App\Models\Target;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BudgetController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        if (! $user->canAccess('budget')) {
            return Inertia::render('LockedFeature', [
                'feature' => 'anggaran',
                'title' => 'Menu Anggaran Tabungan & Target Terkunci',
                'subtitle' => 'Alokasikan Dana Simpanan Impian Khusus Member Pro',
                'description' => 'Disiplin menabung dengan menetapkan alokasi anggaran khusus untuk pos tabungan impian, investasi, dan target masa depan.',
                'benefits' => [
                    'Tetapkan target alokasi tabungan bulanan terencana',
                    'Otomatisasi anggaran berulang (recurring) setiap bulan',
                    'Tracking progres pemenuhan simpanan & investasi',
                    'Integrasi langsung dengan total kekayaan bersih',
                ],
            ]);
        }

        Carbon::setLocale('id');
        $currentMonth = ucfirst(Carbon::now()->translatedFormat('F Y'));

        // Cek dan gandakan anggaran berulang (recurring) dari masa lalu ke bulan ini
        $recurringPastBudgets = Budget::where('user_id', $user->id)
            ->where('is_recurring', true)
            ->where('type', '!=', 'Pengeluaran')
            ->where('month', '!=', $currentMonth)
            ->get()
            ->groupBy('name');

        $existingNamesThisMonth = Budget::where('user_id', $user->id)
            ->where('month', $currentMonth)
            ->pluck('name')
            ->toArray();

        foreach ($recurringPastBudgets as $name => $group) {
            // Cek apakah bulan ini sudah ada anggaran dengan nama tersebut
            if (! in_array($name, $existingNamesThisMonth)) {
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
                    'is_recurring' => true,
                ]);
            }
        }

        $currentMonthNum = Carbon::now()->month;
        $currentYear = Carbon::now()->year;

        // Ambil data bulan ini
        $budgets = Budget::where('user_id', $user->id)
            ->where('type', '!=', 'Pengeluaran')
            ->where('month', $currentMonth)
            ->get();

        $budgetNames = $budgets->pluck('name')->toArray();

        $actualSavings = Transaction::where('user_id', $user->id)
            ->where('type', 'tabungan')
            ->whereIn('category', $budgetNames)
            ->inMonth($currentYear, $currentMonthNum)
            ->selectRaw('category, SUM(amount) as total')
            ->groupBy('category')
            ->pluck('total', 'category');

        $targetDataList = Target::where('user_id', $user->id)
            ->whereIn('name', $budgetNames)
            ->get()
            ->keyBy('name');

        $currentBudgets = $budgets->map(function ($budget) use ($actualSavings, $targetDataList) {
            $color = $budget->type === 'Tabungan' ? 'blue' : 'emerald';
            $savings = (float) ($actualSavings[$budget->name] ?? 0);
            $status = $savings >= $budget->target_amount ? 'Terpenuhi' : 'Berjalan';
            $targetData = $targetDataList[$budget->name] ?? null;

            return [
                'id' => $budget->id,
                'type' => $budget->type,
                'name' => $budget->name,
                'target' => (float) $budget->target_amount,
                'current' => $savings,
                'color' => $color,
                'status' => $status,
                'is_recurring' => (bool) $budget->is_recurring,
                'total_target' => (float) ($targetData ? $targetData->target_amount : 0),
                'total_saved' => (float) ($targetData ? $targetData->current_amount : 0),
            ];
        });

        // Ambil riwayat bulan-bulan sebelumnya
        $historyBudgets = Budget::where('user_id', $user->id)
            ->where('type', '!=', 'Pengeluaran')
            ->where('month', '!=', $currentMonth)
            ->orderBy('created_at', 'desc')
            ->get()->map(function ($budget) {
                $status = $budget->status;
                if ($status === 'Berjalan') {
                    $status = ($budget->current_amount >= $budget->target_amount) ? 'Terpenuhi' : 'Gagal';
                }

                return [
                    'id' => $budget->id,
                    'month' => $budget->month,
                    'type' => $budget->type,
                    'name' => $budget->name,
                    'target' => (float) $budget->target_amount,
                    'current' => (float) $budget->current_amount,
                    'status' => $status,
                ];
            });

        $historyMonths = $historyBudgets->pluck('month')->unique()->values();

        $activeTargets = Target::where('user_id', $user->id)
            ->where('status', 'Berjalan')
            ->orderBy('created_at', 'desc')
            ->get();

        $usedTargets = $currentBudgets->pluck('name')->toArray();
        $availableTargets = $activeTargets->filter(function ($t) use ($usedTargets) {
            return ! in_array($t->name, $usedTargets);
        })->values();

        return Inertia::render('Anggaran/Investasi', [
            'currentMonth' => $currentMonth,
            'currentBudgets' => $currentBudgets,
            'historyData' => $historyBudgets,
            'historyMonths' => $historyMonths,
            'activeTargets' => $activeTargets,
            'availableTargets' => $availableTargets,
        ]);
    }

    public function store(Request $request)
    {
        if (! auth()->user()->canAccess('budget')) {
            abort(403, 'Fitur anggaran hanya tersedia untuk akun Pro.');
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'target_amount' => 'required|numeric|min:1',
            'is_recurring' => 'boolean',
        ]);

        Carbon::setLocale('id');
        $currentMonth = ucfirst(Carbon::now()->translatedFormat('F Y'));

        $exists = Budget::where('user_id', auth()->id())
            ->where('month', $currentMonth)
            ->where('name', $request->name)
            ->exists();

        if ($exists) {
            return redirect()->back()->withErrors(['name' => 'Anggaran untuk target ini sudah ada di bulan ini.']);
        }

        $targetData = Target::where('user_id', auth()->id())->where('name', $request->name)->first();
        $type = $targetData ? $targetData->category : 'Tabungan';

        Budget::create([
            'user_id' => auth()->id(),
            'type' => $type,
            'name' => $request->name,
            'target_amount' => $request->target_amount,
            'current_amount' => 0,
            'month' => $currentMonth,
            'status' => 'Berjalan',
            'is_recurring' => $request->boolean('is_recurring', false),
        ]);

        TransactionRecorded::broadcastAfterResponse(
            userId: (int) auth()->id(),
            action: 'created',
            source: 'web',
            message: "Anggaran '{$request->name}' berhasil disimpan"
        );

        return redirect()->back()->with('success', 'Anggaran baru berhasil disimpan.');
    }

    public function update(Request $request, Budget $budget)
    {
        if (! auth()->user()->canAccess('budget')) {
            abort(403, 'Fitur anggaran hanya tersedia untuk akun Pro.');
        }

        if ($budget->user_id !== auth()->id()) {
            abort(403);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'target_amount' => 'required|numeric|min:1',
            'is_recurring' => 'boolean',
        ]);

        $exists = Budget::where('user_id', auth()->id())
            ->where('month', $budget->month)
            ->where('name', $request->name)
            ->where('id', '!=', $budget->id)
            ->exists();

        if ($exists) {
            return redirect()->back()->withErrors(['name' => 'Anggaran untuk target ini sudah ada di bulan ini.']);
        }

        $targetData = Target::where('user_id', auth()->id())->where('name', $request->name)->first();
        $type = $targetData ? $targetData->category : 'Tabungan';

        $budget->update([
            'type' => $type,
            'name' => $request->name,
            'target_amount' => $request->target_amount,
            'is_recurring' => $request->boolean('is_recurring', false),
        ]);

        TransactionRecorded::broadcastAfterResponse(
            userId: (int) auth()->id(),
            action: 'updated',
            source: 'web',
            message: "Anggaran '{$request->name}' berhasil diperbarui"
        );

        return redirect()->back()->with('success', 'Anggaran berhasil diubah.');
    }

    public function destroy(Budget $budget)
    {
        if (! auth()->user()->canAccess('budget')) {
            abort(403, 'Fitur anggaran hanya tersedia untuk akun Pro.');
        }

        if ($budget->user_id !== auth()->id()) {
            abort(403);
        }

        $budget->delete();

        TransactionRecorded::broadcastAfterResponse(
            userId: (int) auth()->id(),
            action: 'deleted',
            source: 'web',
            message: 'Anggaran berhasil dihapus'
        );

        return redirect()->back()->with('success', 'Anggaran berhasil dihapus.');
    }
}
