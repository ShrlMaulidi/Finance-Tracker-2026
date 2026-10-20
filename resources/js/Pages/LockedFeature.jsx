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

    // "Menu Laporan Keuangan Terkunci" -> "Laporan Keuangan"
    const featureName = title.replace(/^Menu\s+/i, '').replace(/\s+Terkunci$/i, '');

    const formatRupiah = (number) => new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(number || 0);

    return (
        <AuthenticatedLayout>
            <Head title={`${featureName} - Member ${planName}`} />

            {/* Top-aligned on phones (no awkward gap under the header), centered on larger screens */}
            <div className="flex justify-center px-4 pt-3 pb-8 sm:min-h-[70vh] sm:items-center sm:px-6 sm:py-10">
                <div className="relative w-full max-w-md overflow-hidden rounded-[28px] sm:rounded-[2rem] bg-gradient-to-br from-[#eaf4f9] via-[#f4f7fa] to-[#eceff4] p-5 sm:p-8 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.35)]">
                    {/* Soft color glow, like frosted glass */}
                    <div className="pointer-events-none absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-[#009bd2]/15 blur-3xl" aria-hidden="true" />
                    <div className="pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full bg-sky-100/70 blur-3xl" aria-hidden="true" />

                    <div className="relative">
                        <div className="flex items-center justify-between gap-3">
                            <span className={`inline-flex items-center rounded-full px-3 py-1 sm:px-3.5 sm:py-1.5 text-xs sm:text-sm font-medium ${isAiFeature ? 'bg-violet-200/70 text-violet-900' : 'bg-[#009bd2]/15 text-[#007ca8]'}`}>
                                {planName}
                            </span>
                            <Link
                                href={route('dashboard')}
                                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white text-slate-500 hover:text-slate-900 flex items-center justify-center shadow-sm transition active:scale-95"
                                aria-label="Kembali ke Dashboard"
                            >
                                <svg className="w-[18px] h-[18px] sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M6 18L18 6M6 6l12 12" /></svg>
                            </Link>
                        </div>

                        <h1 className="mt-5 sm:mt-6 text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight leading-snug">
                            Buka {featureName}
                        </h1>
                        <p className="mt-1.5 sm:mt-2 text-sm sm:text-[15px] leading-relaxed text-slate-500">{description}</p>

                        {benefits.length > 0 && (
                            <div className="mt-5 sm:mt-6 rounded-2xl bg-white/60 ring-1 ring-white/80">
                                <p className="px-4 pt-3 pb-1 text-[11px] sm:text-xs font-medium text-slate-400">Fitur yang terbuka</p>
                                <ul className="divide-y divide-slate-900/[0.05]">
                                    {benefits.map((benefit) => (
                                        <li key={benefit} className="flex items-start gap-2.5 px-4 py-2.5 text-[13px] sm:text-sm leading-snug text-slate-600">
                                            <svg className="w-4 h-4 mt-px shrink-0 text-[#009bd2]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                            <span>{benefit}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <Link
                            href={route('berlangganan.index')}
                            className="mt-5 sm:mt-7 flex h-12 sm:h-14 w-full items-center justify-center gap-2.5 rounded-full bg-white text-[15px] sm:text-base font-medium text-slate-900 shadow-sm transition hover:shadow-md active:scale-[0.99]"
                        >
                            Upgrade ke {planName}
                            <svg className="w-[18px] h-[18px] sm:w-5 sm:h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5 12h14m-6-6l6 6-6 6" /></svg>
                        </Link>
                        <p className="mt-2.5 sm:mt-3 text-center text-[11px] sm:text-xs text-slate-400">Mulai {formatRupiah(monthlyPrice)}/bulan</p>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
