import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import UserAvatar from '@/Components/UserAvatar';

export default function Dashboard({ metrics, tierDistribution, monthsTrend, recentUsers, pricing }) {
    const proMonthly = Number(pricing?.pro_monthly_price ?? 14999);
    const proPlusMonthly = Number(pricing?.pro_plus_monthly_price ?? 29999);

    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(number || 0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const getTierBadge = (tier) => {
        switch (tier) {
            case 'pro_plus':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200/80">
                        <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        Pro Plus (AI)
                    </span>
                );
            case 'pro':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#009bd2] border border-blue-200/80">
                        <svg className="w-3.5 h-3.5 text-[#009bd2]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                        Paket Pro
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        Gratis
                    </span>
                );
        }
    };

    // Calculate maximum trend count for chart scale
    const maxCount = Math.max(...monthsTrend.map(m => m.count), 5);

    return (
        <AdminLayout title="Dashboard Super Admin">
            <Head title="Super Admin Dashboard" />

            <div className="space-y-4 sm:space-y-6 lg:space-y-8 max-w-7xl mx-auto">
                
                {/* WELCOME BANNER - LIGHT MINIMALIST */}
                <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 p-4 sm:p-7 lg:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.03)] relative overflow-hidden">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
                        <div className="space-y-1.5 sm:space-y-2">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-blue-50 border border-blue-100 text-[#009bd2] text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                                <span>⚡</span> Overview Pusat Kendali
                            </div>
                            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-800 tracking-tight leading-tight">
                                Ringkasan Pengguna & Langganan
                            </h1>
                            <p className="text-slate-500 font-medium text-xs sm:text-sm max-w-2xl leading-relaxed">
                                Pantau pertumbuhan pengguna aktif, distribusi paket langganan (Gratis, Pro, Pro Plus), serta kelola status akun secara terpusat.
                            </p>

                            {/* Access Control Status Pills */}
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1 sm:pt-2">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold border ${
                                    pricing?.allow_registration !== false
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                                        : 'bg-rose-50 border-rose-200 text-rose-700'
                                }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${pricing?.allow_registration !== false ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                    Pendaftaran: {pricing?.allow_registration !== false ? 'Terbuka' : 'Ditutup'}
                                </span>

                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold border ${
                                    pricing?.maintenance_mode 
                                        ? 'bg-amber-50 border-amber-200 text-amber-800 animate-pulse' 
                                        : 'bg-slate-100 border-slate-200 text-slate-700'
                                }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${pricing?.maintenance_mode ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                                    Pemeliharaan: {pricing?.maintenance_mode ? 'Aktif' : 'Normal'}
                                </span>

                                <Link
                                    href={route('admin.settings.index')}
                                    className="text-[11px] sm:text-xs font-bold text-[#009bd2] hover:underline ml-1"
                                >
                                    Ubah Akses &rarr;
                                </Link>
                            </div>
                        </div>

                        {/* Banner Action Buttons - Mobile 2-columns grid, desktop flex */}
                        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-3 w-full sm:w-auto pt-2 sm:pt-0 shrink-0">
                            <Link
                                href={route('admin.settings.index')}
                                className="px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm border border-slate-200 shadow-xs transition-all flex items-center justify-center gap-1.5 text-center"
                            >
                                <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                <span>Kontrol Akses</span>
                            </Link>

                            <Link
                                href={route('admin.users.index')}
                                className="px-3 py-2.5 sm:px-5 sm:py-3 rounded-xl bg-[#009bd2] hover:bg-[#0089ba] text-white font-bold text-xs sm:text-sm shadow-sm transition-all transform active:scale-95 flex items-center justify-center gap-1.5 text-center truncate"
                            >
                                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                <span className="truncate">Kelola Pengguna ({metrics.total_users})</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* KPI METRIC CARDS - 2 COLUMNS ON MOBILE, 4 ON DESKTOP */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-6">
                    
                    {/* CARD 1: TOTAL USERS */}
                    <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 lg:p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col justify-between hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-2 sm:mb-4">
                            <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-blue-50 text-[#009bd2] flex items-center justify-center shrink-0">
                                <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                            </div>
                            <span className="text-[9px] sm:text-[11px] font-bold text-[#009bd2] bg-blue-50 px-1.5 sm:px-2.5 py-0.5 rounded-full">Total Akun</span>
                        </div>
                        <div>
                            <p className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-800 tracking-tight">{metrics.total_users}</p>
                            <p className="text-[10px] sm:text-xs font-semibold text-slate-400 mt-0.5 sm:mt-1 truncate">Akun terdaftar</p>
                        </div>
                    </div>

                    {/* CARD 2: ACTIVE USERS */}
                    <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 lg:p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col justify-between hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-2 sm:mb-4">
                            <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <span className="text-[9px] sm:text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 sm:px-2.5 py-0.5 rounded-full">Aktif</span>
                        </div>
                        <div>
                            <p className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-800 tracking-tight">{metrics.active_users}</p>
                            <p className="text-[10px] sm:text-xs font-semibold text-slate-400 mt-0.5 sm:mt-1 truncate">Dapat beraktivitas</p>
                        </div>
                    </div>

                    {/* CARD 3: SUSPENDED USERS */}
                    <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 lg:p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col justify-between hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-2 sm:mb-4">
                            <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                                <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                            </div>
                            <span className="text-[9px] sm:text-[11px] font-bold text-rose-700 bg-rose-50 px-1.5 sm:px-2.5 py-0.5 rounded-full">Suspend</span>
                        </div>
                        <div>
                            <p className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-800 tracking-tight">{metrics.suspended_users}</p>
                            <p className="text-[10px] sm:text-xs font-semibold text-slate-400 mt-0.5 sm:mt-1 truncate">Akses ditangguhkan</p>
                        </div>
                    </div>

                    {/* CARD 4: ESTIMATED MRR */}
                    <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 lg:p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col justify-between hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-2 sm:mb-4">
                            <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                                <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <span className="text-[9px] sm:text-[11px] font-bold text-purple-700 bg-purple-50 px-1.5 sm:px-2.5 py-0.5 rounded-full">MRR</span>
                        </div>
                        <div>
                            <p className="text-sm sm:text-xl lg:text-2xl font-black text-slate-800 tracking-tight truncate">{formatRupiah(metrics.estimated_mrr)}</p>
                            <p className="text-[10px] sm:text-xs font-semibold text-slate-400 mt-0.5 sm:mt-1 truncate">Pendapatan bulanan</p>
                        </div>
                    </div>
                </div>

                {/* SUBSCRIPTION TIER BREAKDOWN (CARDS) */}
                <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-base sm:text-lg lg:text-xl font-black text-slate-800 tracking-tight">Distribusi Paket Berlangganan</h2>
                            <p className="text-[11px] sm:text-xs text-slate-400 font-medium">Proporsi pengguna berdasarkan tier akun aktif saat ini</p>
                        </div>
                        <Link
                            href={route('admin.settings.index')}
                            className="text-[11px] sm:text-xs font-bold text-[#009bd2] hover:underline flex items-center gap-1 shrink-0"
                        >
                            <span>Atur Tarif</span>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
                        {tierDistribution.map((item) => (
                            <div key={item.tier} className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] space-y-3 sm:space-y-4 hover:shadow-md transition-all">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs sm:text-sm font-black text-slate-800">{item.name}</span>
                                    {getTierBadge(item.tier)}
                                </div>

                                <div className="space-y-1.5 sm:space-y-2">
                                    <div className="flex items-baseline justify-between">
                                        <span className="text-xl sm:text-2xl font-black text-slate-800">{item.count} User</span>
                                        <span className="text-xs font-bold text-slate-400">{item.percentage}%</span>
                                    </div>
                                    
                                    {/* Progress Bar */}
                                    <div className="w-full bg-slate-100 rounded-full h-1.5 sm:h-2 overflow-hidden">
                                        <div 
                                            className="h-full rounded-full transition-all duration-500" 
                                            style={{ 
                                                width: `${item.percentage}%`,
                                                backgroundColor: item.tier === 'pro_plus' ? '#8b5cf6' : (item.tier === 'pro' ? '#009bd2' : '#94a3b8')
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] sm:text-xs text-slate-500 font-medium">
                                    <span>Biaya Langganan:</span>
                                    <span className="font-bold text-slate-700">
                                        {item.tier === 'free' ? 'Gratis' : (item.tier === 'pro' ? `${formatRupiah(proMonthly)}/bln` : `${formatRupiah(proPlusMonthly)}/bln`)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ANALYTICS SECTION: TREND & RECENT USERS */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                    
                    {/* CHART / TREND BAR CARD (1 COLUMN ON LARGE) */}
                    <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col justify-between">
                        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100">
                            <div>
                                <h2 className="text-base sm:text-lg font-black text-slate-800">Tren Pendaftaran</h2>
                                <p className="text-[11px] sm:text-xs text-slate-400 font-medium">6 bulan terakhir</p>
                            </div>
                            <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-blue-50 text-[#009bd2] border border-blue-100">
                                Bulanan
                            </span>
                        </div>

                        {/* Bar chart representation */}
                        <div className="pt-6 pb-2 sm:pt-8 sm:pb-4 flex items-end justify-between gap-2 sm:gap-3 h-44 sm:h-52">
                            {monthsTrend.map((item, idx) => {
                                const heightPercent = Math.max((item.count / maxCount) * 100, 15);
                                return (
                                    <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 sm:gap-2 h-full justify-end group">
                                        <div className="text-[10px] sm:text-[11px] font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {item.count}
                                        </div>
                                        <div
                                            style={{ height: `${heightPercent}%` }}
                                            className="w-full rounded-lg sm:rounded-xl bg-gradient-to-t from-[#009bd2] to-cyan-400 group-hover:from-[#0088b9] group-hover:to-cyan-300 transition-all cursor-pointer relative shadow-xs"
                                        />
                                        <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 truncate w-full text-center">
                                            {item.month}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* RECENT USERS TABLE (2 COLUMNS ON LARGE) */}
                    <div className="lg:col-span-2 bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
                        <div className="flex items-center justify-between pb-3 sm:pb-5 border-b border-slate-100">
                            <div>
                                <h2 className="text-base sm:text-lg font-black text-slate-800">Pengguna Terbaru</h2>
                                <p className="text-[11px] sm:text-xs text-slate-400 font-medium">Pendaftaran akun paling mutakhir</p>
                            </div>
                            <Link
                                href={route('admin.users.index')}
                                className="text-[11px] sm:text-xs font-bold text-[#009bd2] hover:underline transition-colors flex items-center gap-1 shrink-0"
                            >
                                <span>Lihat Semua</span>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                            </Link>
                        </div>

                        <div className="overflow-x-auto mt-2">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-extrabold text-[9px] sm:text-[10px]">
                                        <th className="py-2.5 px-2">Pengguna</th>
                                        <th className="py-2.5 px-2">Paket</th>
                                        <th className="py-2.5 px-2">Status</th>
                                        <th className="py-2.5 px-2">Terdaftar</th>
                                        <th className="py-2.5 px-2 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium">
                                    {recentUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="py-2.5 px-2">
                                                <div className="flex items-center gap-2 sm:gap-2.5">
                                                    <UserAvatar user={user} size="xs" className="w-6 h-6 sm:w-7 sm:h-7 shrink-0" />
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-slate-800 truncate max-w-[100px] sm:max-w-[180px] text-xs">{user.name}</p>
                                                        <p className="text-[10px] text-slate-400 truncate max-w-[100px] sm:max-w-[180px]">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-2.5 px-2 whitespace-nowrap">
                                                {getTierBadge(user.subscription_tier)}
                                            </td>
                                            <td className="py-2.5 px-2 whitespace-nowrap">
                                                {user.is_active ? (
                                                    <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-emerald-700">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                        Aktif
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-rose-700">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                                        Suspend
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-2.5 px-2 text-slate-500 whitespace-nowrap text-[10px] sm:text-xs">
                                                {formatDate(user.created_at)}
                                            </td>
                                            <td className="py-2.5 px-2 text-right whitespace-nowrap">
                                                <Link
                                                    href={route('admin.users.index', { search: user.email })}
                                                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] sm:text-[11px] transition-colors"
                                                >
                                                    Kelola
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div>
        </AdminLayout>
    );
}
