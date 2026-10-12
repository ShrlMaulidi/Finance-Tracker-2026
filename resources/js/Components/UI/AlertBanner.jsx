import React from 'react';

/**
 * Universal AlertBanner Component
 * 
 * @param {'success'|'error'|'warning'|'info'} type - Alert type
 * @param {string|React.ReactNode} message - Alert message text
 * @param {React.ReactNode} children - Alternate body content
 * @param {function} onClose - Optional callback to dismiss the alert
 * @param {string} className - Extra classes
 */
export default function AlertBanner({
    type = 'success',
    message,
    children,
    onClose,
    className = '',
}) {
    const content = message || children;
    if (!content) return null;

    const styles = {
        success: {
            container: 'bg-emerald-50 border-emerald-200 text-emerald-800',
            iconColor: 'text-emerald-600',
            icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            ),
        },
        error: {
            container: 'bg-rose-50 border-rose-200 text-rose-800',
            iconColor: 'text-rose-600',
            icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            ),
        },
        warning: {
            container: 'bg-amber-50 border-amber-200 text-amber-800',
            iconColor: 'text-amber-600',
            icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            ),
        },
        info: {
            container: 'bg-sky-50 border-sky-200 text-sky-800',
            iconColor: 'text-[#009bd2]',
            icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            ),
        },
    }[type] || styles.success;

    return (
        <div className={`border px-4 py-3 rounded-2xl flex items-center justify-between shadow-xs transition-all animate-fade-in ${styles.container} ${className}`}>
            <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold">
                <svg className={`w-5 h-5 shrink-0 ${styles.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {styles.icon}
                </svg>
                <span>{content}</span>
            </div>

            {onClose && (
                <button
                    type="button"
                    onClick={onClose}
                    className="p-1 rounded-lg hover:bg-black/5 text-current opacity-70 hover:opacity-100 transition-opacity ml-3"
                    title="Tutup pemberitahuan"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            )}
        </div>
    );
}
