import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, Link, usePage } from '@inertiajs/react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export default function Dashboard({ auth, summary, chartData = [], currentFilter, selectedMonth, selectedYear }) {
    const pageUser = usePage().props.auth?.user;
    const user = auth?.user || pageUser;
    const isPro = Boolean(user?.is_pro ?? (user?.role === 'superadmin' || user?.subscription_tier === 'pro' || user?.subscription_tier === 'pro_plus'));

    const [chartType, setChartType] = useState('area'); // 'area' | 'bar'
    const [isMobile, setIsMobile] = useState(false);

    // Dummy preview wave for free users without transactions, to show an attractive blurred teaser
    const hasActualData = chartData && chartData.some(d => (d.pemasukan || 0) > 0 || (d.pengeluaran || 0) > 0 || (d.tabungan || 0) > 0);
    const displayChartData = !isPro && !hasActualData ? [
        { name: '1', pemasukan: 3200000, pengeluaran: 1800000, tabungan: 500000 },
        { name: '5', pemasukan: 2500000, pengeluaran: 1200000, tabungan: 400000 },
        { name: '10', pemasukan: 4800000, pengeluaran: 2900000, tabungan: 800000 },
        { name: '15', pemasukan: 3600000, pengeluaran: 2100000, tabungan: 600000 },
        { name: '20', pemasukan: 5100000, pengeluaran: 3400000, tabungan: 900000 },
        { name: '25', pemasukan: 4200000, pengeluaran: 2700000, tabungan: 700000 },
        { name: '30', pemasukan: 6000000, pengeluaran: 3100000, tabungan: 1200000 },
    ] : chartData;

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 640);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const formatRp = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

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

    const monthInputValue = selectedMonth && selectedYear 
        ? `${selectedYear}-${String(selectedMonth).padStart(2, '0')}` 
        : '';

    const availableYears = Array.from({length: 10}, (_, i) => new Date().getFullYear() - 5 + i);

    const monthNames = [
        '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
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
        }
        return null;
    };

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />

            <div className="max-w-7xl mx-auto px-3.5 py-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 relative">
                
                {/* Header & Filter */}
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
                            <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-800 tracking-tight truncate" title={formatRp(summary.pemasukan)}>{formatRp(summary.pemasukan)}</h3>
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
                            <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-800 tracking-tight truncate" title={formatRp(summary.pengeluaran)}>{formatRp(summary.pengeluaran)}</h3>
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
                            <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-800 tracking-tight truncate" title={formatRp(summary.tabungan)}>{formatRp(summary.tabungan)}</h3>
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
                            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight truncate" title={formatRp(summary.saldo)}>{formatRp(summary.saldo)}</h2>
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
                                {!isPro && (
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
                            {/* Chart Canvas (Blurred when !isPro) */}
                            <div className={`h-[280px] sm:h-[350px] md:h-[400px] w-full transition-all duration-500 ${
                                !isPro ? 'filter blur-[5px] sm:blur-[7px] opacity-40 select-none pointer-events-none' : ''
                            }`}>
                                <ResponsiveContainer width="100%" height="100%">
                                    {chartType === 'area' ? (
                                        <AreaChart
                                            data={displayChartData}
                                            margin={{ top: 16, right: isMobile ? 8 : 16, left: isMobile ? -5 : 5, bottom: 4 }}
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
                                                tick={{ fill: '#94a3b8', fontSize: isMobile ? 9 : 11, fontWeight: 700 }}
                                                dy={8}
                                                interval={currentFilter === 'bulan' ? (isMobile ? 4 : 2) : 0}
                                                tickFormatter={(val) => currentFilter === 'bulan' ? `Tgl ${val}` : val}
                                            />
                                            <YAxis 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{ fill: '#94a3b8', fontSize: isMobile ? 9 : 10, fontWeight: 700 }}
                                                tickFormatter={formatYAxis}
                                                width={isMobile ? 48 : 58}
                                            />
                                            <Tooltip content={<CustomTooltip />} />
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
                                            margin={{ top: 16, right: isMobile ? 8 : 16, left: isMobile ? -5 : 5, bottom: 4 }}
                                            barGap={2}
                                            barCategoryGap={displayChartData.length > 20 ? '15%' : '25%'}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis 
                                                dataKey="name" 
                                                axisLine={{ stroke: '#f1f5f9' }} 
                                                tickLine={false} 
                                                tick={{ fill: '#94a3b8', fontSize: isMobile ? 9 : 11, fontWeight: 700 }}
                                                dy={8}
                                                interval={currentFilter === 'bulan' ? (isMobile ? 4 : 2) : 0}
                                                tickFormatter={(val) => currentFilter === 'bulan' ? `Tgl ${val}` : val}
                                            />
                                            <YAxis 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{ fill: '#94a3b8', fontSize: isMobile ? 9 : 10, fontWeight: 700 }}
                                                tickFormatter={formatYAxis}
                                                width={isMobile ? 48 : 58}
                                            />
                                            <Tooltip content={<CustomTooltip />} />
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
                            {!isPro && (
                                <div className="absolute inset-0 z-20 flex items-center justify-center p-3 sm:p-6 bg-slate-900/5 backdrop-blur-[1px]">
                                    <div className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-6 max-w-sm sm:max-w-md w-full text-center border border-slate-100 shadow-xl shadow-slate-900/10 space-y-2.5 sm:space-y-3.5 animate-scale-up">
                                        {/* Lock Badge */}
                                        <div>
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 shadow-2xs text-[10px] sm:text-xs font-black uppercase tracking-wider">
                                                <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                                                </svg>
                                                <span>Fitur Eksklusif Pro</span>
                                            </span>
                                        </div>

                                        {/* Title & Description */}
                                        <div className="space-y-1">
                                            <h4 className="text-sm sm:text-lg font-black text-slate-900 tracking-tight">
                                                Grafik Arus Kas Terkunci
                                            </h4>
                                            <p className="text-[11px] sm:text-xs text-slate-500 font-medium leading-relaxed max-w-xs mx-auto">
                                                Pantau tren perbandingan arus kas pemasukan, pengeluaran & tabungan Anda secara visual dan interaktif.
                                            </p>
                                        </div>

                                        {/* Action Button */}
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

            </div>
        </AuthenticatedLayout>
    );
}
