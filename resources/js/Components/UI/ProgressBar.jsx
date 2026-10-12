import React from 'react';

/**
 * Universal ProgressBar Component
 * 
 * @param {number} value - Current value or percentage
 * @param {number} max - Maximum value (defaults to 100)
 * @param {'auto'|'emerald'|'rose'|'amber'|'indigo'|'blue'|string} variant - Color style
 * @param {string} height - Height classes (default: 'h-2.5 sm:h-3')
 * @param {boolean} showPercent - Whether to display the percentage value
 * @param {React.ReactNode} labelLeft - Optional label on bottom/top left
 * @param {React.ReactNode} labelRight - Optional label on bottom/top right
 * @param {string} className - Extra classes for container
 */
export default function ProgressBar({
    value = 0,
    max = 100,
    variant = 'auto',
    height = 'h-2.5 sm:h-3',
    showPercent = false,
    labelLeft = null,
    labelRight = null,
    className = '',
}) {
    const rawPercent = max > 0 ? (value / max) * 100 : 0;
    const clampedPercent = Math.min(Math.max(rawPercent, 0), 100);

    // Color variant resolution
    const getVariantClass = () => {
        if (variant === 'auto') {
            if (rawPercent > 100) return 'bg-rose-500';
            if (rawPercent >= 80) return 'bg-amber-500';
            return 'bg-emerald-500';
        }

        const map = {
            emerald: 'bg-emerald-500',
            success: 'bg-emerald-500',
            rose: 'bg-rose-500',
            danger: 'bg-rose-500',
            amber: 'bg-amber-500',
            warning: 'bg-amber-500',
            indigo: 'bg-indigo-600',
            blue: 'bg-[#009bd2]',
            sky: 'bg-sky-500',
            purple: 'bg-purple-600',
        };

        return map[variant] || variant;
    };

    return (
        <div className={`w-full ${className}`}>
            {/* Optional Header with Percent */}
            {showPercent && !labelLeft && !labelRight && (
                <div className="flex justify-end mb-1">
                    <span className="text-[11px] sm:text-xs font-bold text-slate-500">
                        {Math.round(rawPercent)}%
                    </span>
                </div>
            )}

            {/* Progress Bar Track */}
            <div className={`w-full bg-slate-100 rounded-full ${height} overflow-hidden`}>
                <div 
                    className={`h-full rounded-full transition-all duration-1000 ${getVariantClass()}`}
                    style={{ width: `${clampedPercent}%` }}
                    role="progressbar"
                    aria-valuenow={Math.round(rawPercent)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                />
            </div>

            {/* Optional Labels Underneath */}
            {(labelLeft || labelRight || (showPercent && (labelLeft || labelRight))) && (
                <div className="flex items-center justify-between text-[11px] sm:text-xs font-semibold text-slate-500 mt-2">
                    <div>{labelLeft}</div>
                    <div>{labelRight || (showPercent ? `${Math.round(rawPercent)}%` : null)}</div>
                </div>
            )}
        </div>
    );
}
