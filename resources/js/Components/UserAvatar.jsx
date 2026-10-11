import React, { useState } from 'react';

/**
 * Reusable UserAvatar component that displays user avatar image
 * or gracefully falls back to clean, stylish initials.
 */
export default function UserAvatar({
    user,
    name,
    avatar,
    size = 'md',
    className = '',
    rounded = 'rounded-full',
}) {
    const [imgError, setImgError] = useState(false);

    const userName = name || user?.name || 'User';
    const avatarUrl = avatar !== undefined ? avatar : user?.avatar;

    // Calculate clean 1-2 character initials
    const getInitials = (text) => {
        if (!text) return 'U';
        const trimmed = text.trim();
        const parts = trimmed.split(/\s+/);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return trimmed.substring(0, 2).toUpperCase();
    };

    const initials = getInitials(userName);

    // Predefined sizes with appropriate font sizing
    const sizeMap = {
        xs: 'w-6 h-6 text-[10px]',
        sm: 'w-7 h-7 sm:w-8 sm:h-8 text-[11px]',
        md: 'w-9 h-9 sm:w-10 sm:h-10 text-xs sm:text-sm',
        lg: 'w-12 h-12 text-sm sm:text-base',
        xl: 'w-16 h-16 sm:w-20 sm:h-20 text-xl sm:text-2xl',
    };

    const sizeClasses = sizeMap[size] || size;

    // If an avatar exists and hasn't errored out, attempt to render the image
    if (avatarUrl && !imgError) {
        return (
            <div className={`relative shrink-0 overflow-hidden ${sizeClasses} ${rounded} ${className} border border-slate-200/80 bg-slate-100`}>
                <img
                    src={avatarUrl}
                    alt=""
                    onError={() => setImgError(true)}
                    className="w-full h-full object-cover"
                />
            </div>
        );
    }

    // Default: Sleek modern initials avatar
    return (
        <div
            className={`relative shrink-0 flex items-center justify-center font-black select-none tracking-tight shadow-2xs ${sizeClasses} ${rounded} ${className} bg-gradient-to-tr from-[#009bd2] to-sky-400 text-white border border-sky-300/40`}
            title={userName}
        >
            <span>{initials}</span>
        </div>
    );
}
