import React from 'react';

/**
 * Standard PageHeader component for consistent page titles, badges, and action toolbars.
 */
export default function PageHeader({
    category = null,
    categoryColor = 'text-[#009bd2]',
    title,
    description = null,
    actions = null,
    className = '',
}) {
    return (
        <div
            className={`flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4 border-b border-slate-100 pb-3 sm:pb-4 ${className}`}
        >
            <div>
                {category && (
                    <p
                        className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-0.5 sm:mb-1 ${categoryColor}`}
                    >
                        {category}
                    </p>
                )}
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
                    {title}
                </h1>
                {description && (
                    <p className="text-slate-500 font-medium text-xs sm:text-sm mt-0.5 sm:mt-1">
                        {description}
                    </p>
                )}
            </div>

            {actions && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full md:w-auto">
                    {actions}
                </div>
            )}
        </div>
    );
}
