<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Laravel\Socialite\Facades\Socialite;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class GoogleAuthController extends Controller
{
    public function redirect()
    {
        return Socialite::driver('google')->redirect();
    }

    public function callback()
    {
        try {
            $googleUser = Socialite::driver('google')->user();
            
            $user = User::where('google_id', $googleUser->id)->orWhere('email', $googleUser->email)->first();
            
            if (!$user) {
                if (!\App\Http\Controllers\Admin\AdminSettingController::isRegistrationAllowed()) {
                    return redirect()->route('login')->with('error', 'Pendaftaran akun baru sedang ditutup sementara oleh administrator.');
                }

                $user = User::create([
                    'name' => $googleUser->name,
                    'email' => $googleUser->email,
                    'google_id' => $googleUser->id,
                    'avatar' => null, // Default profile photo uses initials
                ]);
            } else {
                $user->update([
                    'google_id' => $googleUser->id,
                ]);
            }
            
            Auth::login($user, true);
            session()->flash('show_subscription_offer', true);
            session()->flash('just_logged_in', true);
            
            return redirect()->intended(route('dashboard', absolute: false));
            
        } catch (\Exception $e) {
            return redirect()->route('login')->with('error', 'Gagal login menggunakan Google. Silakan coba lagi.');
        }
    }
}
