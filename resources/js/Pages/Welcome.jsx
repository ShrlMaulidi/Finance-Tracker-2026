import { Head, Link } from '@inertiajs/react';

export default function Welcome({ auth }) {
    return (
        <div 
            className="min-h-screen relative flex flex-col font-sans" 
            style={{ background: 'radial-gradient(circle at 75% 25%, #f0f7ff 0%, #fafcff 40%, #ffffff 100%)' }}
        >
            <Head title="FinanceTrack - AI Financial Assistant" />
            
            {/* Navbar / Header */}
            <nav className="flex justify-between items-center py-6 px-8 lg:px-12 backdrop-blur-md bg-white/30 sticky top-0 z-50 border-b border-white/50">
                <div className="text-2xl font-extrabold text-[#009bd2] tracking-tight">FinanceTrack</div>
                <div className="space-x-4 flex items-center">
                    {auth?.user ? (
                        <Link 
                            href={route('dashboard')} 
                            className="px-6 py-2.5 bg-[#009bd2] text-white font-semibold rounded-lg hover:bg-[#0089ba] transition-colors shadow-sm"
                        >
                            Go to Dashboard
                        </Link>
                    ) : (
                        <>
                            <Link 
                                href={route('login')} 
                                className="hidden sm:inline-block px-5 py-2.5 text-slate-600 font-bold hover:text-[#009bd2] transition-colors"
                            >
                                Log in
                            </Link>
                            <Link 
                                href={route('register')} 
                                className="px-6 py-2 border-2 border-[#009bd2] text-[#009bd2] font-bold rounded-lg hover:bg-[#009bd2]/10 transition-colors shadow-sm text-sm"
                            >
                                Sign Up
                            </Link>
                        </>
                    )}
                </div>
            </nav>

            {/* Hero Section */}
            <main className="flex-1 flex flex-col items-center pt-20 px-6 text-center w-full max-w-6xl mx-auto overflow-hidden">
                {/* Badge AI */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#009bd2]/10 text-[#009bd2] font-bold text-xs uppercase tracking-wider mb-8 border border-[#009bd2]/20 shadow-sm">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#009bd2] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#009bd2]"></span>
                    </span>
                    AI-Powered WhatsApp Integration
                </div>

                <h1 className="text-5xl md:text-[72px] font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-8">
                    Smart Way to Manage <br className="hidden md:block"/> Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#009bd2] to-cyan-400">Wealth</span>
                </h1>
                
                <p className="text-lg md:text-xl text-slate-500 max-w-2xl mb-12 leading-relaxed font-medium">
                    Catat pengeluaran, pantau pemasukan, dan analisis kebiasaan finansial Anda secara instan dan otomatis melalui obrolan WhatsApp.
                </p>

                {/* Call to Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md z-20">
                    {auth?.user ? (
                        <Link 
                            href={route('dashboard')} 
                            className="w-full bg-[#009bd2] hover:bg-[#0089ba] text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 flex justify-center items-center gap-2"
                        >
                            Buka Dashboard Utama
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                        </Link>
                    ) : (
                        <>
                            <Link 
                                href={route('register')} 
                                className="flex-1 bg-[#009bd2] hover:bg-[#0089ba] text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
                            >
                                Mulai Gratis
                            </Link>
                            <Link 
                                href={route('login')} 
                                className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-slate-700 font-bold py-4 px-8 rounded-xl transition-all shadow-sm"
                            >
                                Masuk
                            </Link>
                        </>
                    )}
                </div>

                {/* Feature Cards Showcase */}
                <div className="mt-20 w-full relative z-10 pb-16">
                    <div className="bg-white/60 backdrop-blur-xl border border-white/60 shadow-[0_20px_50px_-12px_rgba(0,155,210,0.1)] rounded-[2.5rem] p-6 md:p-10 mx-auto w-full max-w-5xl">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-left hover:shadow-md transition-shadow">
                                <div className="w-14 h-14 bg-[#009bd2]/10 text-[#009bd2] rounded-2xl flex items-center justify-center text-2xl mb-6">💬</div>
                                <h3 className="font-bold text-slate-800 text-xl mb-3">WhatsApp AI Bot</h3>
                                <p className="text-slate-500 text-sm leading-relaxed">Catat transaksi cukup dengan mengirim pesan chat natural seperti <span className="font-semibold text-slate-700">"Makan siang 50rb"</span>. AI yang urus sisanya.</p>
                            </div>
                            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-left hover:shadow-md transition-shadow">
                                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl mb-6">📊</div>
                                <h3 className="font-bold text-slate-800 text-xl mb-3">Interaktif & Real-time</h3>
                                <p className="text-slate-500 text-sm leading-relaxed">Pantau arus kas Anda melalui grafik dan dashboard yang diperbarui secara instan dengan teknologi React & Inertia.</p>
                            </div>
                            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-left hover:shadow-md transition-shadow">
                                <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center text-2xl mb-6">🔒</div>
                                <h3 className="font-bold text-slate-800 text-xl mb-3">Aman & Privat</h3>
                                <p className="text-slate-500 text-sm leading-relaxed">Data finansial Anda terpusat di server Anda sendiri. Tidak ada pelacakan pihak ketiga, kendali 100% di tangan Anda.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="py-8 text-center text-[13px] text-gray-400 font-medium space-x-6 relative z-20">
                <span>&copy; 2026 FinanceTrack. All rights reserved.</span>
                <a href="#" className="hover:text-gray-600 transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-gray-600 transition-colors">Privacy Policy</a>
            </footer>
        </div>
    );
}
