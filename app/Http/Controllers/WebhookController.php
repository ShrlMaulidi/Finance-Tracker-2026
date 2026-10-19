<?php

namespace App\Http\Controllers;

use App\Jobs\ProcessWhatsAppWebhookJob;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WebhookController extends Controller
{
    public function handleWhatsApp(Request $request): JsonResponse
    {
        ProcessWhatsAppWebhookJob::dispatch($request->all());

        return response()->json([
            'status' => 'success',
            'message' => 'Webhook received & queued',
        ]);
    }
}
