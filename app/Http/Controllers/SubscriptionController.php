<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Admin\AdminSettingController;
use App\Models\SubscriptionPayment;
use App\Services\MidtransService;
use App\Services\SubscriptionBillingService;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class SubscriptionController extends Controller
{
    public function __construct(
        private MidtransService $midtrans,
        private SubscriptionBillingService $billing,
    ) {}

    public function index(Request $request)
    {
        $user = $request->user();
        $activeTier = $user->getActiveTier();

        $pendingPayment = SubscriptionPayment::where('user_id', $user->id)
            ->where('status', 'pending')
            ->whereNotNull('snap_token')
            ->where('created_at', '>=', now()->subHours(23))
            ->latest()
            ->first(['id', 'plan', 'billing_cycle', 'payment_method', 'amount', 'snap_token', 'created_at']);

        return Inertia::render('Berlangganan/Index', [
            'currentPlan' => $activeTier === 'superadmin' ? 'pro_plus' : $activeTier,
            'subscriptionExpiresAt' => $activeTier !== 'free' && $user->subscription_expires_at
                ? $user->subscription_expires_at->locale('id')->translatedFormat('d F Y')
                : null,
            'pricing' => AdminSettingController::getPricingSettings(),
            'midtrans' => [
                'isConfigured' => $this->midtrans->isConfigured(),
                'clientKey' => config('services.midtrans.client_key'),
                'snapScriptUrl' => $this->midtrans->snapScriptUrl(),
                'isProduction' => $this->midtrans->isProduction(),
            ],
            'pendingPayment' => $pendingPayment,
        ]);
    }

    /**
     * Create a Midtrans order for the chosen plan and hand its Snap token to the browser.
     */
    public function checkout(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'plan' => 'required|in:pro,pro_plus',
            'billing_cycle' => 'required|in:monthly,yearly',
            'payment_method' => ['required', Rule::in(array_keys(MidtransService::PAYMENT_CHANNELS))],
        ], [
            'payment_method.required' => 'Pilih metode pembayaran terlebih dahulu.',
            'payment_method.in' => 'Metode pembayaran tidak tersedia.',
        ]);

        if ($reason = $this->billing->checkoutBlockReason($request->user(), $validated['plan'])) {
            return response()->json(['message' => $reason], 422);
        }

        if (! $this->midtrans->isConfigured()) {
            return response()->json(['message' => 'Pembayaran online belum tersedia. Silakan hubungi admin.'], 503);
        }

        try {
            $payment = $this->billing->startCheckout($request->user(), $validated['plan'], $validated['billing_cycle'], $validated['payment_method']);
        } catch (RequestException|ConnectionException $e) {
            Log::error('Midtrans: failed to create Snap transaction', ['user_id' => $request->user()->id, 'error' => $e->getMessage()]);

            return response()->json(['message' => 'Gagal menghubungi layanan pembayaran. Silakan coba lagi.'], 502);
        }

        return response()->json([
            'payment_id' => $payment->id,
            'token' => $payment->snap_token,
        ]);
    }

    /**
     * Ask Midtrans for the order's real status, so the page updates even before the webhook arrives.
     */
    public function syncPayment(Request $request, SubscriptionPayment $payment): JsonResponse
    {
        abort_unless($payment->user_id === $request->user()->id, 404);

        if ($payment->isPending() && $this->midtrans->isConfigured()) {
            try {
                $payment = $this->billing->applyMidtransStatus($payment, $this->midtrans->fetchStatus($payment->order_id));
            } catch (RequestException|ConnectionException $e) {
                // 404 means no payment method was chosen yet; anything else is retried by the next sync or webhook
                if (! ($e instanceof RequestException && $e->response->notFound())) {
                    Log::warning('Midtrans: status check failed', ['order_id' => $payment->order_id, 'error' => $e->getMessage()]);
                }
            }
        }

        return response()->json([
            'status' => $payment->status,
            'plan' => $payment->plan,
            'subscription_expires_at' => $payment->subscription_expires_at?->locale('id')->translatedFormat('d F Y'),
        ]);
    }
}
