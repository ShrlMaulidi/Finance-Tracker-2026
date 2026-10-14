<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Setting extends Model
{
    protected $fillable = [
        'key',
        'value',
    ];

    /**
     * Get a setting by key with caching and fallback.
     */
    public static function get(string $key, mixed $default = null): mixed
    {
        return Cache::rememberForever("app_setting_{$key}", function () use ($key, $default) {
            try {
                $setting = self::where('key', $key)->first();
                if (!$setting) {
                    return $default;
                }
                $decoded = json_decode($setting->value, true);
                return json_last_error() === JSON_ERROR_NONE ? $decoded : $setting->value;
            } catch (\Throwable $e) {
                return $default;
            }
        });
    }

    /**
     * Set a setting value in database and update cache.
     */
    public static function set(string $key, mixed $value): void
    {
        $encoded = is_array($value) || is_object($value) ? json_encode($value) : (string) $value;
        self::updateOrCreate(
            ['key' => $key],
            ['value' => $encoded]
        );
        Cache::forever("app_setting_{$key}", $value);
    }

    /**
     * Forget a setting from cache and database.
     */
    public static function forget(string $key): void
    {
        self::where('key', $key)->delete();
        Cache::forget("app_setting_{$key}");
    }

    /**
     * Default baseline rules for each subscription tier.
     */
    public static function defaultTierRules(): array
    {
        return [
            'free' => [
                'target_limit' => 1,
                'bill_limit' => 2,
                'category_limit' => 15,
                'payment_method_limit' => 5,
                'access_budget' => false,
                'access_report' => false,
                'access_report_export' => false,
                'access_ai_agent' => false,
                'access_dashboard_chart' => false,
            ],
            'pro' => [
                'target_limit' => -1, // -1 means unlimited
                'bill_limit' => -1,
                'category_limit' => -1,
                'payment_method_limit' => -1,
                'access_budget' => true,
                'access_report' => true,
                'access_report_export' => true,
                'access_ai_agent' => false,
                'access_dashboard_chart' => true,
            ],
            'pro_plus' => [
                'target_limit' => -1,
                'bill_limit' => -1,
                'category_limit' => -1,
                'payment_method_limit' => -1,
                'access_budget' => true,
                'access_report' => true,
                'access_report_export' => true,
                'access_ai_agent' => true,
                'access_dashboard_chart' => true,
            ],
        ];
    }

    /**
     * Get tier rules, merging stored rules with default fallback keys.
     */
    public static function getTierRules(): array
    {
        $defaults = self::defaultTierRules();
        $stored = self::get('tier_rules', $defaults);

        if (!is_array($stored)) {
            return $defaults;
        }

        // Deep merge with defaults to avoid missing keys
        $merged = [];
        foreach ($defaults as $tier => $tierDefaults) {
            $merged[$tier] = array_merge($tierDefaults, $stored[$tier] ?? []);
            
            // Normalize limits to integers (-1 for unlimited)
            foreach (['target_limit', 'bill_limit', 'category_limit', 'payment_method_limit'] as $limitKey) {
                if (isset($merged[$tier][$limitKey])) {
                    $val = $merged[$tier][$limitKey];
                    $merged[$tier][$limitKey] = ($val === '' || $val === null || (int)$val < 0) ? -1 : (int)$val;
                }
            }

            // Normalize booleans
            foreach (['access_budget', 'access_report', 'access_report_export', 'access_ai_agent', 'access_dashboard_chart'] as $accessKey) {
                if (isset($merged[$tier][$accessKey])) {
                    $merged[$tier][$accessKey] = (bool) $merged[$tier][$accessKey];
                }
            }
        }

        return $merged;
    }

    /**
     * Save updated tier rules.
     */
    public static function setTierRules(array $rules): void
    {
        self::set('tier_rules', $rules);
    }

    /**
     * Reset tier rules to system defaults.
     */
    public static function resetTierRules(): void
    {
        self::set('tier_rules', self::defaultTierRules());
    }
}
