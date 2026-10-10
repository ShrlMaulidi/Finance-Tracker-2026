import React from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Index({ ihsg, usdToIdr, news }) {
    const formatRp = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
    const formatNumber = (num) => new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);

    const isIhsgUp = ihsg && ihsg.change >= 0;
    
    return (
        <AuthenticatedLayout>
            <Head title="Berita Hari Ini" />
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-10 space-y-6 sm:space-y-8 animate-fade-in relative z-10">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-6">
                    <div>
                        <p className="text-xs md:text-sm font-bold text-[#009bd2] uppercase tracking-widest mb-1 md:mb-2">Informasi & Market</p>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                            Berita Hari Ini
                        </h1>
                    </div>
                </div>

                {/* Market Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* IHSG Card */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:border-[#009bd2]/30 transition-colors">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full blur-[40px] opacity-50 group-hover:bg-[#009bd2]/10 transition-colors"></div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div>
                                <p className="text-sm font-bold text-slate-500 mb-1">IHSG (Indeks Harga Saham Gabungan)</p>
                                <h3 className="text-3xl font-black text-slate-800 tracking-tight">
                                    {ihsg ? formatNumber(ihsg.price) : 'Memuat...'}
                                </h3>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0">
                                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
                            </div>
                        </div>
                        {ihsg && (
                            <div className="mt-4 flex items-center gap-2">
                                <span className={`px-2 py-1 rounded-lg text-xs font-bold ${isIhsgUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                    {isIhsgUp ? '+' : ''}{formatNumber(ihsg.change)} ({formatNumber((ihsg.change / ihsg.previous_close) * 100)}%)
                                </span>
                                <span className="text-xs font-semibold text-slate-400">vs hari sebelumnya</span>
                            </div>
                        )}
                    </div>

                    {/* USD to IDR Card */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full blur-[40px] opacity-50 group-hover:bg-emerald-500/10 transition-colors"></div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div>
                                <p className="text-sm font-bold text-slate-500 mb-1">Kurs Dollar (USD to IDR)</p>
                                <h3 className="text-3xl font-black text-slate-800 tracking-tight">
                                    {usdToIdr ? formatRp(usdToIdr) : 'Memuat...'}
                                </h3>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0">
                                <span className="text-xl font-black text-slate-400">$</span>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                            <span className="px-2 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-600">
                                1 USD = {usdToIdr ? formatRp(usdToIdr) : '...'}
                            </span>
                            <span className="text-xs font-semibold text-slate-400">Update hari ini</span>
                        </div>
                    </div>
                </div>

                {/* News Section */}
                <div className="bg-white rounded-[2rem] p-6 md:p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
                            </div>
                            Berita Keuangan & Market
                        </h2>
                        <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                            Sumber: CNBC Indonesia
                        </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {news && news.length > 0 ? (
                            news.map((item, index) => (
                                <a 
                                    key={index} 
                                    href={item.link} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="group flex flex-col bg-slate-50 rounded-3xl overflow-hidden border border-slate-100 hover:border-[#009bd2]/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                                >
                                    <div className="h-48 bg-slate-200 relative overflow-hidden shrink-0">
                                        {item.image ? (
                                            <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                <svg className="w-12 h-12 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    </div>
                                    <div className="p-5 flex flex-col flex-1">
                                        <p className="text-[11px] font-bold text-[#009bd2] uppercase tracking-wider mb-2">{item.pubDate}</p>
                                        <h3 className="text-base font-bold text-slate-800 leading-snug group-hover:text-[#009bd2] transition-colors mb-3 line-clamp-2">
                                            {item.title}
                                        </h3>
                                        <p className="text-sm text-slate-500 line-clamp-3 mt-auto">
                                            {item.description}
                                        </p>
                                    </div>
                                </a>
                            ))
                        ) : (
                            <div className="col-span-full py-12 text-center text-slate-500">
                                <svg className="w-12 h-12 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
                                <p className="font-semibold text-lg">Belum ada berita hari ini.</p>
                                <p className="text-sm mt-1">Silakan coba beberapa saat lagi.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </AuthenticatedLayout>
    );
}
