import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Index({ currentPlan = 'free' }) {
    const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'
    const [openFaq, setOpenFaq] = useState(null);

    const toggleFaq = (index) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    const faqs = [
        {
            q: "Bagaimana cara kerja fitur Integrasi Agent AI WhatsApp?",
            a: "Dengan paket Pro Plus, Anda akan mendapatkan nomor bot WhatsApp resmi FinanceTrack. Anda cukup mengirim pesan teks seperti 'Makan siang sate 35rb pakai Gopay' atau mengirim foto struk belanja, dan AI akan otomatis mencatatnya ke dalam pembukuan Anda secara instan."
        },
        {
            q: "Apakah saya bisa membatalkan langganan kapan saja?",
            a: "Ya, tentu saja! Anda bebas membatalkan atau mengubah paket langganan Anda kapan saja tanpa komitmen jangka panjang atau biaya tersembunyi."
        },
        {
            q: "Metode pembayaran apa saja yang didukung?",
            a: "Kami mendukung pembayaran instan melalui QRIS, GoPay, OVO, ShopeePay, DANA, Virtual Account Bank (BCA, Mandiri, BNI, BRI), serta Kartu Kredit/Debit berlogo Visa dan Mastercard."
        },
        {
            q: "Apakah data keuangan saya dijamin aman dan rahasia?",
            a: "Keamanan Anda adalah prioritas utama kami. Seluruh data transaksi dienkripsi dengan standar enkripsi 256-bit kelas perbankan dan tidak akan pernah dibagikan kepada pihak ketiga manapun."
        }
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Berlangganan" />

            <div className="max-w-7xl mx-auto px-3.5 py-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-10 animate-fade-in">
                
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto space-y-2 sm:space-y-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-blue-50 text-[#009bd2] border border-blue-100">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4l3 6 5-4-2 12H6L4 6l5 4 3-6z" /></svg>
                        Paket Langganan
                    </span>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 tracking-tight leading-tight">
                        Tingkatkan Pengelolaan Finansial Anda
                    </h1>
                    <p className="text-xs sm:text-sm md:text-base text-slate-500 font-medium max-w-xl mx-auto">
                        Pilih paket berlangganan terbaik untuk membuka fitur pencatatan tanpa batas dan asisten AI pintar.
                    </p>

                    {/* Billing Cycle Toggle */}
                    <div className="pt-2 sm:pt-4 flex items-center justify-center">
                        <div className="bg-slate-100 p-1 rounded-2xl flex items-center shadow-inner">
                            <button
                                onClick={() => setBillingCycle('monthly')}
                                className={`px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 ${
                                    billingCycle === 'monthly'
                                        ? 'bg-white text-slate-900 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                Bulanan
                            </button>
                            <button
                                onClick={() => setBillingCycle('yearly')}
                                className={`px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 flex items-center gap-1.5 ${
                                    billingCycle === 'yearly'
                                        ? 'bg-[#009bd2] text-white shadow-sm'
                                        : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                <span>Tahunan</span>
                                <span className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                                    billingCycle === 'yearly' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                    Hemat 20%
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Pricing Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 items-stretch pt-2">
                    
                    {/* PLAN 1: STARTER (FREE) */}
                    <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-100 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-slate-200 transition-all">
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-xl font-black text-slate-800">Starter</h3>
                                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">
                                    Gratis
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium mb-4">
                                Untuk pencatatan keuangan pribadi dasar.
                            </p>

                            <div className="mb-6">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl sm:text-4xl font-black text-slate-900">Rp 0</span>
                                    <span className="text-xs font-bold text-slate-400">/selamanya</span>
                                </div>
                            </div>

                            <ul className="space-y-3 mb-6 text-xs sm:text-sm">
                                <li className="flex items-start gap-2.5 text-slate-600 font-medium">
                                    <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <span>Pencatatan transaksi manual harian</span>
                                </li>
                                <li className="flex items-start gap-2.5 text-slate-600 font-medium">
                                    <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <span>Hingga 5 kategori & 3 metode bayar</span>
                                </li>
                                <li className="flex items-start gap-2.5 text-slate-600 font-medium">
                                    <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <span>Ringkasan grafik dashboard standar</span>
                                </li>
                                <li className="flex items-start gap-2.5 text-slate-400 font-medium">
                                    <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0 mt-0.5">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </div>
                                    <span>Ekspor laporan PDF / Excel</span>
                                </li>
                                <li className="flex items-start gap-2.5 text-slate-400 font-medium">
                                    <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0 mt-0.5">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </div>
                                    <span>Asisten AI WhatsApp bot</span>
                                </li>
                            </ul>
                        </div>

                        <button 
                            disabled 
                            className="w-full py-3 rounded-xl bg-slate-100 text-slate-500 font-extrabold text-xs sm:text-sm cursor-default text-center"
                        >
                            ✓ Paket Anda Saat Ini
                        </button>
                    </div>

                    {/* PLAN 2: PRO */}
                    <div className="bg-white rounded-3xl p-5 sm:p-7 border-2 border-[#009bd2]/30 hover:border-[#009bd2] shadow-sm flex flex-col justify-between relative overflow-hidden group transition-all">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#009bd2]/5 rounded-full blur-2xl pointer-events-none"></div>

                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-xl font-black text-slate-800">Paket Pro</h3>
                                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-[#009bd2]">
                                    Paling Hemat
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium mb-4">
                                Akses tanpa batas ke seluruh modul finansial.
                            </p>

                            <div className="mb-6">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-xs font-bold text-slate-400 line-through">
                                        {billingCycle === 'monthly' ? 'Rp 19.999' : 'Rp 239.000'}
                                    </span>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl sm:text-4xl font-black text-[#009bd2]">
                                        {billingCycle === 'monthly' ? 'Rp 14.999' : 'Rp 149.000'}
                                    </span>
                                    <span className="text-xs font-bold text-slate-400">
                                        {billingCycle === 'monthly' ? '/bulan' : '/tahun'}
                                    </span>
                                </div>
                            </div>

                            <ul className="space-y-3 mb-6 text-xs sm:text-sm">
                                <li className="flex items-start gap-2.5 text-slate-700 font-bold">
                                    <div className="w-5 h-5 rounded-full bg-blue-50 text-[#009bd2] flex items-center justify-center shrink-0 mt-0.5">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <span>Semua fitur paket Starter</span>
                                </li>
                                <li className="flex items-start gap-2.5 text-slate-700 font-bold">
                                    <div className="w-5 h-5 rounded-full bg-blue-50 text-[#009bd2] flex items-center justify-center shrink-0 mt-0.5">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <span><strong>Unlimited</strong> transaksi, kategori & metode bayar</span>
                                </li>
                                <li className="flex items-start gap-2.5 text-slate-700 font-bold">
                                    <div className="w-5 h-5 rounded-full bg-blue-50 text-[#009bd2] flex items-center justify-center shrink-0 mt-0.5">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <span>Ekspor laporan lengkap ke format Excel & PDF</span>
                                </li>
                                <li className="flex items-start gap-2.5 text-slate-700 font-bold">
                                    <div className="w-5 h-5 rounded-full bg-blue-50 text-[#009bd2] flex items-center justify-center shrink-0 mt-0.5">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <span>Bebas dari iklan & sinkronisasi otomatis</span>
                                </li>
                                <li className="flex items-start gap-2.5 text-slate-400 font-medium">
                                    <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0 mt-0.5">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </div>
                                    <span>Asisten AI WhatsApp bot</span>
                                </li>
                            </ul>
                        </div>

                        <button 
                            className="w-full py-3 rounded-xl bg-slate-900 hover:bg-[#009bd2] text-white font-extrabold text-xs sm:text-sm shadow-md transition-all active:scale-95 text-center cursor-pointer"
                        >
                            Pilih Paket Pro
                        </button>
                    </div>

                    {/* PLAN 3: PRO PLUS (AI & WHATSAPP) */}
                    <div 
                        style={{ backgroundColor: '#0f172a' }}
                        className="bg-[#0f172a] bg-gradient-to-b from-slate-900 via-[#0f172a] to-slate-950 text-white rounded-3xl p-5 sm:p-7 shadow-xl shadow-indigo-950/30 flex flex-col justify-between relative overflow-hidden border-2 border-indigo-500/40 md:-translate-y-2"
                    >
                        {/* Glow effect */}
                        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

                        {/* Top Ribbon */}
                        <div 
                            style={{ backgroundColor: '#4f46e5' }}
                            className="absolute top-0 right-0 bg-indigo-600 bg-gradient-to-l from-indigo-500 to-sky-500 text-white text-[10px] font-black uppercase tracking-widest py-1 px-3.5 rounded-bl-xl shadow-sm"
                        >
                            ★ Paling Populer
                        </div>

                        <div>
                            <div className="mb-3">
                                <h3 className="text-xl font-black text-white flex items-center gap-2">
                                    <span>Pro Plus</span>
                                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
                                        AI WhatsApp
                                    </span>
                                </h3>
                            </div>
                            <p className="text-xs text-slate-300 font-medium mb-4">
                                Asisten finansial cerdas terhubung 24/7 di WhatsApp Anda.
                            </p>

                            <div className="mb-6">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-xs font-bold text-slate-400 line-through">
                                        {billingCycle === 'monthly' ? 'Rp 79.999' : 'Rp 959.000'}
                                    </span>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl sm:text-4xl font-black text-white">
                                        {billingCycle === 'monthly' ? 'Rp 59.999' : 'Rp 590.000'}
                                    </span>
                                    <span className="text-xs font-bold text-slate-300">
                                        {billingCycle === 'monthly' ? '/bulan' : '/tahun'}
                                    </span>
                                </div>
                            </div>

                            <ul className="space-y-3 mb-6 text-xs sm:text-sm">
                                <li className="flex items-start gap-2.5 text-slate-100 font-medium">
                                    <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <span>Semua fitur paket Pro (Full Akses)</span>
                                </li>
                                <li className="flex items-start gap-2.5 text-white font-bold">
                                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <span className="flex items-center gap-1.5 flex-wrap">
                                        <span>Integrasi Agent AI WhatsApp 24/7</span>
                                        <span className="inline-flex h-2 w-2 relative">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                                        </span>
                                    </span>
                                </li>
                                <li className="flex items-start gap-2.5 text-slate-100 font-medium">
                                    <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <span>Scan foto struk belanja via WA (OCR AI)</span>
                                </li>
                                <li className="flex items-start gap-2.5 text-slate-100 font-medium">
                                    <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <span>Laporan analitik pintar & rekomendasi hemat</span>
                                </li>
                                <li className="flex items-start gap-2.5 text-slate-100 font-medium">
                                    <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <span>Customer support prioritas VIP</span>
                                </li>
                            </ul>
                        </div>

                        <button 
                            style={{ backgroundColor: '#4f46e5' }}
                            className="w-full py-3.5 rounded-xl bg-indigo-600 bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-600 hover:to-sky-600 text-white font-black text-xs sm:text-sm shadow-lg shadow-indigo-500/30 transition-all active:scale-95 text-center cursor-pointer"
                        >
                            Pilih Pro Plus (AI)
                        </button>
                    </div>

                </div>

                {/* Secure Payment & Guarantees Banner */}
                <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-slate-800">Garansi Keamanan Transaksi 100%</h4>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">Mendukung pembayaran via QRIS, GoPay, OVO, Bank Transfer & Kartu Kredit.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-extrabold text-slate-400">
                        <span className="px-2.5 py-1 bg-slate-100 rounded-lg">QRIS</span>
                        <span className="px-2.5 py-1 bg-slate-100 rounded-lg">GoPay</span>
                        <span className="px-2.5 py-1 bg-slate-100 rounded-lg">BCA</span>
                        <span className="px-2.5 py-1 bg-slate-100 rounded-lg">Visa/Mastercard</span>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-slate-100 shadow-xs space-y-4 sm:space-y-6">
                    <div className="text-center max-w-xl mx-auto space-y-1">
                        <h2 className="text-lg sm:text-2xl font-black text-slate-800 tracking-tight">
                            Pertanyaan Umum (FAQ)
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 font-medium">
                            Semua hal yang perlu Anda ketahui tentang paket langganan FinanceTrack.
                        </p>
                    </div>

                    <div className="space-y-2.5 max-w-3xl mx-auto">
                        {faqs.map((faq, index) => (
                            <div 
                                key={index}
                                className="border border-slate-100 rounded-2xl overflow-hidden transition-colors"
                            >
                                <button
                                    onClick={() => toggleFaq(index)}
                                    className="w-full p-4 text-left flex items-center justify-between gap-3 font-extrabold text-xs sm:text-sm text-slate-800 hover:bg-slate-50 transition-colors"
                                >
                                    <span>{faq.q}</span>
                                    <svg className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${openFaq === index ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </button>
                                {openFaq === index && (
                                    <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-slate-500 leading-relaxed border-t border-slate-50">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </AuthenticatedLayout>
    );
}
