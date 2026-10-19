import React, { useState, useEffect } from 'react';
import { usePage, router } from '@inertiajs/react';

const TOUR_STEPS = [
    {
        step: 1,
        route: 'kategori.index',
        badge: 'Langkah 1 dari 4',
        title: 'Kelola Kategori Transaksi',
        icon: (
            <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
        ),
        description: 'Sebelum mencatat pemasukan dan pengeluaran, Anda dapat mengelola kategori transaksi di sini. Kami sudah menyiapkan kategori default, dan Anda bisa menambahkan kategori baru sesuai kebutuhan Anda.',
        nextLabel: 'Lanjut ke Jenis Metode',
        mobileNextLabel: 'Lanjut',
        prevLabel: null,
        mobilePrevLabel: null,
    },
    {
        step: 2,
        route: 'metode.index',
        badge: 'Langkah 2 dari 4',
        title: 'Kelola Jenis Metode Pembayaran',
        icon: (
            <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
        ),
        description: 'Di menu ini Anda dapat mengatur metode pembayaran atau rekening penyimpanan (seperti Cash, E-Banking, dan E-Wallet) yang digunakan saat mencatat transaksi.',
        nextLabel: 'Lanjut ke Tabungan & Target',
        mobileNextLabel: 'Lanjut',
        prevLabel: 'Sebelumnya',
        mobilePrevLabel: 'Kembali',
    },
    {
        step: 3,
        route: 'tabungan.target',
        badge: 'Langkah 3 dari 4',
        title: 'Tabungan & Target Impian',
        icon: (
            <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" strokeWidth={2} />
                <circle cx="12" cy="12" r="5" strokeWidth={2} />
                <circle cx="12" cy="12" r="1.5" strokeWidth={2} fill="currentColor" />
            </svg>
        ),
        description: 'Di menu ini Anda dapat merencanakan tujuan keuangan & target tabungan. Tekan tombol "+ Tambah Target" di halaman ini untuk mulai membuat impian tabungan Anda.',
        nextLabel: 'Lanjut ke Transaksi',
        mobileNextLabel: 'Lanjut',
        prevLabel: 'Sebelumnya',
        mobilePrevLabel: 'Kembali',
    },
    {
        step: 4,
        route: 'transaksi.index',
        badge: 'Langkah 4 dari 4',
        title: 'Input & Kelola Transaksi',
        icon: (
            <svg className="w-5 h-5 text-[#009bd2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
        ),
        description: 'Sekarang Anda sudah siap! Di menu Transaksi ini Anda bisa mulai mencatat arus kas harian Anda (pemasukan, pengeluaran, atau alokasi tabungan).',
        nextLabel: 'Selesai & Mulai Mencatat',
        mobileNextLabel: 'Selesai 🎉',
        prevLabel: 'Sebelumnya',
        mobilePrevLabel: 'Kembali',
    },
];

