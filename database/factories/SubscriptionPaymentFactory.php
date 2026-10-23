<?php

namespace Database\Factories;

use App\Models\SubscriptionPayment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<SubscriptionPayment>
 */
class SubscriptionPaymentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'order_id' => 'FT-'.Str::upper(Str::random(12)),
            'plan' => 'pro',
            'billing_cycle' => 'monthly',
            'payment_method' => 'qris',
            'amount' => 14999,
            'status' => 'pending',
            'snap_token' => Str::uuid()->toString(),
        ];
    }

    public function proPlusYearly(): static
    {
        return $this->state(fn (array $attributes) => [
            'plan' => 'pro_plus',
            'billing_cycle' => 'yearly',
            'amount' => 299000,
        ]);
    }
}
