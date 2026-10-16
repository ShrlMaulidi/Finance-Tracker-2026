import React from 'react';

/**
 * Universal SearchInput Component
 * 
 * @param {string} value - Current search value
 * @param {function} onChange - Change handler function
 * @param {function} onClear - Optional clear handler function
 * @param {string} placeholder - Placeholder text
 * @param {'sm'|'md'|'lg'} size - Sizing variant
 * @param {string} className - Extra classes for container
 * @param {string} inputClassName - Extra classes for input element
 */
export default function SearchInput({
    value = '',
    onChange = () => {},
    onClear,
    placeholder = 'Cari...',
    size = 'md',
    className = '',
    inputClassName = '',
    ...props
}) {
    const handleClear = () => {
        if (onClear) {
            onClear();
        } else if (onChange) {
            onChange({ target: { value: '' } });
        }
    };

    const sizeClasses = {
        sm: 'py-1.5 pl-8 pr-7 text-xs',
        md: 'py-2 sm:py-2.5 pl-9 sm:pl-10 pr-8 sm:pr-9 text-xs sm:text-sm',
        lg: 'py-3 pl-11 pr-10 text-sm sm:text-base',
    }[size] || 'py-2 sm:py-2.5 pl-9 sm:pl-10 pr-8 sm:pr-9 text-xs sm:text-sm';

    const iconSizes = {
        sm: 'w-3.5 h-3.5 left-2.5',
        md: 'w-4 h-4 left-3 sm:left-3.5',
        lg: 'w-5 h-5 left-3.5',
    }[size] || 'w-4 h-4 left-3 sm:left-3.5';

    return (
        <div className={`relative w-full ${className}`}>
            {/* Search Icon */}
            <div className={`absolute top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none ${iconSizes}`}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>

            {/* Input Field */}
            <input
                type="text"
                value={value}
                onChange={onChange}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') e.preventDefault();
                    props.onKeyDown?.(e);
                }}
                placeholder={placeholder}
                className={`w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl font-medium placeholder-slate-400 focus:outline-none focus:border-[#009bd2] focus:ring-1 focus:ring-[#009bd2] focus:bg-white transition-all ${sizeClasses} ${inputClassName}`}
                {...props}
            />

            {/* Clear Button */}
            {value && (
                <button
                    type="button"
                    onClick={handleClear}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/60 transition-colors"
                    title="Hapus pencarian"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            )}
        </div>
    );
}
