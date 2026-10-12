import React, { useEffect } from 'react';

/**
 * Universal Modal / Dialog Component
 * 
 * @param {boolean} isOpen - Controls modal visibility
 * @param {function} onClose - Callback when modal is closed
 * @param {React.ReactNode} title - Modal heading title
 * @param {React.ReactNode} subtitle - Optional description under title
 * @param {React.ReactNode} children - Modal body content
 * @param {React.ReactNode} footer - Optional footer action buttons
 * @param {'sm'|'md'|'lg'|'xl'|'2xl'} maxWidth - Maximum width of modal
 * @param {boolean} showCloseButton - Whether to display the top-right X button
 * @param {boolean} closeOnClickOutside - Whether clicking backdrop closes modal
 * @param {string} className - Extra classes for modal dialog card
 * @param {string} bodyClassName - Extra classes for inner scrollable body
 */
export default function Modal({
    isOpen = false,
    onClose = () => {},
    title,
    subtitle,
    children,
    footer,
    maxWidth = 'lg',
    showCloseButton = true,
    closeOnClickOutside = true,
    className = '',
    bodyClassName = '',
}) {
    // Handle Escape key press
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const maxWidthClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '3xl': 'max-w-3xl',
    }[maxWidth] || 'max-w-lg';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 animate-fade-in">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                onClick={closeOnClickOutside ? onClose : undefined}
                aria-hidden="true"
            />

            {/* Modal Dialog Box */}
            <div 
                className={`bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full ${maxWidthClasses} relative overflow-hidden border border-slate-100 z-10 flex flex-col max-h-[92vh] transition-all transform ${className}`}
                role="dialog"
                aria-modal="true"
            >
                {/* Close Button (Top-Right) */}
                {showCloseButton && (
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute top-4 right-4 sm:top-6 sm:right-6 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded-xl transition-all duration-200 z-20"
                        title="Tutup (Esc)"
                    >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}

                {/* Modal Body / Content */}
                <div className={`p-4 sm:p-6 md:p-8 overflow-y-auto ${bodyClassName}`}>
                    {(title || subtitle) && (
                        <div className="mb-4 sm:mb-6 pr-8">
                            {title && (
                                <h2 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 mb-1 leading-tight">
                                    {title}
                                </h2>
                            )}
                            {subtitle && (
                                <p className="text-xs sm:text-sm font-medium text-slate-500">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    )}

                    {children}
                </div>

                {/* Optional Sticky Footer */}
                {footer && (
                    <div className="p-3.5 sm:p-5 bg-slate-50 border-t border-slate-100 flex gap-2.5 sm:gap-3 shrink-0">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
