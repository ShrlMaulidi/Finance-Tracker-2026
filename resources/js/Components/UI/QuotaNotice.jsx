import React from 'react';
import { Link } from '@inertiajs/react';

const RING_RADIUS = 18;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/**
 * Free-plan quota card: circular usage ring with "used/limit", a short status line and an Upgrade button.
 */
export default function QuotaNotice({ used = 0, limit = null, unit = 'data', className = '' }) {
    if (limit === null || limit === undefined) {
        return null;
    }

    const isFull = used >= limit;
    const usageRatio = limit > 0 ? Math.min(1, used / limit) : 1;

    return (
        <div className={`flex items-center gap-3.5 sm:gap-4 rounded-2xl sm:rounded-3xl bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-3.5 sm:p-4 ${className}`}>
            {/* Usage ring */}
            <div className="relative w-12 h-12 shrink-0">
                <svg className="w-12 h-12 -rotate-90" viewBox="0 0 44 44" aria-hidden="true">
                    <circle cx="22" cy="22" r={RING_RADIUS} fill="none" stroke="currentColor" strokeWidth="4" className="text-slate-100" />
                    <circle
                        cx="22"
                        cy="22"
                        r={RING_RADIUS}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={RING_CIRCUMFERENCE}
                        strokeDashoffset={RING_CIRCUMFERENCE * (1 - usageRatio)}
                        className={`transition-all duration-700 ${isFull ? 'text-amber-500' : 'text-[#009bd2]'}`}
                    />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[11px] font-extrabold text-slate-800 tabular-nums">
                    {used}/{limit}
                </span>
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">
                    {isFull ? 'Kuota gratis penuh' : 'Kuota paket gratis'}
                </p>
                <p className="text-xs text-slate-400 truncate mt-0.5">
                    {isFull
                        ? `Upgrade untuk menambah ${unit} tanpa batas`
                        : `${used} dari ${limit} ${unit} terpakai`}
                </p>
            </div>

            <Link
                href={route('berlangganan.index')}
                className="h-9 px-3.5 sm:px-4 rounded-full bg-[#009bd2] hover:bg-[#0086b6] text-white text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-md shadow-[#009bd2]/25 transition active:scale-95"
            >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Upgrade
            </Link>
        </div>
    );
}
