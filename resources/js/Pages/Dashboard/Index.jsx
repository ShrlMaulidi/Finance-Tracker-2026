import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, Link, usePage } from '@inertiajs/react';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
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

/**
 * Single-line amount that shrinks its font until it fits its column, so large
 * numbers are never cut off with an ellipsis on narrow phones.
 */
function FitAmount({ children, className = '', minFontSize = 9, ...props }) {
    const textRef = useRef(null);

    useLayoutEffect(() => {
        const element = textRef.current;
        if (!element) {
            return undefined;
        }

        const fit = () => {
            element.style.fontSize = '';
            let fontSize = parseFloat(window.getComputedStyle(element).fontSize);
            while (element.scrollWidth > element.clientWidth && fontSize > minFontSize) {
                fontSize -= 0.5;
                element.style.fontSize = `${fontSize}px`;
            }
        };

        fit();
        // Figtree loads after first paint and is wider than the fallback font: measure again once it's ready
        document.fonts?.ready.then(fit);
        const observer = new ResizeObserver(fit);
        observer.observe(element.parentElement || element);
        return () => observer.disconnect();
    }, [children, minFontSize]);

    return (
        <p ref={textRef} className={`whitespace-nowrap overflow-hidden ${className}`} {...props}>
            {children}
        </p>
    );
}

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

    // Dedicated live reactive state for Dashboard
    const [liveSummary, setLiveSummary] = useState(summary);
    const [liveRecent, setLiveRecent] = useState(recentTransactions);

    useEffect(() => {
        setLiveSummary(summary);
    }, [summary]);

    useEffect(() => {
        setLiveRecent(recentTransactions);
    }, [recentTransactions]);

    const activeSummary = liveSummary || summary;
    const activeRecent = liveRecent || recentTransactions;

    // Realtime updates arrive once via the 'finance-realtime-update' window event dispatched by AuthenticatedLayout,
    // which also reloads the page props from the server afterwards.
    useEffect(() => {
        if (!user?.id || typeof window === 'undefined') {
            return;
        }

        const handleRealtimeTrx = (e) => {
            const eventData = e?.detail || e;
            const trx = eventData?.transaction;
            const action = eventData?.action || 'created';

            // 'updated' events carry no previous amount, so they are left to the server reload
            if (trx && (action === 'created' || action === 'deleted')) {
                const amount = Number(trx.amount) || 0;
                const type = trx.type; // 'pemasukan' | 'pengeluaran' | 'tabungan'

                // Instantly update summary in memory in 0ms without waiting for HTTP network roundtrip
                setLiveSummary(prev => {
                    const current = prev || { pemasukan: 0, pengeluaran: 0, tabungan: 0, saldo: 0 };
                    let pemasukan = Number(current.pemasukan) || 0;
                    let pengeluaran = Number(current.pengeluaran) || 0;
                    let tabungan = Number(current.tabungan) || 0;

                    if (action === 'deleted') {
                        if (type === 'pemasukan') pemasukan = Math.max(0, pemasukan - amount);
                        else if (type === 'pengeluaran') pengeluaran = Math.max(0, pengeluaran - amount);
                        else if (type === 'tabungan') tabungan = Math.max(0, tabungan - amount);
                    } else {
                        // created or updated
                        if (type === 'pemasukan') pemasukan += amount;
                        else if (type === 'pengeluaran') pengeluaran += amount;
                        else if (type === 'tabungan') tabungan += amount;
                    }

                    return {
                        pemasukan,
                        pengeluaran,
                        tabungan,
                        saldo: pemasukan - pengeluaran - tabungan,
                    };
                });

                // Instantly prepend new transaction to recent list
                if (action === 'created') {
                    setLiveRecent(prev => {
                        const newTrx = {
                            id: trx.id || Date.now(),
                            type: trx.type,
                            amount: Number(trx.amount),
                            category: trx.category || 'Lainnya',
                            payment_method: trx.payment_method || 'Cash',
                            title: trx.title || 'Transaksi Baru',
                            description: trx.description,
                            date: trx.date || new Date().toISOString().split('T')[0],
                            date_formatted: 'Hari ini',
                        };
                        return [newTrx, ...(prev || []).filter(item => item.id !== newTrx.id)].slice(0, 5);
                    });
                } else if (action === 'deleted') {
                    setLiveRecent(prev => (prev || []).filter(item => item.id !== trx.id));
                }
            }
        };

        window.addEventListener('finance-realtime-update', handleRealtimeTrx);

        return () => {
            window.removeEventListener('finance-realtime-update', handleRealtimeTrx);
        };
    }, [user?.id]);

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

    const STORAGE_KEY = 'financetrack_hide_nominal';
    const [hideNominal, setHideNominal] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem(STORAGE_KEY) === 'true';
        }
        return false;
    });

    useEffect(() => {
        const handleSync = (e) => {
            if (typeof e.detail === 'boolean') {
                setHideNominal(e.detail);
            } else if (typeof window !== 'undefined') {
                setHideNominal(localStorage.getItem(STORAGE_KEY) === 'true');
            }
        };
        window.addEventListener('financetrack:toggle-hide-nominal', handleSync);
        window.addEventListener('storage', handleSync);
        return () => {
            window.removeEventListener('financetrack:toggle-hide-nominal', handleSync);
            window.removeEventListener('storage', handleSync);
        };
    }, []);

    const toggleHideNominal = () => {
        setHideNominal((prev) => {
            const next = !prev;
            if (typeof window !== 'undefined') {
                localStorage.setItem(STORAGE_KEY, String(next));
                window.dispatchEvent(new CustomEvent('financetrack:toggle-hide-nominal', { detail: next }));
            }
            return next;
        });
    };

    const formatRp = (num) => {
        if (hideNominal) {
            return 'Rp ••••••';
        }
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);
    };

    const formatYAxis = (value) => {
        if (hideNominal) return '•••';
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

    const availableYears = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);

    // Compact period filter shared by mobile & desktop: "‹ Okt 2026 ›" navigator + Bulan/Tahun/Semua switcher
    const activeYear = selectedYear || new Date().getFullYear();
    const activeMonthName = monthNames[selectedMonth] || '';
    const goToPreviousPeriod = currentFilter === 'bulan' ? handlePrevMonth : handlePrevYear;
    const goToNextPeriod = currentFilter === 'bulan' ? handleNextMonth : handleNextYear;
    const periodNavButtonClass = 'w-7 h-7 sm:w-8 sm:h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition active:scale-90 shrink-0';

    const periodFilter = (
        <div className="flex items-center justify-between gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-0.5 min-w-0">
                {currentFilter !== 'semua' && (
                    <button type="button" onClick={goToPreviousPeriod} className={periodNavButtonClass} aria-label="Periode sebelumnya">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                )}

                {/* Tapping the label opens the native month / year picker */}
                <div className="relative px-1 min-w-0">
                    <span className="block text-[15px] sm:text-base font-extrabold text-slate-800 tracking-tight whitespace-nowrap">
                        {currentFilter === 'bulan' ? (
                            <>
                                <span className="sm:hidden">{activeMonthName.slice(0, 3)} {activeYear}</span>
                                <span className="hidden sm:inline">{activeMonthName} {activeYear}</span>
                            </>
                        ) : currentFilter === 'tahun' ? activeYear : 'Semua Waktu'}
                    </span>
                    {currentFilter === 'bulan' && (
                        <input
                            type="month"
                            value={monthInputValue}
                            onChange={handleMonthChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            aria-label="Pilih bulan"
                        />
                    )}
                    {currentFilter === 'tahun' && (
                        <select
                            value={activeYear}
                            onChange={handleYearChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            aria-label="Pilih tahun"
                        >
                            {availableYears.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    )}
                </div>

                {currentFilter !== 'semua' && (
                    <button type="button" onClick={goToNextPeriod} className={periodNavButtonClass} aria-label="Periode berikutnya">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                    </button>
                )}
            </div>

            <div className="flex items-center p-0.5 rounded-full bg-slate-100/90 shrink-0">
                {[
                    { key: 'bulan', label: 'Bulan' },
                    { key: 'tahun', label: 'Tahun' },
                    { key: 'semua', label: 'Semua' },
                ].map((mode) => (
                    <button
                        key={mode.key}
                        type="button"
                        onClick={() => handleFilterChange(mode.key)}
                        aria-pressed={currentFilter === mode.key}
                        className={`h-7 sm:h-8 px-2.5 sm:px-3.5 rounded-full text-[11px] sm:text-xs font-bold transition-all duration-200 ${
                            currentFilter === mode.key
                                ? 'bg-white text-slate-800 shadow-[0_1px_4px_rgba(15,23,42,0.12)]'
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        {mode.label}
                    </button>
                ))}
            </div>
        </div>
    );

    // Colorize categories for Donut chart and legend
    const chartCategories = (categoryExpenses || []).map((cat, idx) => ({
        ...cat,
        color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
    }));

    // Progress percentage: Saldo Bersih against Total Pemasukan
    const incomePercentage = activeSummary?.pemasukan > 0
        ? Math.round(((activeSummary?.saldo || 0) / activeSummary.pemasukan) * 100)
        : 0;
    const clampedProgress = Math.min(100, Math.max(0, incomePercentage));

    const eyeIcon = hideNominal ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
        </svg>
    ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
    );

    const cardClass = 'bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]';
    const chartTooltip = <Tooltip content={<ChartTooltipContent currentFilter={currentFilter} selectedMonth={selectedMonth} selectedYear={selectedYear} formatRp={formatRp} />} />;
    const xAxis = (
        <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: isMobile ? 9 : 11, fontWeight: 600 }}
            dy={6}
            interval={currentFilter === 'bulan' ? (isMobile ? 4 : 2) : 0}
        />
    );
    const yAxis = (
        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: isMobile ? 9 : 10, fontWeight: 600 }} tickFormatter={formatYAxis} width={isMobile ? 40 : 52} />
    );

    const summaryStats = [
        { label: 'Pemasukan', value: activeSummary?.pemasukan, dot: 'bg-emerald-500' },
        { label: 'Pengeluaran', value: activeSummary?.pengeluaran, dot: 'bg-rose-500' },
        { label: 'Tabungan', value: activeSummary?.tabungan, dot: 'bg-[#009bd2]' },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />

            <div className="max-w-7xl mx-auto px-3.5 py-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 pb-20 sm:pb-8">

                {/* Period filter + hide amounts */}
                <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">{periodFilter}</div>
                    <button
                        type="button"
                        onClick={toggleHideNominal}
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shrink-0 transition active:scale-90 ${hideNominal ? 'bg-amber-50 text-amber-600' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}
                        title={hideNominal ? 'Tampilkan Nominal' : 'Sembunyikan Nominal'}
                        aria-label={hideNominal ? 'Tampilkan Nominal' : 'Sembunyikan Nominal'}
                    >
                        {eyeIcon}
                    </button>
                </div>

                {/* Balance */}
                <div className={`${cardClass} p-5 sm:p-7`}>
                    <p className="text-xs sm:text-sm font-semibold text-slate-400">Saldo tersisa</p>
                    <h2 className="text-[30px] sm:text-4xl lg:text-5xl leading-tight font-extrabold text-slate-900 tracking-tight tabular-nums truncate mt-1" title={hideNominal ? undefined : formatRp(activeSummary?.saldo || 0)}>
                        {formatRp(activeSummary?.saldo || 0)}
                    </h2>

                    <div className="mt-4">
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-[#009bd2] rounded-full transition-all duration-500" style={{ width: `${clampedProgress}%` }} />
                        </div>
                        <p className="text-[11px] sm:text-xs font-medium text-slate-400 mt-2">
                            {activeSummary?.saldo < 0 ? 'Pengeluaran melebihi pemasukan' : `${incomePercentage}% dari pemasukan`}
                        </p>
                    </div>

                    <div className="grid grid-cols-3 mt-5 pt-5 border-t border-slate-100 divide-x divide-slate-100">
                        {summaryStats.map((stat) => (
                            <div key={stat.label} className="min-w-0 px-2 first:pl-0 last:pr-0 sm:px-4">
                                <p className="flex items-center gap-1.5 text-[11px] sm:text-xs font-medium text-slate-400">
                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${stat.dot}`} />
                                    <span className="truncate">{stat.label}</span>
                                </p>
                                <FitAmount
                                    className="text-sm sm:text-lg font-extrabold text-slate-900 tracking-tight tabular-nums mt-1"
                                    title={hideNominal ? undefined : formatRp(stat.value || 0)}
                                >
                                    {formatRp(stat.value || 0)}
                                </FitAmount>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 items-start">
                    {/* Cash flow chart */}
                    <div className={`${cardClass} p-4 sm:p-6 lg:col-span-2`}>
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                                <h3 className="text-sm sm:text-base font-bold text-slate-900">Arus kas</h3>
                                {!canAccessChart && (
                                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md">PRO</span>
                                )}
                            </div>
                            <div className="flex items-center p-0.5 rounded-full bg-slate-100/90 shrink-0">
                                {[{ key: 'area', label: 'Area' }, { key: 'bar', label: 'Batang' }].map((option) => (
                                    <button
                                        key={option.key}
                                        type="button"
                                        onClick={() => setChartType(option.key)}
                                        className={`h-7 px-3 rounded-full text-[11px] sm:text-xs font-bold transition ${chartType === option.key ? 'bg-white text-slate-800 shadow-[0_1px_4px_rgba(15,23,42,0.12)]' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-3 mt-2 text-[11px] font-medium text-slate-400">
                            {summaryStats.map((stat) => (
                                <span key={stat.label} className="flex items-center gap-1.5">
                                    <span className={`w-1.5 h-1.5 rounded-full ${stat.dot}`} />
                                    {stat.label}
                                </span>
                            ))}
                        </div>

                        <div className="relative mt-3">
                            <div className={`h-[220px] sm:h-[300px] w-full min-w-0 ${!canAccessChart ? 'blur-[6px] opacity-40 select-none pointer-events-none' : ''}`}>
                                {displayChartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={180}>
                                        {chartType === 'area' ? (
                                            <AreaChart data={displayChartData} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="gradientPemasukan" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                    </linearGradient>
                                                    <linearGradient id="gradientPengeluaran" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25} />
                                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                                    </linearGradient>
                                                    <linearGradient id="gradientTabungan" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#009bd2" stopOpacity={0.25} />
                                                        <stop offset="95%" stopColor="#009bd2" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                {xAxis}
                                                {yAxis}
                                                {chartTooltip}
                                                <Area type="monotone" dataKey="pemasukan" name="Pemasukan" stroke="#10b981" strokeWidth={2} fill="url(#gradientPemasukan)" activeDot={{ r: 5, stroke: '#ffffff', strokeWidth: 2, fill: '#10b981' }} />
                                                <Area type="monotone" dataKey="pengeluaran" name="Pengeluaran" stroke="#f43f5e" strokeWidth={2} fill="url(#gradientPengeluaran)" activeDot={{ r: 5, stroke: '#ffffff', strokeWidth: 2, fill: '#f43f5e' }} />
                                                <Area type="monotone" dataKey="tabungan" name="Tabungan" stroke="#009bd2" strokeWidth={2} fill="url(#gradientTabungan)" activeDot={{ r: 5, stroke: '#ffffff', strokeWidth: 2, fill: '#009bd2' }} />
                                            </AreaChart>
                                        ) : (
                                            <BarChart data={displayChartData} margin={{ top: 8, right: 4, left: -8, bottom: 0 }} barGap={2} barCategoryGap={displayChartData.length > 20 ? '15%' : '25%'}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                {xAxis}
                                                {yAxis}
                                                {chartTooltip}
                                                <Bar dataKey="pemasukan" name="Pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={displayChartData.length > 20 ? 10 : 24} />
                                                <Bar dataKey="pengeluaran" name="Pengeluaran" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={displayChartData.length > 20 ? 10 : 24} />
                                                <Bar dataKey="tabungan" name="Tabungan" fill="#009bd2" radius={[4, 4, 0, 0]} maxBarSize={displayChartData.length > 20 ? 10 : 24} />
                                            </BarChart>
                                        )}
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-xs font-medium text-slate-400">Belum ada data</div>
                                )}
                            </div>

                            {/* Locked for plans without chart access */}
                            {!canAccessChart && (
                                <div className="absolute inset-0 flex items-center justify-center p-4">
                                    <div className="bg-white rounded-3xl p-5 max-w-xs w-full text-center ring-1 ring-slate-900/5 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.25)]">
                                        <span className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                        </span>
                                        <p className="text-sm font-bold text-slate-900 mt-3">Grafik arus kas khusus Pro</p>
                                        <Link
                                            href={route('berlangganan.index')}
                                            className="mt-3 h-9 w-full rounded-full bg-[#009bd2] hover:bg-[#0086b6] text-white text-xs font-bold flex items-center justify-center transition active:scale-95"
                                        >
                                            Upgrade ke Pro
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Expense categories */}
                    <div className={`${cardClass} p-4 sm:p-6`}>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900">Pengeluaran per kategori</h3>

                        {chartCategories.length > 0 ? (
                            <div className="flex lg:flex-col items-center gap-4 mt-4">
                                <div className="w-[120px] h-[120px] shrink-0">
                                    <PieChart width={120} height={120}>
                                        <Pie data={chartCategories} cx="50%" cy="50%" innerRadius={36} outerRadius={56} paddingAngle={3} dataKey="amount" stroke="none">
                                            {chartCategories.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </div>
                                <ul className="flex-1 min-w-0 w-full space-y-2.5">
                                    {chartCategories.map((cat, index) => (
                                        <li key={`${cat.name}-${index}`} className="flex items-center justify-between gap-2 text-xs">
                                            <span className="flex items-center gap-2 min-w-0">
                                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                                                <span className="font-semibold text-slate-700 truncate">{cat.name}</span>
                                            </span>
                                            <span className="font-bold text-slate-400 tabular-nums shrink-0">{cat.percentage}%</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <p className="py-10 text-center text-xs font-medium text-slate-400">Belum ada pengeluaran</p>
                        )}
                    </div>
                </div>

                {/* Recent transactions */}
                <div className={`${cardClass} px-2 sm:px-4 py-3`}>
                    <div className="flex items-center justify-between px-2 sm:px-3 pb-1">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900">Transaksi terbaru</h3>
                        <Link href={route('transaksi.index')} className="text-xs font-bold text-[#009bd2] hover:text-[#0086b6]">
                            Lihat semua
                        </Link>
                    </div>

                    {activeRecent && activeRecent.length > 0 ? (
                        <ul className="divide-y divide-slate-100">
                            {activeRecent.map((trx) => {
                                const isPemasukan = trx.type === 'pemasukan';
                                const iconStyle = trx.type === 'pengeluaran'
                                    ? 'bg-rose-50 text-rose-500'
                                    : isPemasukan ? 'bg-emerald-50 text-emerald-600' : 'bg-sky-50 text-[#009bd2]';

                                return (
                                    <li key={trx.id} className="flex items-center gap-3 px-2 sm:px-3 py-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${iconStyle}`}>
                                            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                {trx.type === 'pengeluaran' ? (
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M12 5v14m0 0l6-6m-6 6l-6-6" />
                                                ) : isPemasukan ? (
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M12 19V5m0 0l-6 6m6-6l6 6" />
                                                ) : (
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                                )}
                                            </svg>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h4 className="text-[13px] sm:text-sm font-bold text-slate-800 leading-snug line-clamp-2 break-words">{trx.title}</h4>
                                            <p className="text-[11px] sm:text-xs font-medium text-slate-400 truncate mt-0.5">
                                                {[trx.category, trx.date_formatted].filter(Boolean).join(' · ')}
                                            </p>
                                        </div>
                                        <span className={`text-[13px] sm:text-sm font-extrabold tracking-tight tabular-nums shrink-0 ${isPemasukan ? 'text-emerald-600' : 'text-slate-800'}`}>
                                            {isPemasukan ? '+' : '-'}{formatRp(trx.amount)}
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <div className="py-10 text-center space-y-2">
                            <p className="text-xs font-medium text-slate-400">Belum ada transaksi</p>
                            <Link href={route('transaksi.index')} className="text-xs font-bold text-[#009bd2]">Catat transaksi</Link>
                        </div>
                    )}
                </div>

                {/* Privacy reassurance */}
                <p className="flex items-start sm:items-center justify-center gap-1.5 px-2 pt-1 text-center text-[11px] sm:text-xs font-medium text-slate-400">
                    <svg className="w-3.5 h-3.5 shrink-0 mt-px sm:mt-0 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    <span>Data keuangan Anda bersifat privat. Setiap transaksi yang Anda catat hanya dapat dilihat dari akun Anda sendiri, tidak oleh pengguna lain.</span>
                </p>
            </div>
        </AuthenticatedLayout>
    );
}
