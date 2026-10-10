<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Jobs\ProcessWhatsAppWebhookJob;
use Illuminate\Http\JsonResponse;

class WebhookController extends Controller
{
    public function handleWhatsApp(Request $request): JsonResponse
    {
        ProcessWhatsAppWebhookJob::dispatch($request->all());

        return response()->json([
            'status' => 'success', 
            'message' => 'Webhook received & queued'
        ]);
    }
}
