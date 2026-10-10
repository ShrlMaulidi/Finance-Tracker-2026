<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CategoryController extends Controller
{
    public function index()
    {
        $categories = Category::where('user_id', auth()->id())
            ->orderBy('type')
            ->orderBy('name')
            ->get()
            ->map(function ($category) {
                return [
                    'id' => $category->id,
                    'type' => $category->type,
                    'name' => $category->name,
                ];
            });

        return Inertia::render('Kategori/Index', [
            'categories' => $categories
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'type' => 'required|in:pemasukan,pengeluaran',
            'name' => 'required|string|max:255'
        ]);

        // Cek apakah nama kategori untuk tipe yang sama sudah ada
        $exists = Category::where('user_id', auth()->id())
            ->where('type', $request->type)
            ->where('name', $request->name)
            ->exists();

        if ($exists) {
            return redirect()->back()->withErrors(['name' => 'Kategori ini sudah ada.']);
        }

        Category::create([
            'user_id' => auth()->id(),
            'type' => $request->type,
            'name' => $request->name
        ]);

        return redirect()->back()->with('success', 'Kategori berhasil ditambahkan.');
    }

    public function update(Request $request, Category $category)
    {
        if ($category->user_id !== auth()->id()) abort(403);

        $request->validate([
            'type' => 'required|in:pemasukan,pengeluaran',
            'name' => 'required|string|max:255'
        ]);

        $category->update([
            'type' => $request->type,
            'name' => $request->name
        ]);

        return redirect()->back()->with('success', 'Kategori berhasil diperbarui.');
    }

    public function destroy(Category $category)
    {
        if ($category->user_id !== auth()->id()) abort(403);

        $category->delete();

        return redirect()->back()->with('success', 'Kategori berhasil dihapus.');
    }
}
