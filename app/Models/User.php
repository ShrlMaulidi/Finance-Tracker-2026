<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['name', 'email', 'phone_number', 'whatsapp_lid', 'password', 'google_id', 'avatar', 'role', 'subscription_tier', 'is_active', 'subscription_expires_at'])]
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
     * Default categories definition for new users.
     */
    public static function defaultCategories(): array
    {
        return [
            'pemasukan' => [
                'Gaji',
                'Bonus',
                'Freelance',
                'Pemberian',
                'Lainnya',
            ],
            'pengeluaran' => [
                'Makan & Minum',
                'Transportasi',
                'Hiburan',
                'Lainnya',
            ],
        ];
    }

    /**
     * Default payment methods definition for new users.
     */
    public static function defaultPaymentMethods(): array
    {
        return [
            'Cash',
            'E-Banking',
            'E-Wallet',
        ];
    }

    /**
     * Seed default categories and payment methods for this user.
     */
    public function seedDefaultCategoriesAndPaymentMethods(): void
    {
        foreach (self::defaultCategories() as $type => $categories) {
            foreach ($categories as $name) {
                Category::firstOrCreate([
                    'user_id' => $this->id,
                    'type' => $type,
                    'name' => $name,
                ]);
            }
        }

        foreach (self::defaultPaymentMethods() as $methodName) {
            PaymentMethod::firstOrCreate([
                'user_id' => $this->id,
                'name' => $methodName,
            ]);
        }
    }

    /**
     * The "booted" method of the model.
     */
    protected static function booted(): void
    {
        static::created(function (User $user) {
            $user->seedDefaultCategoriesAndPaymentMethods();
        });
    }

    public function categories(): HasMany
    {
        return $this->hasMany(Category::class);
    }

    public function paymentMethods(): HasMany
    {
        return $this->hasMany(PaymentMethod::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    /**
     * Normalize WhatsApp phone number into standard international format (e.g., 628123456789).
     */
    public static function normalizePhoneNumber(?string $number): ?string
    {
        if (! $number) {
            return null;
        }

        // Clean out WhatsApp JID suffixes if present (e.g., @s.whatsapp.net, @c.us)
        $clean = preg_replace('/@[a-zA-Z0-9\._-]+$/', '', trim($number));
        // Strip everything except digits
        $clean = preg_replace('/\D+/', '', $clean);

        if (empty($clean)) {
            return null;
        }

        // 08xx -> 628xx
        if (str_starts_with($clean, '08')) {
            $clean = '628'.substr($clean, 2);
        } elseif (str_starts_with($clean, '8')) {
            // 8xx -> 628xx
            $clean = '628'.substr($clean, 1);
        }

        return $clean;
    }

    /**
     * Find user by phone number or WhatsApp LID / JID.
     */
    public static function findByWhatsAppIdentifier(?string $identifier): ?User
    {
        if (! $identifier) {
            return null;
        }

        $raw = trim($identifier);

        // 1. Try finding by raw whatsapp_lid (e.g. 166129871880419@lid, 166129871880419, or with/without @lid)
        $cleanLid = preg_replace('/@[a-zA-Z0-9\._-]+$/', '', $raw);
        $user = self::where('whatsapp_lid', $raw)
            ->orWhere('whatsapp_lid', $cleanLid)
            ->orWhere('whatsapp_lid', $cleanLid.'@lid')
            ->first();

        if ($user) {
            return $user;
        }

        // 2. Try normalized phone number
        $normalized = self::normalizePhoneNumber($raw);
        if ($normalized) {
            $user = self::where('phone_number', $normalized)->first();
            if ($user) {
                return $user;
            }
        }

        return null;
    }

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
        return ! $this->isPro();
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

    protected ?array $memoizedTierRules = null;

    /**
     * Get tier rules for this user.
     */
    public function getTierRules(): array
    {
        if ($this->memoizedTierRules !== null) {
            return $this->memoizedTierRules;
        }

        if ($this->isSuperAdmin()) {
            return $this->memoizedTierRules = [
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

        return $this->memoizedTierRules = ($allRules[$tier] ?? $allRules['free']);
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
                if (! $value) {
                    return null;
                }
                if (str_starts_with($value, 'http://') || str_starts_with($value, 'https://')) {
                    return $value;
                }
                if (str_starts_with($value, '/storage/')) {
                    return $value;
                }

                return asset('storage/'.$value);
            }
        );
    }
}
