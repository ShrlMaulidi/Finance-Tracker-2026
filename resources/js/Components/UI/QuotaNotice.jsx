import React from 'react';
import { Link } from '@inertiajs/react';

/**
 * Free-plan quota card in the soft frosted style used by the upgrade screens:
 * a brand-blue "1/2 tagihan" pill, a short line, and a white "Upgrade →" pill button.
 */
export default function QuotaNotice({ used = 0, limit = null, unit = 'data', className = '' }) {
    if (limit === null || limit === undefined) {
        return null;
    }

    const isFull = used >= limit;

    return (
        <div className={`relative overflow-hidden flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 rounded-3xl bg-gradient-to-br from-[#eaf4f9] via-[#f4f7fa] to-[#eceff4] p-4 sm:px-5 ${className}`}>
            <div className="pointer-events-none absolute -bottom-16 -left-10 h-32 w-32 rounded-full bg-[#009bd2]/15 blur-2xl" aria-hidden="true" />

            <div className="relative flex items-center gap-3 flex-1 min-w-0">
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium shrink-0 tabular-nums ${isFull ? 'bg-amber-200/80 text-amber-900' : 'bg-[#009bd2]/15 text-[#007ca8]'}`}>
                    {used}/{limit} {unit}
                </span>
                <p className="text-sm text-slate-600 min-w-0">
                    {isFull
                        ? `Kuota gratis penuh. Upgrade ke Pro untuk ${unit} tanpa batas.`
                        : `Paket gratis dibatasi ${limit} ${unit}.`}
                </p>
            </div>

            <Link
                href={route('berlangganan.index')}
                className="relative h-10 px-5 rounded-full bg-white text-sm font-medium text-slate-900 flex items-center justify-center gap-2 shrink-0 shadow-sm transition hover:shadow-md active:scale-95"
            >
                Upgrade
                <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5 12h14m-6-6l6 6-6 6" /></svg>
            </Link>
        </div>
    );
}
