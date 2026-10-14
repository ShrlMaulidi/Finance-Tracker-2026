<?php

use App\Models\Setting;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Cache;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Update stored tier_rules so free tier has realistic limits for default seeded items
        $storedRules = Setting::get('tier_rules');
        if (is_array($storedRules) && isset($storedRules['free'])) {
            if (($storedRules['free']['category_limit'] ?? 0) <= 3) {
                $storedRules['free']['category_limit'] = 15;
            }
            if (($storedRules['free']['payment_method_limit'] ?? 0) <= 3) {
                $storedRules['free']['payment_method_limit'] = 5;
            }
            Setting::set('tier_rules', $storedRules);
            Cache::forget('app_setting_tier_rules');
        }

        // 2. Seed default categories and payment methods for all existing users
        User::chunk(50, function ($users) {
            foreach ($users as $user) {
                $user->seedDefaultCategoriesAndPaymentMethods();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No reversal needed as user-created data should not be deleted
    }
};
