<?php

namespace App\Services;

use App\Events\TransactionRecorded;
use App\Http\Controllers\Admin\AdminSettingController;
use App\Models\SubscriptionPayment;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Turns a plan choice into a Midtrans order and a settled Midtrans payment into an active subscription.
 */
class SubscriptionBillingService
{
    public const PLAN_NAMES = [
        'pro' => 'Paket Pro',
        'pro_plus' => 'Paket Pro Plus',
    ];

    /**
     * A Snap token stays usable for 24 hours, so a pending order younger than this is reused.
     */
    private const REUSABLE_ORDER_HOURS = 23;

    public function __construct(private MidtransService $midtrans) {}

    /**
     * The price always comes from the admin pricing settings, never from the browser.
     */
    public function priceFor(string $plan, string $billingCycle): int
    {
        $pricing = AdminSettingController::getPricingSettings();

        return (int) round((float) ($pricing["{$plan}_{$billingCycle}_price"] ?? 0));
    }

    /**
     * Explain why this user may not buy the plan, or return null when the purchase is allowed.
     */
    public function checkoutBlockReason(User $user, string $plan): ?string
    {
        if ($user->isSuperAdmin()) {
            return 'Akun Super Admin sudah memiliki akses penuh tanpa berlangganan.';
        }

        if ($plan === 'pro' && $user->isProPlus()) {
            return 'Paket Pro Plus Anda masih aktif. Paket Pro baru bisa dibeli setelah Pro Plus berakhir.';
        }

        $hasPlanWithoutEndDate = $user->subscription_tier === $plan && $user->subscription_expires_at === null;
        if ($hasPlanWithoutEndDate) {
            return 'Paket Anda aktif tanpa batas waktu, jadi tidak perlu diperpanjang.';
        }

        return null;
    }

    /**
     * Create (or reuse) a pending order for the plan and payment method and make sure it has a Snap token.
     *
     * @throws RequestException|ConnectionException
     */
    public function startCheckout(User $user, string $plan, string $billingCycle, string $paymentMethod): SubscriptionPayment
    {
        $amount = $this->priceFor($plan, $billingCycle);

        $reusable = SubscriptionPayment::where('user_id', $user->id)
            ->where('status', 'pending')
            ->where('plan', $plan)
            ->where('billing_cycle', $billingCycle)
            ->where('payment_method', $paymentMethod)
            ->where('amount', $amount)
            ->whereNotNull('snap_token')
            ->where('created_at', '>=', now()->subHours(self::REUSABLE_ORDER_HOURS))
            ->latest()
            ->first();

        if ($reusable) {
            return $reusable;
        }

        $payment = SubscriptionPayment::create([
            'user_id' => $user->id,
            'order_id' => 'FT-'.$user->id.'-'.now()->format('ymdHis').'-'.Str::upper(Str::random(4)),
            'plan' => $plan,
            'billing_cycle' => $billingCycle,
            'payment_method' => $paymentMethod,
            'amount' => $amount,
        ]);

        $cycleLabel = $billingCycle === 'yearly' ? 'Tahunan' : 'Bulanan';
        $payment->update([
            'snap_token' => $this->midtrans->createSnapToken($payment, $user, self::PLAN_NAMES[$plan]." ({$cycleLabel})"),
        ]);

        return $payment;
    }

    /**
     * Apply a verified Midtrans status (webhook payload or status API response) to the order.
     * Safe to call repeatedly: a payment activates the subscription only once.
     *
     * @param  array<string, mixed>  $status
     */
    public function applyMidtransStatus(SubscriptionPayment $payment, array $status): SubscriptionPayment
    {
        $newStatus = $this->mapStatus($status);

        $activated = DB::transaction(function () use ($payment, $status, $newStatus) {
            $payment = SubscriptionPayment::whereKey($payment->id)->lockForUpdate()->firstOrFail();

            $payment->last_notification = $status;
            $payment->payment_type = $status['payment_type'] ?? $payment->payment_type;
            $payment->midtrans_transaction_id = $status['transaction_id'] ?? $payment->midtrans_transaction_id;

            // A settled order only ever moves on to "refunded"; late pending/expire notifications are ignored
            if ($payment->status === 'paid' && $newStatus !== 'refunded') {
                $payment->save();

                return null;
            }

            if ($newStatus === 'paid' && (int) round((float) ($status['gross_amount'] ?? 0)) !== $payment->amount) {
                Log::warning('Midtrans: paid amount does not match the subscription order', [
                    'order_id' => $payment->order_id,
                    'expected' => $payment->amount,
                    'received' => $status['gross_amount'] ?? null,
                ]);
                $payment->save();

                return null;
            }

            $payment->status = $newStatus;

            if ($newStatus === 'paid') {
                $payment->paid_at = now();
                $payment->subscription_expires_at = $this->extendSubscription($payment);
            }

            $payment->save();

            return $newStatus === 'paid' ? $payment : null;
        });

        if ($activated) {
            $planName = self::PLAN_NAMES[$activated->plan];
            TransactionRecorded::broadcastAfterResponse(
                userId: (int) $activated->user_id,
                action: 'subscription_updated',
                source: 'payment',
                message: "Pembayaran berhasil! {$planName} aktif hingga ".$activated->subscription_expires_at->locale('id')->translatedFormat('d F Y').'.'
            );
        }

        return $payment->refresh();
    }

    /**
     * Renewing the same active plan adds time to its end date; any other purchase starts today.
     */
    private function extendSubscription(SubscriptionPayment $payment): CarbonInterface
    {
        $user = User::whereKey($payment->user_id)->lockForUpdate()->firstOrFail();

        $isRenewal = $user->subscription_tier === $payment->plan && $user->subscription_expires_at?->isFuture();
        $startsAt = $isRenewal ? $user->subscription_expires_at->copy() : now();
        $expiresAt = $payment->billing_cycle === 'yearly' ? $startsAt->addYearNoOverflow() : $startsAt->addMonthNoOverflow();

        $user->forceFill([
            'subscription_tier' => $payment->plan,
            'subscription_expires_at' => $expiresAt,
        ])->save();

        return $expiresAt;
    }

    /**
     * @param  array<string, mixed>  $status
     */
    private function mapStatus(array $status): string
    {
        return match ($status['transaction_status'] ?? null) {
            'settlement' => 'paid',
            'capture' => in_array($status['fraud_status'] ?? 'accept', ['accept', null], true) ? 'paid' : 'pending',
            'deny', 'failure' => 'failed',
            'cancel' => 'cancelled',
            'expire' => 'expired',
            'refund', 'partial_refund', 'chargeback', 'partial_chargeback' => 'refunded',
            default => 'pending',
        };
    }
}
