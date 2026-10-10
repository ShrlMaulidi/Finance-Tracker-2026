<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Dashboard/Index', [
            'stats' => [
                'total_income' => 25000000,
                'total_expense' => 5000000,
                'balance' => 20000000
            ],
            'recent_transactions' => [
                ['id' => 1, 'type' => 'income', 'amount' => 25000000, 'description' => 'Gaji Freelance', 'date' => 'Hari ini'],
                ['id' => 2, 'type' => 'expense', 'amount' => 150000, 'description' => 'Makan Siang & Kopi', 'date' => 'Kemarin'],
            ]
        ]);
    }
}
