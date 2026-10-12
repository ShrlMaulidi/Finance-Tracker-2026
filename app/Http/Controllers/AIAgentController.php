<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class AIAgentController extends Controller
{
    public function index()
    {
        if (!auth()->user()->canAccess('ai_agent')) {
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

        return Inertia::render('AIAgent/Index');
    }
}
