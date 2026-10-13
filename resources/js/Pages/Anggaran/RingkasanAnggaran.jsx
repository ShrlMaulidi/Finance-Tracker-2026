import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { TabFilter, ProgressBar } from '@/Components/UI';

export default function RingkasanAnggaran({
    currentMonth,
    selectedMonth,
    isCurrentMonth,
    availableMonths = [],
    grandSummary = {
        totalTarget: 0,
        totalPaid: 0,
        totalRemaining: 0,
        percentage: 0,
        totalItems: 0,
        overbudgetCount: 0,
        completedCount: 0,
    },
    pillarSummaries = {
        pengeluaran: { target: 0, paid: 0, remaining: 0, count: 0, percentage: 0 },
        hutang: { target: 0, paid: 0, remaining: 0, count: 0, total_debt: 0, percentage: 0 },
        tabungan: { target: 0, paid: 0, remaining: 0, count: 0, percentage: 0 },
    },
    allBudgets = [],
    expenseBudgets = [],
    debtBudgets = [],
    savingsBudgets = [],
}) {
    const [activeTab, setActiveTab] = useState('semua');

    const formatRp = (num) =>
        new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(num || 0);

    const handleMonthChange = (e) => {
        router.get(
            route('anggaran.ringkasan'),
            { month: e.target.value },
            { preserveState: true, preserveScroll: true }
        );
    };

    // Reusable Card Component - Rapi, Proporsional, & Bersih di Mobile & Desktop
    const renderBudgetCard = (item) => {
        const usedAmount = item.paid ?? 0;
        const percent = item.target > 0 ? Math.min((usedAmount / item.target) * 100, 100) : 0;
        const isOverbudget = item.status === 'Melebihi';

        return (
            <div
                key={item.id}
                className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.02)] sm:shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-100 hover:shadow-md transition-all flex flex-col justify-between"
            >
                {/* Header Kartu: Judul, Info Target & Tombol Buka */}
                <div className="flex items-start justify-between gap-2.5 mb-2.5 sm:mb-4">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <h4
                                className="text-xs sm:text-base font-extrabold text-slate-800 truncate leading-tight"
                                title={item.name}
                            >
                                {item.name}
                            </h4>
                            {item.is_recurring && (
                                <span
                                    className="text-[9px] font-bold text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100 shrink-0"
                                    title="Rutin Setiap Bulan"
                                >
                                    Rutin
                                </span>
                            )}
                        </div>

                        <div className="flex flex-col gap-0.5 text-[11px] sm:text-xs text-slate-400 font-medium mt-1">
                            <p>
                                <span>Target:</span>{' '}
                                <span className="font-bold text-slate-700">{formatRp(item.target)}</span>
                            </p>
                            {item.total_debt > 0 && (
                                <p className="text-[10px] sm:text-[11px] text-rose-500 font-semibold">
                                    Sisa Pokok: <span className="font-bold">{formatRp(item.total_debt)}</span>
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Tombol Buka Menu Asal */}
                    <Link
                        href={item.action_url}
                        className="shrink-0 text-[10px] sm:text-xs font-bold text-[#009bd2] bg-sky-50 hover:bg-sky-100/80 px-2 py-1 rounded-lg border border-sky-100/80 transition-colors flex items-center gap-1 active:scale-95"
                        title={`Buka di menu ${item.source_label}`}
                    >
                        <span>Buka</span>
                        <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>
                </div>

                {/* Bagian Bawah: Realisasi, Persentase, Progress Bar & Sisa */}
                <div className="pt-2 sm:pt-2.5 border-t border-slate-50 mt-auto space-y-1.5">
                    <div className="flex justify-between items-baseline">
                        <div>
                            <span className="text-[10px] sm:text-[11px] text-slate-400 block font-medium">Realisasi</span>
                            <span
                                className="text-sm sm:text-lg font-black text-slate-800 tracking-tight"
                                title={formatRp(usedAmount)}
                            >
                                {formatRp(usedAmount)}
                            </span>
                        </div>
                        <span
                            className={`text-[10px] sm:text-xs font-extrabold px-1.5 sm:px-2 py-0.5 rounded-md shrink-0 ${
                                isOverbudget
                                    ? 'bg-rose-50 text-rose-600'
                                    : percent >= 80
                                    ? 'bg-amber-50 text-amber-600'
                                    : 'bg-emerald-50 text-emerald-600'
                            }`}
                        >
                            {percent.toFixed(0)}%
                        </span>
                    </div>

                    <ProgressBar
                        value={usedAmount}
                        max={item.target}
                        variant="auto"
                        height="h-1.5 sm:h-2"
                    />

                    <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-semibold text-slate-400 pt-0.5">
                        <span>{isOverbudget ? 'Melebihi batas' : percent >= 100 ? 'Terpenuhi' : 'Berjalan'}</span>
                        <span className={isOverbudget ? 'text-rose-600 font-bold' : 'text-slate-600 font-bold'}>
                            {isOverbudget
                                ? `+${formatRp(usedAmount - item.target)}`
                                : `Sisa ${formatRp(item.target - usedAmount)}`
                            }
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title="Ringkasan Anggaran" />

            <div className="max-w-7xl mx-auto px-3 py-3 sm:px-6 sm:py-6 lg:p-8 space-y-3.5 sm:space-y-6 relative">
                
                {/* 1. HEADER HALAMAN & TAB FILTER */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-2.5 sm:gap-4 border-b border-slate-100 pb-2.5 sm:pb-4">
                    <div>
                        <p className="text-[10px] sm:text-xs font-bold text-[#009bd2] uppercase tracking-wider mb-0.5">
                            Manajemen Anggaran
                        </p>
                        <h1 className="text-lg sm:text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
                            Ringkasan Anggaran
                        </h1>
                        <p className="text-slate-500 font-medium text-xs sm:text-sm hidden sm:block mt-0.5 sm:mt-1">
                            Total alokasi dan realisasi seluruh pos anggaran Anda di bulan berjalan.
                        </p>
                    </div>

                    {/* Tab Navigation - Proporsional dengan mobileLabel agar tidak terpotong di HP */}
                    <div className="w-full md:w-auto">
                        <TabFilter
                            tabs={[
                                { key: 'semua', label: `Semua (${allBudgets.length})`, mobileLabel: `Semua (${allBudgets.length})` },
                                { key: 'pengeluaran', label: `Pengeluaran (${expenseBudgets.length})`, mobileLabel: `Belanja (${expenseBudgets.length})` },
                                { key: 'hutang', label: `Cicilan Hutang (${debtBudgets.length})`, mobileLabel: `Hutang (${debtBudgets.length})` },
                                { key: 'tabungan', label: `Tabungan & Target (${savingsBudgets.length})`, mobileLabel: `Tabungan (${savingsBudgets.length})` },
                            ]}
                            activeTab={activeTab}
                            onChange={setActiveTab}
                            activeColor="text-slate-800"
                            size="sm"
                        />
                    </div>
                </div>

                {/* 2. KHUSUS MOBILE: KARTU RINGKASAN MINI YANG RAPI & BERSIH (md:hidden) */}
                <div className="md:hidden bg-white rounded-2xl p-3.5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-slate-100 space-y-3">
                    {/* Header Mini: Status Bulan Berjalan & Dropdown Periode */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#009bd2] animate-pulse"></span>
                            <span className="text-xs font-black text-slate-800">Total Periode Ini</span>
                        </div>
                        <select
                            value={selectedMonth}
                            onChange={handleMonthChange}
                            aria-label="Pilih Periode Anggaran"
                            className="bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-bold rounded-lg px-2 py-1 focus:ring-1 focus:ring-[#009bd2] focus:outline-none cursor-pointer"
                        >
                            {availableMonths.map((m) => (
                                <option key={m} value={m}>
                                    {m}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* 3 Kolom Metrik Bersih dengan Tipografi Rapi */}
                    <div className="grid grid-cols-3 gap-1.5 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100 text-center">
                        <div className="px-1 min-w-0">
                            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-tight truncate">
                                Anggaran
                            </span>
                            <span className="text-[11px] font-black text-slate-900 block truncate leading-tight mt-0.5" title={formatRp(grandSummary.totalTarget)}>
                                {formatRp(grandSummary.totalTarget)}
                            </span>
                        </div>
                        <div className="px-1 border-x border-slate-200/60 min-w-0">
                            <span className="text-[10px] font-bold text-emerald-600 block uppercase tracking-tight truncate">
                                Terbayar
                            </span>
                            <span className="text-[11px] font-black text-emerald-600 block truncate leading-tight mt-0.5" title={formatRp(grandSummary.totalPaid)}>
                                {formatRp(grandSummary.totalPaid)}
                            </span>
                        </div>
                        <div className="px-1 min-w-0">
                            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-tight truncate">
                                Sisa
                            </span>
                            <span className="text-[11px] font-black text-slate-800 block truncate leading-tight mt-0.5" title={formatRp(grandSummary.totalRemaining)}>
                                {formatRp(grandSummary.totalRemaining)}
                            </span>
                        </div>
                    </div>

                    {/* Bar Progres Realisasi */}
                    <div>
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 mb-1">
                            <span>Realisasi Keseluruhan</span>
                            <span className="text-[#009bd2] font-black">{grandSummary.percentage}%</span>
                        </div>
                        <ProgressBar
                            value={grandSummary.totalPaid}
                            max={grandSummary.totalTarget || 1}
                            variant="auto"
                            height="h-1.5"
                        />
                    </div>
                </div>

                {/* 3. TATA LETAK UTAMA (Desktop 2-Kolom, Mobile 1-Kolom) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 animate-fade-in items-start">
                    
                    {/* PANEL KIRI: KHUSUS DESKTOP (hidden md:block sticky) */}
                    <div className="hidden md:block lg:col-span-1">
                        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-100 lg:sticky lg:top-6 space-y-4 sm:space-y-5">
                            <h2 className="text-base sm:text-lg md:text-xl font-black text-slate-800 flex items-center gap-2.5 sm:gap-3">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#009bd2]/10 text-[#009bd2] flex items-center justify-center shrink-0">
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <span>Total Bulan Ini</span>
                            </h2>

                            {/* Periode Bulan Selector Desktop */}
                            <div>
                                <label className="text-xs sm:text-sm font-bold text-slate-600 block mb-1 sm:mb-1.5">
                                    Periode Anggaran
                                </label>
                                <select
                                    value={selectedMonth}
                                    onChange={handleMonthChange}
                                    aria-label="Pilih Periode Anggaran"
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl sm:rounded-2xl px-3.5 py-2 sm:py-2.5 focus:outline-none focus:border-[#009bd2] focus:ring-1 focus:ring-[#009bd2] font-semibold transition-all text-xs sm:text-sm cursor-pointer"
                                >
                                    {availableMonths.map((m) => (
                                        <option key={m} value={m}>
                                            {m} {m === currentMonth ? '(Bulan Berjalan)' : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Metrik Utama Desktop */}
                            <div className="bg-slate-50/80 rounded-2xl p-3.5 sm:p-4 border border-slate-100 space-y-3">
                                <div>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                        Total Anggaran
                                    </p>
                                    <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                                        {formatRp(grandSummary.totalTarget)}
                                    </p>
                                </div>

                                <div className="pt-2.5 border-t border-slate-200/60 flex items-center justify-between">
                                    <span className="text-xs font-semibold text-slate-500">Sudah Terbayar:</span>
                                    <span className="text-xs sm:text-sm font-black text-emerald-600">
                                        {formatRp(grandSummary.totalPaid)}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-slate-500">Sisa yang Perlu Disiapkan:</span>
                                    <span className="text-xs sm:text-sm font-black text-slate-800">
                                        {formatRp(grandSummary.totalRemaining)}
                                    </span>
                                </div>

                                {/* Progress Bar Mini */}
                                <div className="pt-2 border-t border-slate-200/60">
                                    <div className="flex justify-between items-center mb-1 text-[11px] font-bold">
                                        <span className="text-slate-500">Realisasi</span>
                                        <span className="text-[#009bd2]">{grandSummary.percentage}%</span>
                                    </div>
                                    <ProgressBar
                                        value={grandSummary.totalPaid}
                                        max={grandSummary.totalTarget || 1}
                                        variant="auto"
                                    />
                                </div>
                            </div>

                            {/* Rincian 3 Sub Menu Desktop */}
                            <div className="space-y-2 pt-1">
                                <p className="text-xs font-bold text-slate-600">Ringkasan per Sub Menu</p>

                                <Link
                                    href={route('anggaran.pengeluaran')}
                                    className="p-3 rounded-xl sm:rounded-2xl bg-white hover:bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all block group shadow-2xs"
                                >
                                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 group-hover:text-[#009bd2]">
                                        <span>Pengeluaran Bulanan</span>
                                        <span className="text-slate-400 group-hover:text-[#009bd2]">Kelola ↗</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mt-1">
                                        <span>Terpakai: <strong className="text-slate-800">{formatRp(pillarSummaries.pengeluaran.paid)}</strong></span>
                                        <span className="text-slate-400">Target: {formatRp(pillarSummaries.pengeluaran.target)}</span>
                                    </div>
                                </Link>

                                <Link
                                    href={route('anggaran.hutang')}
                                    className="p-3 rounded-xl sm:rounded-2xl bg-white hover:bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all block group shadow-2xs"
                                >
                                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 group-hover:text-[#009bd2]">
                                        <span>Anggaran Hutang</span>
                                        <span className="text-slate-400 group-hover:text-[#009bd2]">Kelola ↗</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mt-1">
                                        <span>Terbayar: <strong className="text-slate-800">{formatRp(pillarSummaries.hutang.paid)}</strong></span>
                                        <span className="text-slate-400">Target: {formatRp(pillarSummaries.hutang.target)}</span>
                                    </div>
                                </Link>

                                <Link
                                    href={route('anggaran.investasi')}
                                    className="p-3 rounded-xl sm:rounded-2xl bg-white hover:bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all block group shadow-2xs"
                                >
                                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 group-hover:text-[#009bd2]">
                                        <span>Tabungan & Target</span>
                                        <span className="text-slate-400 group-hover:text-[#009bd2]">Kelola ↗</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mt-1">
                                        <span>Terkumpul: <strong className="text-slate-800">{formatRp(pillarSummaries.tabungan.paid)}</strong></span>
                                        <span className="text-slate-400">Target: {formatRp(pillarSummaries.tabungan.target)}</span>
                                    </div>
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* PANEL KANAN: RINCIAN ANGGARAN DENGAN PEMBATAS KATEGORI */}
                    <div className="lg:col-span-2 space-y-4 sm:space-y-8">
                        
                        {/* SEKSI 1: PENGELUARAN BULANAN */}
                        {(activeTab === 'semua' || activeTab === 'pengeluaran') && (
                            <div className="space-y-2.5 sm:space-y-4">
                                {/* Pembatas / Section Divider */}
                                <div className="flex items-center justify-between pb-1.5 sm:pb-2 border-b border-slate-200/70">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-lg bg-sky-50 text-[#009bd2] flex items-center justify-center shrink-0">
                                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                            </svg>
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-xs sm:text-base font-extrabold text-slate-800 truncate">
                                                Pengeluaran Bulanan
                                            </h3>
                                            <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">
                                                {expenseBudgets.length} pos • Target: {formatRp(pillarSummaries.pengeluaran.target)}
                                            </p>
                                        </div>
                                    </div>
                                    <Link
                                        href={route('anggaran.pengeluaran')}
                                        className="text-[10px] sm:text-xs font-bold text-[#009bd2] hover:underline shrink-0 ml-2"
                                    >
                                        Kelola ↗
                                    </Link>
                                </div>

                                {/* Grid Kartu Pengeluaran */}
                                {expenseBudgets.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
                                        {expenseBudgets.map(renderBudgetCard)}
                                    </div>
                                ) : (
                                    <div className="bg-slate-50/70 border border-dashed border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center text-[11px] sm:text-xs text-slate-400">
                                        Belum ada pos anggaran pengeluaran bulanan.
                                    </div>
                                )}
                            </div>
                        )}

                        {/* SEKSI 2: ANGGARAN HUTANG */}
                        {(activeTab === 'semua' || activeTab === 'hutang') && (
                            <div className="space-y-2.5 sm:space-y-4">
                                {/* Pembatas / Section Divider */}
                                <div className="flex items-center justify-between pb-1.5 sm:pb-2 border-b border-slate-200/70">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                            </svg>
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-xs sm:text-base font-extrabold text-slate-800 truncate">
                                                Cicilan Hutang
                                            </h3>
                                            <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">
                                                {debtBudgets.length} cicilan • Target: {formatRp(pillarSummaries.hutang.target)}
                                            </p>
                                        </div>
                                    </div>
                                    <Link
                                        href={route('anggaran.hutang')}
                                        className="text-[10px] sm:text-xs font-bold text-amber-700 hover:underline shrink-0 ml-2"
                                    >
                                        Kelola ↗
                                    </Link>
                                </div>

                                {/* Grid Kartu Hutang */}
                                {debtBudgets.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
                                        {debtBudgets.map(renderBudgetCard)}
                                    </div>
                                ) : (
                                    <div className="bg-slate-50/70 border border-dashed border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center text-[11px] sm:text-xs text-slate-400">
                                        Belum ada pos anggaran cicilan hutang.
                                    </div>
                                )}
                            </div>
                        )}

                        {/* SEKSI 3: ANGGARAN TABUNGAN & TARGET */}
                        {(activeTab === 'semua' || activeTab === 'tabungan') && (
                            <div className="space-y-2.5 sm:space-y-4">
                                {/* Pembatas / Section Divider */}
                                <div className="flex items-center justify-between pb-1.5 sm:pb-2 border-b border-slate-200/70">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-xs sm:text-base font-extrabold text-slate-800 truncate">
                                                Tabungan & Target
                                            </h3>
                                            <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">
                                                {savingsBudgets.length} target • Target: {formatRp(pillarSummaries.tabungan.target)}
                                            </p>
                                        </div>
                                    </div>
                                    <Link
                                        href={route('anggaran.investasi')}
                                        className="text-[10px] sm:text-xs font-bold text-emerald-700 hover:underline shrink-0 ml-2"
                                    >
                                        Kelola ↗
                                    </Link>
                                </div>

                                {/* Grid Kartu Tabungan */}
                                {savingsBudgets.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
                                        {savingsBudgets.map(renderBudgetCard)}
                                    </div>
                                ) : (
                                    <div className="bg-slate-50/70 border border-dashed border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center text-[11px] sm:text-xs text-slate-400">
                                        Belum ada pos anggaran tabungan & target.
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Global Empty State jika seluruh kategori kosong */}
                        {allBudgets.length === 0 && (
                            <div className="bg-slate-50/70 border-2 border-dashed border-slate-200 rounded-2xl sm:rounded-3xl p-6 sm:p-12 text-center">
                                <div className="w-10 h-10 sm:w-16 sm:h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-xs mb-3 sm:mb-4 text-slate-300">
                                    <svg className="w-5 h-5 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <p className="text-slate-600 font-bold text-xs sm:text-base">
                                    Belum ada pos anggaran di bulan berjalan ini.
                                </p>
                                <p className="text-slate-400 text-[11px] sm:text-sm mt-0.5 sm:mt-1">
                                    Gunakan sub menu Pengeluaran, Hutang, atau Tabungan untuk mulai merencanakan anggaran.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
