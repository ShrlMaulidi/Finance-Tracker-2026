<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Budget extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'type',
        'name',
        'target_amount',
        'current_amount',
        'month',
        'status',
        'is_recurring',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    protected function casts(): array
    {
        return [
            'target_amount' => 'float',
            'current_amount' => 'float',
            'is_recurring' => 'boolean',
        ];
    }
}
