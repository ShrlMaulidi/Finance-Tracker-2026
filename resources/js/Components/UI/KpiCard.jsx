import React from 'react';

/**
 * Reusable KpiCard component for key metrics and executive dashboards.
 */
export default function KpiCard({
    title,
    value,
    subtitle,
    icon,
    variant = 'default', // 'default' | 'primary' | 'success' | 'warning' | 'danger'
    className = '',
    onClick = null,
}) {
    const variantStyles = {
        default: {
            hoverBorder: 'hover:border-slate-300',
            iconBox: 'bg-slate-100 text-slate-700',
            valueColor: 'text-slate-800',
            titleColor: 'text-slate-400',
        },
        primary: {
            hoverBorder: 'hover:border-[#009bd2]/30',
            iconBox: 'bg-sky-50 text-[#009bd2]',
            valueColor: 'text-slate-800',
            titleColor: 'text-slate-400',
        },
        success: {
            hoverBorder: 'hover:border-emerald-200',
            iconBox: 'bg-emerald-50 text-emerald-600',
            valueColor: 'text-emerald-600',
            titleColor: 'text-emerald-600',
        },
        warning: {
            hoverBorder: 'hover:border-amber-200',
            iconBox: 'bg-amber-50 text-amber-600',
            valueColor: 'text-amber-600',
            titleColor: 'text-amber-600',
        },
        danger: {
            hoverBorder: 'hover:border-rose-200',
            iconBox: 'bg-rose-50 text-rose-600',
            valueColor: 'text-rose-600',
            titleColor: 'text-rose-600',
        },
    };

    const style = variantStyles[variant] || variantStyles.default;

    return (
        <div
            onClick={onClick}
            className={`
                bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-5 border border-slate-100 shadow-xs relative overflow-hidden transition-all duration-200
                ${style.hoverBorder}
                ${onClick ? 'cursor-pointer hover:shadow-md' : ''}
                ${className}
            `}
        >
            <div className="flex items-center justify-between gap-1.5 mb-1.5 sm:mb-2">
                <span className={`text-[10.5px] sm:text-xs font-bold truncate ${style.titleColor}`}>
                    {title}
                </span>
                {icon && (
                    <div
                        className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl ${style.iconBox} flex items-center justify-center shrink-0 [&>svg]:w-3.5 [&>svg]:h-3.5 sm:[&>svg]:w-4 sm:[&>svg]:h-4`}
                    >
                        {icon}
                    </div>
                )}
            </div>
            <div
                className={`text-[15px] sm:text-2xl font-black tracking-tight truncate ${style.valueColor}`}
                title={typeof value === 'string' ? value : undefined}
            >
                {value}
            </div>
            {subtitle && (
                <div className="text-[9.5px] sm:text-[11px] font-medium text-slate-400 mt-0.5 sm:mt-1 truncate" title={subtitle}>
                    {subtitle}
                </div>
            )}
        </div>
    );
}
