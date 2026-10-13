import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, Link, usePage } from '@inertiajs/react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const monthNames = [
    '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const CATEGORY_COLORS = [
    '#009bd2', // Brand Cyan
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#8b5cf6', // Violet
    '#f43f5e', // Rose
    '#06b6d4', // Sky
];

const ChartTooltipContent = React.memo(({ active, payload, label, currentFilter, selectedMonth, selectedYear, formatRp }) => {
    if (!active || !payload || !payload.length) return null;

    const pemasukan = payload.find(p => p.dataKey === 'pemasukan')?.value || 0;
    const pengeluaran = payload.find(p => p.dataKey === 'pengeluaran')?.value || 0;
    const tabungan = payload.find(p => p.dataKey === 'tabungan')?.value || 0;
    const net = pemasukan - pengeluaran - tabungan;

    let periodTitle = '';
    if (currentFilter === 'bulan') {
        periodTitle = `Tanggal ${label} ${monthNames[selectedMonth] || ''} ${selectedYear || ''}`;
    } else if (currentFilter === 'tahun') {
        periodTitle = `Bulan ${label} ${selectedYear || ''}`;
    } else {
        periodTitle = `Tahun ${label}`;
    }

    return (
        <div className="bg-white/95 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl shadow-xl shadow-slate-900/10 border border-slate-100 text-xs min-w-[210px] space-y-2.5">
            <div className="border-b border-slate-100 pb-1.5">
                <p className="font-black text-slate-800 text-[13px]">{periodTitle}</p>
            </div>
            <div className="space-y-1.5 font-bold">
                <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-slate-500">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                        Pemasukan:
                    </span>
                    <span className="font-black text-emerald-600">{formatRp(pemasukan)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-slate-500">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0"></span>
                        Pengeluaran:
                    </span>
                    <span className="font-black text-rose-600">{formatRp(pengeluaran)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-slate-500">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#009bd2] shrink-0"></span>
                        Tabungan:
                    </span>
                    <span className="font-black text-[#009bd2]">{formatRp(tabungan)}</span>
                </div>
            </div>
            {(pemasukan > 0 || pengeluaran > 0 || tabungan > 0) && (
                <div className="border-t border-slate-100 pt-2 flex items-center justify-between font-bold">
                    <span className="text-slate-400 text-[11px]">Arus Kas Bersih:</span>
                    <span className={`font-black ${net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {net >= 0 ? `+${formatRp(net)}` : formatRp(net)}
                    </span>
                </div>
            )}
        </div>
    );
});

export default function Dashboard({ 
    auth, 
    summary, 
    chartData = [], 
    currentFilter = 'bulan', 
    selectedMonth, 
    selectedYear,
    categoryExpenses = [],
    recentTransactions = []
}) {
    const pageUser = usePage().props.auth?.user;
    const user = auth?.user || pageUser;
    const isPro = Boolean(user?.is_pro ?? (user?.role === 'superadmin' || user?.subscription_tier === 'pro' || user?.subscription_tier === 'pro_plus'));
    const canAccessChart = Boolean(user?.permissions?.dashboard_chart ?? isPro);

    const [chartType, setChartType] = useState('area'); // 'area' | 'bar'
    const [isMobile, setIsMobile] = useState(false);
    const [showMobileChart, setShowMobileChart] = useState(false);

    // Dummy preview wave for users with locked chart and without transactions, to show an attractive teaser
    const hasActualData = chartData && chartData.some(d => (d.pemasukan || 0) > 0 || (d.pengeluaran || 0) > 0 || (d.tabungan || 0) > 0);
    const displayChartData = !canAccessChart && !hasActualData ? [
        { name: '1', pemasukan: 3200000, pengeluaran: 1800000, tabungan: 500000 },
        { name: '5', pemasukan: 2500000, pengeluaran: 1200000, tabungan: 400000 },
        { name: '10', pemasukan: 4800000, pengeluaran: 2900000, tabungan: 800000 },
        { name: '15', pemasukan: 3600000, pengeluaran: 2100000, tabungan: 600000 },
        { name: '20', pemasukan: 5100000, pengeluaran: 3400000, tabungan: 900000 },
        { name: '25', pemasukan: 4200000, pengeluaran: 2700000, tabungan: 700000 },
        { name: '30', pemasukan: 6000000, pengeluaran: 3100000, tabungan: 1200000 },
    ] : chartData;

    useEffect(() => {
        let timer;
        const checkMobile = () => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                setIsMobile(window.innerWidth < 640);
            }, 100);
        };
        setIsMobile(window.innerWidth < 640);
        window.addEventListener('resize', checkMobile);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', checkMobile);
        };
    }, []);

    const formatRp = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);

    const formatYAxis = (value) => {
        if (!value || value === 0) return '0';
        if (value >= 1000000000) return `${(value / 1000000000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} M`;
        if (value >= 1000000) return `${(value / 1000000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} Jt`;
        if (value >= 1000) return `${(value / 1000).toLocaleString('id-ID', { maximumFractionDigits: 0 })} Rb`;
        return value;
    };

    const handleFilterChange = (filter) => {
        router.get(route('dashboard'), { filter }, { preserveState: true, preserveScroll: true });
    };

    const handleMonthChange = (e) => {
        const value = e.target.value; // e.g. "2026-08"
        if (value) {
            const [year, month] = value.split('-');
            router.get(route('dashboard'), { filter: 'bulan', month: parseInt(month), year: parseInt(year) }, { preserveState: true, preserveScroll: true });
        }
    };

    const handleYearChange = (e) => {
        const year = e.target.value;
        if (year) {
            router.get(route('dashboard'), { filter: 'tahun', year: parseInt(year) }, { preserveState: true, preserveScroll: true });
        }
    };

    const handlePrevMonth = () => {
        let m = (selectedMonth || new Date().getMonth() + 1) - 1;
        let y = selectedYear || new Date().getFullYear();
        if (m < 1) {
            m = 12;
            y -= 1;
        }
        router.get(route('dashboard'), { filter: 'bulan', month: m, year: y }, { preserveState: true, preserveScroll: true });
    };

    const handleNextMonth = () => {
        let m = (selectedMonth || new Date().getMonth() + 1) + 1;
        let y = selectedYear || new Date().getFullYear();
        if (m > 12) {
            m = 1;
            y += 1;
        }
        router.get(route('dashboard'), { filter: 'bulan', month: m, year: y }, { preserveState: true, preserveScroll: true });
    };

    const handlePrevYear = () => {
        const y = (selectedYear || new Date().getFullYear()) - 1;
        router.get(route('dashboard'), { filter: 'tahun', year: y }, { preserveState: true, preserveScroll: true });
    };

    const handleNextYear = () => {
        const y = (selectedYear || new Date().getFullYear()) + 1;
        router.get(route('dashboard'), { filter: 'tahun', year: y }, { preserveState: true, preserveScroll: true });
    };

    const monthInputValue = selectedMonth && selectedYear 
        ? `${selectedYear}-${String(selectedMonth).padStart(2, '0')}` 
        : '';

    const availableYears = Array.from({length: 10}, (_, i) => new Date().getFullYear() - 5 + i);

    // Colorize categories for Donut chart and legend
    const chartCategories = (categoryExpenses || []).map((cat, idx) => ({
        ...cat,
        color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
    }));

    // Progress percentage: Saldo Bersih against Total Pemasukan
    const incomePercentage = summary?.pemasukan > 0 
        ? Math.round(((summary?.saldo || 0) / summary.pemasukan) * 100) 
        : 0;
    const clampedProgress = Math.min(100, Math.max(0, incomePercentage));

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />

            <div className="max-w-7xl mx-auto px-3.5 py-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 relative pb-20 sm:pb-8">
                
                {/* ======================================================== */}
                {/* 1. TAMPILAN KHUSUS MOBILE (SESUAI WIREFRAME & TEMA KITA) */}
                {/* ======================================================== */}
                <div className="block sm:hidden space-y-4">

                    {/* Filter Atas: Bulan, Tahun, Semua Waktu */}
                    <div className="space-y-2">
                        <div className="flex bg-slate-100 p-1 rounded-2xl w-full">
                            <button
                                type="button"
                                onClick={() => handleFilterChange('bulan')}
                                className={`flex-1 py-2 text-xs font-black rounded-xl transition-all duration-200 ${
                                    currentFilter === 'bulan'
                                        ? 'bg-white text-[#009bd2] shadow-[0_2px_8px_rgba(0,0,0,0.06)]'
                                        : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                Bulan
                            </button>
                            <button
                                type="button"
                                onClick={() => handleFilterChange('tahun')}
                                className={`flex-1 py-2 text-xs font-black rounded-xl transition-all duration-200 ${
                                    currentFilter === 'tahun'
                                        ? 'bg-white text-[#009bd2] shadow-[0_2px_8px_rgba(0,0,0,0.06)]'
                                        : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                Tahun
                            </button>
                            <button
                                type="button"
                                onClick={() => handleFilterChange('semua')}
                                className={`flex-1 py-2 text-xs font-black rounded-xl transition-all duration-200 ${
                                    currentFilter === 'semua'
                                        ? 'bg-white text-[#009bd2] shadow-[0_2px_8px_rgba(0,0,0,0.06)]'
                                        : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                Semua Waktu
                            </button>
                        </div>

                        {/* Picker sub-navigation saat filter Bulan / Tahun aktif */}
                        {currentFilter === 'bulan' && (
                            <div className="flex items-center justify-between bg-white border border-slate-200/90 rounded-2xl p-1.5 shadow-2xs">
                                <button
                                    type="button"
                                    onClick={handlePrevMonth}
                                    className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition active:scale-95 shrink-0"
                                    aria-label="Bulan sebelumnya"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/></svg>
                                </button>
                                <div className="relative flex-1 text-center px-2 flex items-center justify-center gap-1.5 cursor-pointer">
                                    <svg className="w-4 h-4 text-[#009bd2] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                                    <span className="text-xs font-black text-slate-800 tracking-tight">
                                        {monthNames[selectedMonth] || 'Bulan'} {selectedYear || new Date().getFullYear()}
                                    </span>
                                    <input
                                        type="month"
                                        value={monthInputValue}
                                        onChange={handleMonthChange}
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                        title="Pilih Bulan & Tahun"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleNextMonth}
                                    className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition active:scale-95 shrink-0"
                                    aria-label="Bulan berikutnya"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/></svg>
                                </button>
                            </div>
                        )}

                        {currentFilter === 'tahun' && (
                            <div className="flex items-center justify-between bg-white border border-slate-200/90 rounded-2xl p-1.5 shadow-2xs">
                                <button
                                    type="button"
                                    onClick={handlePrevYear}
                                    className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition active:scale-95 shrink-0"
                                    aria-label="Tahun sebelumnya"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/></svg>
                                </button>
                                <div className="relative flex-1 text-center px-2 flex items-center justify-center gap-1.5 cursor-pointer">
                                    <svg className="w-4 h-4 text-[#009bd2] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                                    <span className="text-xs font-black text-slate-800 tracking-tight">
                                        Tahun {selectedYear || new Date().getFullYear()}
                                    </span>
                                    <select
                                        value={selectedYear || new Date().getFullYear()}
                                        onChange={handleYearChange}
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                    >
                                        {availableYears.map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleNextYear}
                                    className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition active:scale-95 shrink-0"
                                    aria-label="Tahun berikutnya"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/></svg>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Top Card: Saldo Bersih, Progress Bar, Uang Masuk & Uang Keluar */}
                    <div className="bg-white rounded-[2rem] p-5 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] space-y-3.5">
                        <div>
                            <p className="text-xs font-extrabold text-slate-700 tracking-tight">Saldo Bersih</p>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight mt-1 truncate" title={formatRp(summary?.saldo || 0)}>
                                {formatRp(summary?.saldo || 0)}
                            </h2>
                        </div>

                        {/* Progress Bar */}
                        <div>
                            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-[#009bd2] to-[#00b4d8] rounded-full transition-all duration-500"
                                    style={{ width: `${clampedProgress}%` }}
                                />
                            </div>
                            <p className="text-[11px] font-bold text-slate-500 mt-1.5">
                                {summary?.saldo < 0 ? 'Defisit Anggaran' : `${incomePercentage}% dari Penghasilan`}
                            </p>
                        </div>

                        {/* Two Sub-Cards: Uang Masuk & Uang Keluar */}
                        <div className="grid grid-cols-2 gap-3 pt-1">
                            {/* Uang Masuk */}
                            <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex flex-col justify-between min-h-[92px]">
                                <div className="flex items-center justify-between gap-1">
                                    <span className="text-xs font-black text-slate-800">Uang Masuk</span>
                                    <span className="w-5 h-5 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>
                                    </span>
                                </div>
                                <div className="mt-2">
                                    <span className="text-sm font-black text-emerald-600 tracking-tight truncate block" title={formatRp(summary?.pemasukan || 0)}>
                                        {formatRp(summary?.pemasukan || 0)}
                                    </span>
                                </div>
                            </div>

                            {/* Uang Keluar */}
                            <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex flex-col justify-between min-h-[92px]">
                                <div className="flex items-center justify-between gap-1">
                                    <span className="text-xs font-black text-slate-800">Uang Keluar</span>
                                    <span className="w-5 h-5 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>
                                    </span>
                                </div>
                                <div className="mt-2">
                                    <span className="text-sm font-black text-rose-600 tracking-tight truncate block" title={formatRp(summary?.pengeluaran || 0)}>
                                        {formatRp(summary?.pengeluaran || 0)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Kategori Pengeluaran */}
                    <div>
                        <h3 className="text-base font-black text-slate-800 tracking-tight mb-2.5">
                            Kategori Pengeluaran
                        </h3>
                        <div className="bg-white rounded-[2rem] p-4 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
                            {chartCategories.length > 0 ? (
                                <div className="flex items-center gap-3">
                                    {/* Donut Chart */}
                                    <div className="w-[120px] h-[120px] shrink-0 relative flex items-center justify-center">
                                        <PieChart width={120} height={120}>
                                            <Pie
                                                data={chartCategories}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={32}
                                                outerRadius={52}
                                                paddingAngle={3}
                                                dataKey="amount"
                                                stroke="none"
                                            >
                                                {chartCategories.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </div>

                                    {/* Legend List */}
                                    <div className="flex-1 min-w-0 space-y-1.5">
                                        {chartCategories.map((cat, idx) => (
                                            <div key={idx} className="flex items-center justify-between text-xs gap-1.5">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: cat.color }} />
                                                    <span className="font-bold text-slate-700 truncate text-[11px]">
                                                        {cat.name}:
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0 font-extrabold text-[11px] text-slate-500">
                                                    <span className="text-slate-800">{cat.count}</span>
                                                    <span className="text-slate-400 font-bold">({cat.percentage}%)</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="py-6 text-center space-y-1">
                                    <div className="w-12 h-12 rounded-full border-4 border-slate-100 mx-auto flex items-center justify-center">
                                        <span className="text-slate-300 text-xs font-black">0%</span>
                                    </div>
                                    <p className="text-xs font-bold text-slate-400 pt-1">Belum ada pengeluaran di periode ini.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Section 3: Riwayat Terbaru */}
                    <div>
                        <div className="flex items-center justify-between mb-2.5">
                            <h3 className="text-base font-black text-slate-800 tracking-tight">
                                Riwayat Terbaru :
                            </h3>
                            <Link
                                href={route('transaksi.index')}
                                className="text-xs font-extrabold text-[#009bd2] hover:underline"
                            >
                                Lihat Semua
                            </Link>
                        </div>

                        {recentTransactions && recentTransactions.length > 0 ? (
                            <div className="space-y-2.5">
                                {recentTransactions.map((trx) => {
                                    const isPengeluaran = trx.type === 'pengeluaran';
                                    const isPemasukan = trx.type === 'pemasukan';

                                    return (
                                        <div
                                            key={trx.id}
                                            className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-2xs flex items-center justify-between gap-3 hover:border-slate-300 transition"
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                {/* Round Icon */}
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                                    isPengeluaran
                                                        ? 'bg-rose-50 text-rose-500'
                                                        : isPemasukan
                                                            ? 'bg-emerald-50 text-emerald-500'
                                                            : 'bg-[#009bd2]/10 text-[#009bd2]'
                                                }`}>
                                                    {isPengeluaran ? (
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                                                    ) : isPemasukan ? (
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                                                    ) : (
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                                                    )}
                                                </div>

                                                {/* Details */}
                                                <div className="min-w-0">
                                                    <h4 className="font-extrabold text-slate-800 text-xs truncate">
                                                        {trx.title}
                                                    </h4>
                                                    <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                                        <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[9.5px] font-bold">
                                                            {trx.category}
                                                        </span>
                                                        <span className="px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600 border border-blue-100/60 text-[9.5px] font-bold">
                                                            {trx.payment_method}
                                                        </span>
                                                        <span className="text-[9.5px] font-medium text-slate-400">
                                                            {trx.date_formatted}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Amount */}
                                            <div className="text-right shrink-0">
                                                <span className={`font-black text-xs sm:text-sm tracking-tight ${
                                                    isPengeluaran
                                                        ? 'text-rose-500'
                                                        : isPemasukan
                                                            ? 'text-emerald-600'
                                                            : 'text-[#009bd2]'
                                                }`}>
                                                    {isPengeluaran ? `-${formatRp(trx.amount)}` : isPemasukan ? `+${formatRp(trx.amount)}` : formatRp(trx.amount)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl p-6 border border-dashed border-slate-200 text-center space-y-2">
                                <p className="text-xs font-bold text-slate-400">Belum ada transaksi di periode ini.</p>
                                <Link href={route('transaksi.index')} className="inline-flex items-center gap-1 text-xs font-black text-[#009bd2]">
                                    Tambah Transaksi →
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Tombol Opsi Tampilkan Grafik Arus Kas di Mobile */}
                    <div className="pt-1">
                        <button
                            type="button"
                            onClick={() => setShowMobileChart(!showMobileChart)}
                            className="w-full flex items-center justify-between p-3.5 bg-white rounded-2xl border border-slate-100 shadow-2xs text-xs font-extrabold text-slate-700 hover:bg-slate-50 transition"
                        >
                            <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#009bd2]"></span>
                                <span>Lihat Grafik Arus Kas {!canAccessChart && '(PRO)'}</span>
                            </span>
                            <svg
                                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${showMobileChart ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {showMobileChart && (
                            <div className="mt-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-black text-slate-800">Grafik Arus Kas</span>
                                    <div className="bg-slate-100 p-0.5 rounded-lg flex items-center text-[10px] font-bold">
                                        <button
                                            type="button"
                                            onClick={() => setChartType('area')}
                                            className={`px-2 py-1 rounded-md transition ${chartType === 'area' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}
                                        >
                                            Area
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setChartType('bar')}
                                            className={`px-2 py-1 rounded-md transition ${chartType === 'bar' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}
                                        >
                                            Batang
                                        </button>
                                    </div>
                                </div>
                                <div className="h-[220px] w-full relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        {chartType === 'area' ? (
                                            <AreaChart data={displayChartData} margin={{ top: 8, right: 4, left: -10, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis dataKey="name" axisLine={{ stroke: '#f1f5f9' }} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9 }} dy={4} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9 }} tickFormatter={formatYAxis} width={40} />
                                                <Tooltip content={<ChartTooltipContent currentFilter={currentFilter} selectedMonth={selectedMonth} selectedYear={selectedYear} formatRp={formatRp} />} />
                                                <Area type="monotone" dataKey="pemasukan" name="Pemasukan" stroke="#10b981" strokeWidth={2} fill="#10b981" fillOpacity={0.15} />
                                                <Area type="monotone" dataKey="pengeluaran" name="Pengeluaran" stroke="#f43f5e" strokeWidth={2} fill="#f43f5e" fillOpacity={0.15} />
                                                <Area type="monotone" dataKey="tabungan" name="Tabungan" stroke="#009bd2" strokeWidth={2} fill="#009bd2" fillOpacity={0.15} />
                                            </AreaChart>
                                        ) : (
                                            <BarChart data={displayChartData} margin={{ top: 8, right: 4, left: -10, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis dataKey="name" axisLine={{ stroke: '#f1f5f9' }} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9 }} dy={4} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9 }} tickFormatter={formatYAxis} width={40} />
                                                <Tooltip content={<ChartTooltipContent currentFilter={currentFilter} selectedMonth={selectedMonth} selectedYear={selectedYear} formatRp={formatRp} />} />
                                                <Bar dataKey="pemasukan" name="Pemasukan" fill="#10b981" radius={[3, 3, 0, 0]} />
                                                <Bar dataKey="pengeluaran" name="Pengeluaran" fill="#f43f5e" radius={[3, 3, 0, 0]} />
                                                <Bar dataKey="tabungan" name="Tabungan" fill="#009bd2" radius={[3, 3, 0, 0]} />
                                            </BarChart>
                                        )}
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ======================================================== */}
                {/* 2. TAMPILAN DESKTOP (KOMPREHENSIF)                       */}
                {/* ======================================================== */}
                <div className="hidden sm:block space-y-6">
                    {/* Desktop Header & Filter */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4 border-b border-slate-100 pb-3 sm:pb-4">
                        <div>
                            <p className="text-[11px] sm:text-xs font-bold text-[#009bd2] uppercase tracking-wider mb-0.5 sm:mb-1">Overview</p>
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
                                Dashboard Keuangan
                            </h1>
                            <p className="text-slate-500 font-medium text-xs sm:text-sm mt-0.5 sm:mt-1">Ringkasan kondisi keuangan Anda.</p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 w-full md:w-auto items-stretch sm:items-center">
                            {currentFilter === 'bulan' && (
                                <div className="flex items-center justify-between bg-white border border-slate-200/90 rounded-xl px-3 py-2 shadow-xs">
                                    <label className="text-xs font-bold text-slate-500 mr-2 shrink-0">Bulan:</label>
                                    <input 
                                        type="month" 
                                        value={monthInputValue}
                                        onChange={handleMonthChange}
                                        className="border-none bg-transparent text-xs sm:text-sm font-bold text-slate-800 focus:ring-0 p-0 cursor-pointer pr-1"
                                    />
                                </div>
                            )}
                            {currentFilter === 'tahun' && (
                                <div className="flex items-center justify-between bg-white border border-slate-200/90 rounded-xl px-3 py-2 shadow-xs">
                                    <label className="text-xs font-bold text-slate-500 mr-2 shrink-0">Tahun:</label>
                                    <select 
                                        value={selectedYear || new Date().getFullYear()}
                                        onChange={handleYearChange}
                                        className="border-none bg-transparent text-xs sm:text-sm font-bold text-slate-800 focus:ring-0 p-0 cursor-pointer pr-5"
                                    >
                                        {availableYears.map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div className="flex bg-slate-100/90 p-1 rounded-xl w-full sm:w-auto gap-1">
                                <button 
                                    onClick={() => handleFilterChange('bulan')}
                                    className={`flex-1 sm:flex-none text-center px-3 sm:px-4 py-2 rounded-lg font-extrabold text-xs sm:text-sm transition-all duration-300 ${currentFilter === 'bulan' ? 'bg-white text-[#009bd2] shadow-[0_2px_8px_rgba(0,0,0,0.06)]' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Bulanan
                                </button>
                                <button 
                                    onClick={() => handleFilterChange('tahun')}
                                    className={`flex-1 sm:flex-none text-center px-3 sm:px-4 py-2 rounded-lg font-extrabold text-xs sm:text-sm transition-all duration-300 ${currentFilter === 'tahun' ? 'bg-white text-[#009bd2] shadow-[0_2px_8px_rgba(0,0,0,0.06)]' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Tahunan
                                </button>
                                <button 
                                    onClick={() => handleFilterChange('semua')}
                                    className={`flex-1 sm:flex-none text-center px-3 sm:px-4 py-2 rounded-lg font-extrabold text-xs sm:text-sm transition-all duration-300 ${currentFilter === 'semua' ? 'bg-white text-[#009bd2] shadow-[0_2px_8px_rgba(0,0,0,0.06)]' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Semua
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
                        {/* Pemasukan */}
                        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-100 flex flex-col justify-between group hover:shadow-[0_8px_30px_rgb(16,185,129,0.08)] transition-all">
                            <div className="flex items-center justify-between mb-2.5 sm:mb-4">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>
                                </div>
                                <span className="text-[10px] sm:text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full">Pemasukan</span>
                            </div>
                            <div>
                                <p className="text-slate-400 font-bold text-xs sm:text-sm mb-0.5 sm:mb-1">Total Pemasukan</p>
                                <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-800 tracking-tight truncate" title={formatRp(summary?.pemasukan || 0)}>{formatRp(summary?.pemasukan || 0)}</h3>
                            </div>
                        </div>

                        {/* Pengeluaran */}
                        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-100 flex flex-col justify-between group hover:shadow-[0_8px_30px_rgb(244,63,94,0.08)] transition-all">
                            <div className="flex items-center justify-between mb-2.5 sm:mb-4">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>
                                </div>
                                <span className="text-[10px] sm:text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full">Pengeluaran</span>
                            </div>
                            <div>
                                <p className="text-slate-400 font-bold text-xs sm:text-sm mb-0.5 sm:mb-1">Total Pengeluaran</p>
                                <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-800 tracking-tight truncate" title={formatRp(summary?.pengeluaran || 0)}>{formatRp(summary?.pengeluaran || 0)}</h3>
                            </div>
                        </div>

                        {/* Tabungan */}
                        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-100 flex flex-col justify-between group hover:shadow-[0_8px_30px_rgb(0,155,210,0.08)] transition-all">
                            <div className="flex items-center justify-between mb-2.5 sm:mb-4">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#009bd2]/10 text-[#009bd2] flex items-center justify-center shrink-0">
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                                </div>
                                <span className="text-[10px] sm:text-xs font-bold text-[#009bd2] bg-[#009bd2]/10 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full">Tabungan</span>
                            </div>
                            <div>
                                <p className="text-slate-400 font-bold text-xs sm:text-sm mb-0.5 sm:mb-1">Total Tabungan</p>
                                <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-800 tracking-tight truncate" title={formatRp(summary?.tabungan || 0)}>{formatRp(summary?.tabungan || 0)}</h3>
                            </div>
                        </div>
                    </div>

                    {/* Saldo Akhir Banner */}
                    <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 md:p-8 shadow-xl sm:shadow-2xl relative overflow-hidden">
                        <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
                        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-[#009bd2]/20 rounded-full blur-3xl pointer-events-none"></div>
                        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                            <div>
                                <p className="text-slate-400 font-bold text-[11px] sm:text-xs md:text-sm uppercase tracking-wider mb-1 sm:mb-2">Estimasi Saldo Tersisa</p>
                                <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight truncate" title={formatRp(summary?.saldo || 0)}>{formatRp(summary?.saldo || 0)}</h2>
                            </div>
                            <div className="hidden sm:flex items-center gap-2 self-start sm:self-center bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                <span className="text-xs font-bold text-white/90">Saldo Aktif</span>
                            </div>
                        </div>
                    </div>

                    {/* Grafik Arus Kas */}
                    <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-100">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
                            <div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#009bd2]"></div>
                                    <h3 className="text-base sm:text-lg font-extrabold text-slate-800">Grafik Arus Kas</h3>
                                    {!canAccessChart && (
                                        <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-200/80 shadow-2xs">
                                            PRO
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs font-medium text-slate-400 mt-0.5">
                                    Perbandingan pemasukan, pengeluaran, dan tabungan secara berkala.
                                </p>
                            </div>

                            {/* Chart View Toggle & Indicator */}
                            <div className="flex items-center gap-2 self-start sm:self-center">
                                <div className="bg-slate-100/80 p-1 rounded-xl flex items-center shadow-inner">
                                    <button
                                        onClick={() => setChartType('area')}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all duration-200 ${
                                            chartType === 'area'
                                                ? 'bg-white text-slate-900 shadow-xs'
                                                : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                    >
                                        <svg className="w-3.5 h-3.5 text-[#009bd2]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                                        <span>Area</span>
                                    </button>
                                    <button
                                        onClick={() => setChartType('bar')}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all duration-200 ${
                                            chartType === 'bar'
                                                ? 'bg-white text-slate-900 shadow-xs'
                                                : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                    >
                                        <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                        <span>Batang</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        {displayChartData.length > 0 ? (
                            <div className="relative overflow-hidden rounded-xl sm:rounded-2xl">
                                {/* Chart Canvas */}
                                <div className={`h-[280px] sm:h-[350px] md:h-[400px] w-full transition-all duration-500 ${
                                    !canAccessChart ? 'filter blur-[5px] sm:blur-[7px] opacity-40 select-none pointer-events-none' : ''
                                }`}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        {chartType === 'area' ? (
                                            <AreaChart
                                                data={displayChartData}
                                                margin={{ top: 16, right: 16, left: 5, bottom: 4 }}
                                            >
                                                <defs>
                                                    <linearGradient id="gradientPemasukan" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.35}/>
                                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                                                    </linearGradient>
                                                    <linearGradient id="gradientPengeluaran" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35}/>
                                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0}/>
                                                    </linearGradient>
                                                    <linearGradient id="gradientTabungan" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#009bd2" stopOpacity={0.35}/>
                                                        <stop offset="95%" stopColor="#009bd2" stopOpacity={0.0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis 
                                                    dataKey="name" 
                                                    axisLine={{ stroke: '#f1f5f9' }} 
                                                    tickLine={false} 
                                                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                                                    dy={8}
                                                    interval={currentFilter === 'bulan' ? 2 : 0}
                                                    tickFormatter={(val) => currentFilter === 'bulan' ? `Tgl ${val}` : val}
                                                />
                                                <YAxis 
                                                    axisLine={false} 
                                                    tickLine={false} 
                                                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                                    tickFormatter={formatYAxis}
                                                    width={58}
                                                />
                                                <Tooltip content={<ChartTooltipContent currentFilter={currentFilter} selectedMonth={selectedMonth} selectedYear={selectedYear} formatRp={formatRp} />} />
                                                <Legend 
                                                    iconType="circle"
                                                    wrapperStyle={{ paddingTop: '16px', fontSize: '12px', fontWeight: 700 }}
                                                />
                                                <Area 
                                                    type="monotone" 
                                                    dataKey="pemasukan" 
                                                    name="Pemasukan" 
                                                    stroke="#10b981" 
                                                    strokeWidth={2.5} 
                                                    fillOpacity={1} 
                                                    fill="url(#gradientPemasukan)" 
                                                    activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2, fill: '#10b981' }}
                                                />
                                                <Area 
                                                    type="monotone" 
                                                    dataKey="pengeluaran" 
                                                    name="Pengeluaran" 
                                                    stroke="#f43f5e" 
                                                    strokeWidth={2.5} 
                                                    fillOpacity={1} 
                                                    fill="url(#gradientPengeluaran)" 
                                                    activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2, fill: '#f43f5e' }}
                                                />
                                                <Area 
                                                    type="monotone" 
                                                    dataKey="tabungan" 
                                                    name="Tabungan" 
                                                    stroke="#009bd2" 
                                                    strokeWidth={2.5} 
                                                    fillOpacity={1} 
                                                    fill="url(#gradientTabungan)" 
                                                    activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2, fill: '#009bd2' }}
                                                />
                                            </AreaChart>
                                        ) : (
                                            <BarChart
                                                data={displayChartData}
                                                margin={{ top: 16, right: 16, left: 5, bottom: 4 }}
                                                barGap={2}
                                                barCategoryGap={displayChartData.length > 20 ? '15%' : '25%'}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis 
                                                    dataKey="name" 
                                                    axisLine={{ stroke: '#f1f5f9' }} 
                                                    tickLine={false} 
                                                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                                                    dy={8}
                                                    interval={currentFilter === 'bulan' ? 2 : 0}
                                                    tickFormatter={(val) => currentFilter === 'bulan' ? `Tgl ${val}` : val}
                                                />
                                                <YAxis 
                                                    axisLine={false} 
                                                    tickLine={false} 
                                                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                                    tickFormatter={formatYAxis}
                                                    width={58}
                                                />
                                                <Tooltip content={<ChartTooltipContent currentFilter={currentFilter} selectedMonth={selectedMonth} selectedYear={selectedYear} formatRp={formatRp} />} />
                                                <Legend 
                                                    iconType="circle"
                                                    wrapperStyle={{ paddingTop: '16px', fontSize: '12px', fontWeight: 700 }}
                                                />
                                                <Bar dataKey="pemasukan" name="Pemasukan" fill="#10b981" radius={[5, 5, 0, 0]} maxBarSize={displayChartData.length > 20 ? 12 : 28} />
                                                <Bar dataKey="pengeluaran" name="Pengeluaran" fill="#f43f5e" radius={[5, 5, 0, 0]} maxBarSize={displayChartData.length > 20 ? 12 : 28} />
                                                <Bar dataKey="tabungan" name="Tabungan" fill="#009bd2" radius={[5, 5, 0, 0]} maxBarSize={displayChartData.length > 20 ? 12 : 28} />
                                            </BarChart>
                                        )}
                                    </ResponsiveContainer>
                                </div>

                                {/* Glassmorphism Lock Overlay for Non-Pro Users */}
                                {!canAccessChart && (
                                    <div className="absolute inset-0 z-20 flex items-center justify-center p-3 sm:p-6 bg-slate-900/5 backdrop-blur-[1px]">
                                        <div className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-6 max-w-sm sm:max-w-md w-full text-center border border-slate-100 shadow-xl shadow-slate-900/10 space-y-2.5 sm:space-y-3.5 animate-scale-up">
                                            <div>
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 shadow-2xs text-[10px] sm:text-xs font-black uppercase tracking-wider">
                                                    <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                                                    </svg>
                                                    <span>Fitur Eksklusif Pro</span>
                                                </span>
                                            </div>

                                            <div className="space-y-1">
                                                <h4 className="text-sm sm:text-lg font-black text-slate-900 tracking-tight">
                                                    Grafik Arus Kas Terkunci
                                                </h4>
                                                <p className="text-[11px] sm:text-xs text-slate-500 font-medium leading-relaxed max-w-xs mx-auto">
                                                    Pantau tren perbandingan arus kas pemasukan, pengeluaran & tabungan Anda secara visual dan interaktif.
                                                </p>
                                            </div>

                                            <div className="pt-0.5">
                                                <Link
                                                    href={route('berlangganan.index')}
                                                    className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 sm:py-3 px-4 sm:px-5 rounded-xl sm:rounded-2xl text-white font-extrabold text-xs sm:text-sm bg-gradient-to-r from-[#009bd2] to-[#0081af] hover:from-[#008bc0] hover:to-[#007099] shadow-md shadow-[#009bd2]/25 active:scale-98 transition-all"
                                                >
                                                    <svg className="w-4 h-4 text-amber-300 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 2a1 1 0 01.894.553l2.991 5.982 6.602.96a1 1 0 01.554 1.705l-4.777 4.656 1.127 6.575a1 1 0 01-1.451 1.054L10 16.347l-5.94 3.138a1 1 0 01-1.451-1.054l1.127-6.575-4.777-4.656a1 1 0 01.554-1.705l6.602-.96 2.991-5.982A1 1 0 0110 2z" clipRule="evenodd" />
                                                    </svg>
                                                    <span>Buka Akses dengan Paket Pro</span>
                                                </Link>
                                            </div>

                                            <p className="text-[9.5px] sm:text-[10px] font-semibold text-slate-400">
                                                Mulai dari <strong className="text-slate-600">Rp 14.999/bln</strong> • Buka semua modul & grafik
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="h-[220px] sm:h-[340px] flex items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl sm:rounded-[2rem] p-6 text-center">
                                <p className="text-slate-400 font-bold text-xs sm:text-sm">Tidak ada data transaksi untuk ditampilkan.</p>
                            </div>
                        )}
                    </div>

                    {/* Desktop Dua Kolom: Kategori Pengeluaran & Riwayat Terbaru */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-start">
                        {/* Kategori Pengeluaran */}
                        <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <div>
                                    <h3 className="text-base font-black text-slate-800">Kategori Pengeluaran</h3>
                                    <p className="text-xs text-slate-400 font-medium">Distribusi pos pengeluaran terbesar</p>
                                </div>
                                <span className="text-xs font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full">
                                    {formatRp(summary?.pengeluaran || 0)}
                                </span>
                            </div>

                            {chartCategories.length > 0 ? (
                                <div className="flex items-center gap-4">
                                    <div className="w-[140px] h-[140px] shrink-0 relative flex items-center justify-center">
                                        <PieChart width={140} height={140}>
                                            <Pie
                                                data={chartCategories}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={38}
                                                outerRadius={62}
                                                paddingAngle={3}
                                                dataKey="amount"
                                                stroke="none"
                                            >
                                                {chartCategories.map((entry, index) => (
                                                    <Cell key={`desktop-cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-2">
                                        {chartCategories.map((cat, idx) => (
                                            <div key={idx} className="flex items-center justify-between text-xs gap-2">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: cat.color }} />
                                                    <span className="font-bold text-slate-700 truncate">{cat.name}:</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 shrink-0 font-extrabold text-slate-500">
                                                    <span className="text-slate-800">{cat.count}</span>
                                                    <span className="text-slate-400 font-bold">({cat.percentage}%)</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="py-8 text-center text-xs font-bold text-slate-400">
                                    Belum ada pengeluaran di periode ini.
                                </div>
                            )}
                        </div>

                        {/* Riwayat Transaksi Terbaru */}
                        <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <div>
                                    <h3 className="text-base font-black text-slate-800">Riwayat Terbaru :</h3>
                                    <p className="text-xs text-slate-400 font-medium">Transaksi terkini Anda</p>
                                </div>
                                <Link
                                    href={route('transaksi.index')}
                                    className="text-xs font-black text-[#009bd2] hover:underline"
                                >
                                    Lihat Semua
                                </Link>
                            </div>

                            {recentTransactions && recentTransactions.length > 0 ? (
                                <div className="space-y-2.5">
                                    {recentTransactions.map((trx) => {
                                        const isPengeluaran = trx.type === 'pengeluaran';
                                        const isPemasukan = trx.type === 'pemasukan';

                                        return (
                                            <div
                                                key={trx.id}
                                                className="bg-white rounded-2xl p-3 border border-slate-100 shadow-2xs flex items-center justify-between gap-3 hover:border-slate-200 transition"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                                        isPengeluaran
                                                            ? 'bg-rose-50 text-rose-500'
                                                            : isPemasukan
                                                                ? 'bg-emerald-50 text-emerald-500'
                                                                : 'bg-[#009bd2]/10 text-[#009bd2]'
                                                    }`}>
                                                        {isPengeluaran ? (
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                                                        ) : isPemasukan ? (
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                                                        ) : (
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="font-extrabold text-slate-800 text-xs sm:text-sm truncate">
                                                            {trx.title}
                                                        </h4>
                                                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                                                                {trx.category}
                                                            </span>
                                                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 border border-blue-100/60 text-[10px] font-bold">
                                                                {trx.payment_method}
                                                            </span>
                                                            <span className="text-[10px] font-medium text-slate-400">
                                                                {trx.date_formatted}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <span className={`font-black text-xs sm:text-sm tracking-tight ${
                                                        isPengeluaran
                                                            ? 'text-rose-500'
                                                            : isPemasukan
                                                                ? 'text-emerald-600'
                                                                : 'text-[#009bd2]'
                                                    }`}>
                                                        {isPengeluaran ? `-${formatRp(trx.amount)}` : isPemasukan ? `+${formatRp(trx.amount)}` : formatRp(trx.amount)}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="py-8 text-center text-xs font-bold text-slate-400">
                                    Belum ada transaksi di periode ini.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </AuthenticatedLayout>
    );
}
