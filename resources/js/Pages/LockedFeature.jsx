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

            <div className="max-w-7xl mx-auto px-3.5 py-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
                {/* Header, same as the other pages */}
                <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">{featureName}</h1>
                    <span className={`text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-md ${isAiFeature ? 'text-violet-700 bg-violet-50' : 'text-amber-700 bg-amber-50'}`}>
                        {planName.toUpperCase()}
                    </span>
                </div>

                <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] px-5 py-7 sm:px-10 sm:py-12">
                    <div className="max-w-lg mx-auto text-center">
                        <span className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-sky-50 text-[#009bd2] flex items-center justify-center mx-auto">
                            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </span>

                        <h2 className="mt-4 text-lg sm:text-xl font-bold text-slate-900">Fitur khusus {planName}</h2>
                        <p className="mt-1.5 text-[13px] sm:text-sm leading-relaxed text-slate-500">{description}</p>
                    </div>

                    {benefits.length > 0 && (
                        <div className="max-w-lg mx-auto mt-6 sm:mt-8">
                            <p className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Yang Anda dapatkan</p>
                            <ul className="mt-2 divide-y divide-slate-100">
                                {benefits.map((benefit) => (
                                    <li key={benefit} className="flex items-start gap-3 px-1 py-3 text-[13px] sm:text-sm leading-snug text-slate-700">
                                        <span className="w-5 h-5 rounded-full bg-sky-50 text-[#009bd2] flex items-center justify-center shrink-0">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                        </span>
                                        <span>{benefit}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="max-w-lg mx-auto mt-6 sm:mt-8 flex flex-col items-center">
                        <Link
                            href={route('berlangganan.index')}
                            className="w-full sm:w-auto sm:min-w-[260px] h-11 sm:h-12 px-6 rounded-full bg-[#009bd2] hover:bg-[#0086b6] text-white text-sm font-bold flex items-center justify-center shadow-sm shadow-[#009bd2]/30 transition active:scale-95"
                        >
                            Upgrade ke {planName}
                        </Link>
                        <p className="mt-2.5 text-[11px] sm:text-xs text-slate-400">Mulai {formatRupiah(monthlyPrice)}/bulan</p>
                        <Link href={route('dashboard')} className="mt-4 text-xs font-semibold text-slate-400 hover:text-slate-700 transition">
                            Kembali ke Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
