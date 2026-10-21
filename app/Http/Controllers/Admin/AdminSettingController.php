<?php

namespace App\Http\Controllers\Admin;

use App\Events\AppSettingsUpdated;
use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Foundation\Application;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AdminSettingController extends Controller
{
    /**
     * Get the system pricing settings from setting model / cache with default fallbacks.
     */
    public static function getPricingSettings(): array
    {
        return Setting::get('pricing_settings', [
            'pro_monthly_price' => 14999,
            'pro_yearly_price' => 149000,
            'pro_plus_monthly_price' => 29999,
            'pro_plus_yearly_price' => 299000,
            'allow_registration' => true,
            'maintenance_mode' => false,
            'support_email' => 'support@financetrack.com',
            'support_wa' => '6281234567890',
        ]);
    }

    /**
     * Check if public registration is enabled.
     */
    public static function isRegistrationAllowed(): bool
    {
        $settings = self::getPricingSettings();

        return (bool) ($settings['allow_registration'] ?? true);
    }

    /**
     * Check if system maintenance mode is enabled.
     */
    public static function isMaintenanceMode(): bool
    {
        $settings = self::getPricingSettings();

        return (bool) ($settings['maintenance_mode'] ?? false);
    }

    /**
     * Display Super Admin settings, tier rules matrix, and system status.
     */
    public function index(): Response
    {
        // System Information
        $dbConnected = true;
        $dbVersion = 'Unknown';
        try {
            $pdo = DB::connection()->getPdo();
            $dbVersion = $pdo->getAttribute(\PDO::ATTR_SERVER_VERSION);
        } catch (\Throwable $e) {
            $dbConnected = false;
        }

        $systemInfo = [
            'app_name' => config('app.name', 'FinanceTrack'),
            'app_env' => config('app.env', 'local'),
            'app_debug' => config('app.debug', false),
            'laravel_version' => Application::VERSION,
            'php_version' => PHP_VERSION,
            'db_connection' => config('database.default'),
            'db_version' => $dbVersion,
            'db_connected' => $dbConnected,
            'server_os' => PHP_OS,
            'timezone' => config('app.timezone', 'UTC'),
        ];

        $pricingSettings = self::getPricingSettings();
        $tierRules = Setting::getTierRules();

        return Inertia::render('Admin/Settings', [
            'systemInfo' => $systemInfo,
            'pricingSettings' => $pricingSettings,
            'tierRules' => $tierRules,
        ]);
    }

    /**
     * Update pricing settings and tier rules matrix.
     */
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'pro_monthly_price' => 'required|numeric|min:0',
            'pro_yearly_price' => 'required|numeric|min:0',
            'pro_plus_monthly_price' => 'required|numeric|min:0',
            'pro_plus_yearly_price' => 'required|numeric|min:0',
            'allow_registration' => 'nullable',
            'maintenance_mode' => 'nullable',
            'support_email' => 'required|email',
            'support_wa' => 'required|string',
            'tier_rules' => 'nullable|array',
        ]);

        $pricingData = [
            'pro_monthly_price' => (float) $validated['pro_monthly_price'],
            'pro_yearly_price' => (float) $validated['pro_yearly_price'],
            'pro_plus_monthly_price' => (float) $validated['pro_plus_monthly_price'],
            'pro_plus_yearly_price' => (float) $validated['pro_plus_yearly_price'],
            'allow_registration' => $request->boolean('allow_registration'),
            'maintenance_mode' => $request->boolean('maintenance_mode'),
            'support_email' => $validated['support_email'],
            'support_wa' => $validated['support_wa'],
        ];

        Setting::set('pricing_settings', $pricingData);
        Cache::forever('admin_pricing_settings', $pricingData);

        if ($request->has('tier_rules') && is_array($request->input('tier_rules'))) {
            Setting::setTierRules($request->input('tier_rules'));
        }

        AppSettingsUpdated::broadcastAfterResponse();

        return back()->with('success', 'Pengaturan sistem & matriks hak akses berhasil diperbarui.');
    }

    /**
     * Reset tier rules to defaults.
     */
    public function resetTierRules(): RedirectResponse
    {
        Setting::resetTierRules();

        AppSettingsUpdated::broadcastAfterResponse();

        return back()->with('success', 'Matriks aturan hak akses berhasil di-reset ke setelan awal default.');
    }
}
