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

            <div className="max-w-xl mx-auto px-3.5 py-6 sm:px-6 sm:py-12">
                <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 sm:p-10 text-center">
                    <span className="w-14 h-14 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </span>

                    <span className="inline-block mt-4 text-[11px] font-bold text-[#009bd2] bg-[#009bd2]/10 px-2.5 py-1 rounded-full">
                        Khusus {planName}
                    </span>

                    <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-3">{title}</h1>
                    <p className="text-sm text-slate-500 leading-relaxed mt-2 max-w-md mx-auto">{description}</p>

                    {benefits.length > 0 && (
                        <ul className="mt-6 space-y-2.5 text-left max-w-sm mx-auto">
                            {benefits.map((benefit) => (
                                <li key={benefit} className="flex items-start gap-2.5 text-sm text-slate-600">
                                    <svg className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span>{benefit}</span>
                                </li>
                            ))}
                        </ul>
                    )}

                    <Link
                        href={route('berlangganan.index')}
                        className="mt-8 h-11 w-full sm:w-auto sm:px-8 rounded-full bg-[#009bd2] hover:bg-[#0086b6] text-white text-sm font-bold inline-flex items-center justify-center transition active:scale-95"
                    >
                        Upgrade ke {planName}
                    </Link>
                    <p className="text-xs text-slate-400 mt-3">
                        Mulai {formatRupiah(monthlyPrice)}/bulan
                    </p>

                    <Link href={route('dashboard')} className="inline-block mt-5 text-xs font-semibold text-slate-400 hover:text-slate-700 transition">
                        Kembali ke Dashboard
                    </Link>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
