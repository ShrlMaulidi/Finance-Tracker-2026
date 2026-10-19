<?php

namespace Tests\Feature;

use App\Models\Bill;
use App\Models\BillPayment;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BillTransactionConceptTest extends TestCase
{
    use RefreshDatabase;

    public function test_adding_bill_automatically_categorizes_as_tagihan_rutin_and_creates_category(): void
    {
        $user = User::factory()->create();

        // Ensure category does not exist yet
        Category::where('user_id', $user->id)->where('name', 'Tagihan Rutin')->delete();

        $response = $this
            ->actingAs($user)
            ->post('/tagihan', [
                'name' => 'WiFi Indihome',
                'amount' => 350000,
                'due_day' => 15,
                'reminder_days' => 3,
            ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();

        // 1. Tagihan Rutin category should now exist in database
        $this->assertDatabaseHas('categories', [
            'user_id' => $user->id,
            'name' => 'Tagihan Rutin',
            'type' => 'pengeluaran',
        ]);

        // 2. Bill should be created with category_name = 'Tagihan Rutin'
        $this->assertDatabaseHas('bills', [
            'user_id' => $user->id,
            'name' => 'WiFi Indihome',
            'category_name' => 'Tagihan Rutin',
            'amount' => 350000,
            'due_day' => 15,
        ]);
    }

    public function test_transaction_page_provides_tagihan_rutin_category_and_active_bills(): void
    {
        $user = User::factory()->create();

        $bill = Bill::create([
            'user_id' => $user->id,
            'name' => 'Listrik PLN',
            'amount' => 200000,
            'due_day' => 20,
            'category_name' => 'Tagihan Rutin',
            'is_active' => true,
        ]);

        $response = $this
            ->actingAs($user)
            ->get('/transaksi');

        $response->assertOk();

        // Check props passed to Inertia
        $response->assertInertia(function ($page) use ($bill) {
            $page->component('Transaksi/Index')
                ->has('activeBills', 1)
                ->where('activeBills.0.id', $bill->id)
                ->where('activeBills.0.name', 'Listrik PLN')
                ->where('activeBills.0.is_paid', false)
                ->where('activeBills.0.paid_months', []);
        });
    }

    public function test_transaction_page_marks_paid_bills(): void
    {
        $user = User::factory()->create();
        $monthStr = Carbon::today()->format('Y-m');

        $bill = Bill::create([
            'user_id' => $user->id,
            'name' => 'Listrik PLN',
            'amount' => 200000,
            'due_day' => 20,
            'category_name' => 'Tagihan Rutin',
            'is_active' => true,
        ]);

        BillPayment::create([
            'bill_id' => $bill->id,
            'user_id' => $user->id,
            'month' => $monthStr,
            'amount' => 200000,
            'paid_at' => Carbon::today()->toDateString(),
        ]);

        $response = $this
            ->actingAs($user)
            ->get('/transaksi');

        $response->assertOk();

        $response->assertInertia(function ($page) use ($bill, $monthStr) {
            $page->component('Transaksi/Index')
                ->where('activeBills.0.id', $bill->id)
                ->where('activeBills.0.is_paid', true)
                ->where('activeBills.0.paid_months', [$monthStr]);
        });
    }

    public function test_recording_transaction_with_bill_id_syncs_bill_payment(): void
    {
        $user = User::factory()->create();

        $bill = Bill::create([
            'user_id' => $user->id,
            'name' => 'BPJS Kesehatan',
            'amount' => 150000,
            'due_day' => 10,
            'category_name' => 'Tagihan Rutin',
            'is_active' => true,
        ]);

        $today = Carbon::today()->toDateString();
        $monthStr = Carbon::today()->format('Y-m');

        $response = $this
            ->actingAs($user)
            ->post('/transaksi', [
                'type' => 'pengeluaran',
                'category' => 'Tagihan Rutin',
                'bill_id' => $bill->id,
                'amount' => 150000,
                'payment_method' => 'Cash',
                'title' => 'Bayar Tagihan BPJS Kesehatan',
                'description' => 'Pembayaran via kas',
                'date' => $today,
            ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();

        // 1. Transaction should be created
        $this->assertDatabaseHas('transactions', [
            'user_id' => $user->id,
            'type' => 'pengeluaran',
            'category' => 'Tagihan Rutin',
            'amount' => 150000,
            'title' => 'Bayar Tagihan BPJS Kesehatan',
        ]);

        // 2. Bill Payment should be registered and linked
        $this->assertDatabaseHas('bill_payments', [
            'user_id' => $user->id,
            'bill_id' => $bill->id,
            'month' => $monthStr,
            'amount' => 150000,
        ]);
    }

    public function test_user_can_delete_bill(): void
    {
        $user = User::factory()->create();

        $bill = Bill::create([
            'user_id' => $user->id,
            'name' => 'Tagihan Listrik',
            'amount' => 50000,
            'due_day' => 10,
            'category_name' => 'Tagihan Rutin',
            'is_active' => true,
        ]);

        $response = $this
            ->actingAs($user)
            ->delete('/tagihan/'.$bill->id);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();

        $this->assertDatabaseMissing('bills', [
            'id' => $bill->id,
        ]);
    }

    public function test_user_can_delete_bill_with_payments(): void
    {
        $user = User::factory()->create();

        $bill = Bill::create([
            'user_id' => $user->id,
            'name' => 'Tagihan Internet',
            'amount' => 100000,
            'due_day' => 5,
            'category_name' => 'Tagihan Rutin',
            'is_active' => true,
        ]);

        BillPayment::create([
            'bill_id' => $bill->id,
            'user_id' => $user->id,
            'month' => '2026-10',
            'amount' => 100000,
            'paid_at' => '2026-10-05',
        ]);

        $response = $this
            ->actingAs($user)
            ->delete('/tagihan/'.$bill->id);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();

        $this->assertDatabaseMissing('bills', [
            'id' => $bill->id,
        ]);
        $this->assertDatabaseMissing('bill_payments', [
            'bill_id' => $bill->id,
        ]);
    }

    public function test_deleting_bill_payment_history_resets_bill_status_and_cleans_transaction(): void
    {
        $user = User::factory()->create();
        $monthStr = Carbon::today()->format('Y-m');

        $bill = Bill::create([
            'user_id' => $user->id,
            'name' => 'WiFi Indihome',
            'amount' => 350000,
            'due_day' => 15,
            'category_name' => 'Tagihan Rutin',
            'is_active' => true,
        ]);

        // Pay the bill via quick pay
        $payResponse = $this->actingAs($user)->post('/tagihan/'.$bill->id.'/pay', [
            'month' => $monthStr,
            'paid_at' => Carbon::today()->toDateString(),
            'payment_method' => 'Transfer BCA',
            'notes' => 'Pembayaran WiFi',
        ]);
        $payResponse->assertSessionHasNoErrors();
        $payResponse->assertRedirect();

        $payment = BillPayment::where('bill_id', $bill->id)->where('month', $monthStr)->first();
        $this->assertNotNull($payment);
        $this->assertNotNull($payment->transaction_id);

        // Verify bill is marked paid
        $tagihanPage = $this->actingAs($user)->get('/tagihan?month='.$monthStr);
        $tagihanPage->assertOk();
        $tagihanPage->assertInertia(function ($page) use ($bill) {
            $page->component('Tagihan/Index')
                ->where('bills.0.id', $bill->id)
                ->where('bills.0.is_paid', true)
                ->where('summary.count_lunas', 1)
                ->where('summary.count_belum', 0);
        });

        // Now delete the payment history
        $deleteResponse = $this->actingAs($user)->delete('/tagihan/payment/'.$payment->id);
        $deleteResponse->assertSessionHasNoErrors();
        $deleteResponse->assertRedirect();

        // Database assertions: payment and linked transaction must be gone
        $this->assertDatabaseMissing('bill_payments', [
            'id' => $payment->id,
        ]);
        $this->assertDatabaseMissing('transactions', [
            'id' => $payment->transaction_id,
        ]);

        // Tagihan page must show bill is reset to unpaid!
        $tagihanPageAfter = $this->actingAs($user)->get('/tagihan?month='.$monthStr);
        $tagihanPageAfter->assertOk();
        $tagihanPageAfter->assertInertia(function ($page) use ($bill) {
            $page->component('Tagihan/Index')
                ->where('bills.0.id', $bill->id)
                ->where('bills.0.is_paid', false)
                ->where('summary.count_lunas', 0)
                ->where('summary.count_belum', 1);
        });
    }

    public function test_deleting_expense_transaction_resets_bill_status(): void
    {
        $user = User::factory()->create();
        $today = Carbon::today()->toDateString();
        $monthStr = Carbon::today()->format('Y-m');

        $bill = Bill::create([
            'user_id' => $user->id,
            'name' => 'BPJS Kesehatan',
            'amount' => 150000,
            'due_day' => 10,
            'category_name' => 'Tagihan Rutin',
            'is_active' => true,
        ]);

        $createTrxResponse = $this->actingAs($user)->post('/transaksi', [
            'type' => 'pengeluaran',
            'category' => 'Tagihan Rutin',
            'bill_id' => $bill->id,
            'amount' => 150000,
            'payment_method' => 'Cash',
            'title' => 'Bayar Tagihan BPJS Kesehatan',
            'description' => 'Pembayaran via kas',
            'date' => $today,
        ]);
        $createTrxResponse->assertSessionHasNoErrors();

        $transaction = Transaction::where('user_id', $user->id)
            ->where('category', 'Tagihan Rutin')
            ->first();
        $this->assertNotNull($transaction);

        // Payment should exist and bill should be paid
        $this->assertDatabaseHas('bill_payments', [
            'bill_id' => $bill->id,
            'month' => $monthStr,
        ]);

        // Delete the transaction from Transaksi
        $deleteTrxResponse = $this->actingAs($user)->delete('/transaksi/'.$transaction->id);
        $deleteTrxResponse->assertSessionHasNoErrors();

        // Payment must be gone!
        $this->assertDatabaseMissing('bill_payments', [
            'bill_id' => $bill->id,
            'month' => $monthStr,
        ]);

        // Visiting Tagihan page should show bill is reset to unpaid!
        $tagihanPage = $this->actingAs($user)->get('/tagihan?month='.$monthStr);
        $tagihanPage->assertOk();
        $tagihanPage->assertInertia(function ($page) use ($bill) {
            $page->component('Tagihan/Index')
                ->where('bills.0.id', $bill->id)
                ->where('bills.0.is_paid', false)
                ->where('summary.count_lunas', 0)
                ->where('summary.count_belum', 1);
        });
    }
}
