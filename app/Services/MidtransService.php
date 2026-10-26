<?php

namespace App\Services;

use App\Models\SubscriptionPayment;
use App\Models\User;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * Thin client for the Midtrans Snap and Core status APIs (sandbox or production per config).
 */
class MidtransService
{
    /**
     * Payment methods the user can pick, mapped to the Snap channel that opens for each.
     * DANA has no Snap channel of its own, so DANA users pay through QRIS.
     */
    public const PAYMENT_CHANNELS = [
        'qris' => 'other_qris',
        'gopay' => 'gopay',
        'shopeepay' => 'shopeepay',
        'dana' => 'other_qris',
        'bca_va' => 'bca_va',
        'bni_va' => 'bni_va',
        'bri_va' => 'bri_va',
        'mandiri' => 'echannel',
        'permata_va' => 'permata_va',
        'cimb_va' => 'cimb_va',
        'other_va' => 'other_va',
    ];

    /**
     * Method keys the user may pick: those listed in MIDTRANS_ENABLED_METHODS, or every method when it is empty.
     *
     * @return array<int, string>
     */
    public function enabledMethods(): array
    {
        $configured = (array) config('services.midtrans.enabled_methods', []);
        $allMethods = array_keys(self::PAYMENT_CHANNELS);

        return $configured === [] ? $allMethods : array_values(array_intersect($allMethods, $configured));
    }

    public function isConfigured(): bool
    {
        return filled(config('services.midtrans.server_key')) && filled(config('services.midtrans.client_key'));
    }

    public function isProduction(): bool
    {
        return (bool) config('services.midtrans.is_production');
    }

    public function snapScriptUrl(): string
    {
        return $this->isProduction()
            ? 'https://app.midtrans.com/snap/snap.js'
            : 'https://app.sandbox.midtrans.com/snap/snap.js';
    }

    /**
     * Create a Snap transaction that opens straight on the chosen payment method and return its popup token.
     *
     * @throws RequestException|ConnectionException
     */
    public function createSnapToken(SubscriptionPayment $payment, User $user, string $itemName): string
    {
        $snapUrl = $this->isProduction()
            ? 'https://app.midtrans.com/snap/v1/transactions'
            : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

        $response = $this->client()->post($snapUrl, [
            'transaction_details' => [
                'order_id' => $payment->order_id,
                'gross_amount' => $payment->amount,
            ],
            'item_details' => [[
                'id' => "{$payment->plan}_{$payment->billing_cycle}",
                'price' => $payment->amount,
                'quantity' => 1,
                'name' => $itemName,
            ]],
            'customer_details' => array_filter([
                'first_name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone_number,
            ]),
            'enabled_payments' => [self::PAYMENT_CHANNELS[$payment->payment_method]],
            'callbacks' => [
                'finish' => route('berlangganan.index'),
            ],
        ])->throw();

        return (string) $response->json('token');
    }

    /**
     * Fetch the authoritative transaction status for an order.
     *
     * @return array<string, mixed>
     *
     * @throws RequestException|ConnectionException
     */
    public function fetchStatus(string $orderId): array
    {
        $baseUrl = $this->isProduction() ? 'https://api.midtrans.com' : 'https://api.sandbox.midtrans.com';

        return $this->client()
            ->retry([200, 600], 0, fn (Throwable $exception) => $exception instanceof ConnectionException
                || ($exception instanceof RequestException && $exception->response->serverError()))
            ->get("{$baseUrl}/v2/".rawurlencode($orderId).'/status')
            ->throw()
            ->json();
    }

    /**
     * A notification is genuine only when its signature was made with our server key.
     *
     * @param  array<string, mixed>  $notification
     */
    public function hasValidSignature(array $notification): bool
    {
        $serverKey = (string) config('services.midtrans.server_key');
        $signature = (string) ($notification['signature_key'] ?? '');

        if ($serverKey === '' || $signature === '') {
            return false;
        }

        $expected = hash('sha512', ($notification['order_id'] ?? '').($notification['status_code'] ?? '').($notification['gross_amount'] ?? '').$serverKey);

        return hash_equals($expected, $signature);
    }

    private function client(): PendingRequest
    {
        return Http::withBasicAuth((string) config('services.midtrans.server_key'), '')
            ->acceptJson()
            ->connectTimeout(5)
            ->timeout(15);
    }
}
