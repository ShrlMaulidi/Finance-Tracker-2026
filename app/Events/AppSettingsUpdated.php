<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Support\Facades\Log;

/**
 * Tells every open member page that the admin changed app-wide settings (pricing, plan access rules,
 * maintenance mode), so it reloads its props. The payload is empty, so a public channel leaks nothing.
 */
class AppSettingsUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    /**
     * Broadcast the event after the HTTP response has been sent, so the admin never waits on Reverb.
     */
    public static function broadcastAfterResponse(): void
    {
        $event = new static;

        defer(function () use ($event): void {
            try {
                broadcast($event);
            } catch (\Throwable $e) {
                Log::warning('Failed to broadcast app settings update to Reverb: '.$e->getMessage());
            }
        });
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('app-settings'),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'settings.updated';
    }

    /**
     * Data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [];
    }
}
