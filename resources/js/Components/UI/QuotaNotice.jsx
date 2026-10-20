import React from 'react';
import { Link } from '@inertiajs/react';

// Same icons as the menus they belong to
const UNIT_ICONS = {
    tagihan: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h6m-6 4h4" />,
    target: (
        <>
            <circle cx="12" cy="12" r="9" strokeWidth={2} />
            <circle cx="12" cy="12" r="4.5" strokeWidth={2} />
            <circle cx="12" cy="12" r="1" strokeWidth={2} fill="currentColor" />
        </>
    ),
    kategori: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />,
    metode: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />,
};

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
            <span className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {UNIT_ICONS[unit] || UNIT_ICONS.tagihan}
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
