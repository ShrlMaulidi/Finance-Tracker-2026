import React from 'react';
import { Link } from '@inertiajs/react';

export default function MobileBottomNav({
    onOpenMenu,
    onToggleMenu,
    isMenuOpen = false,
    className = '',
}) {
    const handleMenuToggle = onToggleMenu || onOpenMenu;

    // 5 Primary Mobile Tabs
    const navItems = [
        {
            key: 'home',
            label: 'Home',
            routeName: 'dashboard',
            isActive: route().current('dashboard'),
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            ),
        },
        {
            key: 'transaksi',
            label: 'Transaksi',
            routeName: 'transaksi.index',
            isActive: route().current('transaksi.*'),
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
        },
        {
            key: 'tagihan',
            label: 'Tagihan',
            routeName: 'tagihan.index',
            isActive: route().current('tagihan.*') || route().current('hutang-piutang.*'),
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h6m-6 4h4" />
                </svg>
            ),
        },
        {
            key: 'target',
            label: 'Target',
            routeName: 'tabungan.target',
            isActive: route().current('tabungan.*') || route().current('anggaran.*'),
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9" strokeWidth={2} />
                    <circle cx="12" cy="12" r="5" strokeWidth={2} />
                    <circle cx="12" cy="12" r="1.5" strokeWidth={2} fill="currentColor" />
                </svg>
            ),
        },
    ];

    return (
        <nav
            aria-label="Mobile Bottom Navigation"
            className={`fixed bottom-0 inset-x-0 z-[60] bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] md:hidden transition-transform duration-300 pb-[env(safe-area-inset-bottom)] ${className}`}
        >
            <div className="h-16 flex items-center justify-around px-2 max-w-lg mx-auto">
                {/* 4 Direct Navigation Tabs */}
                {navItems.map((item) => {
                    const active = item.isActive && !isMenuOpen;

                    return (
                        <Link
                            key={item.key}
                            href={route(item.routeName)}
                            onClick={() => {
                                if (isMenuOpen && handleMenuToggle) {
                                    handleMenuToggle();
                                }
                            }}
                            className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all duration-200 active:scale-95 relative group ${
                                active
                                    ? 'text-[#009bd2]'
                                    : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            {/* Active Top Bar Indicator */}
                            {active && (
                                <span className="absolute top-0 w-8 h-[3px] bg-[#009bd2] rounded-full shadow-[0_1px_6px_rgba(0,155,210,0.4)] animate-fadeIn" />
                            )}

                            <div className={`transition-transform duration-200 ${active ? 'scale-110 -translate-y-0.5' : 'group-hover:scale-105'}`}>
                                {item.icon}
                            </div>
                            <span
                                className={`text-[10px] tracking-tight mt-1 transition-colors leading-none ${
                                    active ? 'font-black text-[#009bd2]' : 'font-semibold text-slate-500'
                                }`}
                            >
                                {item.label}
                            </span>
                        </Link>
                    );
                })}

                {/* 5th Tab: Menu Drawer Toggle */}
                <button
                    type="button"
                    onClick={handleMenuToggle}
                    aria-label={isMenuOpen ? "Tutup Menu" : "Buka Menu"}
                    aria-expanded={isMenuOpen}
                    className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all duration-200 active:scale-95 relative group ${
                        isMenuOpen
                            ? 'text-[#009bd2]'
                            : 'text-slate-400 hover:text-slate-600'
                    }`}
                >
                    {isMenuOpen && (
                        <span className="absolute top-0 w-8 h-[3px] bg-[#009bd2] rounded-full shadow-[0_1px_6px_rgba(0,155,210,0.4)] animate-fadeIn" />
                    )}

                    <div className={`transition-transform duration-200 ${isMenuOpen ? 'scale-110 -translate-y-0.5' : 'group-hover:scale-105'}`}>
                        {isMenuOpen ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        )}
                    </div>
                    <span
                        className={`text-[10px] tracking-tight mt-1 transition-colors leading-none ${
                            isMenuOpen ? 'font-black text-[#009bd2]' : 'font-semibold text-slate-500'
                        }`}
                    >
                        {isMenuOpen ? 'Tutup' : 'Menu'}
                    </span>
                </button>
            </div>
        </nav>
    );
}
