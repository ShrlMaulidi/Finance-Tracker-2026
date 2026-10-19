<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    protected $fillable = [
        'user_id',
        'debt_id',
        'type',
        'amount',
        'category',
        'payment_method',
        'title',
        'description',
        'date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function debt()
    {
        return $this->belongsTo(Debt::class);
    }

    /**
     * Limit to a calendar month using a date range, so MySQL can use the (user_id, date) index
     * instead of scanning every row like MONTH(date) / YEAR(date) would.
     */
    public function scopeInMonth(Builder $query, int|string $year, int|string $month): void
    {
        $start = Carbon::create((int) $year, (int) $month, 1)->startOfMonth();

        $query->whereBetween('date', [$start->toDateString(), $start->copy()->endOfMonth()->toDateString()]);
    }

    /**
     * Years covered by a user's transactions, newest first, for period filter dropdowns.
     *
     * Reads only MIN/MAX(date) from the (user_id, date) index instead of scanning every row.
     *
     * @return array<int, int>
     */
    public static function availableYearsFor(int $userId): array
    {
        $range = static::where('user_id', $userId)
            ->selectRaw('MIN(date) as first_date, MAX(date) as last_date')
            ->toBase()
            ->first();

        if (! $range?->first_date) {
            return [(int) Carbon::now()->year];
        }

        return range((int) Carbon::parse($range->last_date)->year, (int) Carbon::parse($range->first_date)->year);
    }

    /**
     * Limit to a calendar year using an index-friendly date range.
     */
    public function scopeInYear(Builder $query, int|string $year): void
    {
        $query->whereBetween('date', [((int) $year).'-01-01', ((int) $year).'-12-31']);
    }
}
