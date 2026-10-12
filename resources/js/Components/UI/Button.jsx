import React from 'react';
import { Link } from '@inertiajs/react';

/**
 * Universal Button component with support for variants, sizes, icons, and loading states.
 * Preserves exact visual design language and theme tokens.
 */
export default function Button({
    type = 'button',
    variant = 'primary', // 'primary' | 'secondary' | 'danger' | 'success' | 'indigo' | 'ghost' | 'outline'
    size = 'md', // 'sm' | 'md' | 'lg'
    icon = null,
    iconPosition = 'left', // 'left' | 'right'
    loading = false,
    loadingText = 'Menyimpan...',
    disabled = false,
    href = null,
    className = '',
    children,
    onClick,
    ...props
}) {
    // Size tokens
    const sizeClasses = {
        sm: 'px-3 py-1.5 text-xs rounded-xl font-bold gap-1.5',
        md: 'px-4 sm:px-5 py-2.5 text-xs sm:text-sm rounded-xl font-bold gap-2',
        lg: 'px-5 sm:px-6 py-3 sm:py-3.5 text-sm sm:text-base rounded-xl sm:rounded-2xl font-black gap-2.5',
    };

    // Variant tokens matching existing palette exactly
    const variantClasses = {
        primary:
            'bg-[#009bd2] hover:bg-[#0086b6] active:bg-[#00749e] text-white shadow-xs hover:shadow-md active:scale-[0.98]',
        secondary:
            'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800 active:bg-slate-200',
        danger:
            'bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white shadow-rose-500/20 hover:shadow-md active:scale-[0.98]',
        success:
            'bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white shadow-emerald-500/20 hover:shadow-md active:scale-[0.98]',
        indigo:
            'bg-[#6366f1] hover:bg-[#4f46e5] active:bg-[#4338ca] text-white shadow-[0_10px_15px_-3px_rgba(99,102,241,0.3)] hover:-translate-y-0.5',
        ghost:
            'bg-transparent hover:bg-slate-100 active:bg-slate-200 text-slate-600 hover:text-slate-800',
        outline:
            'bg-transparent border border-slate-200 text-slate-700 hover:bg-slate-50 active:bg-slate-100',
    };

    const baseClasses =
        'inline-flex items-center justify-center font-sans tracking-tight transition-all duration-200 focus:outline-none select-none shrink-0';

    const disabledClasses = disabled || loading
        ? 'opacity-60 cursor-not-allowed pointer-events-none'
        : 'cursor-pointer';

    const combinedClasses = `${baseClasses} ${sizeClasses[size] || sizeClasses.md} ${variantClasses[variant] || variantClasses.primary} ${disabledClasses} ${className}`;

    // Spinner element
    const spinner = (
        <svg
            className="animate-spin h-4 w-4 shrink-0 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
        >
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
            ></circle>
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            ></path>
        </svg>
    );

    const content = (
        <>
            {loading && spinner}
            {!loading && icon && iconPosition === 'left' && icon}
            <span>{loading ? loadingText : children}</span>
            {!loading && icon && iconPosition === 'right' && icon}
        </>
    );

    if (href) {
        return (
            <Link href={href} className={combinedClasses} {...props}>
                {content}
            </Link>
        );
    }

    return (
        <button
            type={type}
            disabled={disabled || loading}
            onClick={onClick}
            className={combinedClasses}
            {...props}
        >
            {content}
        </button>
    );
}
