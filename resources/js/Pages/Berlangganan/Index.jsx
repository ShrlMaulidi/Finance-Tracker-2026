import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, router } from '@inertiajs/react';

const PLAN_NAMES = {
    pro: 'Paket Pro',
    pro_plus: 'Paket Pro Plus (AI & WA)',
};

// Keys must match MidtransService::PAYMENT_CHANNELS. A method without a logo file shows its name instead.
const LOGO_DIR = '/images/payment-methods';
const PAYMENT_METHODS = [
    { key: 'qris', name: 'QRIS', shortName: 'QRIS', category: 'ewallet', logo: `${LOGO_DIR}/qris.svg`, note: 'Semua bank & e-wallet', recommended: true },
    { key: 'bca_va', name: 'BCA Virtual Account', shortName: 'BCA', category: 'bank', logo: `${LOGO_DIR}/BCA.svg` },
    { key: 'bri_va', name: 'BRI Virtual Account', shortName: 'BRI', category: 'bank', logo: `${LOGO_DIR}/BRI.svg` },
    { key: 'mandiri', name: 'Mandiri Virtual Account', shortName: 'Mandiri', category: 'bank', logo: `${LOGO_DIR}/mandiri.svg` },
    { key: 'bni_va', name: 'BNI Virtual Account', shortName: 'BNI', category: 'bank', logo: `${LOGO_DIR}/BNI.svg` },
    { key: 'permata_va', name: 'Permata Virtual Account', shortName: 'Permata', category: 'bank', logo: `${LOGO_DIR}/permata.svg`},
    { key: 'cimb_va', name: 'CIMB Niaga Virtual Account', shortName: 'CIMB Niaga', category: 'bank', logo: `${LOGO_DIR}/cimb.svg`},
    { key: 'gopay', name: 'GoPay', shortName: 'GoPay', category: 'ewallet', logo: `${LOGO_DIR}/gopay.svg` },
    { key: 'dana', name: 'DANA', shortName: 'DANA', category: 'ewallet', logo: `${LOGO_DIR}/dana.svg`, note: 'Dibayar via QRIS' },
];

const PAYMENT_CATEGORIES = [
    { key: 'all', label: 'Semua' },
    { key: 'bank', label: 'Transfer Bank' },
    { key: 'ewallet', label: 'E-Wallet & QRIS' },
];

const CATEGORY_LABELS = { bank: 'Transfer Bank', ewallet: 'E-Wallet & QRIS' };

// Loads Midtrans Snap once and resolves with window.snap
const loadSnap = (scriptUrl, clientKey) => new Promise((resolve, reject) => {
    if (window.snap) {
        resolve(window.snap);
        return;
    }
    const existing = document.getElementById('midtrans-snap');
    const script = existing || document.createElement('script');
    script.addEventListener('load', () => resolve(window.snap));
    script.addEventListener('error', () => reject(new Error('Gagal memuat halaman pembayaran.')));
    if (!existing) {
        script.id = 'midtrans-snap';
        script.src = scriptUrl;
        script.setAttribute('data-client-key', clientKey);
        document.body.appendChild(script);
    }
});

