<?php

namespace Tests\Feature;

use App\Models\Debt;
use App\Models\Target;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

class WhatsAppAITransactionCorrectionTest extends TestCase
{
    use RefreshDatabase;

    private string $secretToken = 'financetrack-ai-secret-2026';

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.ai_agent.secret' => $this->secretToken]);

        $this->user = User::factory()->create([
            'phone_number' => '6281234567890',
            'subscription_tier' => 'pro_plus',
            'role' => 'user',
            'is_active' => true,
        ]);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function webhook(string $path, array $payload = []): TestResponse
    {
        return $this->postJson("/api/webhook/whatsapp/{$path}", ['sender_phone' => '081234567890', ...$payload], [
            'X-AI-Secret-Key' => $this->secretToken,
        ]);
    }

    public function test_ai_can_correct_the_amount_of_the_last_transaction(): void
    {
        $this->webhook('transaction', ['type' => 'pengeluaran', 'amount' => 100000, 'title' => 'Kopi', 'category' => 'Makanan'])->assertOk();

        $this->webhook('transaction/edit', ['amount' => 10000])
            ->assertOk()
            ->assertJson(['status' => 'success', 'transaction' => ['amount' => 10000, 'title' => 'Kopi']]);

        $this->assertSame(1, Transaction::where('user_id', $this->user->id)->count());
        $this->assertEquals(10000, Transaction::where('user_id', $this->user->id)->value('amount'));
    }

    public function test_editing_and_deleting_savings_keeps_the_target_balance_in_sync(): void
    {
        $target = Target::create([
            'user_id' => $this->user->id,
            'name' => 'Beli Motor',
            'category' => 'Kendaraan',
            'target_amount' => 1000000,
            'current_amount' => 0,
            'status' => 'Berjalan',
        ]);

        $this->webhook('transaction', ['type' => 'tabungan', 'amount' => 200000, 'title' => 'Nabung', 'category' => 'Beli Motor'])->assertOk();
        $this->assertEquals(200000, $target->fresh()->current_amount);

        $this->webhook('transaction/edit', ['amount' => 50000])->assertOk();
        $this->assertEquals(50000, $target->fresh()->current_amount);

        $this->webhook('transaction/undo')->assertOk()->assertJson(['status' => 'success']);
        $this->assertEquals(0, $target->fresh()->current_amount);
        $this->assertSame(0, Transaction::where('user_id', $this->user->id)->count());
    }

    public function test_deleting_a_debt_payment_restores_the_remaining_debt(): void
    {
        $debt = Debt::create([
            'user_id' => $this->user->id,
            'type' => 'hutang',
            'name' => 'Pinjaman Budi',
            'amount' => 500000,
            'remaining_amount' => 500000,
            'status' => 'belum_lunas',
        ]);

        $this->webhook('transaction', ['type' => 'pengeluaran', 'amount' => 100000, 'title' => 'Bayar Budi', 'category' => 'Pinjaman Budi'])->assertOk();
        $this->assertEquals(400000, $debt->fresh()->remaining_amount);

        $this->webhook('transaction/delete')->assertOk();
        $this->assertEquals(500000, $debt->fresh()->remaining_amount);
    }

    public function test_ai_cannot_touch_another_users_transaction(): void
    {
        $otherUser = User::factory()->create();
        $otherTransaction = Transaction::create([
            'user_id' => $otherUser->id,
            'type' => 'pengeluaran',
            'amount' => 75000,
            'category' => 'Makanan',
            'payment_method' => 'Cash',
            'title' => 'Bukan milikmu',
            'date' => now()->toDateString(),
        ]);

        $this->webhook('transaction/edit', ['transaction_id' => $otherTransaction->id, 'amount' => 1])
            ->assertNotFound()
            ->assertJson(['status' => 'transaction_not_found']);
        $this->webhook('transaction/delete', ['transaction_id' => $otherTransaction->id])->assertNotFound();

        $this->assertEquals(75000, $otherTransaction->fresh()->amount);
    }

    public function test_edit_without_any_change_is_rejected(): void
    {
        $this->webhook('transaction', ['type' => 'pengeluaran', 'amount' => 20000, 'title' => 'Parkir'])->assertOk();

        $this->webhook('transaction/edit')->assertUnprocessable();
    }

    public function test_recent_transactions_are_listed_newest_first(): void
    {
        $this->webhook('transaction', ['type' => 'pengeluaran', 'amount' => 15000, 'title' => 'Parkir'])->assertOk();
        $this->webhook('transaction', ['type' => 'pemasukan', 'amount' => 500000, 'title' => 'Gaji Freelance'])->assertOk();

        $this->webhook('transactions/recent', ['limit' => 5])
            ->assertOk()
            ->assertJsonCount(2, 'transactions')
            ->assertJsonPath('transactions.0.title', 'Gaji Freelance')
            ->assertJsonPath('transactions.1.title', 'Parkir');
    }

    public function test_users_without_pro_plus_cannot_delete_via_whatsapp(): void
    {
        $this->user->update(['subscription_tier' => 'free']);

        $this->webhook('transaction/delete')->assertForbidden()->assertJson(['status' => 'tier_locked']);
    }
}
