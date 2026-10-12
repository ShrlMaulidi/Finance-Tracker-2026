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

    protected $appends = ['is_pro', 'is_pro_plus'];

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
