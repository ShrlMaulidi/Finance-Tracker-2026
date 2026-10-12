import React from 'react';

/**
 * Universal FormField Component
 * Wraps inputs, selects, and textareas with standard labels, hints, and error messages
 * 
 * @param {React.ReactNode} label - Field label text
 * @param {string|React.ReactNode} error - Validation error message
 * @param {boolean} required - Whether field is required
 * @param {React.ReactNode} hint - Optional hint or helper text
 * @param {string} prefix - Optional prefix like "Rp"
 * @param {React.ReactNode} children - Input or form control element
 * @param {string} className - Extra classes for wrapper
 */
export default function FormField({
    label,
    error,
    required = false,
    hint,
    prefix,
    children,
    className = '',
}) {
    return (
        <div className={`w-full ${className}`}>
            {/* Label and Hint */}
            {label && (
                <div className="flex items-center justify-between mb-1 sm:mb-1.5">
                    <label className="text-xs sm:text-sm font-bold text-slate-700 block">
                        {label}
                        {required && <span className="text-rose-500 ml-1 font-black">*</span>}
                    </label>
                    {hint && (
                        <span className="text-[11px] text-slate-400 font-medium">
                            {hint}
                        </span>
                    )}
                </div>
            )}

            {/* Input with optional prefix container */}
            {prefix ? (
                <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs sm:text-sm pointer-events-none z-10">
                        {prefix}
                    </span>
                    {children}
                </div>
            ) : (
                children
            )}

            {/* Error Message */}
            {error && (
                <p className="text-red-500 text-[11px] sm:text-xs mt-1 font-semibold flex items-center gap-1 animate-fade-in">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                </p>
            )}
        </div>
    );
}
