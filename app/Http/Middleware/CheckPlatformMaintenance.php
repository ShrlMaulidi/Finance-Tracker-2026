<?php

namespace App\Http\Middleware;

use App\Http\Controllers\Admin\AdminSettingController;
use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class CheckPlatformMaintenance
{
    /**
     * Whitelisted URL patterns that bypass maintenance mode.
     */
    protected array $whitelisted = [
        'login',
        'logout',
        'admin',
        'admin/*',
        'forgot-password',
        'reset-password/*',
        'webhook/*',
        'up',
    ];

    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! AdminSettingController::isMaintenanceMode()) {
            return $next($request);
        }

        // Super Admin always has full access
        if ($request->user() && $request->user()->isSuperAdmin()) {
            return $next($request);
        }

        // Check if current route is whitelisted (e.g. login, admin endpoints, webhooks)
        foreach ($this->whitelisted as $pattern) {
            if ($request->is($pattern)) {
                return $next($request);
            }
        }

        // Return JSON error for API requests
        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'message' => 'Sistem FinanceTrack sedang dalam mode pemeliharaan berkala.',
            ], 503);
        }

        // Render dedicated maintenance page
        $settings = AdminSettingController::getPricingSettings();

        return Inertia::render('Maintenance', [
            'supportEmail' => $settings['support_email'] ?? 'support@financetrack.com',
            'supportWa' => $settings['support_wa'] ?? '6281234567890',
        ])->toResponse($request)->setStatusCode(503);
    }
}
