import React, { useState, useMemo, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { KpiCard, TabFilter, SearchInput } from '@/Components/UI';

export default function Laporan({
    filters = {},
    periodLabel = 'Bulan Ini',
    availableYears = [],
    summary = {},
    transactions = [],
    totalTransactionsCount = 0,
}) {
    const [trxTab, setTrxTab] = useState('semua'); // 'semua' | 'pemasukan' | 'pengeluaran' | 'tabungan'
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryTab, setCategoryTab] = useState('pengeluaran'); // 'pengeluaran' | 'pemasukan'
    const [showSavingsDetail, setShowSavingsDetail] = useState(true);

    const STORAGE_KEY = 'financetrack_hide_nominal';
    const [hideNominal, setHideNominal] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem(STORAGE_KEY) === 'true';
        }
        return false;
    });

    useEffect(() => {
        const handleSync = (e) => {
            if (typeof e?.detail === 'boolean') {
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
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(num || 0);
    };

    const handleFilterChange = (type) => {
        router.get(route('laporan.index'), { filter_type: type }, { preserveState: true, preserveScroll: true });
    };

    const handleMonthChange = (e) => {
        const value = e.target.value; // e.g. "2026-10"
        if (value) {
            const [year, month] = value.split('-');
            router.get(
                route('laporan.index'),
                { filter_type: 'month', filter_month: parseInt(month, 10), filter_year: parseInt(year, 10) },
                { preserveState: true, preserveScroll: true }
            );
        }
    };

    const handleYearChange = (e) => {
        const year = e.target.value;
        if (year) {
            router.get(
                route('laporan.index'),
                { filter_type: 'year', filter_year: parseInt(year, 10) },
                { preserveState: true, preserveScroll: true }
            );
        }
    };

    const monthInputValue =
        filters.month && filters.year ? `${filters.year}-${String(filters.month).padStart(2, '0')}` : '';

    // Filtered transactions for the detail list
    const filteredTransactions = useMemo(() => {
        return transactions.filter((t) => {
            const matchType = trxTab === 'semua' || t.type === trxTab;
            const query = searchQuery.toLowerCase().trim();
            const matchSearch =
                !query ||
                t.title?.toLowerCase().includes(query) ||
                t.category?.toLowerCase().includes(query) ||
                t.payment_method?.toLowerCase().includes(query) ||
                t.description?.toLowerCase().includes(query);
            return matchType && matchSearch;
        });
    }, [transactions, trxTab, searchQuery]);

    const topCategories =
        categoryTab === 'pengeluaran'
            ? summary.top_pengeluaran_categories || []
            : summary.top_pemasukan_categories || [];

    return (
        <AuthenticatedLayout>
            <Head title="Laporan Keuangan" />

            <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 py-3 sm:py-6 space-y-3.5 sm:space-y-6">
                {/* 1. TOP HEADER & FILTER BAR */}
                <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 border border-slate-100 shadow-xs space-y-3 sm:space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                                <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-wider bg-[#009bd2]/10 text-[#009bd2]">
                                    Laporan Komprehensif
                                </span>
                                <span className="text-slate-300">•</span>
                                <span className="text-[11px] sm:text-xs font-bold text-slate-500">{periodLabel}</span>
                            </div>
                            <h1 className="text-xl sm:text-3xl font-black text-slate-800 tracking-tight">
                                Laporan Keuangan
                            </h1>
                            <p className="text-slate-500 font-medium text-[11px] sm:text-sm mt-0.5">
                                Pantau arus kas masuk-keluar, alokasi pengeluaran, tagihan, dan kekayaan bersih.
                            </p>
                        </div>

                        {/* Action & Export Buttons */}
                        <div className="flex items-center gap-1.5 sm:gap-2 self-start sm:self-center shrink-0">
                            {/* Hide / Show Nominal Eye Toggle Button */}
                            <button
                                type="button"
                                onClick={toggleHideNominal}
                                className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2.5 rounded-xl border font-extrabold text-[11px] sm:text-xs transition shadow-2xs active:scale-95 cursor-pointer ${
                                    hideNominal
                                        ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200/80'
                                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80'
                                }`}
                                title={hideNominal ? "Tampilkan Nominal" : "Sembunyikan Nominal"}
                                aria-label={hideNominal ? "Tampilkan Nominal" : "Sembunyikan Nominal"}
                            >
                                {hideNominal ? (
                                    <>
                                        <svg className="w-3.5 h-3.5 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                                        </svg>
                                        <span><span className="hidden sm:inline">Nominal </span>Disembunyikan</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-3.5 h-3.5 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        <span><span className="hidden sm:inline">Sembunyikan </span>Nominal</span>
                                    </>
                                )}
                            </button>
                            <a
                                href={route('laporan.export.pdf', {
                                    filter_type: filters.type,
                                    filter_month: filters.month,
                                    filter_year: filters.year,
                                })}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 font-extrabold text-[11px] sm:text-xs transition shadow-2xs active:scale-95"
                                title="Unduh format PDF resmi"
                            >
                                <svg className="w-3.5 h-3.5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                <span><span className="hidden sm:inline">Export </span>PDF</span>
                            </a>
                            <a
                                href={route('laporan.export.excel', {
                                    filter_type: filters.type,
                                    filter_month: filters.month,
                                    filter_year: filters.year,
                                })}
                                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 font-extrabold text-[11px] sm:text-xs transition shadow-2xs active:scale-95"
                                title="Unduh format Spreadsheet Excel"
                            >
                                <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span><span className="hidden sm:inline">Export </span>Excel</span>
                            </a>
                        </div>
                    </div>

                    {/* Filter Controls Row */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2.5 sm:pt-3 border-t border-slate-100">
                        {/* Period Type Buttons */}
                        <div className="grid grid-cols-3 sm:flex bg-slate-100 p-0.5 rounded-xl gap-0.5 text-center">
                            <button
                                onClick={() => handleFilterChange('month')}
                                className={`px-2 sm:px-4 py-1.5 rounded-lg sm:rounded-xl font-extrabold text-[11px] sm:text-xs transition ${filters.type === 'month' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                                Per Bulan
                            </button>
                            <button
                                onClick={() => handleFilterChange('year')}
                                className={`px-2 sm:px-4 py-1.5 rounded-lg sm:rounded-xl font-extrabold text-[11px] sm:text-xs transition ${filters.type === 'year' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                                Per Tahun
                            </button>
                            <button
                                onClick={() => handleFilterChange('all')}
                                className={`px-2 sm:px-4 py-1.5 rounded-lg sm:rounded-xl font-extrabold text-[11px] sm:text-xs transition ${filters.type === 'all' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                                Semua
                            </button>
                        </div>

                        {/* Date Picker Input */}
                        <div className="flex items-center gap-2">
                            {filters.type === 'month' && (
                                <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2 bg-slate-50 border border-slate-200/90 rounded-xl sm:rounded-2xl px-3 py-1.5 shadow-2xs">
                                    <div className="flex items-center gap-1.5">
                                        <svg className="w-3.5 h-3.5 text-[#009bd2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span className="text-[11px] sm:text-xs font-bold text-slate-500">Bulan:</span>
                                    </div>
                                    <input
                                        type="month"
                                        value={monthInputValue}
                                        onChange={handleMonthChange}
                                        onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                                        className="border-none bg-transparent text-xs sm:text-sm font-extrabold text-slate-800 focus:ring-0 p-0 cursor-pointer"
                                    />
                                </div>
                            )}

                            {filters.type === 'year' && (
                                <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2 bg-slate-50 border border-slate-200/90 rounded-xl sm:rounded-2xl px-3 py-1.5 shadow-2xs">
                                    <div className="flex items-center gap-1.5">
                                        <svg className="w-3.5 h-3.5 text-[#009bd2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span className="text-[11px] sm:text-xs font-bold text-slate-500">Tahun:</span>
                                    </div>
                                    <select
                                        value={filters.year || new Date().getFullYear()}
                                        onChange={handleYearChange}
                                        className="border-none bg-transparent text-xs sm:text-sm font-extrabold text-slate-800 focus:ring-0 p-0 cursor-pointer pr-6"
                                    >
                                        {availableYears.map((y) => (
                                             <option key={y} value={y}>
                                                 {y}
                                             </option>
                                         ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 2. EXECUTIVE SUMMARY CARDS (4 Cards) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                    <KpiCard
                        title="Pemasukan"
                        value={formatRp(summary.pemasukan)}
                        subtitle="Uang masuk periode ini"
                        variant="success"
                        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>}
                    />
                    <KpiCard
                        title="Pengeluaran"
                        value={formatRp(summary.pengeluaran)}
                        subtitle={`Rasio: ${summary.expense_ratio || 0}%`}
                        variant="danger"
                        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>}
                    />
                    <KpiCard
                        title={summary.is_surplus ? 'Surplus Kas' : 'Defisit Kas'}
                        value={formatRp(summary.net)}
                        subtitle={summary.is_surplus ? `Tabung: ${summary.savings_rate}%` : 'Defisit operasional'}
                        variant={summary.is_surplus ? 'primary' : 'danger'}
                        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    />
                    <KpiCard
                        title="Kekayaan Bersih"
                        value={formatRp(summary.net_worth)}
                        subtitle="Aset dikurangi hutang"
                        variant="default"
                        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>}
                    />
                </div>

                {/* 3. VISUAL HEALTH BAR: KESEIMBANGAN PEMASUKAN VS PENGELUARAN */}
                <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-100 shadow-xs space-y-2.5 sm:space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5 sm:gap-1 text-[11px] sm:text-xs">
                        <span className="font-extrabold text-slate-800">
                            Efisiensi Pengeluaran Periode Ini
                        </span>
                        <span className="text-slate-400 font-medium text-[10px] sm:text-xs">
                            Pengeluaran {formatRp(summary.pengeluaran)} dari Pemasukan {formatRp(summary.pemasukan)}
                        </span>
                    </div>

                    {/* Progress Bar Container */}
                    <div className="w-full bg-slate-100 rounded-full h-2 sm:h-3 overflow-hidden flex">
                        <div
                            style={{ width: `${Math.min(100, summary.expense_ratio || 0)}%` }}
                            className={`h-full transition-all duration-500 ${summary.expense_ratio > 90 ? 'bg-rose-500' : summary.expense_ratio > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            title={`Pengeluaran: ${summary.expense_ratio}%`}
                        />
                        {summary.is_surplus && summary.savings_rate > 0 && (
                            <div
                                style={{ width: `${Math.min(100 - (summary.expense_ratio || 0), summary.savings_rate)}%` }}
                                className="h-full bg-[#009bd2] opacity-80 transition-all duration-500"
                                title={`Surplus / Tabungan: ${summary.savings_rate}%`}
                            />
                        )}
                    </div>

                    <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-semibold text-slate-500 pt-0.5">
                        <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${summary.expense_ratio > 90 ? 'bg-rose-500' : summary.expense_ratio > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                            <span>Belanja: <strong>{summary.expense_ratio || 0}%</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#009bd2]"></span>
                            <span>Surplus / Tabungan: <strong>{Math.max(0, summary.savings_rate || 0)}%</strong></span>
                        </div>
                    </div>
                </div>

                {/* 4. DUA KOLOM DETAIL: TOP KATEGORI & (SALDO + TAGIHAN RUTIN) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-6 items-start">
                    {/* KOLOM KIRI: ALOKASI KATEGORI TERBESAR */}
                    <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 border border-slate-100 shadow-xs space-y-3 sm:space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 sm:pb-3">
                            <div>
                                <h3 className="text-sm sm:text-base font-black text-slate-800">Alokasi per Kategori</h3>
                                <p className="text-[10px] sm:text-xs text-slate-400 font-medium">Pos transaksi paling signifikan</p>
                            </div>
                            <div className="flex bg-slate-100 p-0.5 rounded-xl text-[11px] sm:text-xs font-bold">
                                <button
                                    onClick={() => setCategoryTab('pengeluaran')}
                                    className={`px-2.5 py-1 rounded-lg transition ${categoryTab === 'pengeluaran' ? 'bg-white text-rose-600 shadow-2xs' : 'text-slate-500'}`}
                                >
                                    Pengeluaran
                                </button>
                                <button
                                    onClick={() => setCategoryTab('pemasukan')}
                                    className={`px-2.5 py-1 rounded-lg transition ${categoryTab === 'pemasukan' ? 'bg-white text-emerald-600 shadow-2xs' : 'text-slate-500'}`}
                                >
                                    Pemasukan
                                </button>
                            </div>
                        </div>

                        {topCategories.length === 0 ? (
                            <div className="text-center py-6 text-slate-400 text-xs font-semibold">
                                Tidak ada data kategori untuk ditampilkan pada periode ini.
                            </div>
                        ) : (
                            <div className="space-y-2.5 sm:space-y-3.5">
                                {topCategories.map((item, idx) => (
                                    <div key={idx} className="space-y-1 sm:space-y-1.5">
                                        <div className="flex items-center justify-between text-[11px] sm:text-xs font-bold">
                                            <span className="text-slate-700 flex items-center gap-1.5 truncate">
                                                <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-slate-100 text-[9px] sm:text-[10px] font-black text-slate-500 flex items-center justify-center shrink-0">
                                                    {idx + 1}
                                                </span>
                                                <span className="truncate">{item.category}</span>
                                                <span className="text-[9.5px] sm:text-[10px] font-medium text-slate-400 shrink-0">({item.count} trx)</span>
                                            </span>
                                            <div className="text-right shrink-0 ml-2">
                                                <span className={`font-black ${categoryTab === 'pengeluaran' ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                    {formatRp(item.amount)}
                                                </span>
                                                <span className="text-slate-400 ml-1 text-[10px] sm:text-[11px] font-semibold">({item.percentage}%)</span>
                                            </div>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-1.5 sm:h-2 overflow-hidden">
                                            <div
                                                style={{ width: `${Math.min(100, item.percentage)}%` }}
                                                className={`h-full rounded-full ${categoryTab === 'pengeluaran' ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* KOLOM KANAN: SALDO PER DOMPET & TAGIHAN RUTIN */}
                    <div className="space-y-3.5 sm:space-y-5">
                        {/* Box 1: Saldo per Metode Pembayaran (Dompet / Rekening) */}
                        <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 border border-slate-100 shadow-xs space-y-3 sm:space-y-3.5">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 sm:pb-3">
                                <div>
                                    <h3 className="text-sm sm:text-base font-black text-slate-800">Saldo Dompet & Rekening</h3>
                                    <p className="text-[10px] sm:text-xs text-slate-400 font-medium">Saldo riil di setiap rekening</p>
                                </div>
                                <span className="text-[10.5px] sm:text-xs font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg">
                                    Total: {formatRp(summary.saldo_aktif)}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                                {Object.entries(summary.saldo_by_method || {}).map(([method, amount]) => (
                                    <div
                                        key={method}
                                        className="bg-slate-50/90 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-slate-100 flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg sm:rounded-xl bg-white text-slate-600 flex items-center justify-center font-bold text-xs shadow-2xs border border-slate-100">
                                                💳
                                            </div>
                                            <span className="text-[11.5px] sm:text-xs font-extrabold text-slate-700">{method}</span>
                                        </div>
                                        <span className={`text-[11.5px] sm:text-xs font-black ${amount < 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                                            {formatRp(amount)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Box 2: Ringkasan Tagihan Rutin Periode Ini */}
                        {summary.bills && summary.bills.total_count > 0 && (
                            <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-sky-100 bg-linear-to-b from-white to-sky-50/20 shadow-xs space-y-2.5 sm:space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-sky-100 text-[#009bd2] flex items-center justify-center font-bold text-xs sm:text-base">
                                            🗓️
                                        </div>
                                        <div>
                                            <h4 className="text-xs sm:text-sm font-black text-slate-800">Tagihan Rutin Periode Ini</h4>
                                            <p className="text-[10px] sm:text-[11px] text-slate-400">{summary.bills.total_count} tagihan bulanan terdaftar</p>
                                        </div>
                                    </div>
                                    <span className="text-[11.5px] sm:text-xs font-bold text-slate-600">
                                        {formatRp(summary.bills.total_amount)}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-[11px] sm:text-xs">
                                    <div className="bg-white p-2 sm:p-2.5 rounded-xl border border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-0.5">
                                        <span className="text-emerald-700 font-bold text-[10px] sm:text-xs">✓ Sudah Bayar:</span>
                                        <span className="font-black text-emerald-700">{formatRp(summary.bills.paid_amount)}</span>
                                    </div>
                                    <div className="bg-white p-2 sm:p-2.5 rounded-xl border border-amber-100 flex flex-col sm:flex-row sm:items-center justify-between gap-0.5">
                                        <span className="text-amber-700 font-bold text-[10px] sm:text-xs">⏱️ Sisa Tagihan:</span>
                                        <span className="font-black text-amber-700">{formatRp(summary.bills.unpaid_amount)}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 5. STRUKTUR SALDO & ALOKASI TABUNGAN (3 PILAR SALDO & RINCIAN POS TABUNGAN) */}
                <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 border border-slate-100 shadow-xs space-y-3.5 sm:space-y-5">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5 sm:pb-3">
                        <div>
                            <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5">
                                <span className="px-2 py-0.5 rounded-full text-[9.5px] sm:text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-600 border border-indigo-100/60">
                                    Likuiditas Kas & Tabungan
                                </span>
                                <span className="text-slate-300 hidden sm:inline">•</span>
                                <span className="text-[11px] font-bold text-slate-500 hidden sm:inline">Posisi Dana Riil</span>
                            </div>
                            <h3 className="text-sm sm:text-lg font-black text-slate-800 tracking-tight">
                                Struktur Saldo & Alokasi Tabungan
                            </h3>
                            <p className="text-[10px] sm:text-xs text-slate-400 font-medium mt-0.5 hidden sm:block">
                                Transparansi pemisahan antara uang operasional harian dan simpanan target impian.
                            </p>
                        </div>

                        {summary.rincian_tabungan && summary.rincian_tabungan.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setShowSavingsDetail(!showSavingsDetail)}
                                className="inline-flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-extrabold text-[10.5px] sm:text-xs transition border border-slate-200/90 shadow-2xs shrink-0 active:scale-95 cursor-pointer"
                            >
                                <span>{showSavingsDetail ? 'Sembunyikan' : 'Rincian Tabungan'}</span>
                                <svg
                                    className={`w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform duration-200 ${showSavingsDetail ? 'rotate-180' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                        )}
                    </div>

                    {/* 3 Pillar Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-4">
                        {/* Pilar 1: Saldo Kas Siap Pakai (Bebas) */}
                        <div className="p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-sky-50/70 border border-sky-100 flex flex-col justify-between space-y-2 sm:space-y-3 relative overflow-hidden shadow-2xs">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-[#009bd2] rounded-full blur-[40px] opacity-10 pointer-events-none"></div>
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10.5px] sm:text-xs font-bold text-sky-800 uppercase tracking-wider">
                                        Saldo Kas Siap Pakai
                                    </span>
                                    <span className="text-[9px] sm:text-[10px] font-black uppercase px-1.5 sm:px-2 py-0.5 rounded-full bg-white text-[#009bd2] border border-sky-200/80 shadow-2xs">
                                        Bebas Digunakan
                                    </span>
                                </div>
                                <div className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
                                    {formatRp(summary.saldo_bebas ?? summary.saldo_aktif)}
                                </div>
                            </div>
                            <div className="text-[10.5px] sm:text-[11.5px] text-slate-500 font-medium pt-1.5 sm:pt-2.5 border-t border-sky-100 leading-relaxed">
                                <strong>Sisa saldo aktif</strong> yang sudah dikurangi tabungan. Bebas dipakai operasional tanpa mengganggu simpanan.
                            </div>
                        </div>

                        {/* Pilar 2: Total Dana Tabungan */}
                        <div className="p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-amber-50/70 border border-amber-100 flex flex-col justify-between space-y-2 sm:space-y-3 relative overflow-hidden shadow-2xs">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500 rounded-full blur-[40px] opacity-10 pointer-events-none"></div>
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10.5px] sm:text-xs font-bold text-amber-800 uppercase tracking-wider">
                                        Total Dana Tabungan
                                    </span>
                                    <span className="text-[9px] sm:text-[10px] font-black uppercase px-1.5 sm:px-2 py-0.5 rounded-full bg-white text-amber-700 border border-amber-200/80 shadow-2xs">
                                        {summary.rincian_tabungan?.length || 0} Pos Tabungan
                                    </span>
                                </div>
                                <div className="text-lg sm:text-2xl font-black text-amber-950 tracking-tight">
                                    {formatRp(summary.total_tabungan ?? summary.tabungan)}
                                </div>
                            </div>
                            <div className="text-[10.5px] sm:text-[11.5px] text-slate-500 font-medium pt-1.5 sm:pt-2.5 border-t border-amber-100 leading-relaxed">
                                Akumulasi seluruh uang yang telah diamankan di pos tabungan & target impian Anda.
                            </div>
                        </div>

                        {/* Pilar 3: Total Saldo Gabungan (Kas + Tabungan) */}
                        <div className="p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-emerald-50/70 border border-emerald-100 flex flex-col justify-between space-y-2 sm:space-y-3 relative overflow-hidden shadow-2xs">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500 rounded-full blur-[40px] opacity-10 pointer-events-none"></div>
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10.5px] sm:text-xs font-bold text-emerald-800 uppercase tracking-wider">
                                        Total Saldo Gabungan
                                    </span>
                                    <span className="text-[9px] sm:text-[10px] font-black uppercase px-1.5 sm:px-2 py-0.5 rounded-full bg-white text-emerald-700 border border-emerald-200/80 shadow-2xs">
                                        Kas + Tabungan
                                    </span>
                                </div>
                                <div className="text-lg sm:text-2xl font-black text-emerald-950 tracking-tight">
                                    {formatRp(summary.total_saldo_gabungan)}
                                </div>
                            </div>
                            <div className="text-[10.5px] sm:text-[11.5px] text-slate-500 font-medium pt-1.5 sm:pt-2.5 border-t border-emerald-100 leading-relaxed">
                                <strong>Total seluruh dana riil</strong> yang Anda miliki saat ini (saldo kas siap pakai ditambah tabungan).
                            </div>
                        </div>
                    </div>

                    {/* Breakdown List: Rincian Pos Tabungan (Isi Tabungannya Apa Saja) */}
                    {showSavingsDetail && (
                        <div className="pt-1 sm:pt-2 animate-in fade-in duration-200">
                            <div className="bg-slate-50/80 rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-slate-100 space-y-2.5 sm:space-y-3.5">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                        <span className="text-sm sm:text-base">🎯</span>
                                        <h4 className="text-[11.5px] sm:text-sm font-black text-slate-800">
                                            Rincian Pos Tabungan & Target Impian
                                        </h4>
                                    </div>
                                    <span className="text-[10.5px] sm:text-xs font-semibold text-slate-500">
                                        Total Tersimpan: <strong className="text-slate-900">{formatRp(summary.total_tabungan ?? summary.tabungan)}</strong>
                                    </span>
                                </div>

                                {(!summary.rincian_tabungan || summary.rincian_tabungan.length === 0) ? (
                                    <div className="text-center py-5 text-slate-400 text-xs font-medium">
                                        Belum ada pos tabungan terdaftar. Buka menu <strong>Tabungan & Target</strong> untuk mulai menyisihkan impian finansial Anda.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                                        {summary.rincian_tabungan.map((item, idx) => (
                                            <div
                                                key={item.id || idx}
                                                className="bg-white p-2.5 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between space-y-2 hover:border-[#009bd2]/50 transition-colors"
                                            >
                                                <div className="flex items-start justify-between gap-1.5">
                                                    <div className="min-w-0">
                                                        <h5 className="text-[11.5px] sm:text-xs font-black text-slate-800 truncate" title={item.name}>
                                                            {item.name}
                                                        </h5>
                                                        <span className="text-[9.5px] sm:text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                                                            {item.category}
                                                        </span>
                                                    </div>
                                                    <span className={`text-[9px] sm:text-[9.5px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                                                        item.status === 'Tercapai' 
                                                            ? 'bg-emerald-100 text-emerald-700' 
                                                            : 'bg-sky-100 text-[#009bd2]'
                                                    }`}>
                                                        {item.status === 'Tercapai' ? '✓ Tercapai' : 'Berjalan'}
                                                    </span>
                                                </div>

                                                <div>
                                                    <div className="flex items-baseline justify-between text-xs mb-1">
                                                        <span className="text-[11.5px] sm:text-xs font-black text-slate-900">
                                                            {formatRp(item.current)}
                                                        </span>
                                                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-400">
                                                            dari {item.target > 0 ? formatRp(item.target) : '-'}
                                                        </span>
                                                    </div>

                                                    {/* Mini Progress Bar */}
                                                    {item.target > 0 && (
                                                        <div className="w-full bg-slate-100 rounded-full h-1 sm:h-1.5 overflow-hidden">
                                                            <div
                                                                style={{ width: `${Math.min(100, item.percentage)}%` }}
                                                                className={`h-full rounded-full transition-all duration-300 ${
                                                                    item.status === 'Tercapai' || item.percentage >= 100 
                                                                        ? 'bg-emerald-500' 
                                                                        : 'bg-[#009bd2]'
                                                                }`}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* 6. NERACA KEUANGAN (ASSETS VS LIABILITIES) */}
                <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 border border-slate-100 shadow-xs space-y-3 sm:space-y-4">
                    <div className="border-b border-slate-100 pb-2.5 sm:pb-3">
                        <h3 className="text-sm sm:text-base font-black text-slate-800">Neraca Keuangan & Kekayaan Bersih</h3>
                        <p className="text-[10px] sm:text-xs text-slate-400 font-medium">Perbandingan aset cair versus kewajiban hutang berjalan</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-4">
                        {/* Aset */}
                        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-1.5 sm:space-y-2">
                            <span className="text-[10.5px] sm:text-xs font-bold text-emerald-700 uppercase tracking-wider">Total Aset</span>
                            <div className="text-lg sm:text-2xl font-black text-emerald-800">
                                {formatRp(summary.total_assets)}
                            </div>
                            <div className="text-[10px] sm:text-[11px] text-emerald-700/80 space-y-0.5 pt-1.5 border-t border-emerald-100">
                                <div>• Saldo Kas Siap Pakai: {formatRp(summary.saldo_bebas ?? summary.saldo_aktif)}</div>
                                <div>• Dana Tabungan Tersimpan: {formatRp(summary.total_tabungan ?? summary.tabungan)}</div>
                                <div>• Piutang Aktif: {formatRp(summary.piutang)}</div>
                            </div>
                        </div>

                        {/* Liabilitas / Hutang */}
                        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-rose-50/50 border border-rose-100 space-y-1.5 sm:space-y-2">
                            <span className="text-[10.5px] sm:text-xs font-bold text-rose-700 uppercase tracking-wider">Total Liabilitas (Hutang)</span>
                            <div className="text-lg sm:text-2xl font-black text-rose-800">
                                {formatRp(summary.total_liabilities)}
                            </div>
                            <div className="text-[10px] sm:text-[11px] text-rose-700/80 space-y-0.5 pt-1.5 border-t border-rose-100">
                                <div>• Hutang Belum Lunas: {formatRp(summary.hutang)}</div>
                                <div>• Kewajiban berjalan yang harus diselesaikan</div>
                            </div>
                        </div>

                        {/* Net Worth */}
                        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-900 text-white space-y-1.5 sm:space-y-2 shadow-2xs">
                            <span className="text-[10.5px] sm:text-xs font-bold text-slate-300 uppercase tracking-wider">Kekayaan Bersih (Net Equity)</span>
                            <div className="text-lg sm:text-2xl font-black text-white">
                                {formatRp(summary.net_worth)}
                            </div>
                            <div className="text-[10px] sm:text-[11px] text-slate-300 pt-1.5 border-t border-slate-800">
                                Selisih Aset Bersih setelah dikurangi seluruh kewajiban hutang.
                            </div>
                        </div>
                    </div>
                </div>

                {/* 7. RINCIAN DAFTAR TRANSAKSI (DENGAN TABS FILTER & INSTANT SEARCH) */}
                <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 border border-slate-100 shadow-xs space-y-3.5 sm:space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3 border-b border-slate-100 pb-3">
                        <div>
                            <h3 className="text-sm sm:text-lg font-black text-slate-800 tracking-tight">
                                Rincian Transaksi Periode Ini
                            </h3>
                            <p className="text-[10px] sm:text-xs text-slate-400 font-medium mt-0.5">
                                Menampilkan {filteredTransactions.length} dari {totalTransactionsCount} total transaksi
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            {/* Search Box */}
                            <SearchInput
                                size="sm"
                                placeholder="Cari transaksi..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full sm:w-52"
                            />

                            {/* Type Tabs */}
                            <div className="w-full sm:w-auto">
                                <TabFilter
                                    tabs={[
                                        { key: 'semua', label: 'Semua', mobileLabel: 'Semua' },
                                        { key: 'pemasukan', label: 'Pemasukan', mobileLabel: 'Masuk' },
                                        { key: 'pengeluaran', label: 'Pengeluaran', mobileLabel: 'Keluar' },
                                        { key: 'tabungan', label: 'Tabungan', mobileLabel: 'Tabungan' },
                                    ]}
                                    activeTab={trxTab}
                                    onChange={setTrxTab}
                                    activeColor="text-slate-800"
                                    size="sm"
                                    fullWidthMobile={true}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Table View Desktop */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs sm:text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 text-slate-400 text-[11px] font-black uppercase tracking-wider">
                                    <th className="py-3 px-3">Tanggal</th>
                                    <th className="py-3 px-3">Transaksi</th>
                                    <th className="py-3 px-3">Kategori</th>
                                    <th className="py-3 px-3">Metode Bayar</th>
                                    <th className="py-3 px-3 text-right">Nominal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 font-medium">
                                {filteredTransactions.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="py-8 text-center text-slate-400 font-semibold">
                                            Tidak ada transaksi yang cocok.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTransactions.map((t, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/60 transition">
                                            <td className="py-3 px-3 font-semibold text-slate-700 whitespace-nowrap">
                                                {new Date(t.date).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}
                                            </td>
                                            <td className="py-3 px-3">
                                                <div className="font-extrabold text-slate-800">{t.title}</div>
                                                {t.description && (
                                                    <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                                                        {t.description}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-3 px-3 whitespace-nowrap">
                                                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs">
                                                    {t.category}
                                                </span>
                                            </td>
                                            <td className="py-3 px-3 whitespace-nowrap text-slate-600 font-semibold">
                                                {t.payment_method}
                                            </td>
                                            <td className="py-3 px-3 text-right font-black whitespace-nowrap">
                                                {t.type === 'pemasukan' ? (
                                                    <span className="text-emerald-600">+{formatRp(t.amount)}</span>
                                                ) : t.type === 'pengeluaran' ? (
                                                    <span className="text-rose-600">-{formatRp(t.amount)}</span>
                                                ) : (
                                                    <span className="text-[#009bd2]">-{formatRp(t.amount)}</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile View Cards */}
                    <div className="block md:hidden space-y-2">
                        {filteredTransactions.length === 0 ? (
                            <div className="text-center py-6 text-slate-400 text-xs font-semibold">
                                Tidak ada transaksi yang cocok.
                            </div>
                        ) : (
                            filteredTransactions.map((t, idx) => (
                                <div key={idx} className="bg-slate-50/75 hover:bg-slate-100/60 transition-colors p-3 rounded-2xl border border-slate-100/80 space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <h4 className="text-xs sm:text-sm font-black text-slate-800 truncate leading-snug">{t.title}</h4>
                                            {t.description && (
                                                <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">{t.description}</p>
                                            )}
                                        </div>
                                        <div
                                            className={`text-xs sm:text-sm font-black shrink-0 ${
                                                t.type === 'pemasukan'
                                                    ? 'text-emerald-600'
                                                    : t.type === 'pengeluaran'
                                                    ? 'text-rose-600'
                                                    : 'text-[#009bd2]'
                                            }`}
                                        >
                                            {t.type === 'pemasukan' ? '+' : '-'}{formatRp(t.amount)}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 text-[10.5px]">
                                        <div className="flex items-center gap-1.5 truncate mr-2">
                                            <span className="bg-white text-slate-700 px-2 py-0.5 rounded-md text-[10px] font-bold border border-slate-200/70 shadow-2xs truncate">
                                                {t.category}
                                            </span>
                                            <span className="text-slate-400 font-medium truncate">• {t.payment_method}</span>
                                        </div>
                                        <span className="text-slate-400 font-semibold shrink-0 text-[10px]">
                                            {new Date(t.date).toLocaleDateString('id-ID', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                            })}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
