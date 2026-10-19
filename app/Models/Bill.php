<?php

namespace App\Models;

use App\Services\NotificationService;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Bill extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'amount',
        'due_day',
        'category_name',
        'reminder_days',
        'account_number',
        'notes',
        'is_active',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'due_day' => 'integer',
        'reminder_days' => 'integer',
        'is_active' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::saved(function (Bill $bill) {
            if ($bill->user_id) {
                NotificationService::clearUserReminderCache($bill->user_id);
            }
        });

        static::deleted(function (Bill $bill) {
            if ($bill->user_id) {
                NotificationService::clearUserReminderCache($bill->user_id);
            }
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(BillPayment::class);
    }

    public function isPaidForMonth(string $month): bool
    {
        return $this->payments()->where('month', $month)->exists();
    }

    public function paymentForMonth(string $month): ?BillPayment
    {
        return $this->payments()->where('month', $month)->first();
    }
}
