import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';

export default function Maintenance({ supportEmail = 'support@financetrack.com', supportWa = '6285212867574' }) {
    const { auth } = usePage().props;
    const user = auth?.user;

    const formattedWa = supportWa.replace(/\D/g, '').replace(/^0/, '62');

    return (
        <div 
            className="min-h-screen relative flex flex-col font-sans justify-between" 
            style={{ background: 'radial-gradient(circle at 75% 25%, #f0f7ff 0%, #fafcff 40%, #ffffff 100%)' }}
        >
            <Head title="Pemeliharaan Sistem - FinanceTrack" />

            {/* Top Navigation / Brand */}
            <header className="w-full">
                <nav className="max-w-7xl mx-auto flex justify-between items-center py-4 px-4 sm:px-8">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-[#009bd2] to-cyan-400 flex items-center justify-center text-white shadow-md shadow-[#009bd2]/20">
                            <img src="/logo.png" alt="Logo" className="w-5 h-5 object-contain" />
                        </div>
                        <span className="text-xl sm:text-2xl font-black text-[#009bd2] tracking-tight">FinanceTrack</span>
                    </div>

                    <div className="flex items-center gap-3">
                        {user ? (
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                                    {user.name}
                                </span>
                                <Link
                                    href={route('logout')}
                                    method="post"
                                    as="button"
                                    className="px-3.5 py-1.5 sm:px-4 sm:py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs sm:text-sm transition-all"
                                >
                                    Keluar
                                </Link>
                            </div>
                        ) : (
                            <Link
                                href={route('login')}
                                className="px-3.5 py-1.5 sm:px-4 sm:py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs sm:text-sm transition-all flex items-center gap-1.5 shadow-xs"
                            >
                                <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <span>Akses Admin</span>
                            </Link>
                        )}
                    </div>
                </nav>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 w-full">
                <div className="w-full max-w-[500px] mx-auto text-center">
                    
                    {/* Card Container */}
                    <div className="bg-white/95 sm:bg-white backdrop-blur-sm p-6 sm:p-9 rounded-2xl sm:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 space-y-6">
                        
                        {/* Maintenance Icon Box */}
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-50 border border-amber-200 text-amber-500 flex items-center justify-center mx-auto shadow-xs">
                            <svg className="w-8 h-8 sm:w-10 sm:h-10 animate-spin-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>

                        {/* Status Badge */}
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold uppercase tracking-wider">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                            Pemeliharaan Sistem
                        </div>

                        {/* Headings */}
                        <div>
                            <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                                Sistem Sedang Dalam Pemeliharaan
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed mt-2">
                                Kami sedang melakukan pembaruan berkala dan optimalisasi infrastruktur server untuk meningkatkan performa serta keandalan layanan FinanceTrack.
                            </p>
                        </div>

                        {/* Contact Channels */}
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-left space-y-2.5">
                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                Pusat Bantuan & Layanan
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <a
                                    href={`https://wa.me/${formattedWa}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-3 rounded-xl bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/20 transition-all flex items-center gap-2.5 shadow-2xs group"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.747.953 3.71 1.456 5.711 1.456h.005c6.554 0 11.89-5.335 11.893-11.892a11.82 11.82 0 00-3.484-8.409z" />
                                        </svg>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-slate-800">WhatsApp CS</p>
                                        <p className="text-[11px] text-slate-400 font-medium truncate">+{formattedWa}</p>
                                    </div>
                                </a>

                                <a
                                    href={`mailto:${supportEmail}`}
                                    className="p-3 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/20 transition-all flex items-center gap-2.5 shadow-2xs group"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#009bd2] flex items-center justify-center shrink-0">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002-2v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-slate-800">Email Support</p>
                                        <p className="text-[11px] text-slate-400 font-medium truncate">{supportEmail}</p>
                                    </div>
                                </a>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-2 pt-1">
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full bg-[#009bd2] hover:bg-[#0089ba] active:scale-[0.99] text-white font-bold py-2.5 sm:py-3 text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-[#009bd2]/20 flex items-center justify-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <span>Segarkan Halaman</span>
                            </button>

                            <Link
                                href={route('login')}
                                className="w-full bg-white border border-slate-200 hover:bg-slate-50 active:scale-[0.99] text-slate-700 font-semibold py-2.5 sm:py-3 text-xs sm:text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
                            >
                                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                </svg>
                                <span>Masuk Administrator</span>
                            </Link>
                        </div>

                    </div>

                </div>
            </main>

            {/* Footer */}
            <footer className="py-4 text-center text-[11px] sm:text-xs text-slate-400 font-medium">
                <p>&copy; 2026 FinanceTrack. Hak cipta dilindungi undang-undang.</p>
            </footer>
        </div>
    );
}
