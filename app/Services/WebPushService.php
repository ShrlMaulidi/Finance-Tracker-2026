<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Log;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;

class WebPushService
{
    /**
     * Get configured WebPush client instance.
     */
    public static function getWebPushClient(): ?WebPush
    {
        // Read through config only: env() returns null once the config is cached (php artisan optimize)
        $publicKey = config('services.vapid.public_key');
        $privateKey = config('services.vapid.private_key');
        $subject = config('services.vapid.subject') ?: 'mailto:support@financetrack.id';

        if (! $publicKey || ! $privateKey) {
            Log::warning('[WebPush] VAPID keys not configured in config/services.php or .env');

            return null;
        }

        $publicKey = trim($publicKey, " \t\n\r\0\x0B\"'");
        $privateKey = trim($privateKey, " \t\n\r\0\x0B\"'");
        $subject = trim($subject, " \t\n\r\0\x0B\"'");

        $auth = [
            'VAPID' => [
                'subject' => $subject,
                'publicKey' => $publicKey,
                'privateKey' => $privateKey,
            ],
        ];

        try {
            return new WebPush($auth);
        } catch (\Throwable $e) {
            Log::error('[WebPush] Failed to initialize WebPush client: '.$e->getMessage());

            return null;
        }
    }

    /**
     * Send push notification to a specific user across all their registered devices/browsers.
     *
     * @param  array<string, mixed>  $extra
     * @return int Number of successfully delivered push notifications
     */
    public static function sendToUser(
        User $user,
        string $title,
        string $body,
        ?string $url = null,
        ?string $tag = null,
        array $extra = []
    ): int {
        return self::deliverToUser($user, $title, $body, $url, $tag, $extra)['delivered'];
    }

    /**
     * Send a push notification to all of a user's devices and report what happened, so callers can explain failures.
     *
     * @param  array<string, mixed>  $extra
     * @return array{status: 'sent'|'not_configured'|'no_devices'|'rejected', delivered: int, devices: int, reasons: array<int, string>}
     */
    public static function deliverToUser(
        User $user,
        string $title,
        string $body,
        ?string $url = null,
        ?string $tag = null,
        array $extra = []
    ): array {
        $client = self::getWebPushClient();
        if (! $client) {
            return ['status' => 'not_configured', 'delivered' => 0, 'devices' => 0, 'reasons' => []];
        }

        $subscriptions = $user->pushSubscriptions()->get();
        if ($subscriptions->isEmpty()) {
            return ['status' => 'no_devices', 'delivered' => 0, 'devices' => 0, 'reasons' => []];
        }

        $payload = json_encode([
            'title' => $title,
            'body' => $body,
            'icon' => asset('/favicon.png'),
            'badge' => asset('/favicon.png'),
            'url' => $url ?: url('/dashboard'),
            'tag' => $tag ?: 'financetrack-reminder-'.time(),
            'timestamp' => now()->timestamp * 1000,
            ...$extra,
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

        foreach ($subscriptions as $sub) {
            try {
                $webPushSub = $sub->toWebPushSubscription();
                $client->queueNotification($webPushSub, $payload);
            } catch (\Throwable $e) {
                Log::warning("[WebPush] Failed to queue subscription {$sub->id}: ".$e->getMessage());
            }
        }

        $successCount = 0;
        $failureReasons = [];

        try {
            foreach ($client->flush() as $report) {
                $endpoint = $report->getEndpoint() ?: ($report->getRequest() ? (string) $report->getRequest()->getUri() : null);
                $subModel = $endpoint ? $subscriptions->first(fn ($s) => $s->endpoint === $endpoint) : null;

                if ($report->isSuccess()) {
                    $successCount++;
                } else {
                    $failureReasons[] = (string) $report->getReason();
                    Log::info("[WebPush] Notification failed for endpoint: {$report->getReason()}");

                    // Remove expired/invalid subscriptions (HTTP 404 or 410 Gone)
                    if ($report->isSubscriptionExpired() && $subModel) {
                        $subModel->delete();
                        Log::info("[WebPush] Removed expired subscription {$subModel->id}");
                    }
                }
            }
        } catch (\Throwable $e) {
            $failureReasons[] = $e->getMessage();
            Log::error('[WebPush] Error during flush: '.$e->getMessage());
        }

        return [
            'status' => $successCount > 0 ? 'sent' : 'rejected',
            'delivered' => $successCount,
            'devices' => $subscriptions->count(),
            'reasons' => $failureReasons,
        ];
    }

    /**
     * Send a single direct push notification to an explicit Subscription instance.
     */
    public static function sendDirect(
        Subscription $subscription,
        string $title,
        string $body,
        ?string $url = null,
        ?string $tag = null
    ): bool {
        $client = self::getWebPushClient();
        if (! $client) {
            return false;
        }

        $payload = json_encode([
            'title' => $title,
            'body' => $body,
            'icon' => asset('/favicon.png'),
            'badge' => asset('/favicon.png'),
            'url' => $url ?: url('/dashboard'),
            'tag' => $tag ?: 'financetrack-direct-'.time(),
            'timestamp' => now()->timestamp * 1000,
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

        try {
            $report = $client->sendOneNotification($subscription, $payload);

            return $report->isSuccess();
        } catch (\Throwable $e) {
            Log::error('[WebPush] sendDirect error: '.$e->getMessage());

            return false;
        }
    }
}
