import { Link, usePage, router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import Dropdown from '@/Components/Dropdown';
import OfferModal from '@/Components/OfferModal';
import UserAvatar from '@/Components/UserAvatar';
import MobileBottomNav from '@/Components/UI/MobileBottomNav';
import PwaInstallBanner from '@/Components/UI/PwaInstallBanner';
import OnboardingTour from '@/Components/UI/OnboardingTour';
import NotificationPanel from '@/Components/UI/NotificationPanel';

const Icons = {
    Dashboard: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
    Anggaran: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 12H4M20 12a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0a2 2 0 00-2-2H6a2 2 0 00-2 2" /></svg>,
    Pengeluaran: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    Transaksi: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>,
    Hutang: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 15h2a2 2 0 100-4h-3c-.6 0-1.1.2-1.4.6L3 17" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 00-2.75-2.91l-4.2 3.9" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m2 16 6 6" /><circle cx="16" cy="9" r="2.9" strokeWidth={1.5} /><circle cx="6" cy="5" r="3" strokeWidth={1.5} /></svg>,
    Laporan: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    Database: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>,
    Settings: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    Logout: <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
    Target: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" strokeWidth="1.5" /><circle cx="12" cy="12" r="5" strokeWidth="1.5" /><circle cx="12" cy="12" r="1.5" strokeWidth="1.5" fill="currentColor" /></svg>,
    News: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>,
    ChevronDown: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>,
    CollapseLeft: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>,
    AIAgent: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>,
    Berlangganan: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4l3 6 5-4-2 12H6L4 6l5 4 3-6z" /></svg>,
    Tagihan: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h6m-6 4h4" /></svg>,
    SuperAdmin: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
};

export default function AuthenticatedLayout({ children }) {
    const user = usePage().props.auth.user || { name: 'Super Admin', email: 'admin@finance.track' };
    const userMoodEmoji = user?.mood_emoji || (typeof window !== 'undefined' ? localStorage.getItem('user_mood_emoji') : null) || '👋';

    const isSubscribed = Boolean(
        user?.is_pro ||
        user?.is_pro_plus ||
        user?.role === 'superadmin' ||
        user?.active_tier === 'pro' ||
        user?.active_tier === 'pro_plus'
    );

    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            if (window.innerWidth < 768) {
                return false;
            }
            const saved = localStorage.getItem('sidebarOpen');
            return saved !== null ? saved === 'true' : true;
        }
        return false;
    });

    const currentUrl = usePage().url;
    const sidebarNavRef = useRef(null);

    // Mobile Navigation Mode: 'bottom' (App bottom nav bar) | 'sidebar' (Classic sidebar drawer)
    const [mobileNavMode, setMobileNavMode] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('mobileNavMode');
            return saved !== null ? saved : 'bottom';
        }
        return 'bottom';
    });

    const [modeNotice, setModeNotice] = useState(null);
    const [wsStatus, setWsStatus] = useState(() => {
        if (typeof window !== 'undefined' && window.Echo?.connector?.pusher?.connection?.state) {
            return window.Echo.connector.pusher.connection.state;
        }
        return 'connected';
    });

    const toggleMobileNavMode = () => {
        setMobileNavMode(prev => {
            const next = prev === 'bottom' ? 'sidebar' : 'bottom';
            if (typeof window !== 'undefined') {
                localStorage.setItem('mobileNavMode', next);
            }
            setModeNotice(next === 'bottom' ? 'Beralih ke Navigasi Bawah' : 'Beralih ke Navigasi Samping');
            setTimeout(() => setModeNotice(null), 2200);
            return next;
        });
    };

    // Save sidebar scroll position helper
    const saveSidebarScroll = () => {
        if (sidebarNavRef.current) {
            sessionStorage.setItem('sidebar_scroll_top', String(sidebarNavRef.current.scrollTop));
        }
    };

    const handleSidebarScroll = (e) => {
        sessionStorage.setItem('sidebar_scroll_top', String(e.currentTarget.scrollTop));
    };

    // Restore sidebar scroll position on navigation or sidebar toggle
    useEffect(() => {
        const restoreScroll = () => {
            const savedScroll = sessionStorage.getItem('sidebar_scroll_top');
            if (savedScroll !== null && sidebarNavRef.current) {
                sidebarNavRef.current.scrollTop = Number(savedScroll);
            }
        };

        restoreScroll();
        const t1 = setTimeout(restoreScroll, 50);
        const t2 = setTimeout(restoreScroll, 150);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }, [currentUrl, sidebarOpen]);

    // Realtime WebSocket integration via Laravel Reverb + Mobile Resilience
    useEffect(() => {
        if (!user?.id || typeof window === 'undefined') {
            return;
        }

        // Listen for connection state changes from Reverb
        const handleStatusChange = (e) => {
            const state = e.detail?.state;
            const previous = e.detail?.previous;
            if (state) {
                setWsStatus(state);
                // Only reload if reconnecting after an actual disconnection, not on initial fresh mount
                if (state === 'connected' && (previous === 'disconnected' || previous === 'unavailable')) {
                    router.reload({
                        preserveScroll: true,
                        preserveState: true,
                    });
                }
            }
        };
        window.addEventListener('reverb-status-change', handleStatusChange);

        // Subscribe to private user channel
        if (window.Echo) {
            const channel = window.Echo.private(`user.${user.id}`);

            const handleEvent = (e) => {
                // Dispatch window event so pages (especially Dashboard) can update immediately in-memory
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('finance-realtime-update', { detail: e }));
                }

                // Instantly refresh current page props without scroll/state jump
                router.reload({
                    preserveScroll: true,
                    preserveState: true,
                });
            };

            // Listen to all possible event name variations to guarantee 100% catch rate
            channel.listen('.transaction.recorded', handleEvent);
            channel.listen('transaction.recorded', handleEvent);
            channel.listen('TransactionRecorded', handleEvent);
            channel.listen('.TransactionRecorded', handleEvent);
            channel.listen('App\\Events\\TransactionRecorded', handleEvent);
            channel.error((err) => {
                console.warn('[Echo Channel Error]', err);
                setWsStatus('connecting');
            });
        }

        // Mobile & Tab Switching Resilience:
        // When user switches back from WhatsApp or another app, immediately reload props to show changes made while in background
        let lastVisibleTime = Date.now();
        const handleResume = () => {
            if (document.visibilityState === 'visible') {
                const now = Date.now();
                if (now - lastVisibleTime > 1500) {
                    lastVisibleTime = now;
                    router.reload({
                        preserveScroll: true,
                        preserveState: true,
                    });
                }
                if (window.Echo?.connector?.pusher?.connection?.state === 'disconnected') {
                    window.Echo.connector.pusher.connect();
                }
            }
        };

        document.addEventListener('visibilitychange', handleResume);
        window.addEventListener('focus', handleResume);

        // Fallback polling only when WebSocket is NOT connected (e.g. strict firewall)
        const fallbackInterval = setInterval(() => {
            if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
                const isEchoConnected = window.Echo?.connector?.pusher?.connection?.state === 'connected';
                if (!isEchoConnected) {
                    router.reload({
                        preserveScroll: true,
                        preserveState: true,
                    });
                }
            }
        }, 30000);

        return () => {
            window.removeEventListener('reverb-status-change', handleStatusChange);
            document.removeEventListener('visibilitychange', handleResume);
            window.removeEventListener('focus', handleResume);
            clearInterval(fallbackInterval);
            if (window.Echo) {
                window.Echo.leave(`user.${user.id}`);
            }
        };
    }, [user?.id]);

    // Automatically ensure sidebar stays closed on mobile when navigating
    useEffect(() => {
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
            setSidebarOpen(false);
        }
    }, [currentUrl]);

    // Handle screen resize cleanly
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setSidebarOpen(false);
            } else {
                const saved = localStorage.getItem('sidebarOpen');
                setSidebarOpen(saved !== null ? saved === 'true' : true);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleSidebar = () => {
        setSidebarOpen(prev => {
            const next = !prev;
            if (typeof window !== 'undefined' && window.innerWidth >= 768) {
                localStorage.setItem('sidebarOpen', String(next));
            }
            return next;
        });
    };

    const [openMenus, setOpenMenus] = useState(() => {
        const isAnggaranRoute = route().current('anggaran.*') || route().current('anggaran.investasi');
        const isKelolaRoute = route().current('kelola.*') || route().current('kategori.*') || route().current('metode.*');

        if (typeof window !== 'undefined') {
            try {
                const saved = JSON.parse(sessionStorage.getItem('sidebar_open_menus') || '{}');
                return {
                    anggaran: isAnggaranRoute || Boolean(saved.anggaran),
                    kelola: isKelolaRoute || Boolean(saved.kelola),
                };
            } catch (e) {
                // fallback
            }
        }
        return {
            anggaran: isAnggaranRoute,
            kelola: isKelolaRoute,
        };
    });

    const toggleMenu = (menu) => {
        if (!sidebarOpen) setSidebarOpen(true);
        setOpenMenus(prev => {
            const next = { ...prev, [menu]: !prev[menu] };
            if (typeof window !== 'undefined') {
                sessionStorage.setItem('sidebar_open_menus', JSON.stringify(next));
            }
            return next;
        });
    };

    const getInitials = (name) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    // Helper for Section Labels that animate without shifting
    const SectionLabel = ({ text }) => (
        <div className="h-8 flex items-center overflow-hidden whitespace-nowrap mt-2">
            <div className={`w-[72px] flex justify-center items-center shrink-0 transition-opacity duration-300 ${sidebarOpen ? 'opacity-0' : 'opacity-100'}`}>
                <span className="text-gray-300 text-[10px] tracking-widest">•••</span>
            </div>
            <div className={`transition-all duration-300 ${sidebarOpen ? '-ml-[72px] px-6 opacity-100' : 'opacity-0'}`}>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{text}</p>
            </div>
        </div>
    );

    const isPro = Boolean(user?.is_pro ?? (user?.role === 'superadmin' || user?.subscription_tier === 'pro' || user?.subscription_tier === 'pro_plus'));
    const isProPlus = Boolean(user?.is_pro_plus ?? (user?.role === 'superadmin' || user?.subscription_tier === 'pro_plus'));
    const isBudgetLocked = user?.permissions ? !user.permissions.budget : !isPro;
    const isReportLocked = user?.permissions ? !user.permissions.report : !isPro;
    const isAIAgentLocked = user?.permissions ? !user.permissions.ai_agent : !isProPlus;

    // Helper for Menu Items that anchor icons so they never move during width transitions
    const MenuItem = ({
        icon,
        text,
        active = false,
        routeName = "#",
        isProLocked = false,
        badgeText = "PRO",
        isPrimary = false,
        primaryBadge = null,
    }) => (
        <Link
            href={routeName === '#' ? '#' : route(routeName)}
            prefetch
            onClick={() => {
                saveSidebarScroll();
                if (typeof window !== 'undefined' && window.innerWidth < 768) {
                    setSidebarOpen(false);
                }
            }}
            className={`group relative flex items-center h-[40px] mx-3 rounded-xl transition-all duration-300 w-[calc(100%-1.5rem)] ${active
                ? 'bg-[#009bd2] text-white shadow-md shadow-[#009bd2]/30'
                : isPrimary
                    ? 'bg-sky-50/70 border border-[#009bd2]/25 text-slate-800 hover:bg-sky-100/80 hover:border-[#009bd2]/45 hover:-translate-y-0.5 hover:shadow-xs'
                    : 'text-slate-600 hover:bg-white hover:shadow-[0_8px_15px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 hover:scale-[1.02] hover:z-10 hover:text-slate-900'
                }`}
        >
            <div
                className={`w-10 h-10 flex justify-center items-center shrink-0 transition-all duration-300 ease-out group-hover:scale-[1.1] group-hover:-rotate-[12deg] ${active
                    ? 'text-white'
                    : isPrimary
                        ? 'text-[#009bd2]'
                        : 'group-hover:text-[#009bd2]'
                    }`}
            >
                {icon}
            </div>
            <div
                className={`flex items-center justify-between overflow-hidden whitespace-nowrap transition-all duration-300 ${sidebarOpen ? 'w-[150px] opacity-100 pr-1' : 'w-0 opacity-0'
                    }`}
            >
                <span
                    className={`text-[13px] transition-all duration-300 origin-left truncate ${active
                        ? 'font-semibold'
                        : isPrimary
                            ? 'font-bold text-slate-800 group-hover:text-[#009bd2]'
                            : 'font-semibold group-hover:scale-[1.02] group-hover:font-bold group-hover:tracking-tight'
                        }`}
                >
                    {text}
                </span>
                {isPrimary && primaryBadge && (
                    <span
                        className={`shrink-0 ml-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold tracking-tight transition-all duration-200 ${active
                            ? 'bg-white/20 text-white'
                            : 'bg-[#009bd2]/10 text-[#009bd2] group-hover:bg-[#009bd2] group-hover:text-white'
                            }`}
                    >
                        {primaryBadge}
                    </span>
                )}
                {isProLocked && (
                    <span
                        className={`shrink-0 ml-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider shadow-2xs ${badgeText === 'PRO+'
                            ? 'bg-purple-100 text-purple-700 border border-purple-200/80'
                            : 'bg-amber-100 text-amber-700 border border-amber-200/80'
                            }`}
                    >
                        {badgeText}
                    </span>
                )}
            </div>
        </Link>
    );

    const SubMenuParent = ({ icon, text, menuKey, active = false, isProLocked = false }) => (
        <div className="relative">
            <button
                type="button"
                onClick={() => toggleMenu(menuKey)}
                className={`group relative flex items-center h-[40px] mx-3 rounded-xl transition-all duration-300 w-[calc(100%-1.5rem)] ${active ? 'bg-[#009bd2] text-white shadow-md shadow-[#009bd2]/30' : 'text-slate-600 hover:bg-white hover:shadow-[0_8px_15px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 hover:scale-[1.02] hover:z-10 hover:text-slate-900'}`}
            >
                <div className={`w-10 h-10 flex justify-center items-center shrink-0 transition-all duration-300 ease-out group-hover:scale-[1.1] group-hover:-rotate-[12deg] ${active ? 'text-white' : 'group-hover:text-[#009bd2]'}`}>
                    {icon}
                </div>
                <div className={`flex items-center justify-between overflow-hidden whitespace-nowrap transition-all duration-300 ${sidebarOpen ? 'w-[150px] opacity-100' : 'w-0 opacity-0'}`}>
                    <span className={`text-[13px] font-semibold transition-all duration-300 origin-left flex items-center gap-1.5 truncate ${active ? '' : 'group-hover:scale-[1.02] group-hover:font-bold group-hover:tracking-tight'}`}>
                        <span className="truncate">{text}</span>
                        {isProLocked && (
                            <span className="shrink-0 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-200/80 shadow-2xs">
                                PRO
                            </span>
                        )}
                    </span>
                    <div className={`shrink-0 pr-2 transition-transform duration-300 ${openMenus[menuKey] ? 'rotate-180' : ''}`}>
                        {Icons.ChevronDown}
                    </div>
                </div>
            </button>
            {/* Submenu Items */}
            <div className={`overflow-hidden transition-all duration-300 ${sidebarOpen && openMenus[menuKey] ? 'max-h-72 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="pl-[60px] pr-4 py-1 space-y-1">
                    {menuKey === 'anggaran' && (
                        <>
                            <Link href={route('anggaran.ringkasan')} prefetch onClick={() => { saveSidebarScroll(); if (typeof window !== 'undefined' && window.innerWidth < 768) setSidebarOpen(false); }} className={`flex items-center justify-between py-1.5 text-[12.5px] transition-all whitespace-nowrap ${route().current('anggaran.ringkasan') ? 'text-[#009bd2] font-extrabold' : 'font-medium text-slate-500 hover:text-[#009bd2]'}`}>
                                <span className="truncate">Ringkasan Anggaran</span>
                                {isBudgetLocked && <span className="text-[9px] font-black text-amber-700 bg-amber-100 px-1 py-0.2 rounded shrink-0">PRO</span>}
                            </Link>
                            <Link href={route('anggaran.investasi')} prefetch onClick={() => { saveSidebarScroll(); if (typeof window !== 'undefined' && window.innerWidth < 768) setSidebarOpen(false); }} className={`flex items-center justify-between py-1.5 text-[12.5px] transition-all whitespace-nowrap ${route().current('anggaran.investasi') ? 'text-[#009bd2] font-extrabold' : 'font-medium text-slate-500 hover:text-[#009bd2]'}`}>
                                <span className="truncate">Anggaran Tabungan & Target</span>
                                {isBudgetLocked && <span className="text-[9px] font-black text-amber-700 bg-amber-100 px-1 py-0.2 rounded shrink-0">PRO</span>}
                            </Link>
                            <Link href={route('anggaran.hutang')} prefetch onClick={() => { saveSidebarScroll(); if (typeof window !== 'undefined' && window.innerWidth < 768) setSidebarOpen(false); }} className={`flex items-center justify-between py-1.5 text-[12.5px] transition-all whitespace-nowrap ${route().current('anggaran.hutang') ? 'text-[#009bd2] font-extrabold' : 'font-medium text-slate-500 hover:text-[#009bd2]'}`}>
                                <span className="truncate">Anggaran Hutang</span>
                                {isBudgetLocked && <span className="text-[9px] font-black text-amber-700 bg-amber-100 px-1 py-0.2 rounded shrink-0">PRO</span>}
                            </Link>
                            <Link href={route('anggaran.pengeluaran')} prefetch onClick={() => { saveSidebarScroll(); if (typeof window !== 'undefined' && window.innerWidth < 768) setSidebarOpen(false); }} className={`flex items-center justify-between py-1.5 text-[12.5px] transition-all whitespace-nowrap ${route().current('anggaran.pengeluaran') ? 'text-[#009bd2] font-extrabold' : 'font-medium text-slate-500 hover:text-[#009bd2]'}`}>
                                <span className="truncate">Pengeluaran Bulanan</span>
                                {isBudgetLocked && <span className="text-[9px] font-black text-amber-700 bg-amber-100 px-1 py-0.2 rounded shrink-0">PRO</span>}
                            </Link>
                        </>
                    )}
                    {menuKey === 'kelola' && (
                        <>
                            <Link href={route('kategori.index')} prefetch onClick={() => { saveSidebarScroll(); if (typeof window !== 'undefined' && window.innerWidth < 768) setSidebarOpen(false); }} className={`block py-1.5 text-[12.5px] transition-all whitespace-nowrap ${route().current('kategori.index') ? 'text-[#009bd2] font-extrabold' : 'font-medium text-slate-500 hover:text-[#009bd2]'}`}>Kelola Kategori</Link>
                            <Link href={route('metode.index')} prefetch onClick={() => { saveSidebarScroll(); if (typeof window !== 'undefined' && window.innerWidth < 768) setSidebarOpen(false); }} className={`block py-1.5 text-[12.5px] transition-all whitespace-nowrap ${route().current('metode.index') ? 'text-[#009bd2] font-extrabold' : 'font-medium text-slate-500 hover:text-[#009bd2]'}`}>Kelola Jenis Metode</Link>
                        </>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="h-screen h-[100dvh] overflow-hidden bg-[#fcfcfc] flex font-sans">

            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}

            {/* SIDEBAR */}
            <aside className={`fixed inset-y-0 left-0 md:relative bg-white border-r border-slate-100 flex flex-col transition-all duration-300 ease-in-out z-50 h-full ${mobileNavMode === 'bottom' ? 'pb-16 md:pb-0' : ''} ${sidebarOpen ? 'w-[240px] translate-x-0' : 'w-[240px] md:w-[72px] -translate-x-full md:translate-x-0'}`}>

                {/* Logo Area - Fixed Icon Width */}
                <div className="h-20 md:h-24 flex items-center shrink-0 overflow-hidden">
                    <div className="w-[72px] h-full flex justify-center items-center shrink-0">
                        <img src="/logo.png" alt="FinanceTrack Logo" className="w-8 h-8 object-contain" />
                    </div>
                    <div className={`overflow-hidden transition-all duration-300 ${sidebarOpen ? 'w-[150px] opacity-100' : 'w-0 opacity-0'}`}>
                        <h1 className="font-extrabold text-slate-800 text-[15px] leading-tight whitespace-nowrap tracking-tight">FinanceTrack</h1>
                        <p className="text-[10px] text-slate-400 font-bold whitespace-nowrap mt-0.5">Plan Together</p>
                    </div>
                </div>

                {/* Navigation Menu */}
                <div ref={sidebarNavRef} onScroll={handleSidebarScroll} className="flex-1 overflow-y-auto pb-4 sidebar-scroll">

                    <SectionLabel text="Utama" />
                    <div className="space-y-1">
                        <MenuItem icon={Icons.Dashboard} text="Dashboard" active={route().current('dashboard')} routeName="dashboard" />
                        <MenuItem icon={Icons.Target} text="Tabungan & Target" active={route().current('tabungan.*')} routeName="tabungan.target" />
                        <MenuItem icon={Icons.Hutang} text="Hutang & Piutang" active={route().current('hutang-piutang.*')} routeName="hutang-piutang.index" />
                        <MenuItem icon={Icons.Tagihan} text="Tagihan Rutin" active={route().current('tagihan.*')} routeName="tagihan.index" />
                        <SubMenuParent icon={Icons.Anggaran} text="Anggaran" menuKey="anggaran" active={route().current('anggaran.*')} isProLocked={isBudgetLocked} />
                        <MenuItem icon={Icons.Pengeluaran} text="Transaksi" active={route().current('transaksi.index')} routeName="transaksi.index" isPrimary primaryBadge="+ Catat" />
                        <MenuItem icon={Icons.Transaksi} text="Riwayat Transaksi" active={route().current('transaksi.history*') || usePage().url.startsWith('/transaksi/history')} routeName="transaksi.history" />
                    </div>

                    <SectionLabel text="Laporan" />
                    <div className="space-y-1">
                        <MenuItem icon={Icons.News} text="Berita Hari Ini" active={route().current('news.*')} routeName="news.index" />
                        <MenuItem icon={Icons.Laporan} text="Laporan Keuangan" active={route().current('laporan.*')} routeName="laporan.index" isProLocked={isReportLocked} />
                    </div>

                    <SectionLabel text="Unggulan" />
                    <div className="space-y-1">
                        <MenuItem icon={Icons.AIAgent} text="Integrasi Agent AI" active={route().current('ai-agent.*')} routeName="ai-agent.index" isProLocked={isAIAgentLocked} badgeText="PRO+" />
                    </div>

                    <SectionLabel text="Akun" />
                    <div className="space-y-1">
                        <MenuItem icon={Icons.Berlangganan} text="Berlangganan" active={route().current('berlangganan.*')} routeName="berlangganan.index" />
                        <SubMenuParent icon={Icons.Database} text="Kelola Data" menuKey="kelola" active={route().current('kelola.*') || route().current('kategori.*') || route().current('metode.*')} />
                        <MenuItem icon={Icons.Settings} text="Pengaturan" active={route().current('profile.*')} routeName="profile.edit" />
                    </div>

                    {user?.role === 'superadmin' && (
                        <>
                            <SectionLabel text="Super Admin" />
                            <div className="space-y-1">
                                <MenuItem icon={Icons.SuperAdmin} text="Panel Super Admin" active={route().current('admin.*')} routeName="admin.dashboard" />
                            </div>
                        </>
                    )}
                </div>

                {/* Switcher option inside mobile sidebar drawer */}
                <div className="md:hidden px-3 py-2 border-t border-slate-100 bg-slate-50/60 shrink-0">
                    <button
                        type="button"
                        onClick={() => {
                            toggleMobileNavMode();
                            setSidebarOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white border border-slate-200/80 text-slate-700 text-xs font-bold shadow-2xs hover:bg-slate-50 transition-colors"
                    >
                        <span className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-[#009bd2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <span>Gaya Navigasi HP</span>
                        </span>
                        <span className="text-[10px] text-[#009bd2] bg-sky-50 px-2 py-0.5 rounded-md font-extrabold">
                            {mobileNavMode === 'bottom' ? 'Bawah (App)' : 'Samping'}
                        </span>
                    </button>
                </div>

                {/* Sidebar Footer */}
                <div className="mt-auto shrink-0 border-t border-slate-100 bg-white">
                    {/* User Profile */}
                    <div className="flex items-center h-[64px] hover:bg-slate-50 transition-colors overflow-hidden">
                        <div className="w-[72px] h-full flex justify-center items-center shrink-0">
                            <div className="relative">
                                <UserAvatar user={user} size="sm" className="w-8 h-8" />
                                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-[1.5px] shadow-2xs">
                                    <span className="text-[9px] leading-none block">{userMoodEmoji}</span>
                                </div>
                            </div>
                        </div>
                        <div className={`flex items-center justify-between overflow-hidden transition-all duration-300 whitespace-nowrap ${sidebarOpen ? 'w-[160px] opacity-100' : 'w-0 opacity-0'}`}>
                            <div className="overflow-hidden pr-2">
                                <p className="text-[13px] font-bold text-slate-800 truncate leading-tight">{user.name}</p>
                                <p className="text-[11px] font-medium text-slate-400 truncate mt-0.5">{user.email}</p>
                            </div>
                            <Link href={route('logout')} method="post" as="button" className="text-slate-400 hover:text-red-500 transition-colors p-2 shrink-0 mr-4">
                                {Icons.Logout}
                            </Link>
                        </div>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT WRAPPER */}
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#fbfbfb] relative">
                {/* TOP HEADER - FIXED ON MOBILE, STICKY ON DESKTOP */}
                <header className="fixed top-0 left-0 right-0 md:static z-30 h-16 sm:h-20 bg-white/95 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0 shadow-xs md:shadow-none">
                    <div className="flex items-center gap-2.5 sm:gap-5">
                        <button
                            onClick={toggleSidebar}
                            aria-label="Menu"
                            className={`p-2 rounded-xl hover:bg-slate-50 transition-colors relative w-10 h-10 items-center justify-center group shrink-0 ${mobileNavMode === 'bottom' ? 'hidden md:flex' : 'flex'}`}
                        >
                            {/* Pure CSS Animated Hamburger */}
                            <div className="w-[20px] h-[14px] flex flex-col justify-between items-end">
                                <span className="w-full h-[2.5px] bg-slate-500 group-hover:bg-slate-700 rounded-full transition-all duration-300 ease-in-out"></span>
                                <span className={`h-[2.5px] bg-slate-500 group-hover:bg-slate-700 rounded-full transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-[55%]' : 'w-full'}`}></span>
                                <span className="w-full h-[2.5px] bg-slate-500 group-hover:bg-slate-700 rounded-full transition-all duration-300 ease-in-out"></span>
                            </div>
                        </button>

                        {/* Mobile Brand Title & Live Realtime Indicator */}
                        <div className="sm:hidden flex items-center gap-2 shrink-0">
                            <img src="/logo.png" alt="FinanceTrack Logo" className="w-6 h-6 object-contain shrink-0" />
                            <span className="font-extrabold text-slate-800 text-[15px] tracking-tight whitespace-nowrap">FinanceTrack</span>
                            {wsStatus === 'connected' ? (
                                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/90 text-emerald-700 text-[10px] font-black tracking-wide shadow-2xs">
                                    <span className="relative flex h-1.5 w-1.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                    </span>
                                    <span>Live</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold shadow-2xs">
                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                                    <span>Sync</span>
                                </div>
                            )}
                        </div>

                        {/* Desktop Overview */}
                        <div className="hidden sm:block">
                            <h2 className="text-xl font-extrabold text-slate-900">Dashboard Overview</h2>
                            <p className="text-[13px] font-semibold text-slate-400">Selamat datang kembali, {user.name}.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-6">
                        {/* Realtime Status Indicator Badge (Desktop) */}
                        {wsStatus === 'connected' ? (
                            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/90 text-emerald-700 text-xs font-bold shadow-2xs transition-all hover:bg-emerald-100/70" title="Terhubung secara realtime via Reverb WebSocket">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span>Live Realtime</span>
                            </div>
                        ) : (
                            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold shadow-2xs transition-all" title="Sedang menghubungkan ke server realtime...">
                                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span>
                                <span>Menghubungkan...</span>
                            </div>
                        )}
                        {/* Mobile Nav Switcher (Bottom Nav vs Sidebar) - Sleek 36x36 Icon Button */}
                        <button
                            type="button"
                            onClick={toggleMobileNavMode}
                            title={`Mode Navigasi: ${mobileNavMode === 'bottom' ? 'Bawah (App)' : 'Samping (Sidebar)'}. Klik untuk beralih.`}
                            aria-label={`Mode Navigasi HP: ${mobileNavMode === 'bottom' ? 'Nav Bawah' : 'Nav Samping'}`}
                            className="md:hidden relative w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200/90 text-slate-600 hover:text-slate-900 transition-all duration-200 active:scale-90 flex items-center justify-center shrink-0 border border-slate-200/70"
                        >
                            {mobileNavMode === 'bottom' ? (
                                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <rect x="4.5" y="3" width="15" height="18" rx="2.5" strokeWidth="1.8" />
                                    <path d="M4.5 16.5h15" stroke="#009bd2" strokeWidth="2.2" strokeLinecap="round" />
                                    <circle cx="12" cy="19.5" r="0.75" fill="#009bd2" />
                                </svg>
                            ) : (
                                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <rect x="4.5" y="3" width="15" height="18" rx="2.5" strokeWidth="1.8" />
                                    <path d="M9.5 3v18" stroke="#009bd2" strokeWidth="2.2" strokeLinecap="round" />
                                    <path d="M6.5 7h1.5M6.5 10.5h1.5M6.5 14h1.5" stroke="#009bd2" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                            )}
                        </button>

                        <div className="w-px h-6 bg-gray-200 hidden sm:block"></div>

                        <NotificationPanel />

                        <div className="w-px h-6 bg-gray-200 hidden sm:block"></div>

                        <Dropdown>
                            <Dropdown.Trigger>
                                <button className="flex items-center gap-3 focus:outline-none text-left rounded-xl p-1 hover:bg-slate-50 transition-colors">
                                    <div className="relative">
                                        <UserAvatar user={user} size="md" className="w-10 h-10" />
                                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-[2px] shadow-sm">
                                            <span className="text-[10px] leading-none block">{userMoodEmoji}</span>
                                        </div>
                                    </div>
                                    <div className="hidden lg:block">
                                        <p className="text-sm font-bold text-slate-800 leading-tight">{user.name}</p>
                                        <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                                            {user.role === 'superadmin' ? 'Super Admin' : (user.subscription_tier === 'pro_plus' ? 'Pro Plus Member' : (user.subscription_tier === 'pro' ? 'Pro Member' : 'Free Member'))}
                                        </p>
                                    </div>
                                    <svg className="w-4 h-4 text-gray-400 ml-1 hidden lg:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </button>
                            </Dropdown.Trigger>
                            <Dropdown.Content>
                                {user?.role === 'superadmin' && (
                                    <Dropdown.Link href={route('admin.dashboard')} className="text-[#009bd2] font-black flex items-center gap-1.5">
                                        <span>🛡️</span>
                                        <span>Panel Super Admin</span>
                                    </Dropdown.Link>
                                )}
                                <Dropdown.Link href={route('profile.edit')}>Pengaturan</Dropdown.Link>

                                {/* Trigger Tour Panduan Aplikasi */}
                                <button
                                    type="button"
                                    onClick={() => window.dispatchEvent(new CustomEvent('start-onboarding-tour'))}
                                    className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-between transition-colors border-t border-slate-100 cursor-pointer"
                                >
                                    <span>Panduan Aplikasi</span>
                                    <span className="text-[10px] font-bold text-[#009bd2] bg-sky-50 px-2 py-0.5 rounded-md">Tour</span>
                                </button>

                                {/* Switcher in Dropdown */}
                                <button
                                    type="button"
                                    onClick={toggleMobileNavMode}
                                    className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-between transition-colors border-t border-slate-100 md:hidden"
                                >
                                    <span>Gaya Navigasi HP</span>
                                    <span className="text-[10px] font-bold text-[#009bd2] bg-sky-50 px-2 py-0.5 rounded-md">
                                        {mobileNavMode === 'bottom' ? 'Bawah (App)' : 'Samping'}
                                    </span>
                                </button>

                                <Dropdown.Link href={route('logout')} method="post" as="button">Log Out</Dropdown.Link>
                            </Dropdown.Content>
                        </Dropdown>
                    </div>
                </header>

                {/* Floating Navigation Mode Feedback Toast on Mobile */}
                {modeNotice && (
                    <div className="md:hidden fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 backdrop-blur-md text-white text-[11px] font-bold px-4 py-2 rounded-full shadow-xl border border-white/10 flex items-center gap-2 animate-fadeIn pointer-events-none">
                        <span className="w-2 h-2 rounded-full bg-[#009bd2] animate-pulse"></span>
                        <span>{modeNotice}</span>
                    </div>
                )}


                {/* DYNAMIC PAGE CONTENT */}
                <main className={`flex-1 overflow-y-auto pt-16 md:pt-0 ${mobileNavMode === 'bottom' ? 'pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0' : 'pb-8 md:pb-0'}`}>
                    <OnboardingTour mobileNavMode={mobileNavMode} />
                    {!isSubscribed && <OfferModal />}
                    <PwaInstallBanner />
                    {children}
                </main>

                {/* Mobile Bottom Navigation Bar (Rendered when in 'bottom' mode) */}
                {mobileNavMode === 'bottom' && (
                    <MobileBottomNav
                        onOpenMenu={toggleSidebar}
                        onToggleMenu={toggleSidebar}
                        isMenuOpen={sidebarOpen}
                    />
                )}
            </div>
        </div>
    );
}
