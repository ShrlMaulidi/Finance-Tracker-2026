import React from 'react';

/**
 * Universal Card Container Component
 * 
 * @param {React.ReactNode} children - Card content
 * @param {boolean} hoverable - Whether to add hover lift & shadow effects
 * @param {'none'|'sm'|'md'|'lg'} padding - Internal padding size
 * @param {React.ReactNode} header - Optional header content
 * @param {React.ReactNode} footer - Optional footer content
 * @param {string} className - Extra classes for card container
 */
export default function Card({
    children,
    hoverable = false,
    padding = 'md',
    header = null,
    footer = null,
    className = '',
    ...props
}) {
    const paddingClasses = {
        none: '',
        sm: 'p-3 sm:p-4',
        md: 'p-4 sm:p-6',
        lg: 'p-6 sm:p-8',
    }[padding] || 'p-4 sm:p-6';

    const hoverClasses = hoverable 
        ? 'hover:border-slate-200 hover:shadow-lg transition-all duration-300' 
        : '';

    return (
        <div 
            className={`bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] overflow-hidden ${hoverClasses} ${className}`}
            {...props}
        >
            {header && (
                <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-100 bg-slate-50/50">
                    {header}
                </div>
            )}

            <div className={paddingClasses}>
                {children}
            </div>

            {footer && (
                <div className="px-4 py-3 sm:px-6 sm:py-4 border-t border-slate-100 bg-slate-50/50">
                    {footer}
                </div>
            )}
        </div>
    );
}
