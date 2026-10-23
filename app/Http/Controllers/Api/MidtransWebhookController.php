<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SubscriptionPayment;
use App\Services\MidtransService;
use App\Services\SubscriptionBillingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class MidtransWebhookController extends Controller
{
    public function __construct(
        private MidtransService $midtrans,
        private SubscriptionBillingService $billing,
    ) {}

    /**
     * Receive Midtrans payment notifications (HTTP notification URL set in the Midtrans dashboard).
     */
    public function __invoke(Request $request): JsonResponse
    {
        $notification = $request->all();

        if (! $this->midtrans->hasValidSignature($notification)) {
            Log::warning('Midtrans: notification with invalid signature', [
                'order_id' => $notification['order_id'] ?? null,
                'ip' => $request->ip(),
            ]);

            return response()->json(['message' => 'Invalid signature'], 403);
        }

        $payment = SubscriptionPayment::where('order_id', $notification['order_id'] ?? null)->first();

        // Dashboard test notifications use made-up order ids; acknowledge them so Midtrans stops retrying
        if (! $payment) {
            return response()->json(['status' => 'ignored']);
        }

        $this->billing->applyMidtransStatus($payment, $notification);

        return response()->json(['status' => 'ok']);
    }
}
