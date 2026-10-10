<?php

namespace App\Http\Controllers;

use App\Models\PaymentMethod;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PaymentMethodController extends Controller
{
    public function index()
    {
        $methods = PaymentMethod::where('user_id', auth()->id())
            ->orderBy('name')
            ->get()
            ->map(function ($method) {
                return [
                    'id' => $method->id,
                    'name' => $method->name,
                ];
            });

        return Inertia::render('Metode/Index', [
            'methods' => $methods
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255'
        ]);

        $exists = PaymentMethod::where('user_id', auth()->id())
            ->where('name', $request->name)
            ->exists();

        if ($exists) {
            return redirect()->back()->withErrors(['name' => 'Metode pembayaran ini sudah ada.']);
        }

        PaymentMethod::create([
            'user_id' => auth()->id(),
            'name' => $request->name
        ]);

        return redirect()->back()->with('success', 'Metode pembayaran berhasil ditambahkan.');
    }

    public function update(Request $request, PaymentMethod $paymentMethod)
    {
        if ($paymentMethod->user_id !== auth()->id()) abort(403);

        $request->validate([
            'name' => 'required|string|max:255'
        ]);

        $exists = PaymentMethod::where('user_id', auth()->id())
            ->where('name', $request->name)
            ->where('id', '!=', $paymentMethod->id)
            ->exists();

        if ($exists) {
            return redirect()->back()->withErrors(['name' => 'Metode pembayaran ini sudah ada.']);
        }

        $paymentMethod->update([
            'name' => $request->name
        ]);

        return redirect()->back()->with('success', 'Metode pembayaran berhasil diperbarui.');
    }

    public function destroy(PaymentMethod $paymentMethod)
    {
        if ($paymentMethod->user_id !== auth()->id()) abort(403);

        $paymentMethod->delete();

        return redirect()->back()->with('success', 'Metode pembayaran berhasil dihapus.');
    }
}
