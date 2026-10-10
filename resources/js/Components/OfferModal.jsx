import React, { useState, useEffect } from 'react';

export default function OfferModal() {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // Cek apakah user sudah melihat penawaran di sesi ini
        const hasSeenOffer = sessionStorage.getItem('hasSeenOffer');
        
        if (!hasSeenOffer) {
            // Tampilkan modal dengan sedikit delay agar terasa natural
            const timer = setTimeout(() => {
                setIsOpen(true);
                sessionStorage.setItem('hasSeenOffer', 'true');
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div 
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-fade-in"
                onClick={() => setIsOpen(false)}
            ></div>
            
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto sidebar-scroll relative z-10 animate-slide-up">
                
                {/* Tombol Close */}
                <button 
                    onClick={() => setIsOpen(false)}
                    className="absolute top-4 right-4 w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full flex items-center justify-center transition-colors z-20"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                <div className="p-6 sm:p-8 text-center relative overflow-hidden border-b border-slate-100">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#009bd2] rounded-full blur-[100px] opacity-10"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500 rounded-full blur-[100px] opacity-10"></div>
                    
                    <span className="inline-block py-1 px-3 rounded-full bg-indigo-50 text-indigo-600 text-xs font-black tracking-widest uppercase mb-3 relative z-10">
                        Penawaran Terbatas
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-3 relative z-10">
                        Tingkatkan Pengalaman Anda
                    </h2>
                    <p className="text-slate-500 text-base max-w-xl mx-auto relative z-10">
                        Pilih paket berlangganan untuk membuka semua fitur eksklusif dan mengelola keuangan Anda tanpa batas.
                    </p>
                </div>

                <div className="p-5 sm:p-8 bg-slate-50">
                    <div className="grid md:grid-cols-2 gap-5 sm:gap-6 max-w-3xl mx-auto">
                        
                        {/* Paket Pro */}
                        <div className="bg-white rounded-3xl p-6 border-2 border-slate-100 hover:border-[#009bd2] transition-colors relative group">
                            <div className="mb-6">
                                <h3 className="text-2xl font-black text-slate-800 mb-2">Paket Pro</h3>
                                <p className="text-sm font-medium text-slate-500">Akses tak terbatas ke semua menu.</p>
                            </div>
                            
                            <div className="mb-6">
                                <span className="text-sm font-bold text-slate-400 line-through mr-2">Rp 19.999</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-black text-[#009bd2]">Rp 14.999</span>
                                    <span className="text-sm font-bold text-slate-400">/bulan</span>
                                </div>
                            </div>
                            
                            <ul className="space-y-4 mb-8">
                                <li className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-[#009bd2]/10 text-[#009bd2] flex items-center justify-center shrink-0 mt-0.5">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <span className="text-slate-700 font-medium"><strong>Full akses</strong> semua menu & fitur</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-[#009bd2]/10 text-[#009bd2] flex items-center justify-center shrink-0 mt-0.5">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <span className="text-slate-700 font-medium">Bebas Iklan</span>
                                </li>
                            </ul>
                            
                            <button className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-[#009bd2] text-white font-bold transition-colors">
                                Pilih Paket Pro
                            </button>
                        </div>

                        {/* Paket Pro Plus */}
                        <div className="bg-white rounded-3xl p-6 border-2 border-indigo-500 shadow-xl relative overflow-hidden transform md:-translate-y-4">
                            {/* Best Value Badge */}
                            <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest py-1.5 px-4 rounded-bl-xl">
                                Paling Populer
                            </div>
                            
                            <div className="mb-6">
                                <h3 className="text-2xl font-black text-slate-800 mb-2">Pro Plus</h3>
                                <p className="text-sm font-medium text-slate-500">Asisten keuangan pintar di saku Anda.</p>
                            </div>
                            
                            <div className="mb-6">
                                <span className="text-sm font-bold text-slate-400 line-through mr-2">Rp 79.999</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-black text-indigo-600">Rp 59.999</span>
                                    <span className="text-sm font-bold text-slate-400">/bulan</span>
                                </div>
                            </div>
                            
                            <ul className="space-y-4 mb-8">
                                <li className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <span className="text-slate-700 font-medium"><strong>Full akses</strong> semua menu & fitur</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <span className="text-slate-700 font-medium flex items-center gap-2">
                                        <strong>Integrasi Agent AI WhatsApp</strong>
                                        <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span></span>
                                    </span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <span className="text-slate-700 font-medium">Laporan analitik pintar otomatis</span>
                                </li>
                            </ul>
                            
                            <button className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors shadow-lg shadow-indigo-600/30">
                                Pilih Pro Plus
                            </button>
                        </div>
                        
                    </div>
                    
                    <div className="text-center mt-8">
                        <button 
                            onClick={() => setIsOpen(false)}
                            className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            Lanjutkan dengan versi Gratis
                        </button>
                    </div>
                </div>
                
            </div>
        </div>
    );
}
