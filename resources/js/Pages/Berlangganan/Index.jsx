import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';

export default function Index({ currentPlan = 'free', pricing }) {
    const pagePricing = usePage().props.pricing || {};
    const effectivePricing = pricing || pagePricing;

    const proMonthly = Number(effectivePricing.pro_monthly_price ?? 14999);
    const proYearly = Number(effectivePricing.pro_yearly_price ?? 149000);
    const proPlusMonthly = Number(effectivePricing.pro_plus_monthly_price ?? 29999);
    const proPlusYearly = Number(effectivePricing.pro_plus_yearly_price ?? 299000);

    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(number || 0);
    };

    const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'
    const [mobilePlan, setMobilePlan] = useState('all'); // 'all' | 'pro_plus' | 'pro' | 'free'
    const [openFaq, setOpenFaq] = useState(null);
    const [checkoutPlan, setCheckoutPlan] = useState(null);

    const toggleFaq = (index) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    const handleSelectPlan = (planKey, name, price) => {
        setCheckoutPlan({
            key: planKey,
            name: name,
            price: price,
        });
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

            <div className="max-w-7xl mx-auto px-3.5 py-3.5 sm:p-6 lg:p-8 space-y-4 sm:space-y-7 lg:space-y-10 animate-fade-in">
                
                {/* Header */}
                <div className="text-center max-w-2xl mx-auto space-y-1.5 sm:space-y-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider bg-blue-50 text-[#009bd2] border border-blue-100">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4l3 6 5-4-2 12H6L4 6l5 4 3-6z" /></svg>
                        Paket Langganan
                    </span>
                    <h1 className="text-xl sm:text-3xl md:text-4xl font-black text-slate-800 tracking-tight leading-tight">
                        Tingkatkan Pengelolaan Finansial Anda
                    </h1>
                    <p className="text-[11.5px] sm:text-sm md:text-base text-slate-500 font-medium max-w-lg mx-auto leading-relaxed">
                        Pilih paket berlangganan terbaik untuk membuka fitur pencatatan tanpa batas dan asisten AI pintar.
                    </p>

                    {/* Billing Cycle Toggle - Full 50/50 on small screens */}
                    <div className="pt-1.5 sm:pt-3 flex items-center justify-center">
                        <div className="bg-slate-100 p-1 rounded-xl sm:rounded-2xl flex items-center shadow-inner w-full max-w-[280px] sm:max-w-xs">
                            <button
                                type="button"
                                onClick={() => setBillingCycle('monthly')}
                                className={`flex-1 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 text-center ${
                                    billingCycle === 'monthly'
                                        ? 'bg-white text-slate-900 shadow-xs'
                                        : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                Bulanan
                            </button>
                            <button
                                type="button"
                                onClick={() => setBillingCycle('yearly')}
                                className={`flex-1 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 flex items-center justify-center gap-1 text-center ${
                                    billingCycle === 'yearly'
                                        ? 'bg-[#009bd2] text-white shadow-xs'
                                        : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                <span>Tahunan</span>
                                <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                                    billingCycle === 'yearly' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                    Hemat 20%
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Plan Tab Filter (Native iOS/Android Style Segmented Control) */}
                <div className="grid grid-cols-4 md:hidden bg-slate-100 p-1 rounded-xl text-center shadow-inner gap-1">
                    <button
                        type="button"
                        onClick={() => setMobilePlan('all')}
                        className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                            mobilePlan === 'all'
                                ? 'bg-white text-slate-900 shadow-xs'
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        Semua
                    </button>
                    <button
                        type="button"
                        onClick={() => setMobilePlan('pro_plus')}
                        className={`py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                            mobilePlan === 'pro_plus'
                                ? 'bg-purple-600 text-white shadow-xs'
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <span>Pro Plus</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setMobilePlan('pro')}
                        className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                            mobilePlan === 'pro'
                                ? 'bg-[#009bd2] text-white shadow-xs'
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        Paket Pro
                    </button>
                    <button
                        type="button"
                        onClick={() => setMobilePlan('free')}
                        className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                            mobilePlan === 'free'
                                ? 'bg-slate-700 text-white shadow-xs'
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        Starter
                    </button>
                </div>

                {/* Pricing Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-6 lg:gap-8 items-stretch pt-0.5 sm:pt-2">
                    
                    {/* PLAN 1: STARTER (FREE) */}
                    <div className={`bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-7 border border-slate-100 shadow-xs flex-col justify-between relative overflow-hidden group hover:border-slate-200 transition-all ${
                        mobilePlan !== 'all' && mobilePlan !== 'free' ? 'hidden md:flex' : 'flex'
                    }`}>
                        <div>
                            <div className="flex items-center justify-between mb-1.5 sm:mb-3">
                                <h3 className="text-base sm:text-xl font-black text-slate-800">Starter</h3>
                                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">
                                    Gratis
                                </span>
                            </div>
                            <p className="text-[11.5px] sm:text-xs text-slate-500 font-medium mb-3 sm:mb-4">
                                Untuk pencatatan keuangan pribadi dasar.
                            </p>

                            <div className="mb-3.5 sm:mb-6">
                                <div className="flex items-baseline gap-1.5 flex-wrap">
                                    <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">Rp 0</span>
                                    <span className="text-xs font-bold text-slate-400">/selamanya</span>
                                </div>
                            </div>

                            <ul className="space-y-2 sm:space-y-2.5 mb-4 sm:mb-6 text-[11.5px] sm:text-xs lg:text-sm">
                                <li className="flex items-start gap-2 sm:gap-2.5 text-slate-600 font-medium">
                                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                                        <svg className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <span className="leading-snug">Pencatatan transaksi manual harian</span>
                                </li>
                                <li className="flex items-start gap-2 sm:gap-2.5 text-slate-600 font-medium">
                                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                                        <svg className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <span className="leading-snug">Maks. 1 target impian & 2 tagihan rutin</span>
                                </li>
                                <li className="flex items-start gap-2 sm:gap-2.5 text-slate-600 font-medium">
                                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                                        <svg className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <span className="leading-snug">Maks. 3 kategori & 3 metode bayar</span>
                                </li>
                                <li className="flex items-start gap-2 sm:gap-2.5 text-slate-400 font-medium">
                                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0 mt-0.5">
                                        <svg className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </div>
                                    <span className="leading-snug">Semua modul anggaran (Terkunci)</span>
                                </li>
                                <li className="flex items-start gap-2 sm:gap-2.5 text-slate-400 font-medium">
                                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0 mt-0.5">
                                        <svg className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </div>
                                    <span className="leading-snug">Laporan keuangan & ekspor PDF/Excel</span>
                                </li>
                                <li className="flex items-start gap-2 sm:gap-2.5 text-slate-400 font-medium">
                                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0 mt-0.5">
                                        <svg className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </div>
                                    <span className="leading-snug">Integrasi Agent AI WhatsApp bot</span>
                                </li>
                            </ul>
                        </div>

                        <button 
                            disabled={currentPlan === 'free'} 
                            className={`w-full py-2.5 sm:py-3.5 rounded-xl font-extrabold text-xs sm:text-sm text-center transition-all ${
                                currentPlan === 'free'
                                    ? 'bg-slate-100 text-slate-500 cursor-default'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer active:scale-98'
                            }`}
                        >
                            {currentPlan === 'free' ? '✓ Paket Anda Saat Ini (Aktif)' : 'Pilih Starter'}
                        </button>
                    </div>

                    {/* PLAN 2: PRO */}
                    <div className={`bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-7 border-2 ${
                        currentPlan === 'pro' 
                            ? 'border-[#009bd2] ring-2 ring-[#009bd2]/20' 
                            : 'border-[#009bd2]/30 hover:border-[#009bd2]'
                    } shadow-xs flex-col justify-between relative overflow-hidden group transition-all ${
                        mobilePlan !== 'all' && mobilePlan !== 'pro' ? 'hidden md:flex' : 'flex'
                    }`}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#009bd2]/5 rounded-full blur-2xl pointer-events-none"></div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5 sm:mb-3">
                                <h3 className="text-base sm:text-xl font-black text-slate-800">Paket Pro</h3>
                                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-[#009bd2]">
                                    {currentPlan === 'pro' ? 'Aktif' : 'Paling Hemat'}
                                </span>
                            </div>
                            <p className="text-[11.5px] sm:text-xs text-slate-500 font-medium mb-3 sm:mb-4">
                                Akses tanpa batas ke seluruh modul finansial.
                            </p>

                            <div className="mb-3.5 sm:mb-6">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-[10.5px] sm:text-xs font-bold text-slate-400 line-through">
                                        {formatRupiah(billingCycle === 'monthly' ? Math.round(proMonthly * 1.35) : Math.round(proMonthly * 12))}
                                    </span>
                                </div>
                                <div className="flex items-baseline gap-1.5 flex-wrap">
                                    <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#009bd2] tracking-tight">
                                        {formatRupiah(billingCycle === 'monthly' ? proMonthly : proYearly)}
                                    </span>
                                    <span className="text-xs font-bold text-slate-400">
                                        {billingCycle === 'monthly' ? '/bulan' : '/tahun'}
                                    </span>
                                </div>
                            </div>

                            <ul className="space-y-2 sm:space-y-2.5 mb-4 sm:mb-6 text-[11.5px] sm:text-xs lg:text-sm">
                                <li className="flex items-start gap-2 sm:gap-2.5 text-slate-700 font-bold">
                                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-blue-50 text-[#009bd2] flex items-center justify-center shrink-0 mt-0.5">
                                        <svg className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <span className="leading-snug">Semua fitur paket Starter</span>
                                </li>
                                <li className="flex items-start gap-2 sm:gap-2.5 text-slate-700 font-bold">
                                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-blue-50 text-[#009bd2] flex items-center justify-center shrink-0 mt-0.5">
                                        <svg className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <span className="leading-snug">Transaksi, target & tagihan tanpa batas</span>
                                </li>
                                <li className="flex items-start gap-2 sm:gap-2.5 text-slate-700 font-bold">
                                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-blue-50 text-[#009bd2] flex items-center justify-center shrink-0 mt-0.5">
                                        <svg className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <span className="leading-snug">Kategori & metode bayar tanpa batas</span>
                                </li>
                                <li className="flex items-start gap-2 sm:gap-2.5 text-slate-700 font-bold">
                                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-blue-50 text-[#009bd2] flex items-center justify-center shrink-0 mt-0.5">
                                        <svg className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <span className="leading-snug">Akses penuh semua menu anggaran</span>
                                </li>
                                <li className="flex items-start gap-2 sm:gap-2.5 text-slate-700 font-bold">
                                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-blue-50 text-[#009bd2] flex items-center justify-center shrink-0 mt-0.5">
                                        <svg className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <span className="leading-snug">Laporan keuangan & ekspor PDF / Excel</span>
                                </li>
                                <li className="flex items-start gap-2 sm:gap-2.5 text-slate-400 font-medium">
                                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0 mt-0.5">
                                        <svg className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </div>
                                    <span className="leading-snug">Integrasi Agent AI WhatsApp bot</span>
                                </li>
                            </ul>
                        </div>

                        <button 
                            type="button"
                            onClick={() => handleSelectPlan('pro', 'Paket Pro', billingCycle === 'monthly' ? proMonthly : proYearly)}
                            disabled={currentPlan === 'pro'}
                            className={`w-full py-2.5 sm:py-3.5 rounded-xl font-extrabold text-xs sm:text-sm shadow-sm transition-all text-center flex items-center justify-center gap-1.5 ${
                                currentPlan === 'pro'
                                    ? 'bg-slate-100 text-slate-500 cursor-default'
                                    : 'bg-slate-900 hover:bg-[#009bd2] text-white active:scale-98 cursor-pointer'
                            }`}
                        >
                            {currentPlan === 'pro' ? '✓ Paket Anda Saat Ini (Aktif)' : 'Pilih Paket Pro'}
                        </button>
                    </div>

                    {/* PLAN 3: PRO PLUS (AI & WHATSAPP) */}
                    <div 
                        style={{ backgroundColor: '#0f172a' }}
                        className={`bg-[#0f172a] bg-gradient-to-b from-slate-900 via-[#0f172a] to-slate-950 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-7 shadow-xl shadow-indigo-950/30 flex-col justify-between relative overflow-hidden border-2 ${
                            currentPlan === 'pro_plus' ? 'border-purple-400 ring-2 ring-purple-500/30' : 'border-indigo-500/40'
                        } md:-translate-y-2 ${
                            mobilePlan !== 'all' && mobilePlan !== 'pro_plus' ? 'hidden md:flex' : 'flex'
                        }`}
                    >
                        {/* Glow effect */}
                        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

                        {/* Top Ribbon */}
                        <div 
                            style={{ backgroundColor: '#4f46e5' }}
                            className="absolute top-0 right-0 bg-indigo-600 bg-gradient-to-l from-indigo-500 to-sky-500 text-white text-[9px] sm:text-[10px] font-black uppercase tracking-widest py-0.5 sm:py-1 px-2.5 sm:px-3.5 rounded-bl-xl shadow-xs"
                        >
                            {currentPlan === 'pro_plus' ? '✓ Paket Aktif' : '★ Paling Populer'}
                        </div>

                        <div>
                            <div className="mb-1.5 sm:mb-3 pr-24 sm:pr-0">
                                <h3 className="text-base sm:text-xl font-black text-white flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                    <span>Pro Plus</span>
                                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
                                        AI WhatsApp
                                    </span>
                                </h3>
                            </div>
                            <p className="text-[11.5px] sm:text-xs text-slate-300 font-medium mb-3 sm:mb-4">
                                Asisten finansial cerdas terhubung 24/7 di WhatsApp Anda.
                            </p>

                            <div className="mb-3.5 sm:mb-6">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-[10.5px] sm:text-xs font-bold text-slate-400 line-through">
                                        {formatRupiah(billingCycle === 'monthly' ? Math.round(proPlusMonthly * 1.35) : Math.round(proPlusMonthly * 12))}
                                    </span>
                                </div>
                                <div className="flex items-baseline gap-1.5 flex-wrap">
                                    <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                                        {formatRupiah(billingCycle === 'monthly' ? proPlusMonthly : proPlusYearly)}
                                    </span>
                                    <span className="text-xs font-bold text-slate-300">
                                        {billingCycle === 'monthly' ? '/bulan' : '/tahun'}
                                    </span>
                                </div>
                            </div>

                            <ul className="space-y-2 sm:space-y-2.5 mb-4 sm:mb-6 text-[11.5px] sm:text-xs lg:text-sm">
                                <li className="flex items-start gap-2 sm:gap-2.5 text-slate-100 font-bold">
                                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
                                        <svg className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <span className="leading-snug">Semua fitur paket Pro (Full Akses)</span>
                                </li>
                                <li className="flex items-start gap-2 sm:gap-2.5 text-white font-bold">
                                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                                        <svg className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <span className="flex items-center gap-1.5 flex-wrap leading-snug">
                                        <span>Integrasi Agent AI WhatsApp 24/7</span>
                                        <span className="inline-flex h-2 w-2 relative">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                                        </span>
                                    </span>
                                </li>
                                <li className="flex items-start gap-2 sm:gap-2.5 text-slate-100 font-medium">
                                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
                                        <svg className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <span className="leading-snug">Catat transaksi via chat WhatsApp</span>
                                </li>
                                <li className="flex items-start gap-2 sm:gap-2.5 text-slate-100 font-medium">
                                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
                                        <svg className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <span className="leading-snug">Scan foto struk belanja otomatis (OCR AI)</span>
                                </li>
                            </ul>
                        </div>

                        <button 
                            type="button"
                            onClick={() => handleSelectPlan('pro_plus', 'Paket Pro Plus (AI & WA)', billingCycle === 'monthly' ? proPlusMonthly : proPlusYearly)}
                            disabled={currentPlan === 'pro_plus'}
                            style={{ backgroundColor: '#4f46e5' }}
                            className={`w-full py-2.5 sm:py-3.5 rounded-xl font-black text-xs sm:text-sm shadow-md transition-all text-center flex items-center justify-center gap-1.5 ${
                                currentPlan === 'pro_plus'
                                    ? 'bg-slate-800 text-slate-400 cursor-default'
                                    : 'bg-indigo-600 bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-600 hover:to-sky-600 text-white shadow-indigo-500/30 active:scale-98 cursor-pointer'
                            }`}
                        >
                            {currentPlan === 'pro_plus' ? '✓ Paket Anda Saat Ini (Aktif)' : 'Pilih Pro Plus (AI)'}
                        </button>
                    </div>

                </div>

                {/* Secure Payment & Guarantees Banner */}
                <div className="bg-white rounded-xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4 text-center sm:text-left">
                    <div className="flex items-center gap-2.5 sm:gap-3 text-left">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                        </div>
                        <div>
                            <h4 className="text-xs sm:text-sm font-black text-slate-800">Garansi Keamanan Transaksi 100%</h4>
                            <p className="text-[10.5px] sm:text-xs text-slate-500 font-medium leading-tight">Mendukung pembayaran via QRIS, GoPay, OVO, Bank Transfer & Kartu Kredit.</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-center sm:justify-end gap-1 text-[9.5px] sm:text-xs font-bold text-slate-500">
                        <span className="px-2 py-0.5 bg-slate-100 rounded-md">QRIS</span>
                        <span className="px-2 py-0.5 bg-slate-100 rounded-md">GoPay</span>
                        <span className="px-2 py-0.5 bg-slate-100 rounded-md">BCA</span>
                        <span className="px-2 py-0.5 bg-slate-100 rounded-md">Visa/Mastercard</span>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="bg-white rounded-xl sm:rounded-3xl p-4 sm:p-7 border border-slate-100 shadow-xs space-y-3 sm:space-y-5">
                    <div className="text-center max-w-xl mx-auto space-y-1">
                        <h2 className="text-sm sm:text-xl lg:text-2xl font-black text-slate-800 tracking-tight">
                            Pertanyaan Umum (FAQ)
                        </h2>
                        <p className="text-[11px] sm:text-xs md:text-sm text-slate-500 font-medium">
                            Semua hal yang perlu Anda ketahui tentang paket langganan FinanceTrack.
                        </p>
                    </div>

                    <div className="space-y-1.5 sm:space-y-2.5 max-w-3xl mx-auto">
                        {faqs.map((faq, index) => (
                            <div 
                                key={index}
                                className="border border-slate-100 rounded-xl sm:rounded-2xl overflow-hidden transition-colors"
                            >
                                <button
                                    onClick={() => toggleFaq(index)}
                                    className="w-full p-3 sm:p-4 text-left flex items-center justify-between gap-3 font-bold text-xs sm:text-sm text-slate-800 hover:bg-slate-50 transition-colors"
                                >
                                    <span>{faq.q}</span>
                                    <svg className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0 transition-transform duration-200 ${openFaq === index ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </button>
                                {openFaq === index && (
                                    <div className="px-3 pb-3 sm:px-4 sm:pb-4 pt-1 text-[11px] sm:text-xs md:text-sm text-slate-500 leading-relaxed border-t border-slate-50">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* CHECKOUT / PAYMENT CONFIRMATION MODAL */}
            {checkoutPlan && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
                    <div className="bg-white border border-slate-100 rounded-2xl sm:rounded-3xl p-4 sm:p-6 max-w-sm sm:max-w-md w-full shadow-2xl space-y-3.5 animate-scale-up max-h-[92vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-50 text-[#009bd2] flex items-center justify-center shrink-0">
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4l3 6 5-4-2 12H6L4 6l5 4 3-6z" /></svg>
                                </div>
                                <div>
                                    <h3 className="text-xs sm:text-base font-black text-slate-800">{checkoutPlan.name}</h3>
                                    <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium">Aktivasi Langganan Akun</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setCheckoutPlan(null)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Total Price Box */}
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                            <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-500 font-medium">
                                <span>Siklus Pembayaran:</span>
                                <span className="font-bold text-slate-700 capitalize">{billingCycle === 'monthly' ? 'Bulanan' : 'Tahunan (Hemat 20%)'}</span>
                            </div>
                            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                                <span className="text-[11px] sm:text-xs font-bold text-slate-700">Total Biaya:</span>
                                <span className="text-base sm:text-lg font-black text-[#009bd2]">{formatRupiah(checkoutPlan.price)}</span>
                            </div>
                        </div>

                        {/* Payment Method Highlights */}
                        <div className="space-y-1.5">
                            <p className="text-[11px] sm:text-xs font-bold text-slate-700">Metode Pembayaran Tersedia:</p>
                            <div className="p-2.5 rounded-xl border border-slate-200 flex items-center gap-2.5 bg-white">
                                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] sm:text-xs font-bold text-slate-800">QRIS / E-Wallet / Transfer Bank</p>
                                    <p className="text-[9.5px] sm:text-[10px] text-slate-400 font-medium">BCA, Mandiri, GoPay, OVO, ShopeePay</p>
                                </div>
                            </div>
                        </div>

                        {/* WhatsApp Activation Direct Link */}
                        <div className="pt-1 flex flex-col gap-1.5">
                            <a
                                href={`https://wa.me/${effectivePricing.support_wa?.replace(/\D/g, '') || '6281234567890'}?text=${encodeURIComponent(`Halo Admin FinanceTrack, saya ingin mengaktifkan langganan ${checkoutPlan.name} (${billingCycle === 'monthly' ? 'Bulanan' : 'Tahunan'}) seharga ${formatRupiah(checkoutPlan.price)}.`)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full py-2.5 sm:py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs sm:text-sm text-white flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 text-center"
                            >
                                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.173.086.275.072.376-.044.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.203c.043.072.043.419-.101.824z"/></svg>
                                <span>Konfirmasi & Bayar via WhatsApp</span>
                            </a>
                            <button
                                type="button"
                                onClick={() => setCheckoutPlan(null)}
                                className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all text-center"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
