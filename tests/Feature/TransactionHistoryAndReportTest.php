<?php

namespace Tests\Feature;

use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class TransactionHistoryAndReportTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Create expense rows on given dates for the user.
     *
     * @param  array<int, string>  $dates
     */
    private function createExpenses(User $user, array $dates, float $amount): void
    {
        foreach ($dates as $date) {
            Transaction::create([
                'user_id' => $user->id,
                'type' => 'pengeluaran',
                'amount' => $amount,
                'category' => 'Makanan',
                'payment_method' => 'Cash',
                'title' => 'Makan',
                'date' => $date,
            ]);
        }
    }

    public function test_history_totals_cover_every_row_while_the_list_is_paginated(): void
    {
        $user = User::factory()->create();

        $this->createExpenses($user, array_fill(0, 60, '2026-03-15'), 1000);
        $this->createExpenses($user, ['2026-03-01', '2026-03-31'], 5000);
        $this->createExpenses($user, ['2026-04-01'], 999000);

        $this->actingAs($user)
            ->get('/transaksi/history/pengeluaran?filter_type=month&filter_month=3&filter_year=2026')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Transaksi/History')
                ->where('summary.count', 62)
                ->where('summary.pengeluaran', 70000)
                ->has('transactions.data', 50)
                ->where('availableYears', [2026])
            );
    }

    public function test_report_page_totals_include_rows_beyond_the_listed_transactions(): void
    {
        $user = User::factory()->create(['subscription_tier' => 'pro']);

        $this->createExpenses($user, array_fill(0, 120, '2026-03-10'), 2000);
        $this->createExpenses($user, ['2025-12-31'], 777000);

        $this->actingAs($user)
            ->get('/laporan?filter_type=month&filter_month=3&filter_year=2026')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Laporan/Index')
                ->where('totalTransactionsCount', 120)
                ->where('summary.pengeluaran', 240000)
                ->where('summary.top_pengeluaran_categories.0.count', 120)
                ->has('transactions', 100)
                ->where('availableYears', [2026, 2025])
            );
    }
}
