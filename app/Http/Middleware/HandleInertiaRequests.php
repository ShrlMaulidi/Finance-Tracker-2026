<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $isFreeUser = $user ? $user->isFree() : true;

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user,
            ],
            'flash' => [
                'just_registered' => (bool) $request->session()->get('just_registered', false),
                'show_subscription_offer' => $isFreeUser && (bool) $request->session()->get('show_subscription_offer', false),
                'just_logged_in' => $request->session()->get('just_logged_in', false),
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
            'pricing' => \App\Http\Controllers\Admin\AdminSettingController::getPricingSettings(),
        ];
    }
}
