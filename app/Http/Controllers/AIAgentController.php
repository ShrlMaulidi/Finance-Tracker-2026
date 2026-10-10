<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class AIAgentController extends Controller
{
    public function index()
    {
        return Inertia::render('AIAgent/Index');
    }
}
