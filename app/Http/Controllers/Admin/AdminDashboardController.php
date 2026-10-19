<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Carbon\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController extends Controller
{
    /**
     * Display the Super Admin dashboard with system & user analytics.
     */
    public function index(): Response
    {
        $counts = User::subscriptionSummary();
        $totalUsers = $counts['total'];
        $freeUsers = $counts['free'];
        $proUsers = $counts['pro'];
        $proPlusUsers = $counts['pro_plus'];
        $activeUsers = $counts['active'];
        $suspendedUsers = $counts['suspended'];

        $pricing = AdminSettingController::getPricingSettings();
        $proMonthly = (int) ($pricing['pro_monthly_price'] ?? 14999);
        $proPlusMonthly = (int) ($pricing['pro_plus_monthly_price'] ?? 29999);

        // Estimated MRR dynamically calculated from admin pricing configuration
        $estimatedMrr = ($proUsers * $proMonthly) + ($proPlusUsers * $proPlusMonthly);

        // Tier distribution calculation
        $tierDistribution = [
            [
                'tier' => 'free',
                'name' => 'Gratis (Starter)',
                'count' => $freeUsers,
                'percentage' => $totalUsers > 0 ? round(($freeUsers / $totalUsers) * 100, 1) : 0,
                'color' => '#64748b', // Slate
                'badgeBg' => 'bg-slate-100 text-slate-700',
            ],
            [
                'tier' => 'pro',
                'name' => 'Paket Pro',
                'count' => $proUsers,
                'percentage' => $totalUsers > 0 ? round(($proUsers / $totalUsers) * 100, 1) : 0,
                'color' => '#009bd2', // FinanceTrack Blue
                'badgeBg' => 'bg-blue-50 text-[#009bd2]',
            ],
            [
                'tier' => 'pro_plus',
                'name' => 'Paket Pro Plus (AI & WA)',
                'count' => $proPlusUsers,
                'percentage' => $totalUsers > 0 ? round(($proPlusUsers / $totalUsers) * 100, 1) : 0,
                'color' => '#8b5cf6', // Violet
                'badgeBg' => 'bg-purple-50 text-purple-700',
            ],
        ];

        // 6 months user registration trend
        $registrationsByMonth = User::where('created_at', '>=', Carbon::now()->subMonthsNoOverflow(5)->startOfMonth())
            ->selectRaw("DATE_FORMAT(created_at, '%Y-%m') as ym, COUNT(*) as total")
            ->groupBy('ym')
            ->pluck('total', 'ym');

        $monthsTrend = [];
        for ($i = 5; $i >= 0; $i--) {
            $monthDate = Carbon::now()->subMonthsNoOverflow($i);
            $monthKey = $monthDate->translatedFormat('M Y');
            $count = (int) $registrationsByMonth->get($monthDate->format('Y-m'), 0);

            $monthsTrend[] = [
                'month' => $monthKey,
                'count' => $count,
            ];
        }

        // Recent users
        $recentUsers = User::latest()
            ->take(6)
            ->get(['id', 'name', 'email', 'avatar', 'role', 'subscription_tier', 'is_active', 'created_at']);

        return Inertia::render('Admin/Dashboard', [
            'metrics' => [
                'total_users' => $totalUsers,
                'free_users' => $freeUsers,
                'pro_users' => $proUsers,
                'pro_plus_users' => $proPlusUsers,
                'active_users' => $activeUsers,
                'suspended_users' => $suspendedUsers,
                'estimated_mrr' => $estimatedMrr,
            ],
            'tierDistribution' => $tierDistribution,
            'monthsTrend' => $monthsTrend,
            'recentUsers' => $recentUsers,
            'pricing' => $pricing,
        ]);
    }
}
