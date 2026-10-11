import React, { useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import UserAvatar from '@/Components/UserAvatar';

export default function AdminLayout({ children, title = 'Super Admin' }) {
    const { auth, flash, pricing } = usePage().props;
    const user = auth?.user || { name: 'Super Admin', email: 'admin@finance.track', role: 'superadmin' };

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const currentUrl = usePage().url;

    // Automatically ensure sidebar stays closed on mobile when navigating
    useEffect(() => {
        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
            setSidebarOpen(false);
        }
    }, [currentUrl]);

    // Flash messages toast
    useEffect(() => {
        if (flash?.success) {
            setToast({ show: true, message: flash.success, type: 'success' });
            const timer = setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4500);
            return () => clearTimeout(timer);
        }
        if (flash?.error) {
            setToast({ show: true, message: flash.error, type: 'error' });
            const timer = setTimeout(() => setToast(prev => ({ ...prev, show: false })), 5500);
            return () => clearTimeout(timer);
        }
    }, [flash]);

    const navItems = [
        {
            name: 'Dashboard',
            href: route('admin.dashboard'),
            active: route().current('admin.dashboard'),
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
            )
        },
        {
            name: 'Kelola User',
            href: route('admin.users.index'),
            active: route().current('admin.users.*'),
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            )
        },
        {
            name: 'Pengaturan',
            href: route('admin.settings.index'),
            active: route().current('admin.settings.*'),
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            )
        },
    ];

    return (
        <div className="flex h-screen h-[100dvh] bg-[#fbfbfb] text-slate-800 font-sans overflow-hidden selection:bg-[#009bd2] selection:text-white relative">
            
            {/* TOAST ALERT */}
            {toast.show && (
                <div className="fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md transition-all animate-bounce-subtle bg-white border-slate-200/80 text-slate-800">
                    {toast.type === 'success' ? (
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                        </div>
                    ) : (
                        <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                        </div>
                    )}
                    <div className="text-xs sm:text-sm font-semibold max-w-sm">{toast.message}</div>
                    <button onClick={() => setToast(prev => ({ ...prev, show: false }))} className="text-slate-400 hover:text-slate-600 p-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            )}

            {/* MOBILE SIDEBAR BACKDROP */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* SIDEBAR - STRICTLY FIXED ON DESKTOP & MOBILE */}
            <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 sm:w-72 bg-white border-r border-slate-100 flex flex-col h-full shrink-0 transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                
                {/* Header Brand */}
                <div className="h-16 sm:h-20 flex items-center px-6 border-b border-slate-100 gap-3.5 justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-[#009bd2] to-cyan-400 flex items-center justify-center shadow-md shadow-[#009bd2]/20">
                            <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain" />
                        </div>
                        <div>
                            <h1 className="font-extrabold text-slate-800 text-base tracking-tight leading-tight flex items-center gap-1.5">
                                FinanceTrack
                            </h1>
                            <span className="inline-block px-2 py-0.5 mt-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-[#009bd2] border border-blue-100">
                                Super Admin
                            </span>
                        </div>
                    </div>

                    <button 
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-50"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Navigation Menu (Scrolls internally if items overflow) */}
                <div className="flex-1 py-5 px-3 sm:px-4 space-y-1.5 overflow-y-auto">
                    <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Menu Utama
                    </div>

                    {navItems.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 group ${
                                item.active
                                    ? 'bg-blue-50/90 text-[#009bd2] shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                        >
                            <span className={`transition-transform duration-200 ${item.active ? 'text-[#009bd2]' : 'text-slate-400 group-hover:text-[#009bd2]'}`}>
                                {item.icon}
                            </span>
                            <span>{item.name}</span>
                        </Link>
                    ))}

                    <div className="pt-6 px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Navigasi Cepat
                    </div>

                    <Link
                        href={route('dashboard')}
                        className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:text-[#009bd2] hover:bg-slate-50 transition-all duration-200 group"
                    >
                        <span className="text-slate-400 group-hover:text-[#009bd2]">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        </span>
                        <span>Aplikasi Utama</span>
                    </Link>
                </div>

                {/* Sidebar Footer User Card */}
                <div className="p-3.5 border-t border-slate-100 bg-white shrink-0">
                    <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50/80 border border-slate-100 hover:bg-slate-50 transition-colors">
                        <UserAvatar user={user} size="sm" className="w-9 h-9" />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">{user.name}</p>
                            <p className="text-[10px] text-slate-400 font-medium truncate">{user.email}</p>
                        </div>
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            title="Log Out"
                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        </Link>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT WRAPPER */}
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#fbfbfb] relative">
                
                {/* FIXED HEADER CONTAINER (PINS HEADER & BANNER) */}
                <div className="fixed top-0 left-0 right-0 lg:static z-30 shrink-0">
                    <header className="h-14 sm:h-16 lg:h-20 bg-white/95 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-3.5 sm:px-6 lg:px-8 shadow-xs lg:shadow-none">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                aria-label="Buka Menu"
                                className="lg:hidden p-2 -ml-1 rounded-xl bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                            </button>

                            <div className="min-w-0">
                                <h2 className="text-sm sm:text-base lg:text-lg font-black text-slate-900 tracking-tight truncate">{title}</h2>
                                <p className="text-xs text-slate-400 hidden sm:block font-medium">Panel Kontrol Super Admin FinanceTrack</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                            {/* Live Status Badge */}
                            {pricing?.maintenance_mode ? (
                                <Link
                                    href={route('admin.settings.index')}
                                    className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] sm:text-xs font-bold animate-pulse hover:bg-amber-100 transition-all shrink-0"
                                >
                                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                                    <span className="hidden sm:inline">Mode Pemeliharaan Aktif</span>
                                    <span className="sm:hidden">Pemeliharaan</span>
                                </Link>
                            ) : (
                                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-bold">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    <span>Sistem Normal</span>
                                </div>
                            )}

                            <Link
                                href={route('dashboard')}
                                title="Kembali ke Aplikasi Utama"
                                className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs sm:text-sm font-bold border border-slate-200 transition-all shadow-xs shrink-0"
                            >
                                <svg className="w-4 h-4 text-[#009bd2]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                                <span className="hidden sm:inline">Ke Aplikasi</span>
                            </Link>
                        </div>
                    </header>

                    {/* MAINTENANCE MODE ALERT BANNER */}
                    {pricing?.maintenance_mode && (
                        <div className="bg-amber-50 border-b border-amber-200/80 px-3.5 sm:px-6 lg:px-8 py-2 sm:py-2.5 flex items-center justify-between text-[11px] sm:text-xs text-amber-800">
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0"></span>
                                <span className="truncate">
                                    <strong>Peringatan Pemeliharaan:</strong> Mode Pemeliharaan sedang <strong>AKTIF</strong>.
                                </span>
                            </div>
                            <Link
                                href={route('admin.settings.index')}
                                className="underline font-bold text-amber-900 hover:text-amber-950 shrink-0 ml-2"
                            >
                                Kelola &rarr;
                            </Link>
                        </div>
                    )}
                </div>

                {/* SCROLLABLE PAGE CONTENT (ONLY THIS AREA SCROLLS) */}
                <main className={`flex-1 overflow-y-auto p-3.5 sm:p-6 lg:p-8 ${pricing?.maintenance_mode ? 'pt-24 sm:pt-28 lg:pt-8' : 'pt-16 sm:pt-20 lg:pt-8'}`}>
                    {children}
                </main>
            </div>
        </div>
    );
}
