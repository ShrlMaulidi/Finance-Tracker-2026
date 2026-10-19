<?php

namespace Tests\Feature;

use App\Models\Transaction;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class TransactionPageTest extends TestCase
{
    use RefreshDatabase;

    public function test_transaction_page_lists_every_transaction_of_the_running_month_only(): void
    {
        Carbon::setTestNow('2026-10-20 10:00:00');
        $user = User::factory()->create();

        $dates = [...array_fill(0, 40, '2026-10-05'), '2026-10-01', '2026-10-31', '2026-09-30', '2026-11-01'];
        foreach ($dates as $date) {
            Transaction::create([
                'user_id' => $user->id,
                'type' => 'pengeluaran',
                'amount' => 1000,
                'category' => 'Makanan',
                'payment_method' => 'Cash',
                'title' => 'Makan',
                'date' => $date,
            ]);
        }

        $this->actingAs($user)
            ->get('/transaksi')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Transaksi/Index')
                ->has('transactions', 42)
                ->where('transactions.0.date', '2026-10-31')
                ->where('currentMonthKey', '2026-10')
            );
    }
}
