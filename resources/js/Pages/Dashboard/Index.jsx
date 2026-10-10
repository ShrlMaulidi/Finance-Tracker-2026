import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import OfferModal from '@/Components/OfferModal';

export default function Dashboard({ auth, summary, chartData, currentFilter, selectedMonth, selectedYear }) {
    const formatRp = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

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

    const monthInputValue = selectedMonth && selectedYear 
        ? `${selectedYear}-${String(selectedMonth).padStart(2, '0')}` 
        : '';

    const availableYears = Array.from({length: 10}, (_, i) => new Date().getFullYear() - 5 + i);

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />
            <OfferModal />

            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-10 space-y-6 sm:space-y-10 relative">
                
                {/* Header & Filter */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
                    <div>
                        <p className="text-xs md:text-sm font-bold text-[#009bd2] uppercase tracking-widest mb-1">Overview</p>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
                            Dashboard Keuangan
                        </h1>
                        <p className="text-slate-500 font-medium text-sm mt-1">Ringkasan kondisi keuangan Anda.</p>
                    </div>

                    <div className="flex flex-col md:flex-row gap-3 self-start md:self-end">
                        {currentFilter === 'bulan' && (
                            <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
                                <label className="text-xs font-bold text-slate-500 mr-2">Pilih Bulan:</label>
                                <input 
                                    type="month" 
                                    value={monthInputValue}
                                    onChange={handleMonthChange}
                                    className="border-none bg-transparent text-sm font-bold text-slate-800 focus:ring-0 p-0 cursor-pointer pr-2"
                                />
                            </div>
                        )}
                        {currentFilter === 'tahun' && (
                            <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
                                <label className="text-xs font-bold text-slate-500 mr-2">Pilih Tahun:</label>
                                <select 
                                    value={selectedYear || new Date().getFullYear()}
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
                                onClick={() => handleFilterChange('bulan')}
                                className={`px-4 py-2 rounded-lg font-bold text-xs md:text-sm transition-all duration-300 ${currentFilter === 'bulan' ? 'bg-white text-[#009bd2] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Bulanan
                            </button>
                            <button 
                                onClick={() => handleFilterChange('tahun')}
                                className={`px-4 py-2 rounded-lg font-bold text-xs md:text-sm transition-all duration-300 ${currentFilter === 'tahun' ? 'bg-white text-[#009bd2] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Tahunan
                            </button>
                            <button 
                                onClick={() => handleFilterChange('semua')}
                                className={`px-4 py-2 rounded-lg font-bold text-xs md:text-sm transition-all duration-300 ${currentFilter === 'semua' ? 'bg-white text-[#009bd2] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Semua Waktu
                            </button>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Pemasukan */}
                    <div className="bg-white p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col justify-between group hover:shadow-[0_8px_30px_rgb(16,185,129,0.1)] transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>
                            </div>
                            <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full">Pemasukan</span>
                        </div>
                        <div>
                            <p className="text-slate-400 font-bold text-sm mb-1">Total Pemasukan</p>
                            <h3 className="text-2xl lg:text-3xl font-black text-slate-800">{formatRp(summary.pemasukan)}</h3>
                        </div>
                    </div>

                    {/* Pengeluaran */}
                    <div className="bg-white p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col justify-between group hover:shadow-[0_8px_30px_rgb(244,63,94,0.1)] transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>
                            </div>
                            <span className="text-xs font-bold text-rose-500 bg-rose-50 px-3 py-1 rounded-full">Pengeluaran</span>
                        </div>
                        <div>
                            <p className="text-slate-400 font-bold text-sm mb-1">Total Pengeluaran</p>
                            <h3 className="text-2xl lg:text-3xl font-black text-slate-800">{formatRp(summary.pengeluaran)}</h3>
                        </div>
                    </div>

                    {/* Tabungan */}
                    <div className="bg-white p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col justify-between group hover:shadow-[0_8px_30px_rgb(0,155,210,0.1)] transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-[#009bd2]/10 text-[#009bd2] flex items-center justify-center">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                            </div>
                            <span className="text-xs font-bold text-[#009bd2] bg-[#009bd2]/10 px-3 py-1 rounded-full">Tabungan</span>
                        </div>
                        <div>
                            <p className="text-slate-400 font-bold text-sm mb-1">Total Tabungan</p>
                            <h3 className="text-2xl lg:text-3xl font-black text-slate-800">{formatRp(summary.tabungan)}</h3>
                        </div>
                    </div>
                </div>

                {/* Saldo Akhir */}
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
                    <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-[#009bd2]/20 rounded-full blur-3xl"></div>
                    <div className="relative z-10">
                        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mb-2">Estimasi Saldo Tersisa</p>
                        <h2 className="text-4xl lg:text-5xl font-black text-white">{formatRp(summary.saldo)}</h2>
                    </div>
                </div>

                {/* Grafik */}
                <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
                    <h3 className="text-lg font-extrabold text-slate-800 mb-6">Grafik Arus Kas</h3>
                    
                    {chartData.length > 0 ? (
                        <div className="h-[400px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={chartData}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis 
                                        dataKey="name" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }}
                                        dy={10}
                                    />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }}
                                        tickFormatter={(value) => `Rp ${value / 1000}k`}
                                        dx={-10}
                                    />
                                    <Tooltip 
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                                        formatter={(value) => [formatRp(value), ""]}
                                    />
                                    <Legend 
                                        iconType="circle"
                                        wrapperStyle={{ paddingTop: '20px', fontSize: '13px', fontWeight: 700 }}
                                    />
                                    <Bar dataKey="pemasukan" name="Pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} />
                                    <Bar dataKey="pengeluaran" name="Pengeluaran" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={12} />
                                    <Bar dataKey="tabungan" name="Tabungan" fill="#009bd2" radius={[4, 4, 0, 0]} barSize={12} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[400px] flex items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem]">
                            <p className="text-slate-400 font-bold">Tidak ada data transaksi untuk ditampilkan.</p>
                        </div>
                    )}
                </div>

            </div>
        </AuthenticatedLayout>
    );
}
