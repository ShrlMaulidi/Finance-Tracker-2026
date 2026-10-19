<?php

namespace App\Models;

use App\Services\NotificationService;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Target extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'category',
        'image_path',
        'target_amount',
        'current_amount',
        'target_date',
        'status',
    ];

    protected static function booted(): void
    {
        static::saved(function (Target $target) {
            if ($target->user_id) {
                NotificationService::clearUserReminderCache($target->user_id);
            }
        });

        static::deleted(function (Target $target) {
            if ($target->user_id) {
                NotificationService::clearUserReminderCache($target->user_id);
            }
        });
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    protected function casts(): array
    {
        return [
            'target_amount' => 'float',
            'current_amount' => 'float',
        ];
    }
}
