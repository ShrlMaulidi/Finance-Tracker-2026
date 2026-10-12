import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';

export default function LockedFeature({
    feature = 'pro',
    title = 'Fitur Eksklusif Pro',
    subtitle = 'Tingkatkan akun Anda untuk membuka akses penuh',
    description = 'Menu ini hanya dapat diakses oleh member yang berlangganan paket Pro.',
    benefits = [],
}) {
    const { pricing } = usePage().props;
    const proMonthly = Number(pricing?.pro_monthly_price ?? 14999);
    const proPlusMonthly = Number(pricing?.pro_plus_monthly_price ?? 29999);

    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(number || 0);
    };

    const isAiFeature = feature === 'ai_agent';

    const featureBadges = {
        anggaran: {
            icon: '📊',
            tag: 'Perencanaan Finansial',
        },
        laporan: {
            icon: '📑',
            tag: 'Analisis & Ekspor',
        },
        ai_agent: {
            icon: '✨',
            tag: 'Kecerdasan Buatan AI',
        },
    };

    const currentBadge = featureBadges[feature] || {
        icon: '🔒',
        tag: 'Fitur Pro Eksklusif',
    };

    return (
        <AuthenticatedLayout>
            <Head title={`${title} - ${isAiFeature ? 'Member Pro Plus' : 'Member Pro'}`} />

            <div className="max-w-2xl mx-auto px-3.5 py-3 sm:px-6 sm:py-8 md:py-10 animate-fade-in">
                <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 md:p-9 border border-slate-100 shadow-md sm:shadow-lg relative overflow-hidden text-center">
                    {/* Background Radial Glow */}
                    <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-80 bg-gradient-to-b from-sky-200/30 via-indigo-100/20 to-transparent rounded-full blur-3xl pointer-events-none"></div>

                    <div className="relative z-10 max-w-lg mx-auto space-y-3.5 sm:space-y-5">
                        {/* Lock / Pro Pill Badge */}
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200/80 shadow-2xs">
                            <span className="text-xs sm:text-sm">{currentBadge.icon}</span>
                            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-700">
                                {currentBadge.tag}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase text-white shadow-xs ${
                                isAiFeature ? 'bg-gradient-to-r from-purple-600 to-indigo-600' : 'bg-gradient-to-r from-amber-500 to-orange-500'
                            }`}>
                                {isAiFeature ? 'PRO PLUS' : 'PRO ONLY'}
                            </span>
                        </div>

                        {/* Title & Description */}
                        <div className="space-y-1 sm:space-y-1.5">
                            <h1 className="text-lg sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-snug">
                                {title}
                            </h1>
                            <p className="text-xs sm:text-sm font-bold text-[#009bd2]">
                                {subtitle}
                            </p>
                            <p className="text-[11px] sm:text-xs text-slate-500 font-medium max-w-md mx-auto leading-relaxed pt-0.5">
                                {description}
                            </p>
                        </div>

                        {/* Feature Checklist Box */}
                        {benefits && benefits.length > 0 && (
                            <div className="bg-slate-50/80 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-slate-100 text-left space-y-2">
                                <div className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-400">
                                    {isAiFeature ? 'Keuntungan Eksklusif Pro Plus:' : 'Keuntungan Akses Pro:'}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                                    {benefits.map((b, idx) => (
                                        <div key={idx} className="flex items-start gap-2">
                                            <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 font-black text-[9px]">
                                                ✓
                                            </div>
                                            <span className="text-[11px] sm:text-xs font-semibold text-slate-700 leading-snug">
                                                {b}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* CTA Buttons */}
                        <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 sm:gap-3 w-full">
                            <Link
                                href={route('berlangganan.index')}
                                className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 py-2.5 sm:py-3 px-5 sm:px-6 rounded-xl sm:rounded-2xl text-white font-extrabold text-xs sm:text-sm transition-all duration-200 shadow-md active:scale-95 ${
                                    isAiFeature 
                                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-indigo-600/25'
                                        : 'bg-gradient-to-r from-[#009bd2] to-[#0081af] hover:from-[#008bc0] hover:to-[#007099] shadow-[#009bd2]/25'
                                }`}
                            >
                                <svg className="w-4 h-4 text-amber-300 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 2a1 1 0 01.894.553l2.991 5.982 6.602.96a1 1 0 01.554 1.705l-4.777 4.656 1.127 6.575a1 1 0 01-1.451 1.054L10 16.347l-5.94 3.138a1 1 0 01-1.451-1.054l1.127-6.575-4.777-4.656a1 1 0 01.554-1.705l6.602-.96 2.991-5.982A1 1 0 0110 2z" clipRule="evenodd" />
                                </svg>
                                <span>{isAiFeature ? 'Upgrade ke Pro Plus Sekarang' : 'Upgrade ke Paket Pro Sekarang'}</span>
                            </Link>
                            <Link
                                href={route('dashboard')}
                                className="w-full sm:w-auto inline-flex items-center justify-center py-2 sm:py-2.5 px-4 sm:px-5 rounded-xl sm:rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs sm:text-sm transition-all active:scale-95"
                            >
                                Kembali ke Dashboard
                            </Link>
                        </div>

                        {/* Pricing Teaser Footnote */}
                        <p className="text-[10px] sm:text-[11px] font-medium text-slate-400">
                            {isAiFeature 
                                ? <>Paket Pro Plus hanya <strong className="text-slate-700 font-bold">{formatRupiah(proPlusMonthly)}/bulan</strong>. Bot WhatsApp langsung aktif.</>
                                : <>Mulai dari hanya <strong className="text-slate-700 font-bold">{formatRupiah(proMonthly)}/bulan</strong>. Bebas batasan, aktif seketika.</>}
                        </p>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
