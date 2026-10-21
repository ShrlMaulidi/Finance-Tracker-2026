<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Debt;
use App\Models\Transaction;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DebtTransactionConceptTest extends TestCase
{
    use RefreshDatabase;

    public function test_adding_debt_automatically_creates_hutang_category(): void
    {
        $user = User::factory()->create();

        // Ensure category does not exist yet
        Category::where('user_id', $user->id)->where('name', 'Hutang')->delete();

        $response = $this
            ->actingAs($user)
            ->post('/hutang-piutang', [
                'type' => 'hutang',
                'name' => 'Pinjaman Bank BCA',
                'amount' => 5000000,
                'remaining_amount' => 5000000,
                'due_date' => Carbon::now()->addMonths(6)->format('Y-m-d'),
                'status' => 'belum_lunas',
                'description' => 'Pinjaman modal usaha',
            ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();

        // 1. Category Hutang should now exist in database for this user
        $this->assertDatabaseHas('categories', [
            'user_id' => $user->id,
            'name' => 'Hutang',
            'type' => 'pengeluaran',
        ]);

        // 2. Debt should be created
        $this->assertDatabaseHas('debts', [
            'user_id' => $user->id,
            'name' => 'Pinjaman Bank BCA',
            'type' => 'hutang',
            'amount' => 5000000,
            'remaining_amount' => 5000000,
            'status' => 'belum_lunas',
        ]);
    }

    public function test_transaction_page_provides_active_debts_and_hutang_category(): void
    {
        $user = User::factory()->create();

        $debt = Debt::create([
            'user_id' => $user->id,
            'type' => 'hutang',
            'name' => 'Hutang Teman',
            'amount' => 1000000,
            'remaining_amount' => 750000,
            'due_date' => Carbon::now()->addDays(14)->format('Y-m-d'),
            'status' => 'belum_lunas',
        ]);

        $response = $this
            ->actingAs($user)
            ->get('/transaksi');

        $response->assertOk();

        // Check props passed to Inertia
        $response->assertInertia(function ($page) use ($debt) {
            $page->component('Transaksi/Index')
                ->has('activeDebts', 1)
                ->where('activeDebts.0.id', $debt->id)
                ->where('activeDebts.0.name', 'Hutang Teman')
                ->where('activeDebts.0.amount', 1000000)
                ->where('activeDebts.0.remaining_amount', 750000)
                ->where('activeDebts.0.status', 'belum_lunas');
        });
    }

    public function test_transaction_payment_deducts_debt_remaining_amount_and_supports_cicilan(): void
    {
        $user = User::factory()->create();

        $debt = Debt::create([
            'user_id' => $user->id,
            'type' => 'hutang',
            'name' => 'Hutang Laptop',
            'amount' => 3000000,
            'remaining_amount' => 3000000,
            'status' => 'belum_lunas',
        ]);

        // Partial payment / cicilan of 1,000,000
        $response = $this
            ->actingAs($user)
            ->post('/transaksi', [
                'type' => 'pengeluaran',
                'payment_method' => 'Cash',
                'amount' => 1000000,
                'category' => 'Hutang',
                'debt_id' => $debt->id,
                'title' => 'Cicilan 1 Hutang Laptop',
                'date' => Carbon::today()->format('Y-m-d'),
            ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();

        // Transaction should link to debt_id and have the exact cicilan amount
        $this->assertDatabaseHas('transactions', [
            'user_id' => $user->id,
            'debt_id' => $debt->id,
            'amount' => 1000000,
            'category' => 'Hutang',
        ]);

        // Debt should reflect reduced remaining_amount and still be belum_lunas
        $debt->refresh();
        $this->assertEquals(2000000, $debt->remaining_amount);
        $this->assertEquals('belum_lunas', $debt->status);
    }

    public function test_transaction_payment_marks_debt_lunas_when_fully_paid(): void
    {
        $user = User::factory()->create();

        $debt = Debt::create([
            'user_id' => $user->id,
            'type' => 'hutang',
            'name' => 'Hutang Servis Motor',
            'amount' => 500000,
            'remaining_amount' => 500000,
            'status' => 'belum_lunas',
        ]);

        // Full payment
        $response = $this
            ->actingAs($user)
            ->post('/transaksi', [
                'type' => 'pengeluaran',
                'payment_method' => 'Cash',
                'amount' => 500000,
                'category' => 'Hutang',
                'debt_id' => $debt->id,
                'title' => 'Bayar Hutang Servis Motor Lunas',
                'date' => Carbon::today()->format('Y-m-d'),
            ]);

        $response->assertSessionHasNoErrors();

        $debt->refresh();
        $this->assertEquals(0, $debt->remaining_amount);
        $this->assertEquals('lunas', $debt->status);
    }

    public function test_updating_transaction_reverts_old_debt_payment_and_applies_new_payment(): void
    {
        $user = User::factory()->create();

        $debt = Debt::create([
            'user_id' => $user->id,
            'type' => 'hutang',
            'name' => 'Hutang Koperasi',
            'amount' => 1000000,
            'remaining_amount' => 1000000,
            'status' => 'belum_lunas',
        ]);

        $this->actingAs($user)->post('/transaksi', [
            'type' => 'pengeluaran',
            'payment_method' => 'Cash',
            'amount' => 200000,
            'category' => 'Hutang',
            'debt_id' => $debt->id,
            'title' => 'Cicilan Koperasi',
            'date' => Carbon::today()->format('Y-m-d'),
        ]);

        $debt->refresh();
        $this->assertEquals(800000, $debt->remaining_amount);

        $transaction = Transaction::where('debt_id', $debt->id)->first();

        // Update transaction amount from 200k to 500k
        $response = $this->actingAs($user)->put('/transaksi/'.$transaction->id, [
            'type' => 'pengeluaran',
            'amount' => 500000,
            'category' => 'Hutang',
            'debt_id' => $debt->id,
            'title' => 'Cicilan Koperasi Update',
            'date' => Carbon::today()->format('Y-m-d'),
        ]);

        $response->assertSessionHasNoErrors();

        $debt->refresh();
        $this->assertEquals(500000, $debt->remaining_amount);
        $this->assertEquals('belum_lunas', $debt->status);
    }

    public function test_deleting_transaction_reverts_debt_payment(): void
    {
        $user = User::factory()->create();

        $debt = Debt::create([
            'user_id' => $user->id,
            'type' => 'hutang',
            'name' => 'Pinjaman Darurat',
            'amount' => 600000,
            'remaining_amount' => 600000,
            'status' => 'belum_lunas',
        ]);

        $this->actingAs($user)->post('/transaksi', [
            'type' => 'pengeluaran',
            'payment_method' => 'Cash',
            'amount' => 300000,
            'category' => 'Hutang',
            'debt_id' => $debt->id,
            'title' => 'Bayar Sebagian',
            'date' => Carbon::today()->format('Y-m-d'),
        ]);

        $debt->refresh();
        $this->assertEquals(300000, $debt->remaining_amount);

        $transaction = Transaction::where('debt_id', $debt->id)->first();

        // Delete the transaction
        $response = $this->actingAs($user)->delete('/transaksi/'.$transaction->id);
        $response->assertSessionHasNoErrors();

        // Remaining amount should be restored back to 600,000
        $debt->refresh();
        $this->assertEquals(600000, $debt->remaining_amount);
        $this->assertEquals('belum_lunas', $debt->status);
    }

    public function test_debt_expense_cannot_be_recorded_without_a_debt(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/transaksi', [
            'type' => 'pengeluaran',
            'payment_method' => 'Cash',
            'amount' => 200000,
            'category' => 'Hutang',
            'title' => 'Bayar Hutang',
            'date' => Carbon::today()->format('Y-m-d'),
        ]);

        $response->assertSessionHasErrors([
            'debt_id' => 'Pilih hutang terlebih dahulu. Tambahkan hutang di menu Hutang & Piutang jika belum ada.',
        ]);

        $this->assertDatabaseCount('transactions', 0);
    }

    public function test_debt_expense_cannot_use_another_users_debt(): void
    {
        $user = User::factory()->create();
        $otherUsersDebt = Debt::create([
            'user_id' => User::factory()->create()->id,
            'type' => 'hutang',
            'name' => 'Hutang Orang Lain',
            'amount' => 1000000,
            'remaining_amount' => 1000000,
            'status' => 'belum_lunas',
        ]);

        $response = $this->actingAs($user)->post('/transaksi', [
            'type' => 'pengeluaran',
            'payment_method' => 'Cash',
            'amount' => 200000,
            'category' => 'Hutang',
            'debt_id' => $otherUsersDebt->id,
            'title' => 'Bayar Hutang',
            'date' => Carbon::today()->format('Y-m-d'),
        ]);

        $response->assertSessionHasErrors([
            'debt_id' => 'Data hutang tidak ditemukan.',
        ]);

        $this->assertDatabaseCount('transactions', 0);
        $this->assertEquals(1000000, $otherUsersDebt->fresh()->remaining_amount);
    }

    public function test_expense_cannot_be_switched_to_debt_without_a_debt(): void
    {
        $user = User::factory()->create();
        $transaction = Transaction::create([
            'user_id' => $user->id,
            'type' => 'pengeluaran',
            'category' => 'Makanan',
            'amount' => 50000,
            'payment_method' => 'Cash',
            'title' => 'Makan Siang',
            'date' => Carbon::today()->format('Y-m-d'),
        ]);

        $response = $this->actingAs($user)->put('/transaksi/'.$transaction->id, [
            'type' => 'pengeluaran',
            'category' => 'Hutang',
            'amount' => 50000,
            'payment_method' => 'Cash',
            'title' => 'Makan Siang',
            'date' => Carbon::today()->format('Y-m-d'),
        ]);

        $response->assertSessionHasErrors([
            'debt_id' => 'Pilih hutang terlebih dahulu. Tambahkan hutang di menu Hutang & Piutang jika belum ada.',
        ]);

        $this->assertSame('Makanan', $transaction->fresh()->category);
    }

    public function test_existing_debt_expense_without_a_debt_can_still_be_edited(): void
    {
        $user = User::factory()->create();
        $transaction = Transaction::create([
            'user_id' => $user->id,
            'type' => 'pengeluaran',
            'category' => 'Hutang',
            'amount' => 100000,
            'payment_method' => 'Cash',
            'title' => 'Bayar Hutang Lama',
            'date' => Carbon::today()->format('Y-m-d'),
        ]);

        $response = $this->actingAs($user)->put('/transaksi/'.$transaction->id, [
            'type' => 'pengeluaran',
            'category' => 'Hutang',
            'amount' => 120000,
            'payment_method' => 'Cash',
            'title' => 'Bayar Hutang Lama',
            'date' => Carbon::today()->format('Y-m-d'),
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();

        $this->assertEquals(120000, (float) $transaction->fresh()->amount);
    }
}
