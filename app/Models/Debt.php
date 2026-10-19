<?php

namespace App\Models;

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