export default function OnboardingTour({ mobileNavMode = 'bottom' }) {
    const { auth, flash } = usePage().props;
    const user = auth?.user;
    const url = usePage().url;

    // Cek apakah user sudah berlangganan
    const isSubscribed = Boolean(
        user?.is_pro || 
        user?.is_pro_plus || 
        user?.role === 'superadmin' || 
        user?.active_tier === 'pro' || 
        user?.active_tier === 'pro_plus'
    );

    const [showWelcome, setShowWelcome] = useState(false);
    const [isTourActive, setIsTourActive] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);

    const userKeyPrefix = user ? `financetrack_user_${user.id}_` : 'financetrack_guest_';

    useEffect(() => {
        if (!user || typeof window === 'undefined') return;

        const isCompleted = localStorage.getItem(`${userKeyPrefix}onboarding_completed`) === 'true';
        const isActive = localStorage.getItem(`${userKeyPrefix}onboarding_active`) === 'true';
        const savedStep = parseInt(localStorage.getItem(`${userKeyPrefix}onboarding_step`) || '1', 10);

        // Jika tour sudah selesai, jangan lakukan apapun
        if (isCompleted) return;

        // 1. Jika tour sedang aktif (berlangsung antar halaman)
        if (isActive) {
            setIsTourActive(true);
            setCurrentStep(savedStep >= 1 && savedStep <= 4 ? savedStep : 1);
            return;
        }

        // Listener jika tour dipicu manual (misal dari menu bantuan)
        const handleManualStart = () => {
            setShowWelcome(true);
            setIsMinimized(false);
        };
        window.addEventListener('start-onboarding-tour', handleManualStart);

        // Handler saat modal penawaran berlangganan ditutup oleh user
        const handleOfferClosed = () => {
            sessionStorage.removeItem(`${userKeyPrefix}just_registered`);
            setTimeout(() => {
                const completedNow = localStorage.getItem(`${userKeyPrefix}onboarding_completed`) === 'true';
                const activeNow = localStorage.getItem(`${userKeyPrefix}onboarding_active`) === 'true';
                if (!completedNow && !activeNow) {
                    setShowWelcome(true);
                }
            }, 350);
        };
        window.addEventListener('subscription-offer-closed', handleOfferClosed);

        // 2. Jika user baru saja registrasi
        if (flash?.just_registered) {
            sessionStorage.setItem(`${userKeyPrefix}just_registered`, 'true');

            // Jika user belum berlangganan (free), modal penawaran berlangganan (OfferModal) muncul DULU.
            // Panduan tour TIDAK boleh muncul bersamaan, melainkan baru muncul setelah modal penawaran ditutup.
            if (!isSubscribed) {
                // Tunggu event 'subscription-offer-closed'
                return () => {
                    window.removeEventListener('start-onboarding-tour', handleManualStart);
                    window.removeEventListener('subscription-offer-closed', handleOfferClosed);
                };
            } else {
                // Jika user sudah subscribed / superadmin, langsung tampilkan panduan
                setShowWelcome(true);
                return () => {
                    window.removeEventListener('start-onboarding-tour', handleManualStart);
                    window.removeEventListener('subscription-offer-closed', handleOfferClosed);
                };
            }
        }

        // 3. Jika registrasi baru terjadi di sesi ini tapi tour belum dimulai/selesai
        const wasJustRegistered = sessionStorage.getItem(`${userKeyPrefix}just_registered`) === 'true';
        if (wasJustRegistered && !isCompleted && !isActive) {
            const isOfferBusy = typeof window !== 'undefined' && (window.__offerModalPending || window.__offerModalOpen || Boolean(flash?.show_subscription_offer));
            if (!isOfferBusy) {
                setShowWelcome(true);
            }
        }

        return () => {
            window.removeEventListener('start-onboarding-tour', handleManualStart);
            window.removeEventListener('subscription-offer-closed', handleOfferClosed);
        };
    }, [flash, user?.id, isSubscribed]);

    // Sinkronisasi otomatis nomor langkah panduan dengan URL / halaman aktif user
    useEffect(() => {
        if (!isTourActive) return;

        let matchedStep = null;
        try {
            if (typeof route === 'function') {
                if (route().current('kategori.*')) matchedStep = 1;
                else if (route().current('metode.*')) matchedStep = 2;
                else if (route().current('tabungan.*') || route().current('anggaran.investasi')) matchedStep = 3;
                else if (route().current('transaksi.*')) matchedStep = 4;
            }
        } catch (e) {
            // fallback via url check
        }

        if (!matchedStep) {
            if (url.includes('/kategori')) matchedStep = 1;
            else if (url.includes('/metode')) matchedStep = 2;
            else if (url.includes('/tabungan') || url.includes('/target')) matchedStep = 3;
            else if (url.includes('/transaksi')) matchedStep = 4;
        }

        if (matchedStep && matchedStep !== currentStep) {
            setCurrentStep(matchedStep);
            if (typeof window !== 'undefined') {
                localStorage.setItem(`${userKeyPrefix}onboarding_step`, String(matchedStep));
            }
        }
    }, [url, isTourActive]);

    const handleStartTour = () => {
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem(`${userKeyPrefix}just_registered`);
            localStorage.setItem(`${userKeyPrefix}onboarding_active`, 'true');
            localStorage.setItem(`${userKeyPrefix}onboarding_step`, '1');
            localStorage.removeItem(`${userKeyPrefix}onboarding_completed`);
        }
        setShowWelcome(false);
        setIsTourActive(true);
        setIsMinimized(false);
        setCurrentStep(1);

        // Langsung arahkan ke langkah 1 (Kelola Kategori)
        router.visit(route('kategori.index'));
    };

    const handleSkip = () => {
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem(`${userKeyPrefix}just_registered`);
            localStorage.setItem(`${userKeyPrefix}onboarding_completed`, 'true');
            localStorage.setItem(`${userKeyPrefix}onboarding_active`, 'false');
        }
        setShowWelcome(false);
        setIsTourActive(false);
    };

    const handleNext = () => {
        if (currentStep < 4) {
            const nextStep = currentStep + 1;
            setCurrentStep(nextStep);

            if (typeof window !== 'undefined') {
                localStorage.setItem(`${userKeyPrefix}onboarding_step`, String(nextStep));
            }

            const targetConfig = TOUR_STEPS[nextStep - 1];
            router.visit(route(targetConfig.route));
        } else {
            // Selesai tour
            if (typeof window !== 'undefined') {
                sessionStorage.removeItem(`${userKeyPrefix}just_registered`);
                localStorage.setItem(`${userKeyPrefix}onboarding_completed`, 'true');
                localStorage.setItem(`${userKeyPrefix}onboarding_active`, 'false');
            }
            setIsTourActive(false);
        }
    };

    const handlePrev = () => {
        if (currentStep > 1) {
            const prevStep = currentStep - 1;
            setCurrentStep(prevStep);

            if (typeof window !== 'undefined') {
                localStorage.setItem(`${userKeyPrefix}onboarding_step`, String(prevStep));
            }

            const targetConfig = TOUR_STEPS[prevStep - 1];
            router.visit(route(targetConfig.route));
        }
    };

    const activeConfig = TOUR_STEPS[currentStep - 1] || TOUR_STEPS[0];

    return (
        <>
            {/* 1. MODAL SAMBUTAN SELAMAT DATANG DI AWAL */}
            {showWelcome && (
                <div className="fixed inset-0 z-[130] flex items-center justify-center p-3.5 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
                    <div className="bg-white rounded-2xl sm:rounded-3xl max-w-[390px] sm:max-w-md w-full p-4 sm:p-5 shadow-2xl border border-slate-100/90 text-left animate-scaleUp max-h-[92vh] overflow-y-auto flex flex-col justify-between">
                        {/* Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#009bd2]/10 border border-[#009bd2]/20 flex items-center justify-center p-1.5 shadow-xs shrink-0">
                                    <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-extrabold text-slate-800 text-sm sm:text-base leading-tight flex items-center gap-1.5">
                                        <span>Selamat Datang!</span>
                                        <span className="text-sm sm:text-base">🎉</span>
                                    </h3>
                                    <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate mt-0.5">
                                        Hai, <span className="font-semibold text-slate-700">{user?.name || 'Teman Finance'}</span>!
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleSkip}
                                className="text-slate-400 hover:text-slate-600 p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors cursor-pointer shrink-0 ml-2"
                                aria-label="Tutup"
                                title="Tutup"
                            >
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Intro Text */}
                        <div className="mt-3 sm:mt-3.5 space-y-2.5 sm:space-y-3">
                            <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed font-normal">
                                Mari ikuti panduan singkat <strong className="font-bold text-slate-800">4 langkah</strong> untuk mengenal alur pencatatan keuangan Anda:
                            </p>

                            <div className="space-y-1.5 py-0.5">
                                {TOUR_STEPS.map((s) => (
                                    <div 
                                        key={s.step} 
                                        className="flex items-center gap-2.5 py-1.5 px-2.5 sm:py-2 sm:px-3 rounded-xl bg-slate-50/90 border border-slate-100 hover:border-slate-200 transition-all"
                                    >
                                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-sky-100/90 text-[#009bd2] font-black text-[11px] sm:text-xs flex items-center justify-center shrink-0">
                                            {s.step}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[11.5px] sm:text-xs font-semibold text-slate-800 truncate">
                                                {s.title}
                                            </p>
                                        </div>
                                        <div className="shrink-0 text-slate-300">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center justify-center gap-1.5 pt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                <p className="text-[10.5px] sm:text-[11px] text-slate-400 font-medium text-center">
                                    Panduan fleksibel &amp; dapat dilewati kapan saja
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-3.5 sm:mt-4 pt-3 border-t border-slate-100 flex flex-col gap-1.5 sm:flex-row sm:gap-2">
                            <button
                                type="button"
                                onClick={handleStartTour}
                                className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-[#009bd2] hover:bg-[#0087b7] text-white font-bold text-xs sm:text-sm min-h-[40px] sm:min-h-[42px] transition-all shadow-sm shadow-[#009bd2]/25 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 order-1 sm:order-2"
                            >
                                <span>Mulai Panduan (4 Langkah)</span>
                                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </button>
                            <button
                                type="button"
                                onClick={handleSkip}
                                className="w-full sm:w-auto py-2 sm:py-2.5 px-3 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 font-semibold text-xs min-h-[34px] sm:min-h-[42px] transition-colors cursor-pointer flex items-center justify-center order-2 sm:order-1"
                            >
                                Lewati untuk Sekarang
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. FLOATING TOUR CARD WIDGET (PRESISI DI TENGAH, BEBAS POTONGAN) */}
            {isTourActive && !showWelcome && (
                <aside 
                    aria-label="Panduan Interaktif Aplikasi"
                    className={`fixed inset-x-3 sm:inset-x-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-full md:max-w-lg z-[115] pointer-events-none transition-all duration-300 ${
                        mobileNavMode === 'bottom' 
                            ? 'bottom-[calc(5.75rem+env(safe-area-inset-bottom))] md:bottom-5' 
                            : 'bottom-[calc(1.25rem+env(safe-area-inset-bottom))] md:bottom-5'
                    }`}
                >
                    {/* Mode Terlipat (Slim Collapsed Pill) */}
                    {isMinimized ? (
                        <div className="animate-slide-up-sheet pointer-events-auto bg-slate-900/95 backdrop-blur-md text-white rounded-2xl sm:rounded-full border border-white/10 shadow-[0_12px_35px_rgba(0,0,0,0.25)] px-3.5 py-2.5 flex items-center justify-between gap-2.5">
                            <div 
                                onClick={() => setIsMinimized(false)}
                                className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                            >
                                <div className="w-6 h-6 rounded-lg bg-[#009bd2] text-white font-black text-xs flex items-center justify-center shrink-0">
                                    {currentStep}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-black truncate">{activeConfig.title}</p>
                                    <p className="text-[10px] text-slate-300 font-medium truncate">Ketuk untuk membuka panduan</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setIsMinimized(false)}
                                    className="px-2.5 py-1 rounded-lg bg-[#009bd2] text-white text-[11px] font-extrabold hover:bg-[#0087b7] active:scale-95 transition"
                                >
                                    Buka
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSkip}
                                    className="p-1 rounded-lg text-slate-400 hover:text-white transition"
                                    title="Selesai / Lewati"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Mode Kartu Penuh (Expanded Card) */
                        <div className="animate-slide-up-sheet pointer-events-auto bg-white/98 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-[0_16px_45px_rgba(0,0,0,0.18)] p-3.5 sm:p-5 relative overflow-hidden">
                            {/* Top Progress Track */}
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-2.5 sm:mb-3">
                                <div 
                                    className="bg-[#009bd2] h-full transition-all duration-300 rounded-full"
                                    style={{ width: `${(currentStep / 4) * 100}%` }}
                                ></div>
                            </div>

                            {/* Card Header Toolbar */}
                            <div className="flex items-center justify-between gap-2 mb-2 sm:mb-2.5">
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-50 border border-sky-100 text-[#009bd2] text-[10px] sm:text-[10.5px] font-black tracking-wide uppercase">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#009bd2] animate-pulse"></span>
                                        {activeConfig.badge}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    {/* Tombol Perkecil / Minimize */}
                                    <button
                                        type="button"
                                        onClick={() => setIsMinimized(true)}
                                        className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 min-w-[28px] min-h-[28px] rounded-lg hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                                        title="Sembunyikan sementara"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    {/* Tombol Lewati */}
                                    <button
                                        type="button"
                                        onClick={handleSkip}
                                        className="text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-colors p-1.5 min-h-[28px] rounded-lg hover:bg-slate-100 flex items-center gap-1 cursor-pointer"
                                        title="Lewati Panduan"
                                    >
                                        <span>Lewati</span>
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Step Body */}
                            <div className="flex items-start gap-2.5 sm:gap-3">
                                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                                    {activeConfig.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-xs sm:text-sm font-black text-slate-800 leading-tight">
                                        {activeConfig.title}
                                    </h4>
                                    <p className="text-[11px] sm:text-xs text-slate-600 font-medium leading-relaxed mt-1">
                                        {activeConfig.description}
                                    </p>
                                </div>
                            </div>

                            {/* Card Navigation Footer */}
                            <div className="mt-3 sm:mt-3.5 pt-2.5 sm:pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                                <div>
                                    {activeConfig.prevLabel && (
                                        <button
                                            type="button"
                                            onClick={handlePrev}
                                            className="py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs min-h-[38px] transition-colors cursor-pointer flex items-center gap-1 active:scale-95"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                                            </svg>
                                            <span className="hidden sm:inline">{activeConfig.prevLabel}</span>
                                            <span className="inline sm:hidden">{activeConfig.mobilePrevLabel || 'Kembali'}</span>
                                        </button>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleNext}
                                        className="py-2 px-3.5 sm:px-4 rounded-xl bg-[#009bd2] hover:bg-[#0087b7] text-white font-extrabold text-xs min-h-[38px] transition-all shadow-sm shadow-[#009bd2]/25 active:scale-95 cursor-pointer flex items-center gap-1.5"
                                    >
                                        <span className="hidden sm:inline">{activeConfig.nextLabel}</span>
                                        <span className="inline sm:hidden">{activeConfig.mobileNextLabel || 'Lanjut'}</span>
                                        {currentStep < 4 ? (
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                            </svg>
                                        ) : (
                                            <span>🎉</span>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </aside>
            )}
        </>
    );
}
