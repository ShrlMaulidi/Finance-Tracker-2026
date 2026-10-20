<?php

namespace App\Http\Controllers;

use App\Events\TransactionRecorded;
use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();

        $validated = $request->validated();
        $user->fill([
            'name' => $validated['name'],
            'email' => $validated['email'],
        ]);

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        // Handle Avatar Removal
        if ($request->boolean('remove_avatar')) {
            $oldAvatar = $user->getRawOriginal('avatar');
            if ($oldAvatar && ! str_starts_with($oldAvatar, 'http')) {
                Storage::disk('public')->delete($oldAvatar);
            }
            $user->avatar = null;
        }

        // Handle Avatar Upload
        if ($request->hasFile('avatar')) {
            $oldAvatar = $user->getRawOriginal('avatar');
            if ($oldAvatar && ! str_starts_with($oldAvatar, 'http')) {
                Storage::disk('public')->delete($oldAvatar);
            }
            $path = $request->file('avatar')->store('avatars', 'public');
            $user->avatar = $path;
        }

        if ($request->filled('mood_emoji')) {
            $user->mood_emoji = $request->input('mood_emoji');
        }

        $user->save();

        TransactionRecorded::broadcastAfterResponse(
            userId: (int) $user->id,
            action: 'updated',
            source: 'web',
            message: 'Profil Anda berhasil diperbarui'
        );

        return Redirect::route('profile.edit');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user->has_password) {
            $request->validate([
                'password' => ['required', 'current_password'],
            ]);
        } else {
            // Google-only accounts have no password to confirm with, so they type "HAPUS" instead
            $request->merge(['confirmation' => mb_strtoupper(trim((string) $request->input('confirmation')))]);
            $request->validate([
                'confirmation' => ['required', 'in:HAPUS'],
            ], [
                'confirmation.required' => 'Ketik HAPUS untuk mengonfirmasi penghapusan akun.',
                'confirmation.in' => 'Ketik HAPUS untuk mengonfirmasi penghapusan akun.',
            ]);
        }

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
