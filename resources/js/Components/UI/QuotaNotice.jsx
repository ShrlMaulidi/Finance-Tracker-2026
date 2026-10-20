import React from 'react';
import { Link } from '@inertiajs/react';

/**
 * Free-plan quota card in the app's standard card style: usage line, thin progress bar and an Upgrade pill.
 */
export default function QuotaNotice({ used = 0, limit = null, unit = 'data', className = '' }) {
    if (limit === null || limit === undefined) {
        return null;
    }

    const isFull = used >= limit;
    const usagePercent = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 100;

    return (
        <div className={`flex items-center gap-3 sm:gap-4 bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] px-4 py-3.5 sm:px-5 sm:py-4 ${className}`}>
            <span className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isFull ? 'bg-amber-50 text-amber-600' : 'bg-sky-50 text-[#009bd2]'}`}>
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            </span>

            <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                    <p className="text-[13px] sm:text-sm font-bold text-slate-800 truncate">
                        {isFull ? 'Kuota gratis penuh' : 'Paket gratis'}
                    </p>
                    <span className={`text-[11px] sm:text-xs font-bold tabular-nums shrink-0 ${isFull ? 'text-amber-600' : 'text-slate-400'}`}>
                        {used}/{limit} {unit}
                    </span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${isFull ? 'bg-amber-500' : 'bg-[#009bd2]'}`}
                        style={{ width: `${usagePercent}%` }}
                    />
                </div>
            </div>

            <Link
                href={route('berlangganan.index')}
                className="h-8 sm:h-9 px-3.5 sm:px-4 rounded-full bg-[#009bd2] hover:bg-[#0086b6] text-white text-[11px] sm:text-xs font-bold flex items-center shrink-0 transition active:scale-95"
            >
                Upgrade
            </Link>
        </div>
    );
}
