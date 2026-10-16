<?php

namespace App\Events;

use App\Models\Transaction;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TransactionRecorded implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public int $userId,
        public ?Transaction $transaction = null,
        public string $action = 'created',
        public string $source = 'web',
        public ?string $message = null
    ) {}

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.'.$this->userId),
            new PrivateChannel('App.Models.User.'.$this->userId),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'transaction.recorded';
    }

    /**
     * Data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'userId' => $this->userId,
            'action' => $this->action,
            'source' => $this->source,
            'message' => $this->message,
            'transaction' => $this->transaction ? [
                'id' => $this->transaction->id,
                'type' => $this->transaction->type,
                'amount' => (float) $this->transaction->amount,
                'title' => $this->transaction->title,
                'category' => $this->transaction->category,
                'payment_method' => $this->transaction->payment_method,
                'date' => $this->transaction->date,
                'description' => $this->transaction->description,
            ] : null,
        ];
    }
}
