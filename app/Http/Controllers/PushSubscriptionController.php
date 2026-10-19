<?php

namespace App\Http\Controllers;

use App\Models\PushSubscription;
use App\Services\WebPushService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class PushSubscriptionController extends Controller
{
    /**
     * Store or update a push notification subscription for the authenticated user.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'endpoint' => 'required|string|max:1000',
                'keys.p256dh' => 'required|string',
                'keys.auth' => 'required|string',
                'contentEncoding' => 'nullable|string|max:50',
            ]);

            $user = Auth::user();
            if (! $user) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
            }

            $endpoint = $validated['endpoint'];
            $endpointHash = hash('sha256', $endpoint);

            PushSubscription::updateOrCreate(
                [
                    'endpoint_hash' => $endpointHash,
                ],
                [
                    'user_id' => $user->id,
                    'endpoint' => $endpoint,
                    'public_key' => $validated['keys']['p256dh'],
                    'auth_token' => $validated['keys']['auth'],
                    'content_encoding' => $validated['contentEncoding'] ?? 'aes128gcm',
                ]
            );

            return response()->json([
                'success' => true,
                'message' => 'Perangkat Anda berhasil didaftarkan untuk menerima Push Notification.',
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal: '.collect($e->errors())->flatten()->first(),
            ], 422);
        } catch (\Throwable $e) {
            Log::error('[PushSubscription] store error: '.$e->getMessage(), ['trace' => $e->getTraceAsString()]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal menyimpan langganan: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Remove a push subscription when user disables it.
     */
    public function destroy(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'endpoint' => 'required|string',
            ]);

            $endpointHash = hash('sha256', $validated['endpoint']);

            PushSubscription::where('user_id', Auth::id())
                ->where('endpoint_hash', $endpointHash)
                ->delete();

            return response()->json([
                'success' => true,
                'message' => 'Perangkat berhasil dinonaktifkan dari Push Notification.',
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus langganan: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Send a test push notification to the user's subscribed devices.
     */
    public function sendTest(Request $request): JsonResponse
    {
        $user = Auth::user();
        if (! $user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        try {
            $delivered = WebPushService::sendToUser(
                user: $user,
                title: 'FinanceTrack Aktif! 🎉',
                body: 'Push notification berhasil terhubung ke HP Anda. Anda akan menerima pengingat tempo tagihan & target.',
                url: route('tagihan.index'),
                tag: 'financetrack-welcome-test'
            );

            return response()->json([
                'success' => true,
                'delivered' => $delivered,
                'message' => $delivered > 0
                    ? "Notifikasi berhasil dikirim ke {$delivered} perangkat Anda!"
                    : 'Perangkat belum terdaftar atau izin notifikasi belum diaktifkan di HP.',
            ]);
        } catch (\Throwable $e) {
            Log::error('[PushSubscription] sendTest error: '.$e->getMessage(), ['trace' => $e->getTraceAsString()]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal mengirim notifikasi: '.$e->getMessage(),
            ], 500);
        }
    }
}
