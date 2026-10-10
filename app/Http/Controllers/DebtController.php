<?php

namespace App\Http\Controllers;

use App\Models\Debt;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class DebtController extends Controller
{
    public function index()
    {
        $debts = Debt::where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->get();
            
        return Inertia::render('HutangPiutang/Index', [
            'debts' => $debts
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
        
        return redirect()->back()->with('success', 'Data berhasil diubah.');
    }

    public function destroy(Debt $debt)
    {
        if ($debt->user_id !== Auth::id()) {
            abort(403);
        }
        
        $debt->delete();
        
        return redirect()->back()->with('success', 'Data berhasil dihapus.');
    }
}
