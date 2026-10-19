<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Admin\AdminSettingController;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SubscriptionController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('Berlangganan/Index', [
            'currentPlan' => $request->user()->subscription_tier ?? 'free',
            'pricing' => AdminSettingController::getPricingSettings(),
        ]);
    }
}
