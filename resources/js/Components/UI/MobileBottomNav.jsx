import React from 'react';
import { Link } from '@inertiajs/react';

export default function MobileBottomNav({
    onOpenMenu,
    onToggleMenu,
    isMenuOpen = false,
    className = '',
}) {
    const handleMenuToggle = onToggleMenu || onOpenMenu;

    // Page tabs: Home | Tagihan | Transaksi (emphasized) | Target — plus a separate Menu button
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
            key: 'transaksi',
            label: 'Transaksi',
            routeName: 'transaksi.index',
            isActive: route().current('transaksi.*'),
            isCenter: true,
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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

    const closeMenuIfOpen = () => {
        if (isMenuOpen && handleMenuToggle) {
            handleMenuToggle();
        }
    };

    // Floating white-glass dock: a pill holding the 4 page tabs plus a separate round Menu button
    return (
        <nav
            aria-label="Mobile Bottom Navigation"
            className={`fixed inset-x-0 bottom-0 z-[60] px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:hidden pointer-events-none transition-transform duration-300 ${className}`}
        >
            <div className="max-w-lg mx-auto flex items-center gap-2.5 pointer-events-auto">
                {/* Page tabs pill */}
                <div className="flex-1 h-16 flex items-center gap-1 p-1.5 rounded-full bg-white/70 backdrop-blur-xl backdrop-saturate-150 border border-white/80 ring-1 ring-slate-900/5 shadow-[0_10px_30px_-6px_rgba(15,23,42,0.18)]">
                    {navItems.map((item) => {
                        const active = item.isActive && !isMenuOpen;

                        return (
                            <Link
                                key={item.key}
                                href={route(item.routeName)}
                                prefetch
                                onClick={closeMenuIfOpen}
                                aria-current={active ? 'page' : undefined}
                                className={`flex-1 h-full rounded-full flex flex-col items-center justify-center gap-1 transition-all duration-300 active:scale-95 ${
                                    active
                                        ? 'bg-white text-[#009bd2] shadow-[0_4px_14px_-2px_rgba(0,155,210,0.28)] ring-1 ring-[#009bd2]/10'
                                        : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                {/* Transaksi keeps its emphasis with a brand-colored icon chip */}
                                {item.isCenter ? (
                                    <span className={`w-7 h-7 -my-1 rounded-full flex items-center justify-center text-white bg-gradient-to-tr from-[#0082b2] to-[#00b5f8] shadow-sm shadow-[#009bd2]/40 transition-transform duration-300 ${active ? 'scale-110' : ''}`}>
                                        <span className="[&>svg]:w-4 [&>svg]:h-4">{item.icon}</span>
                                    </span>
                                ) : (
                                    <span className={`transition-transform duration-300 ${active ? 'scale-110' : ''}`}>{item.icon}</span>
                                )}
                                <span className={`text-[10px] leading-none tracking-tight ${active ? 'font-extrabold' : 'font-semibold'}`}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>

                {/* Separate round Menu button */}
                <button
                    type="button"
                    onClick={handleMenuToggle}
                    aria-label={isMenuOpen ? 'Tutup Menu' : 'Buka Menu'}
                    aria-expanded={isMenuOpen}
                    className={`w-16 h-16 shrink-0 rounded-full flex flex-col items-center justify-center gap-1 backdrop-blur-xl backdrop-saturate-150 border ring-1 shadow-[0_10px_30px_-6px_rgba(15,23,42,0.18)] transition-all duration-300 active:scale-95 ${
                        isMenuOpen
                            ? 'bg-white text-[#009bd2] border-white ring-[#009bd2]/15'
                            : 'bg-white/70 text-slate-500 border-white/80 ring-slate-900/5 hover:text-slate-700'
                    }`}
                >
                    {isMenuOpen ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    )}
                    <span className={`text-[10px] leading-none tracking-tight ${isMenuOpen ? 'font-extrabold' : 'font-semibold'}`}>
                        {isMenuOpen ? 'Tutup' : 'Menu'}
                    </span>
                </button>
            </div>
        </nav>
    );
}
