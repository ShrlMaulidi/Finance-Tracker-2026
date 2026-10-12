import React, { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';

/**
 * PwaInstallBanner Component
 * Floating banner prompt to install FinanceTrack as a native PWA on Mobile / Desktop.
 * 
 * Pops up every time after user logs in (when not already running in standalone app mode).
 */
export default function PwaInstallBanner() {
    const { flash } = usePage().props;
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const [showIosGuide, setShowIosGuide] = useState(false);
    const [isIosDevice, setIsIosDevice] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Check if app is already running in standalone PWA mode (already installed & opened as app)
        const isStandalone = 
            window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true ||
            document.referrer.includes('android-app://');

        if (isStandalone) {
            return;
        }

        // Detect iOS device (Safari)
        const ua = window.navigator.userAgent.toLowerCase();
        const isIos = /iphone|ipad|ipod/.test(ua) && !window.MSStream;
        setIsIosDevice(isIos);

        // Check if user just logged in (from Laravel flash or sessionStorage)
        const justLoggedInSession = 
            sessionStorage.getItem('justLoggedInForPwa') === 'true' || 
            sessionStorage.getItem('justLoggedIn') === 'true';
        const justLoggedInFlash = Boolean(flash?.just_logged_in);
        const isFreshLogin = justLoggedInSession || justLoggedInFlash;

        if (isFreshLogin) {
            // Fresh login: reset any session dismissal so banner ALWAYS displays after login
            sessionStorage.removeItem('justLoggedInForPwa');
            sessionStorage.removeItem('pwa_banner_closed_this_session');
            localStorage.removeItem('financetrack_pwa_dismissed');

            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 700);
            return () => clearTimeout(timer);
        }

        // If not a fresh login, check if user dismissed the banner in this active session
        const closedThisSession = sessionStorage.getItem('pwa_banner_closed_this_session') === 'true';
        if (closedThisSession) {
            return;
        }

        // Check if beforeinstallprompt was already captured globally
        if (window.deferredPrompt) {
            setDeferredPrompt(window.deferredPrompt);
        }

        // Chromium-based browsers: listen for beforeinstallprompt event
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            window.deferredPrompt = e;
            setDeferredPrompt(e);
            if (!sessionStorage.getItem('pwa_banner_closed_this_session')) {
                setIsVisible(true);
            }
        };

        const handlePromptAvailable = () => {
            if (window.deferredPrompt) {
                setDeferredPrompt(window.deferredPrompt);
                if (!sessionStorage.getItem('pwa_banner_closed_this_session')) {
                    setIsVisible(true);
                }
            }
        };

        const handleAppInstalled = () => {
            setIsVisible(false);
            setDeferredPrompt(null);
            window.deferredPrompt = null;
            sessionStorage.setItem('pwa_banner_installed', 'true');
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('pwa-prompt-available', handlePromptAvailable);
        window.addEventListener('appinstalled', handleAppInstalled);

        // If iOS and not dismissed in this session, show banner with slight delay
        let iosTimer = null;
        if (isIos && !sessionStorage.getItem('pwa_banner_closed_this_session')) {
            iosTimer = setTimeout(() => {
                setIsVisible(true);
            }, 1200);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('pwa-prompt-available', handlePromptAvailable);
            window.removeEventListener('appinstalled', handleAppInstalled);
            if (iosTimer) clearTimeout(iosTimer);
        };
    }, [flash]);

    const handleInstallClick = async () => {
        if (isIosDevice) {
            setShowIosGuide(true);
            return;
        }

        const promptEvent = deferredPrompt || window.deferredPrompt;

        if (promptEvent) {
            try {
                // Triggers native browser install dialog ("Instal aplikasi" bottom sheet)
                promptEvent.prompt();
                const choice = await promptEvent.userChoice;
                if (choice && choice.outcome === 'accepted') {
                    setIsVisible(false);
                    sessionStorage.setItem('pwa_banner_installed', 'true');
                }
            } catch (err) {
                console.warn('[PWA] Prompt error:', err);
                setShowIosGuide(true);
            } finally {
                setDeferredPrompt(null);
                window.deferredPrompt = null;
            }
        } else {
            // If beforeinstallprompt hasn't fired yet or browser requires HTTPS/manual action
            setShowIosGuide(true);
        }
    };

    const handleDismiss = () => {
        setIsVisible(false);
        // Closed for this active session only; will reappear fresh on the next login!
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('pwa_banner_closed_this_session', 'true');
        }
    };

    if (!isVisible) return null;

    return (
        <>
            {/* FLOATING PWA INSTALL BANNER - TOP CENTER IN HEADER */}
            <div className="fixed top-2 sm:top-3 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.25rem)] max-w-md sm:max-w-lg animate-slideDown">
                <div className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-full border border-slate-200/90 shadow-[0_12px_35px_rgba(0,0,0,0.12)] px-3 py-2 sm:px-4 sm:py-2.5 flex items-center justify-between gap-2.5 sm:gap-3.5">
                    {/* App Squircle Icon */}
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-full bg-[#009bd2]/10 border border-[#009bd2]/20 flex items-center justify-center shrink-0 p-1.5 shadow-2xs">
                        <img src="/logo.png" alt="FinanceTrack" className="w-full h-full object-contain" />
                    </div>

                    {/* Middle Text Details */}
                    <div className="flex-1 min-w-0 pr-1">
                        <h4 className="text-xs sm:text-[13px] font-black text-slate-800 leading-tight truncate tracking-tight">
                            Pasang FinanceTrack di HP
                        </h4>
                        <p className="text-[10.5px] sm:text-[11.5px] text-slate-500 font-medium leading-tight truncate mt-0.5">
                            Buka lebih cepat dan akses seperti aplikasi native
                        </p>
                    </div>

                    {/* Actions: Install & Close */}
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={handleInstallClick}
                            className="bg-[#009bd2] hover:bg-[#0087b7] text-white text-xs font-black px-3.5 py-1.5 rounded-full shadow-sm shadow-[#009bd2]/30 flex items-center gap-1.5 transition-all active:scale-95"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span>Pasang</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleDismiss}
                            aria-label="Tutup"
                            className="text-slate-400 hover:text-slate-600 transition-colors p-1 sm:p-1.5 rounded-full hover:bg-slate-100"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* GUIDED INSTALL MODAL (FOR IOS SAFARI OR MANUAL INSTALL) */}
            {showIosGuide && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
                    <div className="bg-white rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-slate-100 text-left animate-scaleUp">
                        {/* Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-[#009bd2]/10 p-1.5 flex items-center justify-center">
                                    <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-slate-800 text-sm">Pasang di Handphone</h3>
                                    <p className="text-[11px] text-slate-400 font-semibold">Petunjuk Pemasangan Cepat</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowIosGuide(false)}
                                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Step by Step instructions */}
                        <div className="mt-4 space-y-3.5">
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-sky-100 text-[#009bd2] font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                                    1
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                    {isIosDevice ? (
                                        <>Ketuk tombol <strong>Bagikan (Share)</strong> <span className="inline-block px-1.5 py-0.5 bg-slate-100 rounded text-[11px]">⎋</span> di bilah navigasi Safari bawah.</>
                                    ) : (
                                        <>Ketuk menu browser Anda (ikon titik tiga <strong>⋮</strong> di pojok kanan atas browser).</>
                                    )}
                                </p>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-sky-100 text-[#009bd2] font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                                    2
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                    Gulir opsi dan pilih <strong>"Tambahkan ke Layar Utama"</strong> (<em>Add to Home Screen</em> ➕).
                                </p>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-sky-100 text-[#009bd2] font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                                    3
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                    Ketuk <strong>"Tambah"</strong> atau <strong>"Pasang"</strong> di pojok kanan atas. Ikon aplikasi akan langsung muncul di beranda HP Anda!
                                </p>
                            </div>
                        </div>

                        {/* Understand Button */}
                        <div className="mt-5 pt-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowIosGuide(false);
                                    handleDismiss();
                                }}
                                className="w-full py-2.5 rounded-xl bg-[#009bd2] hover:bg-[#0087b7] text-white font-extrabold text-xs transition-colors shadow-sm shadow-[#009bd2]/30 active:scale-95"
                            >
                                Mengerti, Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
