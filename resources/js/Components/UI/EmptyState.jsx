import React from 'react';

/**
 * Standard EmptyState component for lists and tables when there are no records.
 */
export default function EmptyState({
    title,
    description,
    icon = null,
    action = null,
    className = '',
}) {
    const defaultIcon = (
        <svg
            className="w-6 h-6 sm:w-8 sm:h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
        </svg>
    );

    return (
        <div
            className={`text-center py-12 sm:py-16 px-4 bg-slate-50/70 rounded-2xl sm:rounded-3xl border-2 border-dashed border-slate-200 ${className}`}
        >
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-xs text-slate-300">
                {icon || defaultIcon}
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-1">
                {title}
            </h3>
            {description && (
                <p className="text-slate-500 font-medium text-xs sm:text-sm max-w-sm mx-auto">
                    {description}
                </p>
            )}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}
