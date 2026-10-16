import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, Link } from '@inertiajs/react';

export default function TransactionHistory({ auth, title, currentType, filters, availableYears, transactions }) {
    const formatRp = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

    const handleFilterChange = (type) => {
        router.get(route('transaksi.history', { type: currentType }), { filter_type: type }, { preserveState: true, preserveScroll: true });
    };

    const handleMonthChange = (e) => {
        const value = e.target.value;
        if (value) {
            const [year, month] = value.split('-');
            router.get(route('transaksi.history', { type: currentType }), { filter_type: 'month', filter_month: parseInt(month), filter_year: parseInt(year) }, { preserveState: true, preserveScroll: true });
        }
    };

    const handleYearChange = (e) => {
        const year = e.target.value;
        if (year) {
            router.get(route('transaksi.history', { type: currentType }), { filter_type: 'year', filter_year: parseInt(year) }, { preserveState: true, preserveScroll: true });
        }
    };

    const monthInputValue = filters.month && filters.year 
        ? `${filters.year}-${String(filters.month).padStart(2, '0')}` 
        : '';

    // Quick sub-menu URL generator retaining current period filter
    const getTabUrl = (typeKey) => {
        const params = { type: typeKey };
        if (filters.type) params.filter_type = filters.type;
        if (filters.month) params.filter_month = filters.month;
        if (filters.year) params.filter_year = filters.year;
        return route('transaksi.history', params);
    };

    // Aggregate statistics with single-pass memoization
    const { totalCount, totalPemasukan, totalPengeluaran, totalTabungan } = React.useMemo(() => {
        let count = transactions.length;
        let masuk = 0;
        let keluar = 0;
        let tabung = 0;
        for (let i = 0; i < count; i++) {
            const t = transactions[i];
            const amt = Number(t.amount) || 0;
            if (t.type === 'pemasukan') masuk += amt;
            else if (t.type === 'pengeluaran') keluar += amt;
            else if (t.type === 'tabungan') tabung += amt;
        }
        return { totalCount: count, totalPemasukan: masuk, totalPengeluaran: keluar, totalTabungan: tabung };
    }, [transactions]);

    return (
        <AuthenticatedLayout>
            <Head title={title} />

            <div className="max-w-7xl mx-auto px-3.5 py-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
                
                {/* Header Section */}
                <div className="flex flex-col gap-2 sm:gap-3 border-b border-slate-100 pb-3 sm:pb-4">
                    <div>
                        <p className="text-[11px] sm:text-xs md:text-sm font-bold text-[#009bd2] uppercase tracking-wider sm:tracking-widest mb-0.5 sm:mb-1">
                            Riwayat Transaksi
                        </p>
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
                            {title}
                        </h1>
                        <p className="text-slate-500 font-medium text-xs sm:text-sm mt-0.5 sm:mt-1">
                            {currentType === 'pengeluaran' ? 'Menampilkan riwayat arus uang keluar.' : currentType === 'pemasukan' ? 'Menampilkan riwayat arus uang masuk.' : currentType === 'tabungan' ? 'Menampilkan riwayat tabungan Anda.' : 'Menampilkan seluruh riwayat transaksi.'}
                        </p>
                    </div>

                    {/* Quick Sub-menu Tabs for Seamless Mobile Navigation */}
                    <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 -mx-3.5 px-3.5 sm:mx-0 sm:px-0">
                        {[
                            { key: 'semua', label: 'Semua Transaksi', activeBg: 'bg-[#009bd2] text-white shadow-sm' },
                            { key: 'pengeluaran', label: 'Pengeluaran', activeBg: 'bg-rose-500 text-white shadow-sm' },
                            { key: 'pemasukan', label: 'Pemasukan', activeBg: 'bg-emerald-600 text-white shadow-sm' },
                            { key: 'tabungan', label: 'Riwayat Tabungan', activeBg: 'bg-sky-600 text-white shadow-sm' },
                        ].map(tab => (
                            <Link
                                key={tab.key}
                                href={getTabUrl(tab.key)}
                                preserveScroll
                                preserveState
                                className={`whitespace-nowrap px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 shrink-0 ${
                                    currentType === tab.key
                                        ? tab.activeBg
                                        : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-50'
                                }`}
                            >
                                {tab.label}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Summary Statistics Cards */}
                {currentType === 'semua' ? (
                    <div className="grid grid-cols-3 gap-2 sm:gap-4">
                        <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100 shadow-xs">
                            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Pemasukan</p>
                            <p className="text-xs sm:text-base md:text-lg font-black text-emerald-600 mt-0.5 truncate tracking-tight">
                                +{formatRp(totalPemasukan)}
                            </p>
                        </div>
                        <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100 shadow-xs">
                            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Pengeluaran</p>
                            <p className="text-xs sm:text-base md:text-lg font-black text-rose-600 mt-0.5 truncate tracking-tight">
                                -{formatRp(totalPengeluaran)}
                            </p>
                        </div>
                        <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100 shadow-xs">
                            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Tabungan</p>
                            <p className="text-xs sm:text-base md:text-lg font-black text-sky-600 mt-0.5 truncate tracking-tight">
                                {formatRp(totalTabungan)}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
                        <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100 shadow-xs">
                            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
                                {currentType === 'pengeluaran' ? 'Total Pengeluaran' : currentType === 'pemasukan' ? 'Total Pemasukan' : 'Total Tabungan'}
                            </p>
                            <p className={`text-sm sm:text-lg md:text-xl font-black mt-0.5 truncate tracking-tight ${
                                currentType === 'pengeluaran' ? 'text-rose-600' : currentType === 'pemasukan' ? 'text-emerald-600' : 'text-sky-600'
                            }`}>
                                {currentType === 'pengeluaran' ? `-${formatRp(totalPengeluaran)}` : currentType === 'pemasukan' ? `+${formatRp(totalPemasukan)}` : formatRp(totalTabungan)}
                            </p>
                        </div>
                        <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100 shadow-xs">
                            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Jumlah Data</p>
                            <p className="text-sm sm:text-lg md:text-xl font-black text-slate-800 mt-0.5 truncate tracking-tight">
                                {totalCount} Transaksi
                            </p>
                        </div>
                    </div>
                )}

                {/* Filter Toolbar Section */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-4 bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-100 shadow-xs">
                    {/* Period Switcher Buttons */}
                    <div className="grid grid-cols-3 sm:flex items-center bg-slate-100/90 p-1 rounded-xl w-full sm:w-auto gap-1">
                        <button 
                            onClick={() => handleFilterChange('month')}
                            className={`text-center px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg font-extrabold text-[11px] sm:text-xs md:text-sm transition-all duration-200 ${filters.type === 'month' ? 'bg-white text-[#009bd2] shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Per Bulan
                        </button>
                        <button 
                            onClick={() => handleFilterChange('year')}
                            className={`text-center px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg font-extrabold text-[11px] sm:text-xs md:text-sm transition-all duration-200 ${filters.type === 'year' ? 'bg-white text-[#009bd2] shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Per Tahun
                        </button>
                        <button 
                            onClick={() => handleFilterChange('all')}
                            className={`text-center px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg font-extrabold text-[11px] sm:text-xs md:text-sm transition-all duration-200 ${filters.type === 'all' ? 'bg-white text-[#009bd2] shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Semua
                        </button>
                    </div>

                    {/* Dynamic Date/Year Selector */}
                    {filters.type === 'month' && (
                        <div className="flex items-center justify-between sm:justify-start bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 w-full sm:w-auto">
                            <label className="text-[11px] sm:text-xs font-bold text-slate-500 mr-2 shrink-0">Bulan:</label>
                            <input 
                                type="month" 
                                value={monthInputValue}
                                onChange={handleMonthChange}
                                onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                                className="border-none bg-transparent text-xs sm:text-sm font-bold text-slate-800 focus:ring-0 p-0 cursor-pointer"
                            />
                        </div>
                    )}
                    {filters.type === 'year' && (
                        <div className="flex items-center justify-between sm:justify-start bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 w-full sm:w-auto">
                            <label className="text-[11px] sm:text-xs font-bold text-slate-500 mr-2 shrink-0">Tahun:</label>
                            <select 
                                value={filters.year || new Date().getFullYear()}
                                onChange={handleYearChange}
                                className="border-none bg-transparent text-xs sm:text-sm font-bold text-slate-800 focus:ring-0 p-0 cursor-pointer"
                            >
                                {availableYears.map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* MOBILE VIEW: Touch-Friendly Card Feed (Clean & Native) */}
                <div className="block md:hidden space-y-2.5">
                    {transactions.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center shadow-xs">
                            <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center mx-auto mb-3">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                            </div>
                            <p className="font-bold text-slate-700 text-sm">Belum ada transaksi</p>
                            <p className="text-xs text-slate-400 mt-1">Tidak ada catatan untuk filter yang dipilih.</p>
                        </div>
                    ) : (
                        transactions.map((t, idx) => (
                            <div key={idx} className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs flex flex-col gap-2">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-2.5 min-w-0">
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                            t.type === 'pemasukan' ? 'bg-emerald-50 text-emerald-600' :
                                            t.type === 'pengeluaran' ? 'bg-rose-50 text-rose-600' :
                                            'bg-sky-50 text-sky-600'
                                        }`}>
                                            {t.type === 'pemasukan' ? (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                                            ) : t.type === 'pengeluaran' ? (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                                            ) : (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-xs sm:text-sm font-extrabold text-slate-800 truncate leading-snug">{t.title}</h4>
                                            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">{t.date_formatted}</p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span className={`text-xs sm:text-sm font-black tracking-tight ${
                                            t.type === 'pemasukan' ? 'text-emerald-600' :
                                            t.type === 'pengeluaran' ? 'text-rose-600' :
                                            'text-[#009bd2]'
                                        }`}>
                                            {t.type === 'pemasukan' ? `+${formatRp(t.amount)}` : `-${formatRp(t.amount)}`}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-1.5 border-t border-slate-50 text-[11px]">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-md text-[10px]">
                                            {t.category}
                                        </span>
                                        <span className="text-slate-400 font-medium flex items-center gap-1">
                                            <span>•</span>
                                            <span>{t.payment_method}</span>
                                        </span>
                                    </div>
                                    {t.type === 'tabungan' && (
                                        <span className="text-sky-600 font-bold text-[10px] bg-sky-50 px-1.5 py-0.5 rounded-md">
                                            Tabungan
                                        </span>
                                    )}
                                </div>

                                {t.description && (
                                    <p className="text-[11px] text-slate-500 font-medium bg-slate-50/70 rounded-lg px-2.5 py-1.5 line-clamp-2">
                                        {t.description}
                                    </p>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* DESKTOP VIEW: High-Density Table */}
                <div className="hidden md:block bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sm:p-8">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[700px]">
                            <thead>
                                <tr className="border-b-2 border-slate-100 text-slate-400 text-[11px] uppercase tracking-wider font-extrabold">
                                    <th className="pb-3 px-4">Tanggal</th>
                                    <th className="pb-3 px-4">Nama Transaksi</th>
                                    <th className="pb-3 px-4">Kategori</th>
                                    <th className="pb-3 px-4">Metode</th>
                                    <th className="pb-3 px-4 text-right">Jumlah</th>
                                </tr>
                            </thead>
                            <tbody className="text-xs sm:text-sm">
                                {transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="py-12 text-center">
                                            <div className="flex flex-col items-center justify-center text-slate-400">
                                                <svg className="w-12 h-12 mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                                <p className="font-bold text-slate-600 text-base">Belum ada transaksi</p>
                                                <p className="text-xs font-medium text-slate-400 mt-1">Tidak ada catatan untuk filter yang dipilih.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map((t, idx) => (
                                        <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                            <td className="py-3.5 px-4 font-bold text-slate-700 whitespace-nowrap">
                                                {t.date_formatted}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="font-extrabold text-slate-800">{t.title}</div>
                                                {t.description && <div className="text-xs text-slate-500 font-medium mt-0.5">{t.description}</div>}
                                            </td>
                                            <td className="py-3.5 px-4 font-bold text-slate-500">
                                                <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-xs font-bold tracking-wide">
                                                    {t.category}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 font-bold text-slate-600">
                                                {t.payment_method}
                                            </td>
                                            <td className="py-3.5 px-4 text-right font-black">
                                                {t.type === 'pemasukan' ? (
                                                    <span className="text-emerald-600 font-black">+{formatRp(t.amount)}</span>
                                                ) : t.type === 'pengeluaran' ? (
                                                    <span className="text-rose-600 font-black">-{formatRp(t.amount)}</span>
                                                ) : (
                                                    <span className="text-[#009bd2] font-black">-{formatRp(t.amount)} <span className="text-xs font-bold text-sky-500">(Tabungan)</span></span>
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
        </AuthenticatedLayout>
    );
}
