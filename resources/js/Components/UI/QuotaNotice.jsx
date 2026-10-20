import React from 'react';
import { Link } from '@inertiajs/react';

/**
 * Compact free-plan quota row: "Paket gratis · 1/2 tagihan" with a thin usage bar and an Upgrade link.
 */
export default function QuotaNotice({ used = 0, limit = null, unit = 'data', className = '' }) {
    if (limit === null || limit === undefined) {
        return null;
    }

    const isFull = used >= limit;
    const usagePercent = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 100;

    return (
        <div className={`flex items-center gap-4 rounded-2xl bg-white border border-slate-100 px-4 py-3 ${className}`}>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-slate-600 truncate">
                        Paket gratis · <span className="text-slate-900 tabular-nums">{used}/{limit}</span> {unit}
                    </span>
                    {isFull && <span className="font-semibold text-amber-600 shrink-0">Penuh</span>}
                </div>
                <div className="h-1 bg-slate-100 rounded-full overflow-hidden mt-2">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${isFull ? 'bg-amber-500' : 'bg-[#009bd2]'}`}
                        style={{ width: `${usagePercent}%` }}
                    />
                </div>
            </div>

            <Link
                href={route('berlangganan.index')}
                className="h-8 px-3.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center shrink-0 transition active:scale-95"
            >
                Upgrade
            </Link>
        </div>
    );
}
