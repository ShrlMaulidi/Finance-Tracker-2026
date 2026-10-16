import { Head, Link } from '@inertiajs/react';

export default function Welcome({ auth, canRegister = true }) {
    return (
        <div
            className="min-h-screen relative flex flex-col font-sans"
            style={{ background: 'radial-gradient(circle at 75% 25%, #f0f7ff 0%, #fafcff 40%, #ffffff 100%)' }}
        >
            <Head title="FinanceTrack - AI Financial Assistant" />

            {/* Navbar / Header */}
            <nav className="flex justify-between items-center py-3.5 px-4 sm:px-8 lg:px-12 backdrop-blur-md bg-white/70 sticky top-0 z-50 border-b border-slate-100 shadow-2xs">
                <Link href="/" className="flex items-center gap-2 shrink-0">
                    <img src="/logo.png" alt="FinanceTrack Logo" className="w-7 h-7 sm:w-8 sm:h-8 object-contain" />
                    <span className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">FinanceTrack</span>
                </Link>

                <div className="flex items-center gap-2 sm:gap-3">
                    {auth?.user ? (
                        <Link
                            href={route('dashboard')}
                            className="px-3.5 py-1.5 sm:px-5 sm:py-2 bg-[#009bd2] hover:bg-[#0089ba] text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-sm shadow-[#009bd2]/25 active:scale-95 flex items-center gap-1.5"
                        >
                            <span>Dashboard</span>
                            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                        </Link>
                    ) : (
                        <>
                            <Link
                                href={route('login')}
                                className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-slate-600 font-bold hover:text-[#009bd2] transition-colors rounded-lg hover:bg-slate-50"
                            >
                                Masuk
                            </Link>
                            {canRegister && (
                                <Link
                                    href={route('register')}
                                    className="px-3.5 py-1.5 sm:px-5 sm:py-2 bg-[#009bd2] hover:bg-[#0089ba] text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-sm shadow-[#009bd2]/25 active:scale-95"
                                >
                                    Daftar
                                </Link>
                            )}
                        </>
                    )}
                </div>
            </nav>

            {/* Hero Section */}
            <main className="flex-1 flex flex-col items-center pt-8 sm:pt-14 md:pt-20 px-4 sm:px-6 text-center w-full max-w-6xl mx-auto overflow-hidden">
                {/* Badge AI */}

                {/* Main Heading */}
                <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-[70px] font-black text-slate-900 tracking-tight leading-[1.15] sm:leading-[1.1] mb-3.5 sm:mb-6 max-w-4xl mx-auto">
                    Smart Way to Manage <br className="hidden sm:inline" /> Your <span className="text-[#009bd2]">Wealth</span>
                </h1>

                {/* Subtitle */}
                <p className="text-xs sm:text-base md:text-lg text-slate-500 max-w-2xl mb-6 sm:mb-8 font-medium leading-relaxed px-2 sm:px-0">
                    Catat pengeluaran, pantau pemasukan, dan analisis kebiasaan finansial Anda secara instan dan otomatis melalui obrolan WhatsApp.
                </p>

                {/* Call to Actions */}
                <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-4 justify-center w-full max-w-sm sm:max-w-md z-20 px-2 sm:px-0">
                    {auth?.user ? (
                        <Link
                            href={route('dashboard')}
                            className="w-full bg-[#009bd2] hover:bg-[#0089ba] text-white font-extrabold py-3.5 px-6 rounded-xl transition-all shadow-md shadow-[#009bd2]/25 hover:-translate-y-0.5 active:scale-[0.98] text-sm sm:text-base flex justify-center items-center gap-2"
                        >
                            <span>Buka Dashboard Utama</span>
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                        </Link>
                    ) : canRegister ? (
                        <>
                            <Link
                                href={route('register')}
                                className="w-full sm:flex-1 bg-[#009bd2] hover:bg-[#0089ba] text-white font-extrabold py-3 sm:py-3.5 px-6 rounded-xl transition-all shadow-md shadow-[#009bd2]/25 hover:-translate-y-0.5 active:scale-[0.98] text-sm sm:text-base flex items-center justify-center gap-2"
                            >
                                <span>Mulai Gratis</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                            </Link>
                            <Link
                                href={route('login')}
                                className="w-full sm:flex-1 bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-700 font-bold py-3 sm:py-3.5 px-6 rounded-xl transition-all shadow-2xs hover:-translate-y-0.5 active:scale-[0.98] text-sm sm:text-base flex items-center justify-center"
                            >
                                Masuk
                            </Link>
                        </>
                    ) : (
                        <Link
                            href={route('login')}
                            className="w-full bg-[#009bd2] hover:bg-[#0089ba] text-white font-extrabold py-3.5 px-6 rounded-xl transition-all shadow-md shadow-[#009bd2]/25 hover:-translate-y-0.5 active:scale-[0.98] text-sm sm:text-base flex justify-center items-center gap-2"
                        >
                            <span>Masuk ke Akun Anda</span>
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                        </Link>
                    )}
                </div>

                {/* Trust Badges */}
                <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-6 sm:mt-8 text-[11px] sm:text-xs font-semibold text-slate-400">
                    <span className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        100% Gratis Digunakan
                    </span>
                    <span className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        Data Aman & Privat
                    </span>
                    <span className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-[#009bd2]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        Mendukung PWA HP
                    </span>
                </div>

                {/* Feature Cards Showcase */}
                <div className="mt-8 sm:mt-14 md:mt-20 w-full relative z-10 pb-10 sm:pb-16 max-w-5xl mx-auto px-1 sm:px-0">
                    <div className="text-center mb-5 sm:mb-8">
                        <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-[#009bd2] bg-[#009bd2]/10 px-3 py-1 rounded-full border border-[#009bd2]/20 inline-block mb-2">
                            Fitur Unggulan
                        </span>
                        <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                            Semua yang Anda butuhkan untuk kelola finansial
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                        {/* Card 1: WhatsApp Bot */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-sky-200 transition-all p-4 sm:p-5 md:p-6 flex flex-row md:flex-col items-start gap-3.5 sm:gap-4 text-left">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-sky-50 text-[#009bd2] border border-sky-100 flex items-center justify-center shrink-0 shadow-2xs">
                                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                    <h3 className="font-extrabold text-slate-900 text-sm sm:text-base md:text-lg tracking-tight">
                                        WhatsApp AI Bot
                                    </h3>
                                    <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100 md:hidden">
                                        Instan
                                    </span>
                                </div>
                                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">
                                    Catat transaksi cukup kirim chat natural seperti <span className="font-bold text-slate-700">"Makan siang 50rb"</span>. AI yang urus kategorinya.
                                </p>
                            </div>
                        </div>

                        {/* Card 2: Interactive Real-time */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-200 transition-all p-4 sm:p-5 md:p-6 flex flex-row md:flex-col items-start gap-3.5 sm:gap-4 text-left">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 shadow-2xs">
                                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                    <h3 className="font-extrabold text-slate-900 text-sm sm:text-base md:text-lg tracking-tight">
                                        Interaktif & Real-time
                                    </h3>
                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 md:hidden">
                                        Live
                                    </span>
                                </div>
                                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">
                                    Pantau arus kas Anda melalui grafik dan dashboard interaktif yang diperbarui secara instan.
                                </p>
                            </div>
                        </div>

                        {/* Card 3: Secure & Private */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all p-4 sm:p-5 md:p-6 flex flex-row md:flex-col items-start gap-3.5 sm:gap-4 text-left">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0 shadow-2xs">
                                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                    <h3 className="font-extrabold text-slate-900 text-sm sm:text-base md:text-lg tracking-tight">
                                        Aman & Privat
                                    </h3>
                                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 md:hidden">
                                        Privat
                                    </span>
                                </div>
                                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">
                                    Data finansial Anda terpusat di server Anda sendiri tanpa pelacakan pihak ketiga. Kendali 100% milik Anda.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="py-6 sm:py-8 px-4 text-center text-xs sm:text-[13px] text-slate-400 font-medium relative z-20 border-t border-slate-100/80 bg-white/40 backdrop-blur-xs">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6">
                    <span>&copy; 2026 FinanceTrack. All rights reserved.</span>
                    <div className="flex items-center gap-4">
                        <a href="#" className="hover:text-slate-600 transition-colors">Syarat & Ketentuan</a>
                        <span className="text-slate-300">•</span>
                        <a href="#" className="hover:text-slate-600 transition-colors">Kebijakan Privasi</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
