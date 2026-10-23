<?php

namespace App\Models;

use Database\Factories\SubscriptionPaymentFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SubscriptionPayment extends Model
{
    /** @use HasFactory<SubscriptionPaymentFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'order_id',
        'plan',
        'billing_cycle',
        'payment_method',
        'amount',
        'status',
        'snap_token',
        'payment_type',
        'midtrans_transaction_id',
        'paid_at',
        'subscription_expires_at',
        'last_notification',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'integer',
            'paid_at' => 'datetime',
            'subscription_expires_at' => 'datetime',
            'last_notification' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }
}
