<?php

namespace App\Http\Controllers;

use App\Models\Target;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TargetController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        // Ambil data targets milik user
        $targets = Target::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function($target) {
                // Update status jika jumlah terkumpul >= target
                if ($target->status === 'Berjalan' && $target->current_amount >= $target->target_amount) {
                    $target->update(['status' => 'Tercapai']);
                }

                return [
                    'id' => $target->id,
                    'name' => $target->name,
                    'category' => $target->category,
                    'target' => $target->target_amount,
                    'current' => $target->current_amount,
                    'status' => $target->status,
                    'date' => $target->target_date ? \Carbon\Carbon::parse($target->target_date)->translatedFormat('d F Y') : '-',
                    'raw_date' => $target->target_date,
                    'image_path' => $target->image_path ? asset('storage/' . $target->image_path) : null
                ];
            });

        return Inertia::render('Tabungan/Target', [
            'dbTargets' => $targets
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'target_amount' => 'required|numeric|min:1',
            'target_date' => 'nullable|date',
            'image' => 'nullable|image|max:2048'
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('targets', 'public');
        }

        Target::create([
            'user_id' => auth()->id(),
            'name' => $request->name,
            'category' => $request->category,
            'image_path' => $imagePath,
            'target_amount' => $request->target_amount,
            'current_amount' => 0,
            'target_date' => $request->target_date,
            'status' => 'Berjalan'
        ]);

        return redirect()->back()->with('success', 'Target berhasil disimpan.');
    }

    public function update(Request $request, Target $target)
    {
        if ($target->user_id !== auth()->id()) abort(403);

        $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'target_amount' => 'required|numeric|min:1',
            'target_date' => 'nullable|date',
            'image' => 'nullable|image|max:2048'
        ]);

        $data = [
            'name' => $request->name,
            'category' => $request->category,
            'target_amount' => $request->target_amount,
            'target_date' => $request->target_date,
        ];

        if ($request->hasFile('image')) {
            // Optional: delete old image here if exists
            $data['image_path'] = $request->file('image')->store('targets', 'public');
        }

        $target->update($data);

        return redirect()->back()->with('success', 'Target berhasil diubah.');
    }

    public function destroy(Target $target)
    {
        if ($target->user_id !== auth()->id()) abort(403);
        
        $target->delete();

        return redirect()->back()->with('success', 'Target berhasil dihapus.');
    }
}
