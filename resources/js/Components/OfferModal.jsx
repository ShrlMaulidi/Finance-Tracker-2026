import React, { useState, useEffect } from 'react';
import { usePage, Link } from '@inertiajs/react';

export default function OfferModal() {
    const { flash, pricing } = usePage().props;
    const [isOpen, setIsOpen] = useState(false);
    const [mobilePlan, setMobilePlan] = useState('pro_plus'); // 'pro_plus' | 'pro'

    const proMonthly = Number(pricing?.pro_monthly_price ?? 14999);
    const proPlusMonthly = Number(pricing?.pro_plus_monthly_price ?? 29999);

    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(number || 0);
    };

    useEffect(() => {
        const justLoggedIn = typeof window !== 'undefined' && sessionStorage.getItem('justLoggedIn') === 'true';
        const flashOffer = Boolean(flash?.show_subscription_offer);

        // Jika user baru login / register, selalu tampilkan modal penawaran
        if (flashOffer || justLoggedIn) {
            if (typeof window !== 'undefined') {
                sessionStorage.removeItem('justLoggedIn');
                sessionStorage.setItem('hasSeenOffer', 'true');
            }
            const timer = setTimeout(() => {
                setIsOpen(true);
            }, 600);
            return () => clearTimeout(timer);
        }

        // Jika belum pernah melihat penawaran sama sekali di sesi browser ini
        if (typeof window !== 'undefined') {
            const hasSeenOffer = sessionStorage.getItem('hasSeenOffer');
            if (!hasSeenOffer) {
                const timer = setTimeout(() => {
                    setIsOpen(true);
                    sessionStorage.setItem('hasSeenOffer', 'true');
                }, 1000);
                return () => clearTimeout(timer);
            }
        }
    }, [flash]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-hidden">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={() => setIsOpen(false)}
            ></div>
            
            {/* Modal Dialog */}
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-sm sm:max-w-2xl md:max-w-4xl max-h-[85vh] sm:max-h-[90vh] flex flex-col relative z-10 border border-slate-100 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
                
                {/* Close Button */}
                <button 
                    onClick={() => setIsOpen(false)}
                    aria-label="Tutup penawaran"
                    className="absolute top-2.5 right-2.5 sm:top-4 sm:right-4 w-7 h-7 sm:w-9 sm:h-9 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full flex items-center justify-center transition-colors z-20 shadow-xs"
                >
                    <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Header Banner */}
                <div className="px-4 py-2.5 sm:px-8 sm:py-5 text-center relative overflow-hidden border-b border-slate-100 bg-gradient-to-b from-sky-50/70 to-white shrink-0 pr-10 sm:pr-8">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-[#009bd2] rounded-full blur-[80px] opacity-10 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500 rounded-full blur-[80px] opacity-10 pointer-events-none"></div>
                    
                    <span className="inline-block py-0.5 px-2 rounded-full bg-indigo-50 text-indigo-600 text-[9px] sm:text-xs font-black tracking-widest uppercase mb-1 relative z-10 border border-indigo-100/60 shadow-2xs">
                        🎉 Penawaran Eksklusif
                    </span>
                    <h2 className="text-sm sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight relative z-10 leading-tight">
                        Tingkatkan Pengalaman Finansial Anda
                    </h2>
                    <p className="text-slate-500 text-[11px] sm:text-sm max-w-lg mx-auto relative z-10 leading-relaxed font-medium mt-0.5 hidden sm:block">
                        Buka integrasi WhatsApp AI otomatis, export laporan tanpa batas, dan analisis cerdas.
                    </p>
                </div>

                {/* Scrollable Content Body */}
                <div className="flex-1 overflow-y-auto p-2.5 sm:p-6 bg-slate-50/70">
                    
                    {/* Mobile Filter / Segmented Switcher (2 Tabs on Mobile) */}
                    <div className="flex md:hidden bg-slate-200/80 p-1 rounded-xl mb-2.5 max-w-[270px] mx-auto text-xs font-bold shadow-2xs">
                        <button 
                            type="button" 
                            onClick={() => setMobilePlan('pro_plus')} 
                            className={`flex-1 py-1 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${mobilePlan === 'pro_plus' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                            <span>⭐ Pro Plus</span>
                            <span className="text-[9px] bg-indigo-50 text-indigo-600 px-1 rounded font-extrabold">Top</span>
                        </button>
                        <button 
                            type="button" 
                            onClick={() => setMobilePlan('pro')} 
                            className={`flex-1 py-1 px-2 rounded-lg transition-all flex items-center justify-center gap-1 ${mobilePlan === 'pro' ? 'bg-white text-[#009bd2] shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                            <span>Paket Pro</span>
                        </button>
                    </div>

                    {/* Cards Grid */}
                    <div className="grid md:grid-cols-2 gap-3 sm:gap-6 max-w-3xl mx-auto items-stretch">
                        
                        {/* Paket Pro Plus (Paling Populer & Unggulan) */}
                        <div className={`bg-white rounded-xl sm:rounded-3xl p-3.5 sm:p-6 border-2 border-indigo-500 shadow-md shadow-indigo-500/10 relative overflow-hidden flex flex-col justify-between transition-all ${
                            mobilePlan === 'pro' ? 'hidden md:flex' : 'flex'
                        }`}>
                            {/* Best Value Badge */}
                            <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[9px] sm:text-[10px] font-black uppercase tracking-wider py-0.5 px-2.5 sm:py-1 sm:px-4 rounded-bl-xl shadow-xs">
                                Paling Populer
                            </div>
                            
                            <div>
                                <div className="mb-2 sm:mb-4 pr-16 sm:pr-0">
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                        <h3 className="text-base sm:text-2xl font-black text-slate-900">Pro Plus</h3>
                                        <span className="text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">AI Terintegrasi</span>
                                    </div>
                                    <p className="text-[10.5px] sm:text-xs font-medium text-slate-500 mt-0.5">Asisten keuangan pintar WhatsApp di saku Anda.</p>
                                </div>
                                
                                <div className="mb-2.5 sm:mb-5 pb-2 sm:pb-3 border-b border-slate-100">
                                    <span className="text-[10px] sm:text-xs font-bold text-slate-400 line-through mr-1.5">{formatRupiah(Math.round(proPlusMonthly * 1.35))}</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-xl sm:text-3xl font-black text-indigo-600">{formatRupiah(proPlusMonthly)}</span>
                                        <span className="text-[10px] sm:text-xs font-bold text-slate-400">/bulan</span>
                                    </div>
                                </div>
                                
                                <ul className="space-y-1.5 sm:space-y-3 mb-3.5 sm:mb-6 text-[10.5px] sm:text-sm">
                                    <li className="flex items-start gap-1.5 sm:gap-2">
                                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                                            <svg className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                        </div>
                                        <span className="text-slate-700 font-medium"><strong>Semua fitur Paket Pro</strong> (Full Akses)</span>
                                    </li>
                                    <li className="flex items-start gap-1.5 sm:gap-2">
                                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                                            <svg className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                        </div>
                                        <span className="text-slate-700 font-medium flex items-center gap-1.5 flex-wrap">
                                            <strong>Integrasi Agent AI WhatsApp 24/7</strong>
                                            <span className="flex h-1.5 w-1.5 relative">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
                                            </span>
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-1.5 sm:gap-2">
                                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                                            <svg className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                        </div>
                                        <span className="text-slate-700 font-medium">Catat transaksi otomatis & scan nota via WA</span>
                                    </li>
                                </ul>
                            </div>
                            
                            <Link 
                                href={route('berlangganan.index')}
                                onClick={() => setIsOpen(false)}
                                className="w-full py-2.5 sm:py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 active:scale-[0.99] text-white font-extrabold text-xs sm:text-sm transition-all text-center block shadow-md shadow-indigo-600/25"
                            >
                                Pilih Pro Plus &rarr;
                            </Link>
                        </div>

                        {/* Paket Pro */}
                        <div className={`bg-white rounded-xl sm:rounded-3xl p-3.5 sm:p-6 border-2 border-slate-200 hover:border-[#009bd2] transition-all flex flex-col justify-between shadow-xs ${
                            mobilePlan === 'pro_plus' ? 'hidden md:flex' : 'flex'
                        }`}>
                            <div>
                                <div className="mb-2 sm:mb-4">
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-base sm:text-2xl font-black text-slate-800">Paket Pro</h3>
                                        <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-50 text-[#009bd2] border border-sky-100">Hemat 25%</span>
                                    </div>
                                    <p className="text-[10.5px] sm:text-xs font-medium text-slate-500 mt-0.5">Akses penuh semua modul finansial tanpa batas.</p>
                                </div>
                                
                                <div className="mb-2.5 sm:mb-5 pb-2 sm:pb-3 border-b border-slate-100">
                                    <span className="text-[10px] sm:text-xs font-bold text-slate-400 line-through mr-1.5">{formatRupiah(Math.round(proMonthly * 1.35))}</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-xl sm:text-3xl font-black text-[#009bd2]">{formatRupiah(proMonthly)}</span>
                                        <span className="text-[10px] sm:text-xs font-bold text-slate-400">/bulan</span>
                                    </div>
                                </div>
                                
                                <ul className="space-y-1.5 sm:space-y-3 mb-3.5 sm:mb-6 text-[10.5px] sm:text-sm">
                                    <li className="flex items-start gap-1.5 sm:gap-2">
                                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#009bd2]/10 text-[#009bd2] flex items-center justify-center shrink-0 mt-0.5">
                                            <svg className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                        </div>
                                        <span className="text-slate-700 font-medium"><strong>Target, tagihan, kategori & metode</strong> tanpa batas</span>
                                    </li>
                                    <li className="flex items-start gap-1.5 sm:gap-2">
                                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#009bd2]/10 text-[#009bd2] flex items-center justify-center shrink-0 mt-0.5">
                                            <svg className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                        </div>
                                        <span className="text-slate-700 font-medium"><strong>Akses penuh</strong> seluruh modul anggaran</span>
                                    </li>
                                    <li className="flex items-start gap-1.5 sm:gap-2">
                                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#009bd2]/10 text-[#009bd2] flex items-center justify-center shrink-0 mt-0.5">
                                            <svg className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                        </div>
                                        <span className="text-slate-700 font-medium">Laporan keuangan & ekspor PDF / Excel lengkap</span>
                                    </li>
                                </ul>
                            </div>
                            
                            <Link 
                                href={route('berlangganan.index')}
                                onClick={() => setIsOpen(false)}
                                className="w-full py-2.5 sm:py-3.5 rounded-xl bg-slate-900 hover:bg-[#009bd2] active:scale-[0.99] text-white font-extrabold text-xs sm:text-sm transition-colors text-center block shadow-xs"
                            >
                                Pilih Paket Pro
                            </Link>
                        </div>
                        
                    </div>
                    
                    {/* Free Version / Dismiss Button */}
                    <div className="text-center mt-2.5 sm:mt-5 pb-0.5">
                        <button 
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="text-[10.5px] sm:text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors py-1 px-3"
                        >
                            Lanjutkan dengan versi Gratis &rarr;
                        </button>
                    </div>
                </div>
                
            </div>
        </div>
    );
}
