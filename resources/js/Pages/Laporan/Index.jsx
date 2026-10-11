import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';

export default function Laporan({ auth, filters, availableYears, summary, transactions }) {
    const formatRp = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

    const handleFilterChange = (type) => {
        router.get(route('laporan.index'), { filter_type: type }, { preserveState: true, preserveScroll: true });
    };

    const handleMonthChange = (e) => {
        const value = e.target.value; // e.g. "2026-08"
        if (value) {
            const [year, month] = value.split('-');
            router.get(route('laporan.index'), { filter_type: 'month', filter_month: parseInt(month), filter_year: parseInt(year) }, { preserveState: true, preserveScroll: true });
        }
    };

    const handleYearChange = (e) => {
        const year = e.target.value;
        if (year) {
            router.get(route('laporan.index'), { filter_type: 'year', filter_year: parseInt(year) }, { preserveState: true, preserveScroll: true });
        }
    };

    const monthInputValue = filters.month && filters.year 
        ? `${filters.year}-${String(filters.month).padStart(2, '0')}` 
        : '';

    return (
        <AuthenticatedLayout>
            <Head title="Laporan Keuangan" />

            <div className="max-w-7xl mx-auto px-3.5 py-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-10">
                
                {/* Header & Filter */}
                <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 sm:gap-6 border-b border-slate-100 pb-3 sm:pb-4">
                    <div>
                        <p className="text-[11px] sm:text-xs md:text-sm font-bold text-[#009bd2] uppercase tracking-wider sm:tracking-widest mb-0.5 sm:mb-1">
                            Analisis
                        </p>
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
                            Laporan Keuangan
                        </h1>
                        <p className="text-slate-500 font-medium text-xs sm:text-sm mt-0.5 sm:mt-1">
                            Laporan rinci arus kas, saldo, dan hutang piutang.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 items-stretch sm:items-center">
                        {/* Filter Segment Buttons */}
                        <div className="grid grid-cols-3 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
                            <button 
                                onClick={() => handleFilterChange('month')}
                                className={`py-1.5 px-3 sm:px-4 rounded-lg font-extrabold text-xs sm:text-sm transition-all duration-200 text-center ${filters.type === 'month' ? 'bg-white text-[#009bd2] shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                                Per Bulan
                            </button>
                            <button 
                                onClick={() => handleFilterChange('year')}
                                className={`py-1.5 px-3 sm:px-4 rounded-lg font-extrabold text-xs sm:text-sm transition-all duration-200 text-center ${filters.type === 'year' ? 'bg-white text-[#009bd2] shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                                Per Tahun
                            </button>
                            <button 
                                onClick={() => handleFilterChange('all')}
                                className={`py-1.5 px-3 sm:px-4 rounded-lg font-extrabold text-xs sm:text-sm transition-all duration-200 text-center ${filters.type === 'all' ? 'bg-white text-[#009bd2] shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                                Semua
                            </button>
                        </div>

                        {/* Month Picker */}
                        {filters.type === 'month' && (
                            <div className="flex items-center justify-between sm:justify-start bg-white border border-slate-200/90 rounded-xl px-3 py-1.5 shadow-xs w-full sm:w-auto">
                                <div className="flex items-center gap-1.5 text-slate-400 mr-2 shrink-0">
                                    <svg className="w-4 h-4 text-[#009bd2]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    <span className="text-xs font-bold text-slate-500">Bulan:</span>
                                </div>
                                <input 
                                    type="month" 
                                    value={monthInputValue}
                                    onChange={handleMonthChange}
                                    className="border-none bg-transparent text-xs sm:text-sm font-bold text-slate-800 focus:ring-0 p-0 cursor-pointer text-right sm:text-left"
                                />
                            </div>
                        )}

                        {/* Year Picker */}
                        {filters.type === 'year' && (
                            <div className="flex items-center justify-between sm:justify-start bg-white border border-slate-200/90 rounded-xl px-3 py-1.5 shadow-xs w-full sm:w-auto">
                                <div className="flex items-center gap-1.5 text-slate-400 mr-2 shrink-0">
                                    <svg className="w-4 h-4 text-[#009bd2]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    <span className="text-xs font-bold text-slate-500">Tahun:</span>
                                </div>
                                <select 
                                    value={filters.year || new Date().getFullYear()}
                                    onChange={handleYearChange}
                                    className="border-none bg-transparent text-xs sm:text-sm font-bold text-slate-800 focus:ring-0 p-0 cursor-pointer pr-6"
                                >
                                    {availableYears.map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                {/* Arus Kas Section */}
                <div className="space-y-3 sm:space-y-4">
                    <h2 className="text-sm sm:text-base md:text-lg font-black text-slate-800 flex items-center gap-2">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-50 text-[#009bd2] flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        Arus Kas Periode Ini
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-6">
                        {/* Pemasukan Card */}
                        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-emerald-100 shadow-[0_8px_30px_rgb(16,185,129,0.06)] relative overflow-hidden group">
                            <div className="absolute -right-6 -top-6 w-28 h-28 bg-emerald-50 rounded-full blur-2xl group-hover:bg-emerald-100 transition-colors duration-500"></div>
                            <div className="relative">
                                <div className="flex items-center gap-2.5 sm:gap-3 mb-2.5 sm:mb-4">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                                    </div>
                                    <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">Total Pemasukan</p>
                                </div>
                                <h3 className="text-2xl sm:text-3xl font-black text-emerald-600 mb-4 sm:mb-6 tracking-tight">{formatRp(summary.pemasukan)}</h3>
                                
                                <div className="space-y-2 sm:space-y-2.5">
                                    <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Berdasarkan Metode</p>
                                    {Object.entries(summary.pemasukan_by_method).length > 0 ? (
                                        Object.entries(summary.pemasukan_by_method).map(([method, amount]) => (
                                            <div key={method} className="flex justify-between items-center bg-slate-50/80 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl border border-slate-100/60">
                                                <span className="text-xs sm:text-sm font-bold text-slate-700">{method}</span>
                                                <span className="text-xs sm:text-sm font-black text-emerald-600">{formatRp(amount)}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-xs sm:text-sm text-slate-400 font-medium py-1">Belum ada pemasukan.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Pengeluaran Card */}
                        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-rose-100 shadow-[0_8px_30px_rgb(244,63,94,0.06)] relative overflow-hidden group">
                            <div className="absolute -right-6 -top-6 w-28 h-28 bg-rose-50 rounded-full blur-2xl group-hover:bg-rose-100 transition-colors duration-500"></div>
                            <div className="relative">
                                <div className="flex items-center gap-2.5 sm:gap-3 mb-2.5 sm:mb-4">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                                    </div>
                                    <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">Total Pengeluaran</p>
                                </div>
                                <h3 className="text-2xl sm:text-3xl font-black text-rose-600 mb-4 sm:mb-6 tracking-tight">{formatRp(summary.pengeluaran)}</h3>
                                
                                <div className="space-y-2 sm:space-y-2.5">
                                    <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Berdasarkan Metode</p>
                                    {Object.entries(summary.pengeluaran_by_method).length > 0 ? (
                                        Object.entries(summary.pengeluaran_by_method).map(([method, amount]) => (
                                            <div key={method} className="flex justify-between items-center bg-slate-50/80 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl border border-slate-100/60">
                                                <span className="text-xs sm:text-sm font-bold text-slate-700">{method}</span>
                                                <span className="text-xs sm:text-sm font-black text-rose-600">{formatRp(amount)}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-xs sm:text-sm text-slate-400 font-medium py-1">Belum ada pengeluaran.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Saldo Aktif Section */}
                <div className="space-y-3 sm:space-y-4">
                    <h2 className="text-sm sm:text-base md:text-lg font-black text-slate-800 flex items-center gap-2">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                        </div>
                        Informasi Saldo Keseluruhan (All Time)
                    </h2>
                    
                    <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-slate-100 shadow-xs relative overflow-hidden">
                        <div className="absolute right-0 top-0 w-48 h-48 bg-gradient-to-bl from-violet-100/60 to-transparent rounded-full blur-2xl pointer-events-none"></div>
                        
                        <div className="relative z-10 mb-4 sm:mb-6 border-b border-slate-100 pb-4 sm:pb-6">
                            <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Total Sisa Saldo Aktif</p>
                            <h3 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">{formatRp(summary.saldo_aktif)}</h3>
                        </div>

                        <div className="relative z-10">
                            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-2.5 sm:mb-3">Sisa Saldo Berdasarkan Metode</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
                                {Object.entries(summary.saldo_by_method).map(([method, amount]) => (
                                    <div key={method} className="bg-slate-50/90 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100/80 flex items-center justify-between sm:block">
                                        <p className="text-xs sm:text-sm font-bold text-slate-600 sm:mb-1">{method}</p>
                                        <p className={`text-sm sm:text-lg lg:text-xl font-black ${amount < 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                                            {formatRp(amount)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Hutang Piutang & Tabungan */}
                <div className="space-y-3 sm:space-y-4">
                    <h2 className="text-sm sm:text-base md:text-lg font-black text-slate-800 flex items-center gap-2">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                        </div>
                        Kewajiban & Tabungan Keseluruhan (All Time)
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4 lg:gap-6">
                        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-100 shadow-xs flex sm:flex-col justify-between items-center sm:items-start">
                            <div>
                                <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5 sm:mb-2">Total Hutang</p>
                                <h4 className="text-base sm:text-2xl font-black text-rose-600 tracking-tight">{formatRp(summary.hutang)}</h4>
                            </div>
                            <span className="sm:hidden px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-50 text-rose-600">Hutang</span>
                        </div>
                        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-100 shadow-xs flex sm:flex-col justify-between items-center sm:items-start">
                            <div>
                                <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5 sm:mb-2">Total Piutang</p>
                                <h4 className="text-base sm:text-2xl font-black text-emerald-600 tracking-tight">{formatRp(summary.piutang)}</h4>
                            </div>
                            <span className="sm:hidden px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-50 text-emerald-600">Piutang</span>
                        </div>
                        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-100 shadow-xs flex sm:flex-col justify-between items-center sm:items-start">
                            <div>
                                <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5 sm:mb-2">Total Tabungan & Target</p>
                                <h4 className="text-base sm:text-2xl font-black text-[#009bd2] tracking-tight">{formatRp(summary.tabungan)}</h4>
                            </div>
                            <span className="sm:hidden px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-sky-50 text-[#009bd2]">Tabungan</span>
                        </div>
                    </div>
                </div>

                {/* Riwayat Transaksi */}
                <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm sm:text-base md:text-lg font-black text-slate-800 flex items-center gap-2">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                            </div>
                            Riwayat Transaksi Periode Ini
                        </h2>
                        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                            {transactions.length} Transaksi
                        </span>
                    </div>

                    {/* MOBILE CARD LIST VIEW (Screens < 768px) */}
                    <div className="block md:hidden space-y-2.5">
                        {transactions.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center shadow-xs">
                                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                </div>
                                <p className="text-xs font-extrabold text-slate-600">Belum ada transaksi</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">Tidak ditemukan transaksi pada periode ini.</p>
                            </div>
                        ) : (
                            transactions.map((t, idx) => (
                                <div key={idx} className="bg-white p-3.5 rounded-2xl border border-slate-100/90 shadow-xs space-y-2.5">
                                    {/* Card Header: Date & Type Badge */}
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-[11px] font-bold text-slate-400">
                                            {new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                                            t.type === 'pemasukan' 
                                                ? 'bg-emerald-50 text-emerald-600' 
                                                : t.type === 'pengeluaran' 
                                                    ? 'bg-rose-50 text-rose-600' 
                                                    : 'bg-sky-50 text-sky-600'
                                        }`}>
                                            {t.type === 'pemasukan' ? 'Pemasukan' : t.type === 'pengeluaran' ? 'Pengeluaran' : 'Tabungan'}
                                        </span>
                                    </div>

                                    {/* Card Content: Title & Description */}
                                    <div>
                                        <h4 className="text-sm font-black text-slate-800 line-clamp-1">{t.title}</h4>
                                        {t.description && (
                                            <p className="text-[11px] text-slate-500 font-medium mt-0.5 line-clamp-1">{t.description}</p>
                                        )}
                                    </div>

                                    {/* Card Footer: Category & Payment Method Badges and Amount */}
                                    <div className="flex items-center justify-between pt-1 border-t border-slate-50">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="bg-slate-100/80 text-slate-600 px-2 py-0.5 rounded-md text-[10px] font-bold">
                                                {t.category}
                                            </span>
                                            <span className="bg-slate-100/80 text-slate-500 px-2 py-0.5 rounded-md text-[10px] font-bold">
                                                {t.payment_method}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-xs sm:text-sm font-black tracking-tight ${
                                                t.type === 'pemasukan' 
                                                    ? 'text-emerald-600' 
                                                    : t.type === 'pengeluaran' 
                                                        ? 'text-rose-600' 
                                                        : 'text-[#009bd2]'
                                            }`}>
                                                {t.type === 'pemasukan' ? '+' : '-'}{formatRp(t.amount)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* DESKTOP TABLE VIEW (Screens >= 768px) */}
                    <div className="hidden md:block bg-white rounded-3xl shadow-xs border border-slate-100 p-6 lg:p-8">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[700px]">
                                <thead>
                                    <tr className="border-b-2 border-slate-100 text-slate-400 text-[11px] uppercase tracking-widest font-bold">
                                        <th className="pb-4 px-4">Tanggal</th>
                                        <th className="pb-4 px-4">Nama Transaksi</th>
                                        <th className="pb-4 px-4">Kategori</th>
                                        <th className="pb-4 px-4">Metode</th>
                                        <th className="pb-4 px-4 text-right">Jumlah</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {transactions.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="py-8 text-center text-slate-400 font-semibold">
                                                Belum ada transaksi pada periode ini.
                                            </td>
                                        </tr>
                                    ) : (
                                        transactions.map((t, idx) => (
                                            <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                                <td className="py-4 px-4 font-bold text-slate-700 whitespace-nowrap text-xs sm:text-sm">
                                                    {new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="font-extrabold text-slate-800 text-xs sm:text-sm">{t.title}</div>
                                                    {t.description && <div className="text-xs text-slate-500 font-medium mt-0.5">{t.description}</div>}
                                                </td>
                                                <td className="py-4 px-4 font-bold text-slate-500 text-xs sm:text-sm">{t.category}</td>
                                                <td className="py-4 px-4 font-bold text-slate-500 text-xs sm:text-sm">{t.payment_method}</td>
                                                <td className="py-4 px-4 text-right font-extrabold text-xs sm:text-sm">
                                                    {t.type === 'pemasukan' ? (
                                                        <span className="text-emerald-600">+{formatRp(t.amount)}</span>
                                                    ) : t.type === 'pengeluaran' ? (
                                                        <span className="text-rose-600">-{formatRp(t.amount)}</span>
                                                    ) : (
                                                        <span className="text-[#009bd2]">-{formatRp(t.amount)} (Tabungan)</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
