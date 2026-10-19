<?php

namespace App\Http\Controllers\Admin;

use App\Events\TransactionRecorded;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class AdminUserController extends Controller
{
    /**
     * Display a listing of the users with search and filter capabilities.
     */
    public function index(Request $request): Response
    {
        $query = User::query();

        // Search by name or email
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Filter by subscription tier
        if ($tier = $request->input('tier')) {
            if (in_array($tier, ['free', 'pro', 'pro_plus'])) {
                $query->where('subscription_tier', $tier);
            }
        }

        // Filter by active status
        if ($status = $request->input('status')) {
            if ($status === 'active') {
                $query->where('is_active', true);
            } elseif ($status === 'suspended') {
                $query->where('is_active', false);
            }
        }

        // Filter by role
        if ($role = $request->input('role')) {
            if (in_array($role, ['user', 'superadmin'])) {
                $query->where('role', $role);
            }
        }

        $users = $query->latest()
            ->paginate(10)
            ->withQueryString();

        // Count totals for quick summary tabs
        $counts = User::subscriptionSummary();

        return Inertia::render('Admin/Users', [
            'users' => $users,
            'filters' => [
                'search' => $request->input('search', ''),
                'tier' => $request->input('tier', ''),
                'status' => $request->input('status', ''),
                'role' => $request->input('role', ''),
            ],
            'counts' => $counts,
        ]);
    }

    /**
     * Toggle user status (active / suspended).
     */
    public function toggleStatus(Request $request, User $user): RedirectResponse
    {
        if ($user->id === Auth::id()) {
            return back()->with('error', 'Anda tidak dapat menonaktifkan akun Super Admin Anda sendiri.');
        }

        $user->is_active = ! $user->is_active;
        $user->save();

        TransactionRecorded::broadcastAfterResponse(
            userId: (int) $user->id,
            action: 'status_updated',
            source: 'admin',
            message: $user->is_active ? 'Akun Anda telah diaktifkan kembali oleh Admin' : 'Akun Anda telah dinonaktifkan sementara oleh Admin'
        );

        $statusText = $user->is_active ? 'diaktifkan kembali' : 'dinonaktifkan sementara';

        return back()->with('success', "Akun pengguna '{$user->name}' berhasil {$statusText}.");
    }

    /**
     * Update user subscription tier.
     */
    public function updateTier(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'tier' => 'required|in:free,pro,pro_plus',
        ]);

        $user->subscription_tier = $validated['tier'];
        $user->save();

        $tierNames = [
            'free' => 'Gratis (Starter)',
            'pro' => 'Paket Pro',
            'pro_plus' => 'Paket Pro Plus',
        ];

        TransactionRecorded::broadcastAfterResponse(
            userId: (int) $user->id,
            action: 'subscription_updated',
            source: 'admin',
            message: "Paket langganan Anda telah diperbarui ke {$tierNames[$validated['tier']]}!"
        );

        return back()->with('success', "Paket langganan pengguna '{$user->name}' berhasil diubah ke {$tierNames[$validated['tier']]}.");
    }

    /**
     * Permanently delete user account and related records.
     */
    public function destroy(Request $request, User $user): RedirectResponse
    {
        if ($user->id === Auth::id()) {
            return back()->with('error', 'Anda tidak dapat menghapus akun Super Admin Anda sendiri.');
        }

        $userName = $user->name;
        $user->delete();

        return back()->with('success', "Akun pengguna '{$userName}' berhasil dihapus secara permanen beserta seluruh datanya.");
    }
}
