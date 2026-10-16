<?php

namespace App\Http\Controllers;

use App\Events\TransactionRecorded;
use App\Models\Debt;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DebtController extends Controller
{
    public function index()
    {
        $debts = Debt::where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('HutangPiutang/Index', [
            'debts' => $debts,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:hutang,piutang',
            'name' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'remaining_amount' => 'required|numeric|min:0|lte:amount',
            'due_date' => 'nullable|date',
            'status' => 'required|in:belum_lunas,lunas',
            'description' => 'nullable|string',
        ]);

        $validated['user_id'] = Auth::id();

        Debt::create($validated);

        try {
            broadcast(new TransactionRecorded(
                userId: (int) Auth::id(),
                action: 'created',
                source: 'web',
                message: "Data {$validated['type']} '{$validated['name']}' berhasil dicatat"
            ));
        } catch (\Throwable $e) {
        }

        return redirect()->back()->with('success', 'Data berhasil ditambahkan.');
    }

    public function update(Request $request, Debt $debt)
    {
        if ($debt->user_id !== Auth::id()) {
            abort(403);
        }

        $validated = $request->validate([
            'type' => 'required|in:hutang,piutang',
            'name' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'remaining_amount' => 'required|numeric|min:0|lte:amount',
            'due_date' => 'nullable|date',
            'status' => 'required|in:belum_lunas,lunas',
            'description' => 'nullable|string',
        ]);

        $debt->update($validated);

        try {
            broadcast(new TransactionRecorded(
                userId: (int) Auth::id(),
                action: 'updated',
                source: 'web',
                message: "Data {$debt->type} '{$debt->name}' berhasil diperbarui"
            ));
        } catch (\Throwable $e) {
        }

        return redirect()->back()->with('success', 'Data berhasil diubah.');
    }

    public function destroy(Debt $debt)
    {
        if ($debt->user_id !== Auth::id()) {
            abort(403);
        }

        $debt->delete();

        try {
            broadcast(new TransactionRecorded(
                userId: (int) Auth::id(),
                action: 'deleted',
                source: 'web',
                message: 'Data hutang/piutang berhasil dihapus'
            ));
        } catch (\Throwable $e) {
        }

        return redirect()->back()->with('success', 'Data berhasil dihapus.');
    }
}
