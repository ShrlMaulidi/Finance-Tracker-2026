<?php

namespace App\Models;

use App\Services\NotificationService;
use Illuminate\Database\Eloquent\Model;

class Debt extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'name',
        'amount',
        'remaining_amount',
        'due_date',
        'status',
        'description',
    ];

    protected static function booted(): void
    {
        static::saved(function (Debt $debt) {
            if ($debt->user_id) {
                NotificationService::clearUserReminderCache($debt->user_id);
            }
        });

        static::deleted(function (Debt $debt) {
            if ($debt->user_id) {
                NotificationService::clearUserReminderCache($debt->user_id);
            }
        });
    }

    protected function casts(): array
    {
        return [
            'amount' => 'float',
            'remaining_amount' => 'float',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }
}
