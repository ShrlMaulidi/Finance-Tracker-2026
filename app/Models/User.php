<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

use Illuminate\Database\Eloquent\Casts\Attribute;

#[Fillable(['name', 'email', 'password', 'google_id', 'avatar', 'role', 'subscription_tier', 'is_active', 'subscription_expires_at'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'subscription_expires_at' => 'datetime',
        ];
    }

    protected $appends = ['is_pro', 'is_pro_plus', 'permissions', 'tier_limits', 'active_tier'];

    /**
     * Check if user is Super Admin.
     */
    public function isSuperAdmin(): bool
    {
        return $this->role === 'superadmin';
    }

    /**
     * Check if user has active Pro or Pro Plus subscription.
     */
    public function isPro(): bool
    {
        if ($this->isSuperAdmin()) {
            return true;
        }

        if (in_array($this->subscription_tier, ['pro', 'pro_plus'])) {
            if ($this->subscription_expires_at && $this->subscription_expires_at->isPast()) {
                return false;
            }
            return true;
        }

        return false;
    }

    /**
     * Check if user has active Pro Plus subscription.
     */
    public function isProPlus(): bool
    {
        if ($this->isSuperAdmin()) {
            return true;
        }

        if ($this->subscription_tier === 'pro_plus') {
            if ($this->subscription_expires_at && $this->subscription_expires_at->isPast()) {
                return false;
            }
            return true;
        }

        return false;
    }

    /**
     * Check if user is in free tier.
     */
    public function isFree(): bool
    {
        return !$this->isPro();
    }

    /**
     * Get active tier name ('superadmin', 'pro_plus', 'pro', or 'free').
     */
    public function getActiveTier(): string
    {
        if ($this->isSuperAdmin()) {
            return 'superadmin';
        }
        if ($this->isProPlus()) {
            return 'pro_plus';
        }
        if ($this->isPro()) {
            return 'pro';
        }
        return 'free';
    }

    /**
     * Get tier rules for this user.
     */
    public function getTierRules(): array
    {
        if ($this->isSuperAdmin()) {
            return [
                'target_limit' => -1,
                'bill_limit' => -1,
                'category_limit' => -1,
                'payment_method_limit' => -1,
                'access_budget' => true,
                'access_report' => true,
                'access_report_export' => true,
                'access_ai_agent' => true,
                'access_dashboard_chart' => true,
            ];
        }

        $allRules = Setting::getTierRules();
        $tier = $this->getActiveTier();
        return $allRules[$tier] ?? $allRules['free'];
    }

    /**
     * Check if user can access a specific feature.
     */
    public function canAccess(string $feature): bool
    {
        if ($this->isSuperAdmin()) {
            return true;
        }
        $rules = $this->getTierRules();
        $key = str_starts_with($feature, 'access_') ? $feature : "access_{$feature}";
        return (bool) ($rules[$key] ?? false);
    }

    /**
     * Get limit for a specific entity. Returns -1 if unlimited.
     */
    public function getLimit(string $entity): int
    {
        if ($this->isSuperAdmin()) {
            return -1;
        }
        $rules = $this->getTierRules();
        $key = str_ends_with($entity, '_limit') ? $entity : "{$entity}_limit";
        return (int) ($rules[$key] ?? -1);
    }

    /**
     * Check if user has reached limit for an entity.
     */
    public function hasReachedLimit(string $entity, int $currentCount): bool
    {
        $limit = $this->getLimit($entity);
        if ($limit < 0) {
            return false;
        }
        return $currentCount >= $limit;
    }

    /**
     * Accessor for is_pro attribute in frontend serialization.
     */
    public function getIsProAttribute(): bool
    {
        return $this->isPro();
    }

    /**
     * Accessor for is_pro_plus attribute in frontend serialization.
     */
    public function getIsProPlusAttribute(): bool
    {
        return $this->isProPlus();
    }

    /**
     * Accessor for permissions attribute in frontend serialization.
     */
    public function getPermissionsAttribute(): array
    {
        $rules = $this->getTierRules();
        return [
            'budget' => (bool) ($rules['access_budget'] ?? false),
            'report' => (bool) ($rules['access_report'] ?? false),
            'report_export' => (bool) ($rules['access_report_export'] ?? false),
            'ai_agent' => (bool) ($rules['access_ai_agent'] ?? false),
            'dashboard_chart' => (bool) ($rules['access_dashboard_chart'] ?? false),
        ];
    }

    /**
     * Accessor for tier_limits attribute in frontend serialization.
     */
    public function getTierLimitsAttribute(): array
    {
        $rules = $this->getTierRules();
        return [
            'target_limit' => (int) ($rules['target_limit'] ?? -1),
            'bill_limit' => (int) ($rules['bill_limit'] ?? -1),
            'category_limit' => (int) ($rules['category_limit'] ?? -1),
            'payment_method_limit' => (int) ($rules['payment_method_limit'] ?? -1),
        ];
    }

    /**
     * Accessor for active_tier attribute in frontend serialization.
     */
    public function getActiveTierAttribute(): string
    {
        return $this->getActiveTier();
    }

    /**
     * Get the user's avatar url.
     */
    protected function avatar(): Attribute
    {
        return Attribute::make(
            get: function ($value) {
                if (!$value) {
                    return null;
                }
                if (str_starts_with($value, 'http://') || str_starts_with($value, 'https://')) {
                    return $value;
                }
                if (str_starts_with($value, '/storage/')) {
                    return $value;
                }
                return asset('storage/' . $value);
            }
        );
    }
}
