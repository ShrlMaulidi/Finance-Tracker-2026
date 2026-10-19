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
        $publicKey = config('services.vapid.public_key');
        $privateKey = config('services.vapid.private_key');
        $subject = config('services.vapid.subject', 'mailto:support@financetrack.id');

        if (! $publicKey || ! $privateKey) {
            Log::warning('[WebPush] VAPID keys not configured in config/services.php or .env');

            return null;
        }

        $auth = [
            'VAPID' => [
                'subject' => $subject,
                'publicKey' => $publicKey,
                'privateKey' => $privateKey,
            ],
        ];

        return new WebPush($auth);
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
        $client = self::getWebPushClient();
        if (! $client) {
            return 0;
        }

        $subscriptions = $user->pushSubscriptions()->get();
        if ($subscriptions->isEmpty()) {
            return 0;
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

        try {
            foreach ($client->flush() as $report) {
                $endpoint = $report->getRequest()->getUri()->__toString();
                $subModel = $subscriptions->first(fn ($s) => $s->endpoint === $endpoint);

                if ($report->isSuccess()) {
                    $successCount++;
                } else {
                    Log::info("[WebPush] Notification failed for endpoint: {$report->getReason()}");

                    // Remove expired/invalid subscriptions (HTTP 404 or 410 Gone)
                    if ($report->isSubscriptionExpired() && $subModel) {
                        $subModel->delete();
                        Log::info("[WebPush] Removed expired subscription {$subModel->id}");
                    }
                }
            }
        } catch (\Throwable $e) {
            Log::error('[WebPush] Error during flush: '.$e->getMessage());
        }

        return $successCount;
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
