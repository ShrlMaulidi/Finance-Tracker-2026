import React, { useState } from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import UserAvatar from '@/Components/UserAvatar';

export default function Settings({ systemInfo, pricingSettings, tierRules }) {
    const { auth } = usePage().props;
    const user = auth?.user || {};

    const [activeTierTab, setActiveTierTab] = useState('free');
    const [resettingTier, setResettingTier] = useState(false);

    const defaultTierConfig = {
        free: {
            target_limit: 1,
            bill_limit: 2,
            category_limit: 15,
            payment_method_limit: 5,
            access_budget: false,
            access_report: false,
            access_report_export: false,
            access_ai_agent: false,
            access_dashboard_chart: false,
        },
        pro: {
            target_limit: -1,
            bill_limit: -1,
            category_limit: -1,
            payment_method_limit: -1,
            access_budget: true,
            access_report: true,
            access_report_export: true,
            access_ai_agent: false,
            access_dashboard_chart: true,
        },
        pro_plus: {
            target_limit: -1,
            bill_limit: -1,
            category_limit: -1,
            payment_method_limit: -1,
            access_budget: true,
            access_report: true,
            access_report_export: true,
            access_ai_agent: true,
            access_dashboard_chart: true,
        },
    };

    const { data, setData, post, processing, errors } = useForm({
        pro_monthly_price: pricingSettings?.pro_monthly_price ?? 14999,
        pro_yearly_price: pricingSettings?.pro_yearly_price ?? 149000,
        pro_plus_monthly_price: pricingSettings?.pro_plus_monthly_price ?? 29999,
        pro_plus_yearly_price: pricingSettings?.pro_plus_yearly_price ?? 299000,
        allow_registration: pricingSettings?.allow_registration ?? true,
        maintenance_mode: pricingSettings?.maintenance_mode ?? false,
        support_email: pricingSettings?.support_email ?? 'support@financetrack.com',
        support_wa: pricingSettings?.support_wa ?? '6281234567890',
        tier_rules: {
            free: { ...defaultTierConfig.free, ...(tierRules?.free || {}) },
            pro: { ...defaultTierConfig.pro, ...(tierRules?.pro || {}) },
            pro_plus: { ...defaultTierConfig.pro_plus, ...(tierRules?.pro_plus || {}) },
        },
    });

    const handleTierLimitChange = (tier, field, value) => {
        const intVal = value === '' ? -1 : parseInt(value, 10);
        setData('tier_rules', {
            ...data.tier_rules,
            [tier]: {
                ...data.tier_rules[tier],
                [field]: isNaN(intVal) ? -1 : intVal,
            },
        });
    };

    const handleTierAccessToggle = (tier, field) => {
        setData('tier_rules', {
            ...data.tier_rules,
            [tier]: {
                ...data.tier_rules[tier],
                [field]: !data.tier_rules[tier][field],
            },
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('admin.settings.update'), {
            preserveScroll: true,
        });
    };

    const handleResetDefaults = () => {
        if (confirm('Apakah Anda yakin ingin mereset seluruh batasan dan hak akses ke setelan default awal?')) {
            setResettingTier(true);
            router.post(route('admin.settings.reset-tier-rules'), {}, {
                preserveScroll: true,
                onFinish: () => setResettingTier(false),
            });
        }
    };

    return (
        <AdminLayout title="Pengaturan Super Admin">
            <Head title="Pengaturan - Super Admin" />

            <div className="space-y-4 sm:space-y-6 lg:space-y-8 max-w-7xl mx-auto">
                
                {/* HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-800 tracking-tight leading-tight">
                            Pengaturan & Konfigurasi Sistem
                        </h1>
                        <p className="text-slate-500 font-medium text-xs sm:text-sm mt-0.5">
                            Kelola matriks hak akses paket, batas data, tarif langganan, dan diagnostik server
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                        
                        {/* MAIN COLUMN (2 COLS) */}
                        <div className="lg:col-span-2 space-y-6">
                            
                            {/* 1. TIER RULES & ACCESS CONTROL CARD */}
                            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] space-y-5">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                                        </div>
                                        <div>
                                            <h2 className="text-base sm:text-lg font-black text-slate-800">Matriks Hak Akses & Batasan Paket</h2>
                                            <p className="text-[11px] sm:text-xs text-slate-500 font-medium">Atur kuota data dan kontrol menu terkunci secara dinamis tanpa sentuh kode</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleResetDefaults}
                                        disabled={resettingTier}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-bold transition-all self-start sm:self-center"
                                        title="Kembalikan semua aturan ke rekomendasi default"
                                    >
                                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                                        <span>Reset ke Default</span>
                                    </button>
                                </div>

                                {/* TIER SELECTOR TABS */}
                                <div className="grid grid-cols-3 gap-1.5 sm:gap-2 p-1.5 bg-slate-100/80 rounded-2xl">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTierTab('free')}
                                        className={`py-2 px-2.5 sm:px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                                            activeTierTab === 'free'
                                                ? 'bg-white text-slate-900 shadow-sm'
                                                : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                    >
                                        <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                                        <span>Gratis</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTierTab('pro')}
                                        className={`py-2 px-2.5 sm:px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                                            activeTierTab === 'pro'
                                                ? 'bg-white text-[#009bd2] shadow-sm'
                                                : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                    >
                                        <span className="w-2 h-2 rounded-full bg-[#009bd2]"></span>
                                        <span>Paket Pro</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTierTab('pro_plus')}
                                        className={`py-2 px-2.5 sm:px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                                            activeTierTab === 'pro_plus'
                                                ? 'bg-white text-purple-700 shadow-sm'
                                                : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                    >
                                        <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                                        <span>Pro Plus</span>
                                    </button>
                                </div>

                                {/* ACTIVE TIER CONFIGURATION PANEL */}
                                {['free', 'pro', 'pro_plus'].map((tierKey) => {
                                    if (activeTierTab !== tierKey) return null;
                                    const currentTierRules = data.tier_rules[tierKey] || {};
                                    const tierBadge = {
                                        free: { label: 'Akun Standar Gratis', bg: 'bg-slate-100 text-slate-700 border-slate-200' },
                                        pro: { label: 'Paket Pro (Modul Penuh & Ekspor)', bg: 'bg-blue-50 text-[#009bd2] border-blue-200' },
                                        pro_plus: { label: 'Paket Pro Plus (Lengkap + AI WhatsApp Bot)', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
                                    }[tierKey];

                                    return (
                                        <div key={tierKey} className="space-y-5 animate-fade-in">
                                            
                                            {/* Tier Info Card */}
                                            <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-100">
                                                <div>
                                                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider border ${tierBadge.bg}`}>
                                                        {tierBadge.label}
                                                    </span>
                                                    <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-1">
                                                        Ketik <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-700 font-mono">-1</code> pada batas data untuk menjadikannya <strong>Unlimited (Tanpa Batas)</strong>.
                                                    </p>
                                                </div>
                                            </div>

                                            {/* 1. LIMIT DATA INPUTS */}
                                            <div>
                                                <h4 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                                                    <span>Batasan Jumlah Data (Data Quotas)</span>
                                                </h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                                    
                                                    {/* Target Limit */}
                                                    <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white border border-slate-200 space-y-1.5">
                                                        <div className="flex items-center justify-between">
                                                            <label className="text-[11px] sm:text-xs font-bold text-slate-700">Maksimal Tabungan & Target</label>
                                                            <span className="text-[10px] font-bold text-slate-400">{currentTierRules.target_limit < 0 ? 'Unlimited' : `${currentTierRules.target_limit} data`}</span>
                                                        </div>
                                                        <input
                                                            type="number"
                                                            value={currentTierRules.target_limit ?? -1}
                                                            onChange={(e) => handleTierLimitChange(tierKey, 'target_limit', e.target.value)}
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-[#009bd2]"
                                                        />
                                                    </div>

                                                    {/* Bill Limit */}
                                                    <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white border border-slate-200 space-y-1.5">
                                                        <div className="flex items-center justify-between">
                                                            <label className="text-[11px] sm:text-xs font-bold text-slate-700">Maksimal Tagihan Rutin</label>
                                                            <span className="text-[10px] font-bold text-slate-400">{currentTierRules.bill_limit < 0 ? 'Unlimited' : `${currentTierRules.bill_limit} data`}</span>
                                                        </div>
                                                        <input
                                                            type="number"
                                                            value={currentTierRules.bill_limit ?? -1}
                                                            onChange={(e) => handleTierLimitChange(tierKey, 'bill_limit', e.target.value)}
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-[#009bd2]"
                                                        />
                                                    </div>

                                                    {/* Category Limit */}
                                                    <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white border border-slate-200 space-y-1.5">
                                                        <div className="flex items-center justify-between">
                                                            <label className="text-[11px] sm:text-xs font-bold text-slate-700">Maksimal Kelola Kategori</label>
                                                            <span className="text-[10px] font-bold text-slate-400">{currentTierRules.category_limit < 0 ? 'Unlimited' : `${currentTierRules.category_limit} data`}</span>
                                                        </div>
                                                        <input
                                                            type="number"
                                                            value={currentTierRules.category_limit ?? -1}
                                                            onChange={(e) => handleTierLimitChange(tierKey, 'category_limit', e.target.value)}
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-[#009bd2]"
                                                        />
                                                    </div>

                                                    {/* Payment Method Limit */}
                                                    <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white border border-slate-200 space-y-1.5">
                                                        <div className="flex items-center justify-between">
                                                            <label className="text-[11px] sm:text-xs font-bold text-slate-700">Maksimal Kelola Metode Bayar</label>
                                                            <span className="text-[10px] font-bold text-slate-400">{currentTierRules.payment_method_limit < 0 ? 'Unlimited' : `${currentTierRules.payment_method_limit} data`}</span>
                                                        </div>
                                                        <input
                                                            type="number"
                                                            value={currentTierRules.payment_method_limit ?? -1}
                                                            onChange={(e) => handleTierLimitChange(tierKey, 'payment_method_limit', e.target.value)}
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-[#009bd2]"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 2. FEATURE PERMISSION TOGGLES */}
                                            <div className="pt-2">
                                                <h4 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
                                                    <span>Hak Akses Fitur & Menu Platform</span>
                                                </h4>

                                                <div className="space-y-2.5">
                                                    
                                                    {/* Toggle: Menu Anggaran */}
                                                    <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white flex items-center justify-between gap-3">
                                                        <div>
                                                            <p className="text-xs sm:text-sm font-bold text-slate-800">Modul Anggaran Keuangan</p>
                                                            <p className="text-[10.5px] sm:text-xs text-slate-500 font-medium">Buka akses anggaran tabungan, hutang, dan batas belanja bulanan</p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            role="switch"
                                                            aria-checked={Boolean(currentTierRules.access_budget)}
                                                            onClick={() => handleTierAccessToggle(tierKey, 'access_budget')}
                                                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                                                                currentTierRules.access_budget ? 'bg-emerald-500' : 'bg-slate-200'
                                                            }`}
                                                        >
                                                            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ${currentTierRules.access_budget ? 'translate-x-5' : 'translate-x-0'}`} />
                                                        </button>
                                                    </div>

                                                    {/* Toggle: Menu Laporan */}
                                                    <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white flex items-center justify-between gap-3">
                                                        <div>
                                                            <p className="text-xs sm:text-sm font-bold text-slate-800">Modul Laporan Keuangan</p>
                                                            <p className="text-[10.5px] sm:text-xs text-slate-500 font-medium">Akses analisis arus kas, neraca aset vs liabilitas & saldo riil</p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            role="switch"
                                                            aria-checked={Boolean(currentTierRules.access_report)}
                                                            onClick={() => handleTierAccessToggle(tierKey, 'access_report')}
                                                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                                                                currentTierRules.access_report ? 'bg-emerald-500' : 'bg-slate-200'
                                                            }`}
                                                        >
                                                            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ${currentTierRules.access_report ? 'translate-x-5' : 'translate-x-0'}`} />
                                                        </button>
                                                    </div>

                                                    {/* Toggle: Ekspor PDF & Excel */}
                                                    <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white flex items-center justify-between gap-3">
                                                        <div>
                                                            <p className="text-xs sm:text-sm font-bold text-slate-800">Ekspor Laporan (PDF & Excel)</p>
                                                            <p className="text-[10.5px] sm:text-xs text-slate-500 font-medium">Izin unduh dokumen cetak PDF dan spreadsheet Excel</p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            role="switch"
                                                            aria-checked={Boolean(currentTierRules.access_report_export)}
                                                            onClick={() => handleTierAccessToggle(tierKey, 'access_report_export')}
                                                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                                                                currentTierRules.access_report_export ? 'bg-emerald-500' : 'bg-slate-200'
                                                            }`}
                                                        >
                                                            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ${currentTierRules.access_report_export ? 'translate-x-5' : 'translate-x-0'}`} />
                                                        </button>
                                                    </div>

                                                    {/* Toggle: Grafik Arus Kas Dashboard */}
                                                    <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white flex items-center justify-between gap-3">
                                                        <div>
                                                            <p className="text-xs sm:text-sm font-bold text-slate-800">Grafik Arus Kas Dashboard (Visual)</p>
                                                            <p className="text-[10.5px] sm:text-xs text-slate-500 font-medium">Jika dinonaktifkan, grafik di Dashboard akan terkunci dan diblur sebagai teaser</p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            role="switch"
                                                            aria-checked={Boolean(currentTierRules.access_dashboard_chart)}
                                                            onClick={() => handleTierAccessToggle(tierKey, 'access_dashboard_chart')}
                                                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                                                                currentTierRules.access_dashboard_chart ? 'bg-emerald-500' : 'bg-slate-200'
                                                            }`}
                                                        >
                                                            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ${currentTierRules.access_dashboard_chart ? 'translate-x-5' : 'translate-x-0'}`} />
                                                        </button>
                                                    </div>

                                                    {/* Toggle: Integrasi AI Agent WhatsApp */}
                                                    <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white flex items-center justify-between gap-3">
                                                        <div>
                                                            <p className="text-xs sm:text-sm font-bold text-slate-800">Integrasi Agent AI (WhatsApp & OCR)</p>
                                                            <p className="text-[10.5px] sm:text-xs text-slate-500 font-medium">Akses bot WhatsApp otomatis dan fitur OCR foto nota belanja</p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            role="switch"
                                                            aria-checked={Boolean(currentTierRules.access_ai_agent)}
                                                            onClick={() => handleTierAccessToggle(tierKey, 'access_ai_agent')}
                                                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                                                                currentTierRules.access_ai_agent ? 'bg-purple-600' : 'bg-slate-200'
                                                            }`}
                                                        >
                                                            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ${currentTierRules.access_ai_agent ? 'translate-x-5' : 'translate-x-0'}`} />
                                                        </button>
                                                    </div>

                                                </div>
                                            </div>

                                        </div>
                                    );
                                })}
                            </div>

                            {/* 2. PRICING CARD */}
                            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] space-y-4 sm:space-y-6">
                                <div className="flex items-center gap-3 pb-3 sm:pb-4 border-b border-slate-100">
                                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#009bd2] flex items-center justify-center shrink-0">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </div>
                                    <div>
                                        <h2 className="text-base sm:text-lg font-black text-slate-800">Tarif Paket Berlangganan</h2>
                                        <p className="text-[11px] sm:text-xs text-slate-500 font-medium">Sesuaikan harga paket yang ditampilkan pada menu Berlangganan</p>
                                    </div>
                                </div>

                                {/* PACKAGE: PRO */}
                                <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-blue-50/40 border border-blue-100 space-y-3 sm:space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs sm:text-sm font-black text-[#009bd2] flex items-center gap-1.5 sm:gap-2">
                                            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                            Paket Pro
                                        </span>
                                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-400">IDR</span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                        <div>
                                            <label className="text-[11px] sm:text-xs font-bold text-slate-600 block mb-1">Harga Bulanan (Rp)</label>
                                            <input
                                                type="number"
                                                value={data.pro_monthly_price}
                                                onChange={(e) => setData('pro_monthly_price', e.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#009bd2] font-semibold shadow-xs"
                                            />
                                            {errors.pro_monthly_price && <p className="text-rose-500 text-xs mt-1">{errors.pro_monthly_price}</p>}
                                        </div>
                                        <div>
                                            <label className="text-[11px] sm:text-xs font-bold text-slate-600 block mb-1">Harga Tahunan (Rp)</label>
                                            <input
                                                type="number"
                                                value={data.pro_yearly_price}
                                                onChange={(e) => setData('pro_yearly_price', e.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#009bd2] font-semibold shadow-xs"
                                            />
                                            {errors.pro_yearly_price && <p className="text-rose-500 text-xs mt-1">{errors.pro_yearly_price}</p>}
                                        </div>
                                    </div>
                                </div>

                                {/* PACKAGE: PRO PLUS */}
                                <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-purple-50/40 border border-purple-100 space-y-3 sm:space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs sm:text-sm font-black text-purple-700 flex items-center gap-1.5 sm:gap-2">
                                            <svg className="w-4 h-4 text-amber-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                            Paket Pro Plus (AI WhatsApp Bot)
                                        </span>
                                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-400">IDR</span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                        <div>
                                            <label className="text-[11px] sm:text-xs font-bold text-slate-600 block mb-1">Harga Bulanan (Rp)</label>
                                            <input
                                                type="number"
                                                value={data.pro_plus_monthly_price}
                                                onChange={(e) => setData('pro_plus_monthly_price', e.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-purple-500 font-semibold shadow-xs"
                                            />
                                            {errors.pro_plus_monthly_price && <p className="text-rose-500 text-xs mt-1">{errors.pro_plus_monthly_price}</p>}
                                        </div>
                                        <div>
                                            <label className="text-[11px] sm:text-xs font-bold text-slate-600 block mb-1">Harga Tahunan (Rp)</label>
                                            <input
                                                type="number"
                                                value={data.pro_plus_yearly_price}
                                                onChange={(e) => setData('pro_plus_yearly_price', e.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-purple-500 font-semibold shadow-xs"
                                            />
                                            {errors.pro_plus_yearly_price && <p className="text-rose-500 text-xs mt-1">{errors.pro_plus_yearly_price}</p>}
                                        </div>
                                    </div>
                                </div>

                                {/* CONTACT SUPPORT INFO */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-1 sm:pt-2">
                                    <div>
                                        <label className="text-[11px] sm:text-xs font-bold text-slate-600 block mb-1">Email Layanan Bantuan</label>
                                        <input
                                            type="email"
                                            value={data.support_email}
                                            onChange={(e) => setData('support_email', e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#009bd2] shadow-xs"
                                        />
                                        {errors.support_email && <p className="text-rose-500 text-xs mt-1">{errors.support_email}</p>}
                                    </div>
                                    <div>
                                        <label className="text-[11px] sm:text-xs font-bold text-slate-600 block mb-1">WhatsApp CS Resmi</label>
                                        <input
                                            type="text"
                                            value={data.support_wa}
                                            onChange={(e) => setData('support_wa', e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#009bd2] shadow-xs"
                                        />
                                        {errors.support_wa && <p className="text-rose-500 text-xs mt-1">{errors.support_wa}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* 3. ACCESS & SYSTEM CONTROL */}
                            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] space-y-4">
                                <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100 flex-wrap gap-2.5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                        </div>
                                        <div>
                                            <h2 className="text-base sm:text-lg font-black text-slate-800">Kontrol Akses Platform</h2>
                                            <p className="text-[11px] sm:text-xs text-slate-500 font-medium">Atur pendaftaran publik dan mode pemeliharaan</p>
                                        </div>
                                    </div>

                                    {data.maintenance_mode ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
                                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                            Mode Pemeliharaan Aktif
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                            Platform Online & Siap
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-3 sm:space-y-4">
                                    {/* TOGGLE: ALLOW REGISTRATION */}
                                    <div className={`p-4 sm:p-5 rounded-xl sm:rounded-2xl border transition-all ${
                                        data.allow_registration 
                                            ? 'bg-slate-50/70 border-slate-200/80' 
                                            : 'bg-rose-50/40 border-rose-200'
                                    }`}>
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="space-y-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="text-xs sm:text-sm font-bold text-slate-800">Buka Pendaftaran Akun Baru</p>
                                                    {data.allow_registration ? (
                                                        <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100 shrink-0">
                                                            Terbuka
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                                                            Ditutup
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[11px] sm:text-xs text-slate-500 font-medium leading-relaxed">
                                                    Jika dinonaktifkan, tombol registrasi dan form pendaftaran di <code>/register</code> akan dialihkan.
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                role="switch"
                                                aria-checked={data.allow_registration}
                                                onClick={() => setData('allow_registration', !data.allow_registration)}
                                                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                    data.allow_registration ? 'bg-[#009bd2]' : 'bg-slate-200'
                                                }`}
                                            >
                                                <span
                                                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                                        data.allow_registration ? 'translate-x-5' : 'translate-x-0'
                                                    }`}
                                                />
                                            </button>
                                        </div>
                                    </div>

                                    {/* TOGGLE: MAINTENANCE MODE */}
                                    <div className={`p-4 sm:p-5 rounded-xl sm:rounded-2xl border transition-all ${
                                        data.maintenance_mode 
                                            ? 'bg-amber-50/50 border-amber-200 shadow-xs' 
                                            : 'bg-slate-50/70 border-slate-200/80'
                                    }`}>
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="space-y-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="text-xs sm:text-sm font-bold text-slate-800">Mode Pemeliharaan (Maintenance)</p>
                                                    {data.maintenance_mode ? (
                                                        <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200 animate-pulse shrink-0">
                                                            Aktif
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                                                            Nonaktif
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[11px] sm:text-xs text-slate-500 font-medium leading-relaxed">
                                                    Pengguna biasa dan publik akan melihat layar Maintenance (HTTP 503). Super Admin tetap memiliki akses penuh.
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                role="switch"
                                                aria-checked={data.maintenance_mode}
                                                onClick={() => setData('maintenance_mode', !data.maintenance_mode)}
                                                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                    data.maintenance_mode ? 'bg-amber-500' : 'bg-slate-200'
                                                }`}
                                            >
                                                <span
                                                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                                        data.maintenance_mode ? 'translate-x-5' : 'translate-x-0'
                                                    }`}
                                                />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* SUBMIT BUTTON */}
                            <div className="flex justify-end pt-1">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full sm:w-auto px-7 py-3.5 rounded-xl sm:rounded-2xl bg-[#009bd2] hover:bg-[#0089ba] font-black text-xs sm:text-sm text-white shadow-md shadow-[#009bd2]/25 transition-all transform active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                    <span>{processing ? 'Menyimpan Pengaturan...' : 'Simpan Seluruh Pengaturan'}</span>
                                </button>
                            </div>
                        </div>

                        {/* SIDEBAR COLUMN (1 COL) */}
                        <div className="space-y-4 sm:space-y-6">
                            
                            {/* SUPER ADMIN PROFILE CARD */}
                            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] space-y-3 sm:space-y-4">
                                <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-100">
                                    Akun Super Admin Aktif
                                </h3>

                                <div className="flex items-center gap-3">
                                    <UserAvatar user={user} size="lg" className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl shrink-0" rounded="rounded-2xl" />
                                    <div className="min-w-0">
                                        <p className="font-bold text-slate-800 text-xs sm:text-sm truncate">{user.name}</p>
                                        <p className="text-[10px] sm:text-xs text-slate-400 font-medium truncate">{user.email}</p>
                                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-[#009bd2] border border-blue-100">
                                            Role: Super Admin
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* SYSTEM DIAGNOSTICS CARD */}
                            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] space-y-3 sm:space-y-4">
                                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                    <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
                                        Diagnostik Server
                                    </h3>
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                        Online
                                    </span>
                                </div>

                                <div className="space-y-2 text-[11px] sm:text-xs">
                                    <div className="flex items-center justify-between p-2 sm:p-2.5 rounded-xl bg-slate-50 border border-slate-100/60">
                                        <span className="text-slate-500 font-medium">Framework</span>
                                        <span className="font-bold text-slate-800">Laravel {systemInfo.laravel_version}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-2 sm:p-2.5 rounded-xl bg-slate-50 border border-slate-100/60">
                                        <span className="text-slate-500 font-medium">PHP Version</span>
                                        <span className="font-bold text-slate-800">v{systemInfo.php_version}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-2 sm:p-2.5 rounded-xl bg-slate-50 border border-slate-100/60">
                                        <span className="text-slate-500 font-medium">Database</span>
                                        <span className="font-bold text-emerald-700 truncate max-w-[150px] text-right">
                                            {systemInfo.db_connection.toUpperCase()} ({systemInfo.db_version})
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between p-2 sm:p-2.5 rounded-xl bg-slate-50 border border-slate-100/60">
                                        <span className="text-slate-500 font-medium">Koneksi DB</span>
                                        <span className="font-bold text-emerald-700">
                                            {systemInfo.db_connected ? '✓ Terhubung' : '✕ Terputus'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between p-2 sm:p-2.5 rounded-xl bg-slate-50 border border-slate-100/60">
                                        <span className="text-slate-500 font-medium">Sistem Operasi</span>
                                        <span className="font-bold text-slate-800 truncate max-w-[140px] text-right">{systemInfo.server_os}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-2 sm:p-2.5 rounded-xl bg-slate-50 border border-slate-100/60">
                                        <span className="text-slate-500 font-medium">Zona Waktu</span>
                                        <span className="font-bold text-slate-800 truncate max-w-[140px] text-right">{systemInfo.timezone}</span>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </form>

            </div>
        </AdminLayout>
    );
}