export default function Index({ currentPlan = 'free', subscriptionExpiresAt = null, pricing, midtrans = {}, pendingPayment = null }) {
    const { auth, pricing: pagePricing } = usePage().props;
    const user = auth?.user;
    const effectivePricing = pricing || pagePricing || {};

    const proMonthly = Number(effectivePricing.pro_monthly_price ?? 14999);
    const proYearly = Number(effectivePricing.pro_yearly_price ?? 149000);
    const proPlusMonthly = Number(effectivePricing.pro_plus_monthly_price ?? 29999);
    const proPlusYearly = Number(effectivePricing.pro_plus_yearly_price ?? 299000);

    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(number || 0);
    };

    const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'
    const [mobilePlan, setMobilePlan] = useState('all'); // 'all' | 'pro_plus' | 'pro' | 'free'
    const [openFaq, setOpenFaq] = useState(null);
    const [checkoutPlan, setCheckoutPlan] = useState(null);
    const [payingMethod, setPayingMethod] = useState(null); // method key while its Snap token is being created
    const isStartingPayment = payingMethod !== null;
    const [methodCategory, setMethodCategory] = useState('all');
    const [methodSearch, setMethodSearch] = useState('');
    const [brokenLogos, setBrokenLogos] = useState({});
    const [checkoutError, setCheckoutError] = useState(null);
    const [paymentNotice, setPaymentNotice] = useState(null); // { type: 'success' | 'pending' | 'error', text }

    const toggleFaq = (index) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    const handleSelectPlan = (planKey, name) => {
        setCheckoutPlan({
            key: planKey,
            name: name,
        });
        setCheckoutError(null);
        setMethodCategory('all');
        setMethodSearch('');
    };

    const visiblePaymentMethods = PAYMENT_METHODS.filter(method => {
        const matchesCategory = methodCategory === 'all' || method.category === methodCategory;
        const keyword = methodSearch.trim().toLowerCase();
        return matchesCategory && (!keyword || method.name.toLowerCase().includes(keyword));
    });

    // Ask the server for the real Midtrans status, then refresh the page props (plan, expiry, pending order)
    const syncPayment = async (paymentId) => {
        try {
            const { data } = await window.axios.post(route('berlangganan.payments.sync', paymentId));
            if (data.status === 'paid') {
                setPaymentNotice({ type: 'success', text: `Pembayaran berhasil! Paket Anda aktif hingga ${data.subscription_expires_at}.` });
            } else if (data.status === 'pending') {
                setPaymentNotice({ type: 'pending', text: 'Menunggu pembayaran. Selesaikan pembayaran sesuai instruksi; paket aktif otomatis setelah pembayaran diterima.' });
            } else if (['expired', 'cancelled', 'failed'].includes(data.status)) {
                setPaymentNotice({ type: 'error', text: 'Pembayaran tidak berhasil atau sudah kedaluwarsa. Silakan buat pembayaran baru.' });
            }
        } catch (err) {
            // The webhook still activates the plan; the realtime update refreshes this page when it arrives
        }
        router.reload({ preserveScroll: true });
    };

    const openSnap = async (token, paymentId) => {
        const snap = await loadSnap(midtrans.snapScriptUrl, midtrans.clientKey);
        setCheckoutPlan(null);
        snap.pay(token, {
            onSuccess: () => syncPayment(paymentId),
            onPending: () => syncPayment(paymentId),
            onClose: () => syncPayment(paymentId),
            onError: () => setPaymentNotice({ type: 'error', text: 'Pembayaran gagal diproses. Silakan coba lagi.' }),
        });
    };

    const handlePay = async (methodKey) => {
        if (!checkoutPlan || isStartingPayment) return;
        setPayingMethod(methodKey);
        setCheckoutError(null);
        try {
            const { data } = await window.axios.post(route('berlangganan.checkout'), {
                plan: checkoutPlan.key,
                billing_cycle: billingCycle,
                payment_method: methodKey,
            });
            await openSnap(data.token, data.payment_id);
        } catch (err) {
            setCheckoutError(err.response?.data?.message || err.message || 'Gagal memulai pembayaran. Silakan coba lagi.');
        } finally {
            setPayingMethod(null);
        }
    };

    const resumePendingPayment = async () => {
        try {
            await openSnap(pendingPayment.snap_token, pendingPayment.id);
        } catch (err) {
            setPaymentNotice({ type: 'error', text: err.message || 'Gagal membuka halaman pembayaran.' });
        }
    };

    const getCheckoutPrice = (planKey) => {
        if (!planKey) return 0;
        if (planKey === 'pro_plus') {
            return billingCycle === 'monthly' ? proPlusMonthly : proPlusYearly;
        }
        return billingCycle === 'monthly' ? proMonthly : proYearly;
    };

    const currentCheckoutPrice = getCheckoutPrice(checkoutPlan?.key);

    // Auto buka modal checkout jika ada query param ?plan=...
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const planParam = params.get('plan');
            if (planParam === 'pro' && currentPlan === 'free') {
                handleSelectPlan('pro', PLAN_NAMES.pro);
            } else if (planParam === 'pro_plus' && currentPlan !== 'pro_plus') {
                handleSelectPlan('pro_plus', PLAN_NAMES.pro_plus);
            }
        }
    }, []);

    // Tutup modal jika tombol Escape ditekan
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && checkoutPlan) {
                setCheckoutPlan(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [checkoutPlan]);

    // wa.me needs the international format, so a local 08xx number becomes 628xx
    const waNumber = (effectivePricing.support_wa?.replace(/\D/g, '') || '6285212867574').replace(/^0/, '62');

    const canRenewCurrentPlan = Boolean(subscriptionExpiresAt);

    const faqs = [
        {
            q: "Bagaimana cara kerja fitur Integrasi Agent AI WhatsApp?",
            a: "Dengan paket Pro Plus, Anda akan mendapatkan nomor bot WhatsApp resmi FinanceTrack. Anda cukup mengirim pesan teks seperti 'Makan siang sate 35rb pakai Gopay' atau mengirim foto struk belanja, dan AI akan otomatis mencatatnya ke dalam pembukuan Anda secara instan."
        },
        {
            q: "Apakah saya bisa membatalkan langganan kapan saja?",
            a: "Ya, tentu saja! Anda bebas membatalkan atau mengubah paket langganan Anda kapan saja tanpa komitmen jangka panjang atau biaya tersembunyi."
        },
        {
            q: "Metode pembayaran apa saja yang didukung?",
            a: "Pembayaran diproses otomatis oleh Midtrans melalui QRIS (bisa dibayar dari semua aplikasi bank & e-wallet, termasuk OVO dan DANA), GoPay, ShopeePay, serta Virtual Account BCA, BNI, BRI, Mandiri, Permata, dan CIMB Niaga. Paket langsung aktif begitu pembayaran diterima."
        },
        {
            q: "Apakah data keuangan saya dijamin aman dan rahasia?",
            a: "Keamanan Anda adalah prioritas utama kami. Seluruh data transaksi dienkripsi dengan standar enkripsi 256-bit kelas perbankan dan tidak akan pernah dibagikan kepada pihak ketiga manapun."
        }
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Berlangganan" />

            <div className="max-w-7xl mx-auto px-3.5 py-3.5 sm:p-6 lg:p-8 space-y-4 sm:space-y-7 lg:space-y-10 animate-fade-in">
                
                {/* Header */}
                <div className="text-center max-w-2xl mx-auto space-y-1.5 sm:space-y-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider bg-blue-50 text-[#009bd2] border border-blue-100">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4l3 6 5-4-2 12H6L4 6l5 4 3-6z" /></svg>
                        Paket Langganan
                    </span>
                    <h1 className="text-xl sm:text-3xl md:text-4xl font-black text-slate-800 tracking-tight leading-tight">
                        Tingkatkan Pengelolaan Finansial Anda
                    </h1>
                    <p className="text-[11.5px] sm:text-sm md:text-base text-slate-500 font-medium max-w-lg mx-auto leading-relaxed">
                        Pilih paket berlangganan terbaik untuk membuka fitur pencatatan tanpa batas dan asisten AI pintar.
                    </p>

                    {/* Billing Cycle Toggle - Full 50/50 on small screens */}
                    <div className="pt-1.5 sm:pt-3 flex items-center justify-center">
                        <div className="bg-slate-100 p-1 rounded-xl sm:rounded-2xl flex items-center shadow-inner w-full max-w-[280px] sm:max-w-xs">
                            <button
                                type="button"
                                onClick={() => setBillingCycle('monthly')}
                                className={`flex-1 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 text-center ${
                                    billingCycle === 'monthly'
                                        ? 'bg-white text-slate-900 shadow-xs'
                                        : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                Bulanan
                            </button>
                            <button
                                type="button"
                                onClick={() => setBillingCycle('yearly')}
                                className={`flex-1 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 flex items-center justify-center gap-1 text-center ${
                                    billingCycle === 'yearly'
                                        ? 'bg-[#009bd2] text-white shadow-xs'
                                        : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                <span>Tahunan</span>
                                <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                                    billingCycle === 'yearly' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                    Hemat 20%
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Payment result / pending order / active plan */}
                {paymentNotice && (
                    <div className={`max-w-2xl mx-auto flex items-start gap-2.5 p-3 sm:p-3.5 rounded-2xl border text-xs sm:text-sm font-semibold ${
                        paymentNotice.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                            : paymentNotice.type === 'pending' ? 'bg-amber-50 border-amber-100 text-amber-800'
                            : 'bg-rose-50 border-rose-100 text-rose-700'
                    }`}>
                        <span className="flex-1 leading-relaxed">{paymentNotice.text}</span>
                        <button type="button" onClick={() => setPaymentNotice(null)} className="shrink-0 opacity-60 hover:opacity-100" aria-label="Tutup">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                )}

                {pendingPayment && (
                    <div className="max-w-2xl mx-auto flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 p-3 sm:p-4 rounded-2xl bg-amber-50 border border-amber-100">
                        <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-extrabold text-amber-900">Pembayaran belum selesai</p>
                            <p className="text-[11px] sm:text-xs text-amber-800/80 font-medium mt-0.5">
                                {PLAN_NAMES[pendingPayment.plan]} · {pendingPayment.billing_cycle === 'yearly' ? 'Tahunan' : 'Bulanan'} · {formatRupiah(pendingPayment.amount)}
                                {PAYMENT_METHODS.find(method => method.key === pendingPayment.payment_method) && (
                                    <> · {PAYMENT_METHODS.find(method => method.key === pendingPayment.payment_method).name}</>
                                )}
                            </p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <button
                                type="button"
                                onClick={() => syncPayment(pendingPayment.id)}
                                className="h-9 px-3 rounded-xl bg-white border border-amber-200 text-amber-800 text-xs font-bold hover:bg-amber-100 transition"
                            >
                                Cek Status
                            </button>
                            <button
                                type="button"
                                onClick={resumePendingPayment}
                                className="h-9 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold transition"
                            >
                                Lanjutkan Pembayaran
                            </button>
                        </div>
                    </div>
                )}

                {currentPlan !== 'free' && subscriptionExpiresAt && (
                    <p className="text-center text-[11.5px] sm:text-sm font-semibold text-slate-500">
                        {PLAN_NAMES[currentPlan]} Anda aktif hingga <span className="font-extrabold text-slate-800">{subscriptionExpiresAt}</span>
                    </p>
                )}

                {/* Mobile Plan Tab Filter (Native iOS/Android Style Segmented Control) */}
                <div className="grid grid-cols-4 md:hidden bg-slate-100 p-1 rounded-xl text-center shadow-inner gap-1">
                    <button
                        type="button"
                        onClick={() => setMobilePlan('all')}
                        className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                            mobilePlan === 'all'
                                ? 'bg-white text-slate-900 shadow-xs'
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        Semua
                    </button>
                    <button
                        type="button"
                        onClick={() => setMobilePlan('pro_plus')}
                        className={`py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                            mobilePlan === 'pro_plus'
                                ? 'bg-purple-600 text-white shadow-xs'
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <span>Pro Plus</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setMobilePlan('pro')}
                        className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                            mobilePlan === 'pro'
                                ? 'bg-[#009bd2] text-white shadow-xs'
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        Paket Pro
                    </button>
                    <button
                        type="button"
                        onClick={() => setMobilePlan('free')}
                        className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                            mobilePlan === 'free'
                                ? 'bg-slate-700 text-white shadow-xs'
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        Starter
                    </button>
                </div>

                {/* Pricing Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-6 lg:gap-8 items-stretch pt-0.5 sm:pt-2">
                    
                    {/* PLAN 1: STARTER (FREE) */}
                    <div className={`bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-7 border border-slate-100 shadow-xs flex-col justify-between relative overflow-hidden group hover:border-slate-200 transition-all ${
                        mobilePlan !== 'all' && mobilePlan !== 'free' ? 'hidden md:flex' : 'flex'
                    }`}>
                        <div>
                            <div className="flex items-center justify-between mb-1.5 sm:mb-3">
                                <h3 className="text-base sm:text-xl font-black text-slate-800">Starter</h3>
                                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">
                                    Gratis
                                </span>
                            </div>
                            <p className="text-[11.5px] sm:text-xs text-slate-500 font-medium mb-3 sm:mb-4">
                                Untuk pencatatan keuangan pribadi dasar.
                            </p>

                            <div className="mb-3.5 sm:mb-6">
                                <div className="flex items-baseline gap-1.5 flex-wrap">
                                    <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">Rp 0</span>
                                    <span className="text-xs font-bold text-slate-400">/selamanya</span>
                                </div>
                            </div>

                            <ul className="space-y-2 sm:space-y-2.5 mb-4 sm:mb-6 text-[11.5px] sm:text-xs lg:text-sm">
                                <li className="flex items-start gap-2 sm:gap-2.5 text-slate-600 font-medium">
                                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                                        <svg className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <span className="leading-snug">Pencatatan transaksi manual harian</span>
                                </li>
                                <li className="flex items-start gap-2 sm:gap-2.5 text-slate-600 font-medium">
                                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                                        <svg className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <span className="leading-snug">Maks. 1 target impian & 2 tagihan rutin</span>
                                </li>
                                <li className="flex items-start gap-2 sm:gap-2.5 text-slate-600 font-medium">
                                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                                        <svg className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <span className="leading-snug">Maks. 3 kategori & 3 metode bayar</span>
                                </li>
                                <li className="flex items-start gap-2 sm:gap-2.5 text-slate-400 font-medium">
                                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0 mt-0.5">
                                        <svg className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </div>
                                    <span className="leading-snug">Semua modul anggaran (Terkunci)</span>
                                </li>
                                <li className="flex items-start gap-2 sm:gap-2.5 text-slate-400 font-medium">
                                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0 mt-0.5">
                                        <svg className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </div>
                                    <span className="leading-snug">Laporan keuangan & ekspor PDF/Excel</span>
                                </li>
                                <li className="flex items-start gap-2 sm:gap-2.5 text-slate-400 font-medium">
                                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0 mt-0.5">
                                        <svg className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </div>
                                    <span className="leading-snug">Integrasi Agent AI WhatsApp bot</span>
                                </li>
                            </ul>
                        </div>

                        <button 
                            disabled={currentPlan === 'free'} 
                            className={`w-full py-2.5 sm:py-3.5 rounded-xl font-extrabold text-xs sm:text-sm text-center transition-all ${
                                currentPlan === 'free'
                                    ? 'bg-slate-100 text-slate-500 cursor-default'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer active:scale-98'
                            }`}
                        >
                            {currentPlan === 'free' ? '✓ Paket Anda Saat Ini (Aktif)' : 'Pilih Starter'}
                        </button>
                    </div>

                    {/* PLAN 2: PRO */}
                    <div className={`bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-7 border-2 ${
                        currentPlan === 'pro' 
                            ? 'border-[#009bd2] ring-2 ring-[#009bd2]/20' 
                            : 'border-[#009bd2]/30 hover:border-[#009bd2]'
                    } shadow-xs flex-col justify-between relative overflow-hidden group transition-all ${
                        mobilePlan !== 'all' && mobilePlan !== 'pro' ? 'hidden md:flex' : 'flex'
                    }`}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#009bd2]/5 rounded-full blur-2xl pointer-events-none"></div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5 sm:mb-3">
                                <h3 className="text-base sm:text-xl font-black text-slate-800">Paket Pro</h3>
                                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-[#009bd2]">
                                    {currentPlan === 'pro' ? 'Aktif' : 'Paling Hemat'}
                                </span>
                            </div>
                            <p className="text-[11.5px] sm:text-xs text-slate-500 font-medium mb-3 sm:mb-4">
                                Akses tanpa batas ke seluruh modul finansial.
                            </p>

                            <div className="mb-3.5 sm:mb-6">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-[10.5px] sm:text-xs font-bold text-slate-400 line-through">
                                        {formatRupiah(billingCycle === 'monthly' ? Math.round(proMonthly * 1.35) : Math.round(proMonthly * 12))}
                                    </span>
                                </div>
                                <div className="flex items-baseline gap-1.5 flex-wrap">
                                    <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#009bd2] tracking-tight">
                                        {formatRupiah(billingCycle === 'monthly' ? proMonthly : proYearly)}
                                    </span>
                                    <span className="text-xs font-bold text-slate-400">
                                        {billingCycle === 'monthly' ? '/bulan' : '/tahun'}
                                    </span>
                                </div>
                            </div>

                            <ul className="space-y-2 sm:space-y-2.5 mb-4 sm:mb-6 text-[11.5px] sm:text-xs lg:text-sm">
                                <li className="flex items-start gap-2 sm:gap-2.5 text-slate-700 font-bold">
                                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-blue-50 text-[#009bd2] flex items-center justify-center shrink-0 mt-0.5">
                                        <svg className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <span className="leading-snug">Semua fitur paket Starter</span>
                                </li>
                                <li className="flex items-start gap-2 sm:gap-2.5 text-slate-700 font-bold">
                                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-blue-50 text-[#009bd2] flex items-center justify-center shrink-0 mt-0.5">
                                        <svg className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <span className="leading-snug">Transaksi, target & tagihan tanpa batas</span>
                                </li>
                                <li className="flex items-start gap-2 sm:gap-2.5 text-slate-700 font-bold">
                                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-blue-50 text-[#009bd2] flex items-center justify-center shrink-0 mt-0.5">
                                        <svg className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <span className="leading-snug">Kategori & metode bayar tanpa batas</span>
                                </li>
                                <li className="flex items-start gap-2 sm:gap-2.5 text-slate-700 font-bold">
                                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-blue-50 text-[#009bd2] flex items-center justify-center shrink-0 mt-0.5">
                                        <svg className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <span className="leading-snug">Akses penuh semua menu anggaran</span>
                                </li>
                                <li className="flex items-start gap-2 sm:gap-2.5 text-slate-700 font-bold">
                                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-blue-50 text-[#009bd2] flex items-center justify-center shrink-0 mt-0.5">
                                        <svg className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <span className="leading-snug">Laporan keuangan & ekspor PDF / Excel</span>
                                </li>
                                <li className="flex items-start gap-2 sm:gap-2.5 text-slate-400 font-medium">
                                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0 mt-0.5">
                                        <svg className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </div>
                                    <span className="leading-snug">Integrasi Agent AI WhatsApp bot</span>
                                </li>
                            </ul>
                        </div>

                        <button 
                            type="button"
                            onClick={() => handleSelectPlan('pro', PLAN_NAMES.pro)}
                            disabled={currentPlan === 'pro_plus' || (currentPlan === 'pro' && !canRenewCurrentPlan)}
                            className={`w-full py-2.5 sm:py-3.5 rounded-xl font-extrabold text-xs sm:text-sm shadow-sm transition-all text-center flex items-center justify-center gap-1.5 ${
                                currentPlan === 'pro_plus' || (currentPlan === 'pro' && !canRenewCurrentPlan)
                                    ? 'bg-slate-100 text-slate-500 cursor-default'
                                    : 'bg-slate-900 hover:bg-[#009bd2] text-white active:scale-98 cursor-pointer'
                            }`}
                        >
                            {currentPlan === 'pro_plus'
                                ? 'Sudah termasuk di Pro Plus'
                                : currentPlan === 'pro'
                                ? (canRenewCurrentPlan ? 'Perpanjang Paket Pro' : '✓ Paket Anda Saat Ini (Aktif)')
                                : 'Pilih Paket Pro'}
                        </button>
                    </div>

                    {/* PLAN 3: PRO PLUS (AI & WHATSAPP) */}
                    <div 
                        style={{ backgroundColor: '#0f172a' }}
                        className={`bg-[#0f172a] bg-gradient-to-b from-slate-900 via-[#0f172a] to-slate-950 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-7 shadow-xl shadow-indigo-950/30 flex-col justify-between relative overflow-hidden border-2 ${
                            currentPlan === 'pro_plus' ? 'border-purple-400 ring-2 ring-purple-500/30' : 'border-indigo-500/40'
                        } md:-translate-y-2 ${
                            mobilePlan !== 'all' && mobilePlan !== 'pro_plus' ? 'hidden md:flex' : 'flex'
                        }`}
                    >
                        {/* Glow effect */}
                        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

                        {/* Top Ribbon */}
                        <div 
                            style={{ backgroundColor: '#4f46e5' }}
                            className="absolute top-0 right-0 bg-indigo-600 bg-gradient-to-l from-indigo-500 to-sky-500 text-white text-[9px] sm:text-[10px] font-black uppercase tracking-widest py-0.5 sm:py-1 px-2.5 sm:px-3.5 rounded-bl-xl shadow-xs"
                        >
                            {currentPlan === 'pro_plus' ? '✓ Paket Aktif' : '★ Paling Populer'}
                        </div>

                        <div>
                            <div className="mb-1.5 sm:mb-3 pr-24 sm:pr-0">
                                <h3 className="text-base sm:text-xl font-black text-white flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                    <span>Pro Plus</span>
                                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
                                        AI WhatsApp
                                    </span>
                                </h3>
                            </div>
                            <p className="text-[11.5px] sm:text-xs text-slate-300 font-medium mb-3 sm:mb-4">
                                Asisten finansial cerdas terhubung 24/7 di WhatsApp Anda.
                            </p>

                            <div className="mb-3.5 sm:mb-6">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-[10.5px] sm:text-xs font-bold text-slate-400 line-through">
                                        {formatRupiah(billingCycle === 'monthly' ? Math.round(proPlusMonthly * 1.35) : Math.round(proPlusMonthly * 12))}
                                    </span>
                                </div>
                                <div className="flex items-baseline gap-1.5 flex-wrap">
                                    <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                                        {formatRupiah(billingCycle === 'monthly' ? proPlusMonthly : proPlusYearly)}
                                    </span>
                                    <span className="text-xs font-bold text-slate-300">
                                        {billingCycle === 'monthly' ? '/bulan' : '/tahun'}
                                    </span>
                                </div>
                            </div>

                            <ul className="space-y-2 sm:space-y-2.5 mb-4 sm:mb-6 text-[11.5px] sm:text-xs lg:text-sm">
                                <li className="flex items-start gap-2 sm:gap-2.5 text-slate-100 font-bold">
                                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
                                        <svg className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <span className="leading-snug">Semua fitur paket Pro (Full Akses)</span>
                                </li>
                                <li className="flex items-start gap-2 sm:gap-2.5 text-white font-bold">
                                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                                        <svg className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <span className="flex items-center gap-1.5 flex-wrap leading-snug">
                                        <span>Integrasi Agent AI WhatsApp 24/7</span>
                                        <span className="inline-flex h-2 w-2 relative">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                                        </span>
                                    </span>
                                </li>
                                <li className="flex items-start gap-2 sm:gap-2.5 text-slate-100 font-medium">
                                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
                                        <svg className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <span className="leading-snug">Catat transaksi via chat WhatsApp</span>
                                </li>
                                <li className="flex items-start gap-2 sm:gap-2.5 text-slate-100 font-medium">
                                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
                                        <svg className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <span className="leading-snug">Scan foto struk belanja otomatis (OCR AI)</span>
                                </li>
                            </ul>
                        </div>

                        <button 
                            type="button"
                            onClick={() => handleSelectPlan('pro_plus', PLAN_NAMES.pro_plus)}
                            disabled={currentPlan === 'pro_plus' && !canRenewCurrentPlan}
                            style={{ backgroundColor: '#4f46e5' }}
                            className={`w-full py-2.5 sm:py-3.5 rounded-xl font-black text-xs sm:text-sm shadow-md transition-all text-center flex items-center justify-center gap-1.5 ${
                                currentPlan === 'pro_plus' && !canRenewCurrentPlan
                                    ? 'bg-slate-800 text-slate-400 cursor-default'
                                    : 'bg-indigo-600 bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-600 hover:to-sky-600 text-white shadow-indigo-500/30 active:scale-98 cursor-pointer'
                            }`}
                        >
                            {currentPlan === 'pro_plus'
                                ? (canRenewCurrentPlan ? 'Perpanjang Pro Plus' : '✓ Paket Anda Saat Ini (Aktif)')
                                : 'Pilih Pro Plus (AI)'}
                        </button>
                    </div>

                </div>

                {/* Secure Payment & Guarantees Banner */}
                <div className="bg-white rounded-xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4 text-center sm:text-left">
                    <div className="flex items-center gap-2.5 sm:gap-3 text-left">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                        </div>
                        <div>
                            <h4 className="text-xs sm:text-sm font-black text-slate-800">Garansi Keamanan Transaksi 100%</h4>
                            <p className="text-[10.5px] sm:text-xs text-slate-500 font-medium leading-tight">Pembayaran diproses aman oleh Midtrans via QRIS, E-Wallet & Virtual Account Bank.</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-center sm:justify-end gap-1 text-[9.5px] sm:text-xs font-bold text-slate-500">
                        <span className="px-2 py-0.5 bg-slate-100 rounded-md">QRIS</span>
                        <span className="px-2 py-0.5 bg-slate-100 rounded-md">GoPay</span>
                        <span className="px-2 py-0.5 bg-slate-100 rounded-md">ShopeePay</span>
                        <span className="px-2 py-0.5 bg-slate-100 rounded-md">Virtual Account</span>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="bg-white rounded-xl sm:rounded-3xl p-4 sm:p-7 border border-slate-100 shadow-xs space-y-3 sm:space-y-5">
                    <div className="text-center max-w-xl mx-auto space-y-1">
                        <h2 className="text-sm sm:text-xl lg:text-2xl font-black text-slate-800 tracking-tight">
                            Pertanyaan Umum (FAQ)
                        </h2>
                        <p className="text-[11px] sm:text-xs md:text-sm text-slate-500 font-medium">
                            Semua hal yang perlu Anda ketahui tentang paket langganan FinanceTrack.
                        </p>
                    </div>

                    <div className="space-y-1.5 sm:space-y-2.5 max-w-3xl mx-auto">
                        {faqs.map((faq, index) => (
                            <div 
                                key={index}
                                className="border border-slate-100 rounded-xl sm:rounded-2xl overflow-hidden transition-colors"
                            >
                                <button
                                    onClick={() => toggleFaq(index)}
                                    className="w-full p-3 sm:p-4 text-left flex items-center justify-between gap-3 font-bold text-xs sm:text-sm text-slate-800 hover:bg-slate-50 transition-colors"
                                >
                                    <span>{faq.q}</span>
                                    <svg className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0 transition-transform duration-200 ${openFaq === index ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </button>
                                {openFaq === index && (
                                    <div className="px-3 pb-3 sm:px-4 sm:pb-4 pt-1 text-[11px] sm:text-xs md:text-sm text-slate-500 leading-relaxed border-t border-slate-50">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* CHECKOUT MODAL: pick a payment method, then Midtrans Snap opens straight on it */}
            {checkoutPlan && (
                <div
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
                    onClick={(e) => {
                        if (e.target === e.currentTarget && !isStartingPayment) setCheckoutPlan(null);
                    }}
                >
                    <div className="bg-slate-50 w-full sm:max-w-3xl max-h-[94dvh] sm:max-h-[92vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-scale-up">

                        <div className="flex-1 overflow-y-auto">
                        {/* Header */}
                        <div className="relative bg-gradient-to-br from-[#0b2f5b] via-[#0a4a8a] to-[#009bd2] text-white px-4 sm:px-7 pt-4 sm:pt-6 pb-16 sm:pb-20 overflow-hidden">
                            <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-white/10 pointer-events-none" />
                            <div className="absolute right-10 -bottom-24 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
                            <div className="relative flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">
                                        {currentPlan === checkoutPlan.key ? 'Perpanjangan paket' : 'Pembayaran langganan'}
                                    </p>
                                    <h3 className="mt-1.5 text-xl sm:text-3xl font-black tracking-tight">Pilih metode pembayaran</h3>
                                    <p className="mt-1 text-[11.5px] sm:text-sm text-white/80 font-medium">Pilih metode yang paling nyaman untuk menyelesaikan pembayaran Anda.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setCheckoutPlan(null)}
                                    disabled={isStartingPayment}
                                    className="shrink-0 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition disabled:opacity-40"
                                    aria-label="Tutup"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </div>

                            {/* Order summary */}
                            <div className="relative z-10 -mt-12 sm:-mt-14 mx-3 sm:mx-6 bg-white rounded-2xl shadow-[0_10px_30px_-12px_rgba(15,23,42,0.25)] border border-slate-100 grid grid-cols-2 sm:grid-cols-4">
                                <div className="col-span-2 sm:col-span-1 p-3 sm:p-4 min-w-0 flex items-center gap-2.5 border-b sm:border-b-0 border-slate-100">
                                    <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-sky-50 text-[#009bd2] flex items-center justify-center shrink-0">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400">Nama pelanggan</p>
                                        <p className="mt-0.5 text-[12.5px] sm:text-sm font-extrabold text-slate-800 truncate" title={user?.email}>{user?.name || '-'}</p>
                                    </div>
                                </div>
                                <div className="p-3 sm:p-4 min-w-0 sm:border-l border-slate-100">
                                    <p className="text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400">Paket</p>
                                    <p className="mt-0.5 text-[12.5px] sm:text-sm font-extrabold text-slate-800 truncate">{checkoutPlan.name}</p>
                                </div>
                                <div className="p-3 sm:p-4 min-w-0 border-l border-slate-100">
                                    <p className="text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400">Total tagihan</p>
                                    <p className="mt-0.5 text-[13px] sm:text-base font-black text-[#009bd2] tabular-nums">{formatRupiah(currentCheckoutPrice)}</p>
                                </div>
                                <div className="col-span-2 sm:col-span-1 p-3 sm:p-4 border-t sm:border-t-0 sm:border-l border-slate-100 flex sm:block items-center justify-between gap-2">
                                    <p className="text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400">Periode</p>
                                    <div className="sm:mt-1 inline-flex items-center p-0.5 rounded-lg bg-slate-100">
                                        {[{ key: 'monthly', label: 'Bulanan' }, { key: 'yearly', label: 'Tahunan' }].map(cycle => (
                                            <button
                                                key={cycle.key}
                                                type="button"
                                                onClick={() => setBillingCycle(cycle.key)}
                                                disabled={isStartingPayment}
                                                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${billingCycle === cycle.key ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                                            >
                                                {cycle.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            {currentPlan === checkoutPlan.key && subscriptionExpiresAt && (
                                <p className="mx-4 sm:mx-7 mt-2 text-[10.5px] sm:text-[11px] text-slate-500 font-medium">
                                    Masa aktif ditambahkan dari tanggal berakhir sekarang ({subscriptionExpiresAt}).
                                </p>
                            )}

                            {/* Methods */}
                            <div className="m-3 sm:m-6 mt-4 sm:mt-5 bg-white rounded-2xl sm:rounded-3xl border border-slate-100 p-3.5 sm:p-6">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h4 className="text-[15px] sm:text-lg font-black text-slate-800 tracking-tight">Metode pembayaran</h4>
                                        <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">Silakan pilih salah satu metode yang tersedia di bawah ini.</p>
                                    </div>
                                    <span className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-100 text-[10.5px] sm:text-xs font-bold text-slate-600 tabular-nums">{PAYMENT_METHODS.length} metode</span>
                                </div>

                                <div className="mt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                    <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-0.5">
                                        {PAYMENT_CATEGORIES.map(category => (
                                            <button
                                                key={category.key}
                                                type="button"
                                                onClick={() => setMethodCategory(category.key)}
                                                className={`shrink-0 h-8 sm:h-9 px-3 sm:px-3.5 rounded-xl text-[11.5px] sm:text-xs font-bold border transition ${
                                                    methodCategory === category.key
                                                        ? 'bg-[#009bd2] border-[#009bd2] text-white'
                                                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                                }`}
                                            >
                                                {category.label}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="relative sm:w-56">
                                        <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" /></svg>
                                        <input
                                            type="search"
                                            value={methodSearch}
                                            onChange={e => setMethodSearch(e.target.value)}
                                            placeholder="Cari metode pembayaran..."
                                            className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#009bd2] focus:ring-1 focus:ring-[#009bd2]"
                                        />
                                    </div>
                                </div>

                                {visiblePaymentMethods.length === 0 ? (
                                    <p className="py-10 text-center text-xs font-medium text-slate-400">Metode pembayaran tidak ditemukan.</p>
                                ) : (
                                    <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3.5">
                                        {visiblePaymentMethods.map(method => {
                                            const isPayingThis = payingMethod === method.key;
                                            const showLogo = method.logo && !brokenLogos[method.key];
                                            return (
                                                <button
                                                    key={method.key}
                                                    type="button"
                                                    onClick={() => handlePay(method.key)}
                                                    disabled={isStartingPayment || !midtrans.isConfigured || !currentCheckoutPrice}
                                                    className={`group relative text-left rounded-2xl border bg-white p-2.5 sm:p-3.5 flex flex-col transition ${
                                                        isPayingThis ? 'border-[#009bd2] ring-2 ring-[#009bd2]/20'
                                                            : method.recommended ? 'border-emerald-300 ring-1 ring-emerald-200 hover:border-emerald-400 hover:shadow-md'
                                                            : 'border-slate-200 hover:border-[#009bd2]/60 hover:shadow-md'
                                                    } disabled:cursor-not-allowed ${isStartingPayment && !isPayingThis ? 'opacity-50' : ''}`}
                                                >
                                                    <div className="flex flex-wrap items-center gap-1">
                                                        <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-[9px] sm:text-[10px] font-bold text-slate-500">
                                                            {CATEGORY_LABELS[method.category]}
                                                        </span>
                                                        {method.recommended && (
                                                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-emerald-50 text-[9px] sm:text-[10px] font-extrabold text-emerald-700">
                                                                <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.07 3.3a1 1 0 00.95.69h3.47c.97 0 1.37 1.24.59 1.81l-2.81 2.04a1 1 0 00-.36 1.12l1.07 3.3c.3.92-.75 1.69-1.54 1.12l-2.81-2.04a1 1 0 00-1.18 0l-2.81 2.04c-.78.57-1.84-.2-1.54-1.12l1.07-3.3a1 1 0 00-.36-1.12L2.97 8.73c-.78-.57-.38-1.81.59-1.81h3.47a1 1 0 00.95-.69l1.07-3.3z" /></svg>
                                                                Direkomendasikan
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="h-14 sm:h-20 flex items-center justify-center px-2 sm:px-4">
                                                        {showLogo ? (
                                                            <img
                                                                src={method.logo}
                                                                alt={method.name}
                                                                loading="lazy"
                                                                onError={() => setBrokenLogos(prev => ({ ...prev, [method.key]: true }))}
                                                                className="max-h-8 sm:max-h-11 max-w-full object-contain"
                                                            />
                                                        ) : (
                                                            <span className="text-base sm:text-xl font-black tracking-tight text-slate-700 text-center leading-tight">{method.shortName}</span>
                                                        )}
                                                    </div>

                                                    <div className="pt-2 sm:pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1.5">
                                                        <div className="min-w-0">
                                                            <p className="text-[11px] sm:text-[13px] font-extrabold text-slate-800 leading-snug line-clamp-2">{method.name}</p>
                                                            {method.note && <p className="text-[9.5px] sm:text-[10.5px] font-medium text-slate-400 truncate">{method.note}</p>}
                                                        </div>
                                                        <span className="shrink-0 flex items-center gap-0.5 text-[10.5px] sm:text-xs font-bold text-[#009bd2]">
                                                            {isPayingThis ? (
                                                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
                                                            ) : (
                                                                <>
                                                                    <span className="hidden sm:inline">Pilih</span>
                                                                    <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                                                                </>
                                                            )}
                                                        </span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {checkoutError && (
                                    <p className="mt-3 text-[11px] sm:text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">{checkoutError}</p>
                                )}
                                {!midtrans.isConfigured && (
                                    <p className="mt-3 text-[11px] sm:text-xs font-bold text-slate-600 bg-slate-100 rounded-xl px-3 py-2">Pembayaran online belum tersedia. Silakan hubungi admin.</p>
                                )}
                                {!midtrans.isProduction && midtrans.isConfigured && (
                                    <p className="mt-3 text-[10.5px] sm:text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                                        Mode uji coba (Sandbox): tidak ada uang sungguhan yang ditarik.
                                    </p>
                                )}

                                <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <p className="flex items-start gap-1.5 text-[10.5px] sm:text-[11px] font-medium text-slate-500 leading-relaxed">
                                        <svg className="w-3.5 h-3.5 shrink-0 mt-px text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        <span>Setelah memilih metode, halaman pembayaran Midtrans akan terbuka. Paket aktif otomatis begitu pembayaran diterima.</span>
                                    </p>
                                    <a
                                        href={`https://wa.me/${waNumber}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="shrink-0 text-[11px] font-bold text-slate-500 hover:text-slate-800 transition"
                                    >
                                        Butuh bantuan? Hubungi admin via WhatsApp
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
