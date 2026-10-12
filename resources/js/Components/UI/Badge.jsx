import React from 'react';

/**
 * Reusable Badge component for statuses, tags, and category indicators.
 */
export default function Badge({
    children,
    variant = 'neutral', // 'success' | 'danger' | 'warning' | 'info' | 'primary' | 'neutral'
    size = 'sm', // 'xs' | 'sm' | 'md'
    pill = true, // rounded-full vs rounded-lg
    dot = false,
    ping = false,
    icon = null,
    className = '',
    ...props
}) {
    const sizeClasses = {
        xs: 'px-2 py-0.5 text-[10px] font-bold',
        sm: 'px-2.5 py-1 text-xs font-bold',
        md: 'px-3 py-1.5 text-xs sm:text-sm font-extrabold',
    };

    const variantClasses = {
        success:
            'bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs',
        'success-solid':
            'bg-emerald-100 text-emerald-800',
        danger:
            'bg-rose-50 text-rose-700 border border-rose-200 shadow-xs',
        'danger-solid':
            'bg-rose-100 text-rose-800',
        warning:
            'bg-amber-50 text-amber-700 border border-amber-200 shadow-xs',
        'warning-solid':
            'bg-amber-100 text-amber-800',
        info:
            'bg-sky-50 text-sky-700 border border-sky-200 shadow-xs',
        primary:
            'bg-[#009bd2]/10 text-[#009bd2] border border-[#009bd2]/20',
        neutral:
            'bg-slate-100 text-slate-600',
    };

    const dotColors = {
        success: 'bg-emerald-500',
        danger: 'bg-rose-500',
        warning: 'bg-amber-500',
        info: 'bg-sky-500',
        primary: 'bg-[#009bd2]',
        neutral: 'bg-slate-400',
    };

    const roundedClass = pill ? 'rounded-full' : 'rounded-lg';
    const activeVariant = variantClasses[variant] || variantClasses.neutral;
    const dotColor = dotColors[variant.split('-')[0]] || 'bg-slate-400';

    return (
        <span
            className={`inline-flex items-center gap-1.5 tracking-tight ${roundedClass} ${sizeClasses[size] || sizeClasses.sm} ${activeVariant} ${className}`}
            {...props}
        >
            {dot && (
                <span className="relative flex h-2 w-2 shrink-0">
                    {ping && (
                        <span
                            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColor}`}
                        ></span>
                    )}
                    <span
                        className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`}
                    ></span>
                </span>
            )}
            {icon && <span className="shrink-0">{icon}</span>}
            <span>{children}</span>
        </span>
    );
}
