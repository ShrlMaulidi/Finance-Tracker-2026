<?php

namespace Tests\Feature;

use App\Models\PushSubscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

class PushNotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_store_push_subscription(): void
    {
        $user = User::factory()->create();

        $payload = [
            'endpoint' => 'https://fcm.googleapis.com/fcm/send/fake-endpoint-token-123',
            'keys' => [
                'p256dh' => 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QT9t044Yjs6JLBIb5IlpE3YCa',
                'auth' => 'tBHItJI5svbpez7KI4CCXg==',
            ],
            'contentEncoding' => 'aes128gcm',
        ];

        $response = $this->actingAs($user)->postJson(route('push-subscriptions.store'), $payload);

        $response->assertStatus(200);
        $response->assertJson(['success' => true]);

        $this->assertDatabaseHas('push_subscriptions', [
            'user_id' => $user->id,
            'endpoint' => 'https://fcm.googleapis.com/fcm/send/fake-endpoint-token-123',
            'endpoint_hash' => hash('sha256', 'https://fcm.googleapis.com/fcm/send/fake-endpoint-token-123'),
        ]);
    }

    public function test_user_can_delete_push_subscription(): void
    {
        $user = User::factory()->create();
        $endpoint = 'https://fcm.googleapis.com/fcm/send/delete-endpoint-test';

        PushSubscription::create([
            'user_id' => $user->id,
            'endpoint' => $endpoint,
            'endpoint_hash' => hash('sha256', $endpoint),
            'public_key' => 'fake-key',
            'auth_token' => 'fake-auth',
            'content_encoding' => 'aes128gcm',
        ]);

        $response = $this->actingAs($user)->deleteJson(route('push-subscriptions.destroy'), [
            'endpoint' => $endpoint,
        ]);

        $response->assertStatus(200);
        $response->assertJson(['success' => true]);

        $this->assertDatabaseMissing('push_subscriptions', [
            'endpoint' => $endpoint,
        ]);
    }

    public function test_reminders_send_push_command_runs_without_errors(): void
    {
        $exitCode = Artisan::call('reminders:send-push');
        $this->assertEquals(0, $exitCode);
    }
}
