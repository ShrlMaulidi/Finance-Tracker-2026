<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\PaymentMethod;
use App\Models\Setting;
use App\Models\Transaction;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class AIAgentController extends Controller
{
    /**
     * Display the AI Agent WhatsApp Integration dashboard.
     */
    public function index(): Response
    {
        $user = Auth::user();

        if (! $user->canAccess('ai_agent')) {
            return Inertia::render('LockedFeature', [
                'feature' => 'ai_agent',
                'title' => 'Integrasi Agent AI WhatsApp Terkunci',
                'subtitle' => 'Catat Keuangan Cukup Lewat Chat WhatsApp 24/7 (Eksklusif Paket Pro Plus)',
                'description' => 'Tidak perlu lagi input transaksi manual! Cukup kirim pesan teks atau foto struk belanja ke bot WhatsApp resmi FinanceTrack, pembukuan Anda terupdate secara instan.',
                'benefits' => [
                    'Pencatatan transaksi instan otomatis via pesan WhatsApp',
                    'Deteksi cerdas nominal, tanggal, kategori, dan metode bayar',
                    'Dukungan kirim foto struk / nota belanja (OCR Vision AI)',
                    'Asisten AI siap melayani 24 jam nonstop',
                ],
            ]);
        }

        Carbon::setLocale('id');

        // Bot phone number from pricing setting or config
        $pricing = Setting::get('pricing_settings', []);
        $botPhone = config('services.ai_agent.bot_phone') ?: ($pricing['support_wa'] ?? '6281234567890');

        // Clean bot phone for wa.me link
        $botPhoneClean = User::normalizePhoneNumber($botPhone) ?: '6281234567890';

        // Transactions recorded via WhatsApp AI
        $recentAiTransactions = Transaction::where('user_id', $user->id)
            ->where(function ($query) {
                $query->where('description', 'LIKE', '%WhatsApp%')
                    ->orWhere('description', 'LIKE', '%AI Agent%')
                    ->orWhere('description', 'LIKE', '%Bot%');
            })
            ->orderBy('date', 'desc')
            ->orderBy('created_at', 'desc')
            ->take(15)
            ->get()
            ->map(function ($t) {
                return [
                    'id' => $t->id,
                    'type' => $t->type,
                    'amount' => (float) $t->amount,
                    'title' => $t->title,
                    'category' => $t->category,
                    'payment_method' => $t->payment_method,
                    'date' => $t->date,
                    'date_formatted' => Carbon::parse($t->date)->translatedFormat('d M Y'),
                    'description' => $t->description,
                ];
            });

        // Summary of AI activity
        $aiTrxCount = Transaction::where('user_id', $user->id)
            ->where(function ($query) {
                $query->where('description', 'LIKE', '%WhatsApp%')
                    ->orWhere('description', 'LIKE', '%AI Agent%')
                    ->orWhere('description', 'LIKE', '%Bot%');
            })
            ->count();

        $aiMonthlyExpense = (float) Transaction::where('user_id', $user->id)
            ->where('type', 'pengeluaran')
            ->whereMonth('date', Carbon::now()->month)
            ->whereYear('date', Carbon::now()->year)
            ->where(function ($query) {
                $query->where('description', 'LIKE', '%WhatsApp%')
                    ->orWhere('description', 'LIKE', '%AI Agent%')
                    ->orWhere('description', 'LIKE', '%Bot%');
            })
            ->sum('amount');

        // Active categories and payment methods
        $categories = Category::where('user_id', $user->id)
            ->get()
            ->groupBy('type')
            ->map(fn ($items) => $items->pluck('name')->values()->toArray());

        $paymentMethods = PaymentMethod::where('user_id', $user->id)
            ->pluck('name')
            ->toArray();

        // Technical details for n8n webhook setup
        $webhookUrl = url('/api/webhook/whatsapp/transaction');
        $webhookSecret = config('services.ai_agent.secret', 'financetrack-ai-secret-2026');

        return Inertia::render('AIAgent/Index', [
            'phoneNumber' => $user->phone_number,
            'whatsappLid' => $user->whatsapp_lid,
            'isPhoneConnected' => ! empty($user->phone_number) || ! empty($user->whatsapp_lid),
            'botPhoneNumber' => $botPhoneClean,
            'recentAiTransactions' => $recentAiTransactions,
            'stats' => [
                'total_ai_transactions' => $aiTrxCount,
                'monthly_ai_expense' => $aiMonthlyExpense,
            ],
            'categories' => [
                'pemasukan' => $categories->get('pemasukan', []),
                'pengeluaran' => $categories->get('pengeluaran', []),
            ],
            'paymentMethods' => ! empty($paymentMethods) ? $paymentMethods : ['Cash', 'E-Banking', 'E-Wallet'],
            'integrationConfig' => [
                'webhook_url' => $webhookUrl,
                'secret_token' => $webhookSecret,
                'is_admin' => $user->isSuperAdmin(),
            ],
        ]);
    }

    /**
     * Link or update user's WhatsApp phone number.
     */
    public function updatePhone(Request $request): RedirectResponse
    {
        $user = Auth::user();

        $validated = $request->validate([
            'phone_number' => 'required|string|min:8|max:25',
        ], [
            'phone_number.required' => 'Nomor WhatsApp wajib diisi.',
            'phone_number.min' => 'Nomor WhatsApp minimal 8 digit.',
        ]);

        $normalized = User::normalizePhoneNumber($validated['phone_number']);

        if (! $normalized || strlen($normalized) < 9) {
            return back()->withErrors(['phone_number' => 'Format nomor WhatsApp tidak valid. Masukkan nomor yang benar (misal: 081234567890).']);
        }

        // Check uniqueness across other users
        $existing = User::where('phone_number', $normalized)
            ->where('id', '!=', $user->id)
            ->first();

        if ($existing) {
            return back()->withErrors(['phone_number' => 'Nomor WhatsApp ini sudah ditautkan ke akun FinanceTrack lain. Gunakan nomor lain atau hubungi admin.']);
        }

        $user->phone_number = $normalized;
        $user->save();

        return back()->with('success', "Nomor WhatsApp (+{$normalized}) berhasil ditautkan! Anda sudah dapat mengirim pesan transaksi ke bot kami.");
    }

    /**
     * Disconnect/unlink user's WhatsApp phone number.
     */
    public function disconnectPhone(): RedirectResponse
    {
        $user = Auth::user();
        $user->phone_number = null;
        $user->whatsapp_lid = null;
        $user->save();

        return back()->with('success', 'Nomor WhatsApp berhasil diputuskan dari akun Anda.');
    }
}
