import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Index({ ihsg, usdToIdr, news }) {
    const formatRp = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
    const formatNumber = (num) => new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);

    const [search, setSearch] = useState('');

    const isIhsgUp = ihsg && ihsg.change >= 0;

    const filteredNews = (news || []).filter(item => {
        if (!search.trim()) return true;
        const query = search.toLowerCase();
        return (item.title && item.title.toLowerCase().includes(query)) ||
               (item.description && item.description.toLowerCase().includes(query));
    });

    const featuredArticle = !search.trim() && filteredNews.length > 0 ? filteredNews[0] : null;
    const regularArticles = !search.trim() && filteredNews.length > 0 ? filteredNews.slice(1) : filteredNews;

    return (
        <AuthenticatedLayout>
            <Head title="Berita Hari Ini" />

            <div className="max-w-7xl mx-auto px-3.5 py-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
                
                {/* Header */}
                <div className="border-b border-slate-100 pb-3 sm:pb-4">
                    <p className="text-[11px] sm:text-xs md:text-sm font-bold text-[#009bd2] uppercase tracking-wider sm:tracking-widest mb-0.5 sm:mb-1">
                        Informasi & Market
                    </p>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
                        Berita Hari Ini
                    </h1>
                    <p className="text-slate-500 font-medium text-xs sm:text-sm mt-0.5 sm:mt-1">
                        Pantau pergerakan pasar saham, kurs mata uang, dan berita finansial terkini.
                    </p>
                </div>

                {/* Market Overview Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5">
                    {/* IHSG Card */}
                    <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-100 shadow-xs relative overflow-hidden group hover:border-[#009bd2]/30 transition-all">
                        <div className="absolute top-0 right-0 w-28 h-28 bg-[#009bd2]/5 rounded-full blur-2xl pointer-events-none group-hover:bg-[#009bd2]/10 transition-colors"></div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div>
                                <p className="text-xs sm:text-sm font-bold text-slate-500 mb-0.5 sm:mb-1">
                                    IHSG (Indeks Saham Gabungan)
                                </p>
                                <h3 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
                                    {ihsg ? formatNumber(ihsg.price) : 'Memuat...'}
                                </h3>
                            </div>
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-50/80 text-[#009bd2] flex items-center justify-center shrink-0">
                                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
                            </div>
                        </div>
                        {ihsg && (
                            <div className="mt-3 sm:mt-4 flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                <span className={`px-2 py-0.5 sm:py-1 rounded-lg text-[11px] sm:text-xs font-black flex items-center gap-0.5 ${isIhsgUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                    <svg className={`w-3.5 h-3.5 ${isIhsgUp ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                                    {isIhsgUp ? '+' : ''}{formatNumber(ihsg.change)} ({formatNumber((ihsg.change / ihsg.previous_close) * 100)}%)
                                </span>
                                <span className="text-[10px] sm:text-xs font-semibold text-slate-400">vs hari sebelumnya</span>
                            </div>
                        )}
                    </div>

                    {/* USD to IDR Card */}
                    <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-100 shadow-xs relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                        <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/10 transition-colors"></div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div>
                                <p className="text-xs sm:text-sm font-bold text-slate-500 mb-0.5 sm:mb-1">
                                    Kurs Dollar (USD to IDR)
                                </p>
                                <h3 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
                                    {usdToIdr ? formatRp(usdToIdr) : 'Memuat...'}
                                </h3>
                            </div>
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-50/80 text-emerald-600 flex items-center justify-center shrink-0">
                                <span className="text-lg sm:text-xl font-black">$</span>
                            </div>
                        </div>
                        <div className="mt-3 sm:mt-4 flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            <span className="px-2 py-0.5 sm:py-1 rounded-lg text-[11px] sm:text-xs font-black bg-slate-100 text-slate-700">
                                1 USD = {usdToIdr ? formatRp(usdToIdr) : '...'}
                            </span>
                            <span className="text-[10px] sm:text-xs font-semibold text-slate-400">Update hari ini</span>
                        </div>
                    </div>
                </div>

                {/* News Section */}
                <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 lg:p-8 border border-slate-100 shadow-xs space-y-4 sm:space-y-6">
                    {/* News Header & Search */}
                    <div className="space-y-3 sm:space-y-4 pb-3 sm:pb-4 border-b border-slate-100">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                            <h2 className="text-base sm:text-lg md:text-xl font-black text-slate-800 flex items-center gap-2 sm:gap-2.5">
                                <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
                                </div>
                                Berita Keuangan & Market
                            </h2>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] sm:text-xs font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 shrink-0">
                                    CNBC Indonesia
                                </span>
                                <span className="text-[10px] sm:text-xs font-extrabold text-[#009bd2] bg-blue-50 px-2.5 py-1 rounded-lg shrink-0">
                                    {filteredNews.length} Berita
                                </span>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </div>
                            <input 
                                type="text"
                                placeholder="Cari topik atau judul berita..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#009bd2] focus:ring-1 focus:ring-[#009bd2] transition-all"
                            />
                            {search && (
                                <button 
                                    onClick={() => setSearch('')}
                                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Featured Article (Hero card) - Only when no search is active */}
                    {featuredArticle && (
                        <a 
                            href={featuredArticle.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative flex flex-col md:grid md:grid-cols-12 rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
                        >
                            <div className="md:col-span-7 h-44 sm:h-56 md:h-72 bg-slate-800 relative overflow-hidden shrink-0">
                                {featuredArticle.image ? (
                                    <img 
                                        src={featuredArticle.image} 
                                        alt={featuredArticle.title} 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                                        <svg className="w-12 h-12 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent md:hidden"></div>
                                <span className="absolute top-3 left-3 bg-[#009bd2] text-white text-[10px] sm:text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-sm">
                                    ★ Berita Utama
                                </span>
                            </div>
                            <div className="md:col-span-5 p-4 sm:p-6 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-2 text-slate-400 text-[11px] sm:text-xs font-semibold">
                                        <svg className="w-3.5 h-3.5 text-[#009bd2]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        <span>{featuredArticle.pubDate}</span>
                                    </div>
                                    <h3 className="text-sm sm:text-base md:text-lg font-black text-white leading-snug group-hover:text-[#009bd2] transition-colors line-clamp-2 md:line-clamp-3 mb-2">
                                        {featuredArticle.title}
                                    </h3>
                                    {featuredArticle.description && (
                                        <p className="text-xs sm:text-sm text-slate-300 font-medium line-clamp-2 sm:line-clamp-3">
                                            {featuredArticle.description}
                                        </p>
                                    )}
                                </div>
                                <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-extrabold text-[#009bd2]">
                                    <span>Baca Berita Selengkapnya</span>
                                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                </div>
                            </div>
                        </a>
                    )}

                    {/* Articles Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
                        {regularArticles.length > 0 ? (
                            regularArticles.map((item, index) => (
                                <a 
                                    key={index} 
                                    href={item.link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="group flex flex-col bg-white rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-100/90 hover:border-[#009bd2]/40 shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
                                >
                                    {/* Thumbnail Image */}
                                    <div className="h-36 sm:h-44 bg-slate-100 relative overflow-hidden shrink-0">
                                        {item.image ? (
                                            <img 
                                                src={item.image} 
                                                alt={item.title} 
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                <svg className="w-10 h-10 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-3.5 sm:p-5 flex flex-col flex-1 justify-between">
                                        <div>
                                            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-[#009bd2] uppercase tracking-wider mb-1.5">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                <span>{item.pubDate}</span>
                                            </div>
                                            <h3 className="text-xs sm:text-sm md:text-base font-extrabold text-slate-800 leading-snug group-hover:text-[#009bd2] transition-colors mb-1.5 line-clamp-2">
                                                {item.title}
                                            </h3>
                                            {item.description && (
                                                <p className="text-[11px] sm:text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">
                                                    {item.description}
                                                </p>
                                            )}
                                        </div>

                                        <div className="mt-3 pt-2.5 border-t border-slate-50 flex items-center justify-between text-[11px] sm:text-xs font-black text-slate-600 group-hover:text-[#009bd2] transition-colors">
                                            <span>Baca Berita</span>
                                            <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-[#009bd2]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                                        </div>
                                    </div>
                                </a>
                            ))
                        ) : (
                            <div className="col-span-full py-12 text-center text-slate-400">
                                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
                                </div>
                                <p className="font-extrabold text-sm sm:text-base text-slate-700">Tidak ada berita yang sesuai</p>
                                <p className="text-xs text-slate-400 mt-0.5">Coba gunakan kata kunci pencarian yang lain.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </AuthenticatedLayout>
    );
}
