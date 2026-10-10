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

            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-10 space-y-8 sm:space-y-12">
                
                {/* Header & Filter */}
                <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 pb-2">
                    <div>
                        <p className="text-xs md:text-sm font-bold text-[#009bd2] uppercase tracking-widest mb-1">Analisis</p>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
                            Laporan Keuangan
                        </h1>
                        <p className="text-slate-500 font-medium text-sm mt-1">Laporan rinci arus kas, saldo, dan hutang piutang.</p>
                    </div>

                    <div className="flex flex-col md:flex-row gap-3 self-start xl:self-end">
                        {filters.type === 'month' && (
                            <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
                                <label className="text-xs font-bold text-slate-500 mr-2">Bulan:</label>
                                <input 
                                    type="month" 
                                    value={monthInputValue}
                                    onChange={handleMonthChange}
                                    className="border-none bg-transparent text-sm font-bold text-slate-800 focus:ring-0 p-0 cursor-pointer pr-2"
                                />
                            </div>
                        )}
                        {filters.type === 'year' && (
                            <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
                                <label className="text-xs font-bold text-slate-500 mr-2">Tahun:</label>
                                <select 
                                    value={filters.year || new Date().getFullYear()}
                                    onChange={handleYearChange}
                                    className="border-none bg-transparent text-sm font-bold text-slate-800 focus:ring-0 p-0 cursor-pointer pr-6"
                                >
                                    {availableYears.map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div className="flex bg-slate-100 p-1.5 rounded-xl">
                            <button 
                                onClick={() => handleFilterChange('month')}
                                className={`px-4 py-2 rounded-lg font-bold text-xs md:text-sm transition-all duration-300 ${filters.type === 'month' ? 'bg-white text-[#009bd2] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Per Bulan
                            </button>
                            <button 
                                onClick={() => handleFilterChange('year')}
                                className={`px-4 py-2 rounded-lg font-bold text-xs md:text-sm transition-all duration-300 ${filters.type === 'year' ? 'bg-white text-[#009bd2] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Per Tahun
                            </button>
                            <button 
                                onClick={() => handleFilterChange('all')}
                                className={`px-4 py-2 rounded-lg font-bold text-xs md:text-sm transition-all duration-300 ${filters.type === 'all' ? 'bg-white text-[#009bd2] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Semua Waktu
                            </button>
                        </div>
                    </div>
                </div>

                {/* Arus Kas Section */}
                <div className="space-y-6">
                    <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        Arus Kas Periode Ini
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Pemasukan Card */}
                        <div className="bg-white rounded-[2rem] p-6 border border-emerald-100 shadow-[0_8px_30px_rgb(16,185,129,0.06)] relative overflow-hidden group">
                            <div className="absolute -right-6 -top-6 w-32 h-32 bg-emerald-50 rounded-full blur-3xl group-hover:bg-emerald-100 transition-colors duration-500"></div>
                            <div className="relative">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                                    </div>
                                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Pemasukan</p>
                                </div>
                                <h3 className="text-3xl font-black text-emerald-600 mb-6">{formatRp(summary.pemasukan)}</h3>
                                
                                <div className="space-y-3">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Berdasarkan Metode</p>
                                    {Object.entries(summary.pemasukan_by_method).length > 0 ? (
                                        Object.entries(summary.pemasukan_by_method).map(([method, amount]) => (
                                            <div key={method} className="flex justify-between items-center bg-slate-50 px-4 py-3 rounded-xl">
                                                <span className="text-sm font-bold text-slate-700">{method}</span>
                                                <span className="text-sm font-extrabold text-emerald-600">{formatRp(amount)}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-slate-400 font-medium">Belum ada pemasukan.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Pengeluaran Card */}
                        <div className="bg-white rounded-[2rem] p-6 border border-rose-100 shadow-[0_8px_30px_rgb(244,63,94,0.06)] relative overflow-hidden group">
                            <div className="absolute -right-6 -top-6 w-32 h-32 bg-rose-50 rounded-full blur-3xl group-hover:bg-rose-100 transition-colors duration-500"></div>
                            <div className="relative">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                                    </div>
                                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Pengeluaran</p>
                                </div>
                                <h3 className="text-3xl font-black text-rose-600 mb-6">{formatRp(summary.pengeluaran)}</h3>
                                
                                <div className="space-y-3">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Berdasarkan Metode</p>
                                    {Object.entries(summary.pengeluaran_by_method).length > 0 ? (
                                        Object.entries(summary.pengeluaran_by_method).map(([method, amount]) => (
                                            <div key={method} className="flex justify-between items-center bg-slate-50 px-4 py-3 rounded-xl">
                                                <span className="text-sm font-bold text-slate-700">{method}</span>
                                                <span className="text-sm font-extrabold text-rose-600">{formatRp(amount)}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-slate-400 font-medium">Belum ada pengeluaran.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Saldo Aktif Section */}
                <div className="space-y-6">
                    <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                        </div>
                        Informasi Saldo Keseluruhan (All Time)
                    </h2>
                    
                    <div className="bg-white rounded-[2rem] p-6 sm:p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
                        <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-bl from-violet-100 to-transparent opacity-50 rounded-full blur-3xl pointer-events-none"></div>
                        
                        <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8 md:items-end mb-8 border-b border-slate-100 pb-8">
                            <div>
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Total Sisa Saldo Aktif</p>
                                <h3 className="text-4xl sm:text-5xl font-black text-slate-800">{formatRp(summary.saldo_aktif)}</h3>
                            </div>
                        </div>

                        <div className="relative z-10">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Sisa Saldo Berdasarkan Metode</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Object.entries(summary.saldo_by_method).map(([method, amount]) => (
                                    <div key={method} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <p className="text-sm font-bold text-slate-500 mb-1">{method}</p>
                                        <p className={`text-xl font-extrabold ${amount < 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                                            {formatRp(amount)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Hutang Piutang & Tabungan */}
                <div className="space-y-6">
                    <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                        </div>
                        Kewajiban & Tabungan Keseluruhan (All Time)
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Total Hutang</p>
                            <h4 className="text-2xl font-black text-rose-600">{formatRp(summary.hutang)}</h4>
                        </div>
                        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Total Piutang</p>
                            <h4 className="text-2xl font-black text-emerald-600">{formatRp(summary.piutang)}</h4>
                        </div>
                        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Total Tabungan & Target</p>
                            <h4 className="text-2xl font-black text-[#009bd2]">{formatRp(summary.tabungan)}</h4>
                        </div>
                    </div>
                </div>

                {/* Riwayat Transaksi */}
                <div className="space-y-6">
                    <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                        </div>
                        Riwayat Transaksi Periode Ini
                    </h2>

                    <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6 sm:p-8">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[800px]">
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
                                                <td className="py-4 px-4 font-bold text-slate-700 whitespace-nowrap">
                                                    {new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="font-extrabold text-slate-800">{t.title}</div>
                                                    {t.description && <div className="text-xs text-slate-500 font-medium mt-0.5">{t.description}</div>}
                                                </td>
                                                <td className="py-4 px-4 font-bold text-slate-500">{t.category}</td>
                                                <td className="py-4 px-4 font-bold text-slate-500">{t.payment_method}</td>
                                                <td className="py-4 px-4 text-right font-extrabold">
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
