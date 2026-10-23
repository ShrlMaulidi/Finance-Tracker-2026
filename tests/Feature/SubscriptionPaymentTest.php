<?php

namespace Tests\Feature;

use App\Events\TransactionRecorded;
use App\Models\SubscriptionPayment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SubscriptionPaymentTest extends TestCase
{
    use RefreshDatabase;

    private const SERVER_KEY = 'midtrans-test-server-key';

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.midtrans.server_key' => self::SERVER_KEY,
            'services.midtrans.client_key' => 'midtrans-test-client-key',
            'services.midtrans.is_production' => false,
        ]);

        $this->travelTo('2026-10-23 10:00:00');
        Http::preventStrayRequests();
    }

    public function test_subscription_page_shows_the_active_plan_end_date_and_the_unfinished_payment(): void
    {
        $user = User::factory()->create(['subscription_tier' => 'pro', 'subscription_expires_at' => '2026-12-01 00:00:00']);
        $pending = SubscriptionPayment::factory()->for($user)->proPlusYearly()->create();

        $response = $this->actingAs($user)->get('/berlangganan');

        $response->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('Berlangganan/Index')
            ->where('currentPlan', 'pro')
            ->where('subscriptionExpiresAt', '01 Desember 2026')
            ->where('pendingPayment.id', $pending->id)
            ->where('midtrans.isConfigured', true)
            ->where('midtrans.snapScriptUrl', 'https://app.sandbox.midtrans.com/snap/snap.js'));
    }

    public function test_checkout_creates_an_order_priced_by_the_server_and_returns_a_snap_token(): void
    {
        Http::fake(['app.sandbox.midtrans.com/snap/v1/transactions' => Http::response(['token' => 'snap-token-123'])]);
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/berlangganan/checkout', [
            'plan' => 'pro_plus',
            'billing_cycle' => 'yearly',
            'payment_method' => 'bca_va',
            'amount' => 1,
        ]);

        $response->assertOk()->assertJson(['token' => 'snap-token-123']);

        $this->assertDatabaseHas('subscription_payments', [
            'user_id' => $user->id,
            'plan' => 'pro_plus',
            'billing_cycle' => 'yearly',
            'payment_method' => 'bca_va',
            'amount' => 299000,
            'status' => 'pending',
            'snap_token' => 'snap-token-123',
        ]);

        Http::assertSent(fn (Request $request) => $request['transaction_details']['gross_amount'] === 299000
            && $request['enabled_payments'] === ['bca_va']
            && $request->hasHeader('Authorization', 'Basic '.base64_encode(self::SERVER_KEY.':')));
    }

    public function test_checkout_reuses_a_recent_pending_order_only_for_the_same_plan_and_method(): void
    {
        Http::fake(['app.sandbox.midtrans.com/*' => Http::response(['token' => 'snap-token-123'])]);
        $user = User::factory()->create();
        $order = ['plan' => 'pro', 'billing_cycle' => 'monthly', 'payment_method' => 'qris'];

        $this->actingAs($user)->postJson('/berlangganan/checkout', $order)->assertOk();
        $this->actingAs($user)->postJson('/berlangganan/checkout', $order)->assertOk();
        $this->actingAs($user)->postJson('/berlangganan/checkout', [...$order, 'payment_method' => 'gopay'])->assertOk();

        $this->assertDatabaseCount('subscription_payments', 2);
        Http::assertSentCount(2);
    }

    public function test_dana_opens_the_qris_channel_and_unknown_methods_are_rejected(): void
    {
        Http::fake(['app.sandbox.midtrans.com/*' => Http::response(['token' => 'snap-token-123'])]);
        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson('/berlangganan/checkout', ['plan' => 'pro', 'billing_cycle' => 'monthly', 'payment_method' => 'ovo'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['payment_method' => 'Metode pembayaran tidak tersedia.']);

        $this->actingAs($user)
            ->postJson('/berlangganan/checkout', ['plan' => 'pro', 'billing_cycle' => 'monthly', 'payment_method' => 'dana'])
            ->assertOk();

        Http::assertSentCount(1);
        Http::assertSent(fn (Request $request) => $request['enabled_payments'] === ['other_qris']);
    }

    public function test_checkout_refuses_to_sell_pro_while_pro_plus_is_active(): void
    {
        Http::fake();
        $user = User::factory()->create(['subscription_tier' => 'pro_plus', 'subscription_expires_at' => now()->addDays(10)]);

        $response = $this->actingAs($user)->postJson('/berlangganan/checkout', ['plan' => 'pro', 'billing_cycle' => 'monthly', 'payment_method' => 'qris']);

        $response->assertUnprocessable()
            ->assertJson(['message' => 'Paket Pro Plus Anda masih aktif. Paket Pro baru bisa dibeli setelah Pro Plus berakhir.']);
        $this->assertDatabaseCount('subscription_payments', 0);
        Http::assertNothingSent();
    }

    public function test_checkout_is_unavailable_until_midtrans_keys_are_configured(): void
    {
        config(['services.midtrans.server_key' => null]);
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/berlangganan/checkout', ['plan' => 'pro', 'billing_cycle' => 'monthly', 'payment_method' => 'qris']);

        $response->assertServiceUnavailable()
            ->assertJson(['message' => 'Pembayaran online belum tersedia. Silakan hubungi admin.']);
        $this->assertDatabaseCount('subscription_payments', 0);
    }

    public function test_settlement_notification_activates_the_plan_for_one_month(): void
    {
        Event::fake([TransactionRecorded::class]);
        $user = User::factory()->create();
        $payment = SubscriptionPayment::factory()->for($user)->create(['plan' => 'pro', 'billing_cycle' => 'monthly', 'amount' => 14999]);

        $this->postJson('/api/webhook/midtrans', $this->notification($payment, 'settlement'))->assertOk();

        $user->refresh();
        $this->assertSame('pro', $user->subscription_tier);
        $this->assertSame('2026-11-23 10:00:00', $user->subscription_expires_at->toDateTimeString());
        $this->assertSame('paid', $payment->fresh()->status);
        $this->assertSame('qris', $payment->fresh()->payment_type);
        Event::assertDispatched(TransactionRecorded::class, fn (TransactionRecorded $event) => $event->userId === $user->id
            && $event->action === 'subscription_updated');
    }

    public function test_renewing_an_active_plan_adds_time_to_its_current_end_date(): void
    {
        $user = User::factory()->create(['subscription_tier' => 'pro_plus', 'subscription_expires_at' => '2026-11-01 08:00:00']);
        $payment = SubscriptionPayment::factory()->for($user)->proPlusYearly()->create();

        $this->postJson('/api/webhook/midtrans', $this->notification($payment, 'settlement'))->assertOk();

        $this->assertSame('2027-11-01 08:00:00', $user->fresh()->subscription_expires_at->toDateTimeString());
    }

    public function test_a_repeated_settlement_notification_extends_the_plan_only_once(): void
    {
        $user = User::factory()->create();
        $payment = SubscriptionPayment::factory()->for($user)->create();

        $this->postJson('/api/webhook/midtrans', $this->notification($payment, 'settlement'))->assertOk();
        $this->postJson('/api/webhook/midtrans', $this->notification($payment, 'settlement'))->assertOk();

        $this->assertSame('2026-11-23 10:00:00', $user->fresh()->subscription_expires_at->toDateTimeString());
    }

    public function test_a_notification_with_an_invalid_signature_is_rejected(): void
    {
        $user = User::factory()->create();
        $payment = SubscriptionPayment::factory()->for($user)->create();

        $response = $this->postJson('/api/webhook/midtrans', [
            ...$this->notification($payment, 'settlement'),
            'signature_key' => str_repeat('a', 128),
        ]);

        $response->assertForbidden();
        $this->assertSame('pending', $payment->fresh()->status);
        $this->assertNotSame('pro', $user->fresh()->subscription_tier);
    }

    public function test_a_settlement_for_a_different_amount_does_not_activate_the_plan(): void
    {
        $user = User::factory()->create();
        $payment = SubscriptionPayment::factory()->for($user)->create(['amount' => 14999]);

        $this->postJson('/api/webhook/midtrans', $this->notification($payment, 'settlement', grossAmount: '1000.00'))->assertOk();

        $this->assertSame('pending', $payment->fresh()->status);
        $this->assertNotSame('pro', $user->fresh()->subscription_tier);
    }

    public function test_an_expired_payment_is_marked_expired_without_changing_the_plan(): void
    {
        $user = User::factory()->create();
        $payment = SubscriptionPayment::factory()->for($user)->create();

        $this->postJson('/api/webhook/midtrans', $this->notification($payment, 'expire'))->assertOk();

        $this->assertSame('expired', $payment->fresh()->status);
        $this->assertNull($user->fresh()->subscription_expires_at);
    }

    public function test_only_the_owner_can_sync_a_payment_and_sync_applies_the_midtrans_status(): void
    {
        $owner = User::factory()->create();
        $payment = SubscriptionPayment::factory()->for($owner)->create();
        Http::fake(["api.sandbox.midtrans.com/v2/{$payment->order_id}/status" => Http::response($this->notification($payment, 'settlement'))]);

        $this->actingAs(User::factory()->create())
            ->postJson("/berlangganan/payments/{$payment->id}/sync")
            ->assertNotFound();

        $this->actingAs($owner)
            ->postJson("/berlangganan/payments/{$payment->id}/sync")
            ->assertOk()
            ->assertJson(['status' => 'paid', 'subscription_expires_at' => '23 November 2026']);

        $this->assertSame('pro', $owner->fresh()->subscription_tier);
    }

    /**
     * @return array<string, string>
     */
    private function notification(SubscriptionPayment $payment, string $transactionStatus, ?string $grossAmount = null): array
    {
        $grossAmount ??= number_format($payment->amount, 2, '.', '');
        $statusCode = $transactionStatus === 'settlement' ? '200' : '407';

        return [
            'order_id' => $payment->order_id,
            'status_code' => $statusCode,
            'gross_amount' => $grossAmount,
            'transaction_status' => $transactionStatus,
            'payment_type' => 'qris',
            'transaction_id' => 'trx-'.$payment->id,
            'signature_key' => hash('sha512', $payment->order_id.$statusCode.$grossAmount.self::SERVER_KEY),
        ];
    }
}
