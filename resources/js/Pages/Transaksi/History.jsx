import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';

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

    return (
        <AuthenticatedLayout>
            <Head title={title} />

            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-10 space-y-8 sm:space-y-12">
                
                {/* Header & Filter */}
                <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 pb-2">
                    <div>
                        <p className="text-xs md:text-sm font-bold text-[#009bd2] uppercase tracking-widest mb-1">Riwayat</p>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
                            {title}
                        </h1>
                        <p className="text-slate-500 font-medium text-sm mt-1">
                            {currentType === 'pengeluaran' ? 'Menampilkan riwayat arus uang keluar.' : currentType === 'pemasukan' ? 'Menampilkan riwayat arus uang masuk.' : currentType === 'tabungan' ? 'Menampilkan riwayat tabungan Anda.' : 'Menampilkan seluruh riwayat transaksi.'}
                        </p>
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

                {/* Table Section */}
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
                                        <td colSpan="5" className="py-12 text-center">
                                            <div className="flex flex-col items-center justify-center text-slate-400">
                                                <svg className="w-12 h-12 mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                                <p className="font-semibold text-slate-500">Belum ada transaksi</p>
                                                <p className="text-xs font-medium mt-1">Tidak ada catatan untuk filter yang dipilih.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map((t, idx) => (
                                        <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                            <td className="py-4 px-4 font-bold text-slate-700 whitespace-nowrap">
                                                {t.date_formatted}
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="font-extrabold text-slate-800">{t.title}</div>
                                                {t.description && <div className="text-xs text-slate-500 font-medium mt-0.5">{t.description}</div>}
                                            </td>
                                            <td className="py-4 px-4 font-bold text-slate-500">
                                                <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-xs tracking-wide">
                                                    {t.category}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 font-bold text-slate-500">
                                                {t.payment_method}
                                            </td>
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
        </AuthenticatedLayout>
    );
}
