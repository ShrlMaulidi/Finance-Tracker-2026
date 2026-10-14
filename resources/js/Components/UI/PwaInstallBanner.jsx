import React, { useState, useEffect } from 'react';

/**
 * PwaInstallBanner Component
 * Floating banner prompt to install FinanceTrack as a native PWA on Mobile / Desktop.
 * 
 * Stays visible across page navigations / menu changes until explicitly closed via the 'X' button.
 */
export default function PwaInstallBanner() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isVisible, setIsVisible] = useState(() => {
        if (typeof window === 'undefined') return false;
        const isStandalone =
            window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true ||
            document.referrer.includes('android-app://');
        if (isStandalone) return false;

        const closedThisSession = sessionStorage.getItem('pwa_banner_closed_this_session') === 'true';
        if (closedThisSession) return false;

        return true;
    });
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
            setIsVisible(false);
            return;
        }

        // Detect iOS device (Safari)
        const ua = window.navigator.userAgent.toLowerCase();
        const isIos = /iphone|ipad|ipod/.test(ua) && !window.MSStream;
        setIsIosDevice(isIos);

        // Check if user dismissed the banner via close / X icon in this session
        const closedThisSession = sessionStorage.getItem('pwa_banner_closed_this_session') === 'true';
        if (closedThisSession) {
            setIsVisible(false);
            return;
        }

        // Banner stays visible across menu navigations until closed via 'X'
        setIsVisible(true);

        // Check if beforeinstallprompt was already captured globally
        if (window.deferredPrompt) {
            setDeferredPrompt(window.deferredPrompt);
        }

        // Chromium-based browsers: listen for beforeinstallprompt event
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            window.deferredPrompt = e;
            setDeferredPrompt(e);
        };

        const handlePromptAvailable = () => {
            if (window.deferredPrompt) {
                setDeferredPrompt(window.deferredPrompt);
            }
        };

        const handleAppInstalled = () => {
            setIsVisible(false);
            setDeferredPrompt(null);
            window.deferredPrompt = null;
            sessionStorage.setItem('pwa_banner_closed_this_session', 'true');
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('pwa-prompt-available', handlePromptAvailable);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('pwa-prompt-available', handlePromptAvailable);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

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
                    sessionStorage.setItem('pwa_banner_closed_this_session', 'true');
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
        // Only closed when user explicitly clicks the 'X' button!
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('pwa_banner_closed_this_session', 'true');
        }
    };

    if (!isVisible) return null;

    return (
        <>
            {/* FLOATING PWA INSTALL BANNER - FLOATS BENEATH FIXED HEADER ON MOBILE */}
            <div className="fixed top-18 sm:top-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1.25rem)] max-w-md sm:max-w-lg animate-slideDown">
                <div className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-full border border-slate-200/90 shadow-[0_12px_35px_rgba(0,0,0,0.12)] px-3.5 py-2 sm:px-4 sm:py-2.5 flex items-center justify-between gap-2.5 sm:gap-3.5">
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
                            className="bg-[#009bd2] hover:bg-[#0087b7] text-white text-xs font-black px-3.5 py-1.5 min-h-[36px] rounded-full shadow-sm shadow-[#009bd2]/30 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
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
                            className="text-slate-400 hover:text-slate-600 transition-colors p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full hover:bg-slate-100 cursor-pointer"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* GUIDED INSTALL BOTTOM SHEET (FOR IOS SAFARI / MOBILE) */}
            {showIosGuide && (
                <div
                    className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
                    onClick={() => setShowIosGuide(false)}
                >
                    <div
                        className="bg-white rounded-t-[2rem] sm:rounded-3xl max-w-md w-full p-5 sm:p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:pb-6 shadow-2xl border-t sm:border border-slate-200/80 text-left animate-slide-up-sheet relative overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* iOS Drag Handle */}
                        <div className="w-10 h-1.5 bg-slate-300 rounded-full mx-auto mb-3.5 sm:hidden"></div>

                        {/* Header */}
                        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-2xl bg-[#009bd2]/10 p-1.5 flex items-center justify-center border border-[#009bd2]/20 shadow-2xs shrink-0">
                                    <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-black text-slate-800 text-sm sm:text-base leading-tight truncate">
                                        {isIosDevice ? 'Pasang di Layar Utama iPhone' : 'Pasang di Layar Utama'}
                                    </h3>
                                    <p className="text-[11px] text-slate-400 font-semibold leading-tight truncate mt-0.5">
                                        {isIosDevice ? 'Petunjuk Pemasangan Cepat Safari' : 'Petunjuk Pemasangan Manual'}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowIosGuide(false)}
                                className="text-slate-400 hover:text-slate-600 p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Step by Step Cards */}
                        <div className="mt-4 space-y-3">
                            {/* Step 1 */}
                            <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-slate-50/80 border border-slate-100">
                                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#007aff] border border-blue-100/80 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                                    {isIosDevice ? (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                            <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                                            <polyline points="16 6 12 2 8 6" />
                                            <line x1="12" y1="2" x2="12" y2="15" />
                                        </svg>
                                    ) : (
                                        <span className="font-black text-xs">1</span>
                                    )}
                                </div>
                                <div className="text-xs text-slate-700 leading-relaxed font-medium">
                                    {isIosDevice ? (
                                        <>Ketuk tombol <strong>Bagikan (Share)</strong> <span className="inline-flex items-center justify-center px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[#007aff] font-bold text-[11px] shadow-2xs">⎋</span> pada bilah menu Safari di bawah layar.</>
                                    ) : (
                                        <>Ketuk menu browser Anda (ikon titik tiga <strong>⋮</strong> di pojok kanan atas browser).</>
                                    )}
                                </div>
                            </div>

                            {/* Step 2 */}
                            <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-slate-50/80 border border-slate-100">
                                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 border border-slate-200/80 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                        <rect x="3" y="3" width="18" height="18" rx="4" />
                                        <line x1="12" y1="8" x2="12" y2="16" />
                                        <line x1="8" y1="12" x2="16" y2="12" />
                                    </svg>
                                </div>
                                <div className="text-xs text-slate-700 leading-relaxed font-medium">
                                    Gulir ke bawah, lalu pilih opsi <strong>"Tambahkan ke Layar Utama"</strong> (<em>Add to Home Screen</em> ➕).
                                </div>
                            </div>

                            {/* Step 3 */}
                            <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-slate-50/80 border border-slate-100">
                                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100/80 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                </div>
                                <div className="text-xs text-slate-700 leading-relaxed font-medium">
                                    Ketuk <strong>"Tambah"</strong> di pojok kanan atas. Ikon aplikasi akan langsung muncul di beranda HP Anda!
                                </div>
                            </div>
                        </div>

                        {/* Pointing Downward Indicator for Safari Toolbar */}
                        {isIosDevice && (
                            <div className="mt-3.5 p-2.5 rounded-xl bg-blue-50/90 border border-blue-100/90 flex items-center justify-center gap-2 text-center text-[11.5px] font-bold text-[#007aff] shadow-2xs">
                                <span>Ikon Bagikan (Share) ada di bilah Safari tepat di bawah ini</span>
                                <span className="animate-bounce inline-block text-sm">👇</span>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="mt-4 pt-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setShowIosGuide(false)}
                                className="w-full py-3 rounded-xl bg-[#009bd2] hover:bg-[#0087b7] text-white font-extrabold text-xs sm:text-sm min-h-[46px] transition-all shadow-md shadow-[#009bd2]/25 active:scale-95 cursor-pointer"
                            >
                                Saya Mengerti, Coba Sekarang
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
