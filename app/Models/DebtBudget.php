<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DebtBudget extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'target_amount',
        'is_recurring',
    ];

    protected function casts(): array
    {
        return [
            'target_amount' => 'float',
            'is_recurring' => 'boolean',
        ];
    }
}
