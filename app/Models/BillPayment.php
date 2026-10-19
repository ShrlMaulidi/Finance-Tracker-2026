<?php

namespace App\Models;

use App\Services\NotificationService;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BillPayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'bill_id',
        'user_id',
        'transaction_id',
        'month',
        'amount',
        'paid_at',
        'payment_method',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'paid_at' => 'date',
    ];

    protected static function booted(): void
    {
        static::saved(function (BillPayment $payment) {
            if ($payment->user_id) {
                NotificationService::clearUserReminderCache($payment->user_id);
            }
        });

        static::deleted(function (BillPayment $payment) {
            if ($payment->user_id) {
                NotificationService::clearUserReminderCache($payment->user_id);
            }
        });
    }

    public function bill(): BelongsTo
    {
        return $this->belongsTo(Bill::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class);
    }
}
