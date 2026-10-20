import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';

export default function LockedFeature({
    feature = 'pro',
    title = 'Fitur Eksklusif Pro',
    description = 'Menu ini hanya dapat diakses oleh member yang berlangganan paket Pro.',
    benefits = [],
}) {
    const { pricing } = usePage().props;
    const isAiFeature = feature === 'ai_agent';
    const planName = isAiFeature ? 'Pro Plus' : 'Pro';
    const monthlyPrice = Number(isAiFeature ? (pricing?.pro_plus_monthly_price ?? 29999) : (pricing?.pro_monthly_price ?? 14999));

    const formatRupiah = (number) => new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(number || 0);

    return (
        <AuthenticatedLayout>
            <Head title={`${title} - Member ${planName}`} />

            <div className="max-w-2xl mx-auto px-3.5 py-6 sm:px-6 sm:py-12">
                <div className="rounded-3xl overflow-hidden border border-slate-100 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.25)] bg-white">
                    {/* Premium header */}
                    <div className="relative bg-slate-900 px-6 pt-10 pb-9 sm:px-10 sm:pt-12 text-center overflow-hidden">
                        {/* Decorative rings */}
                        <svg className="absolute -top-24 left-1/2 -translate-x-1/2 w-[520px] h-[520px] text-white/[0.05] pointer-events-none" viewBox="0 0 520 520" fill="none" aria-hidden="true">
                            <circle cx="260" cy="260" r="110" stroke="currentColor" strokeWidth="1.5" />
                            <circle cx="260" cy="260" r="170" stroke="currentColor" strokeWidth="1.5" />
                            <circle cx="260" cy="260" r="230" stroke="currentColor" strokeWidth="1.5" />
                        </svg>

                        <div className="relative">
                            <span className="w-14 h-14 rounded-2xl bg-white/10 ring-1 ring-white/15 text-white flex items-center justify-center mx-auto">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </span>

                            <span className={`inline-flex items-center gap-1.5 mt-5 text-[11px] font-bold px-3 py-1 rounded-full ${isAiFeature ? 'bg-violet-400/15 text-violet-200' : 'bg-amber-400/15 text-amber-200'}`}>
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 1.5l2.47 5.01 5.53.8-4 3.9.94 5.5L10 14.1l-4.94 2.6.94-5.5-4-3.9 5.53-.8L10 1.5z" /></svg>
                                Khusus {planName}
                            </span>

                            <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight mt-3">{title}</h1>
                            <p className="text-sm text-slate-300 leading-relaxed mt-2.5 max-w-md mx-auto">{description}</p>
                        </div>
                    </div>

                    {/* Benefits + CTA */}
                    <div className="px-6 py-7 sm:px-10 sm:py-9">
                        {benefits.length > 0 && (
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5">
                                {benefits.map((benefit) => (
                                    <li key={benefit} className="flex items-start gap-3 text-[13px] sm:text-sm text-slate-600 leading-snug">
                                        <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </span>
                                        <span>{benefit}</span>
                                    </li>
                                ))}
                            </ul>
                        )}

                        <Link
                            href={route('berlangganan.index')}
                            className="mt-8 w-full h-12 sm:h-14 rounded-2xl bg-[#009bd2] hover:bg-[#0086b6] text-white flex items-center justify-between gap-3 pl-5 pr-2 transition active:scale-[0.99] shadow-lg shadow-[#009bd2]/25"
                        >
                            <span className="text-sm sm:text-base font-bold">Upgrade ke {planName}</span>
                            <span className="h-8 sm:h-10 px-3 sm:px-4 rounded-xl bg-white/15 text-xs sm:text-sm font-bold flex items-center tabular-nums">
                                {formatRupiah(monthlyPrice)}/bln
                            </span>
                        </Link>

                        <div className="text-center mt-4">
                            <Link href={route('dashboard')} className="text-xs font-semibold text-slate-400 hover:text-slate-700 transition">
                                Kembali ke Dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
