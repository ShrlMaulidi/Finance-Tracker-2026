<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WhatsAppAIWebhookTest extends TestCase
{
    use RefreshDatabase;

    protected string $secretToken = 'financetrack-ai-secret-2026';

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.ai_agent.secret' => $this->secretToken]);
    }

    public function test_rejects_unauthorized_webhook_requests(): void
    {
        $response = $this->postJson('/api/webhook/whatsapp/transaction', [
            'sender_phone' => '6281234567890',
            'type' => 'pengeluaran',
            'amount' => 50000,
            'title' => 'Makan',
        ], [
            'X-AI-Secret-Key' => 'wrong-token',
        ]);

        $response->assertStatus(401)
            ->assertJson(['status' => 'error']);
    }

    public function test_returns_404_for_unregistered_phone_numbers(): void
    {
        $response = $this->postJson('/api/webhook/whatsapp/transaction', [
            'sender_phone' => '6289999999999',
            'type' => 'pengeluaran',
            'amount' => 25000,
            'title' => 'Beli Bensin',
        ], [
            'X-AI-Secret-Key' => $this->secretToken,
        ]);

        $response->assertStatus(404)
            ->assertJson(['status' => 'unregistered_phone']);
    }

    public function test_blocks_users_without_pro_plus_tier(): void
    {
        $user = User::factory()->create([
            'phone_number' => '6281234567890',
            'subscription_tier' => 'free',
            'role' => 'user',
        ]);

        $response = $this->postJson('/api/webhook/whatsapp/transaction', [
            'sender_phone' => '081234567890', // Tests auto-normalization 0812 -> 62812
            'type' => 'pengeluaran',
            'amount' => 30000,
            'title' => 'Kopi',
        ], [
            'X-AI-Secret-Key' => $this->secretToken,
        ]);

        $response->assertStatus(403)
            ->assertJson(['status' => 'tier_locked']);
    }

    public function test_successfully_records_transaction_for_pro_plus_user(): void
    {
        $user = User::factory()->create([
            'phone_number' => '6281234567890',
            'subscription_tier' => 'pro_plus',
            'role' => 'user',
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/webhook/whatsapp/transaction', [
            'sender_phone' => '+62 812-3456-7890',
            'type' => 'pengeluaran',
            'amount' => 45000,
            'title' => 'Makan Siang Nasi Padang',
            'category' => 'Makan & Minum',
            'payment_method' => 'GoPay',
            'date' => '2026-10-15',
        ], [
            'X-AI-Secret-Key' => $this->secretToken,
        ]);

        $response->assertStatus(200)
            ->assertJson(['status' => 'success'])
            ->assertJsonStructure([
                'status',
                'user' => ['name', 'phone'],
                'transaction' => ['id', 'amount', 'title', 'category'],
                'balance',
                'message',
            ]);

        $this->assertDatabaseHas('transactions', [
            'user_id' => $user->id,
            'type' => 'pengeluaran',
            'amount' => 45000,
            'title' => 'Makan Siang Nasi Padang',
        ]);
    }

    public function test_user_can_link_and_unlink_phone_number_in_web(): void
    {
        $user = User::factory()->create([
            'subscription_tier' => 'pro_plus',
            'phone_number' => null,
        ]);

        // Link phone
        $response = $this->actingAs($user)->post('/ai-agent/phone', [
            'phone_number' => '081298765432',
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'phone_number' => '6281298765432',
        ]);

        // Disconnect phone
        $deleteResponse = $this->actingAs($user)->delete('/ai-agent/phone');
        $deleteResponse->assertSessionHasNoErrors();

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'phone_number' => null,
        ]);
    }
}
