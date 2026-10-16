<?php

namespace App\Http\Controllers;

use App\Events\TransactionRecorded;
use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CategoryController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        // Auto-seed defaults if user does not have categories yet
        if (Category::where('user_id', $user->id)->count() === 0) {
            $user->seedDefaultCategoriesAndPaymentMethods();
        }

        $categories = Category::where('user_id', $user->id)
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

        $userCategoriesCount = Category::where('user_id', $user->id)->count();
        $categoryLimit = $user->getLimit('category');
        $isUnlimited = $categoryLimit < 0;
        $canAdd = $isUnlimited || $userCategoriesCount < $categoryLimit;

        return Inertia::render('Kategori/Index', [
            'categories' => $categories,
            'isFree' => $user->isFree(),
            'canAdd' => $canAdd,
            'maxLimit' => $isUnlimited ? null : $categoryLimit,
            'currentCount' => $userCategoriesCount,
        ]);
    }

    public function store(Request $request)
    {
        $user = auth()->user();
        $count = Category::where('user_id', $user->id)->count();
        if ($user->hasReachedLimit('category', $count)) {
            $limit = $user->getLimit('category');

            return redirect()->back()->withErrors([
                'name' => "Batas maksimal kategori untuk paket Anda telah tercapai (maksimal {$limit} data). Silakan upgrade ke paket Pro untuk menambah kategori tanpa batas.",
            ]);
        }

        $request->validate([
            'type' => 'required|in:pemasukan,pengeluaran',
            'name' => 'required|string|max:255',
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
            'name' => $request->name,
        ]);

        try {
            broadcast(new TransactionRecorded(
                userId: (int) auth()->id(),
                action: 'created',
                source: 'web',
                message: "Kategori '{$request->name}' berhasil ditambahkan"
            ));
        } catch (\Throwable $e) {
        }

        return redirect()->back()->with('success', 'Kategori berhasil ditambahkan.');
    }

    public function update(Request $request, Category $category)
    {
        if ($category->user_id !== auth()->id()) {
            abort(403);
        }

        $request->validate([
            'type' => 'required|in:pemasukan,pengeluaran',
            'name' => 'required|string|max:255',
        ]);

        $category->update([
            'type' => $request->type,
            'name' => $request->name,
        ]);

        try {
            broadcast(new TransactionRecorded(
                userId: (int) auth()->id(),
                action: 'updated',
                source: 'web',
                message: "Kategori '{$category->name}' berhasil diperbarui"
            ));
        } catch (\Throwable $e) {
        }

        return redirect()->back()->with('success', 'Kategori berhasil diperbarui.');
    }

    public function destroy(Category $category)
    {
        if ($category->user_id !== auth()->id()) {
            abort(403);
        }

        $category->delete();

        try {
            broadcast(new TransactionRecorded(
                userId: (int) auth()->id(),
                action: 'deleted',
                source: 'web',
                message: 'Kategori berhasil dihapus'
            ));
        } catch (\Throwable $e) {
        }

        return redirect()->back()->with('success', 'Kategori berhasil dihapus.');
    }
}
