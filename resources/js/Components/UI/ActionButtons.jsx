import React, { useState } from 'react';

/**
 * Reusable ActionButtons component for Edit & Delete actions.
 * Features icon-only design with smooth animated floating tooltips on hover.
 */
export default function ActionButtons({
    onEdit,
    onDelete,
    editTooltip = 'Edit',
    deleteTooltip = 'Hapus',
    size = 'md', // 'sm' | 'md'
    variant = 'transparent', // 'transparent' | 'soft'
    tooltipPosition = 'bottom', // 'bottom' | 'top'
    className = '',
    children = null, // Extra action buttons if any
}) {
    const [hovered, setHovered] = useState(null); // 'edit' | 'delete' | null

    const btnPadding = size === 'sm' ? 'w-7 h-7 sm:w-8 sm:h-8' : 'w-8.5 h-8.5 sm:w-8 sm:h-8 min-w-[34px] min-h-[34px] sm:min-w-0 sm:min-h-0';
    const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

    const editBtnStyle =
        variant === 'soft'
            ? 'bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-600'
            : 'bg-transparent hover:bg-slate-100 active:bg-slate-200 text-slate-500 hover:text-slate-700';

    const deleteBtnStyle =
        variant === 'soft'
            ? 'bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-500'
            : 'bg-transparent hover:bg-red-50 active:bg-red-100 text-red-500';

    const isBottom = tooltipPosition === 'bottom';

    return (
        <div className={`flex items-center gap-1 shrink-0 ${className}`}>
            {children}

            {/* Edit Button */}
            {onEdit && (
                <div className="relative">
                    <button
                        type="button"
                        onClick={onEdit}
                        onMouseEnter={() => setHovered('edit')}
                        onMouseLeave={() => setHovered(null)}
                        className={`${btnPadding} ${editBtnStyle} rounded-lg flex items-center justify-center transition-colors focus:outline-none`}
                        aria-label={editTooltip}
                    >
                        <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                        </svg>
                    </button>
                    <div
                        className={`absolute ${
                            isBottom ? 'top-full mt-1.5' : 'bottom-full mb-1.5'
                        } right-1/2 translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-[11px] font-bold rounded-md pointer-events-none z-40 transition-all duration-150 shadow-md whitespace-nowrap`}
                        style={{
                            opacity: hovered === 'edit' ? 1 : 0,
                            visibility: hovered === 'edit' ? 'visible' : 'hidden',
                            transform:
                                hovered === 'edit'
                                    ? 'translate(50%, 0)'
                                    : isBottom
                                    ? 'translate(50%, -4px)'
                                    : 'translate(50%, 4px)',
                        }}
                    >
                        {/* Tooltip Arrow */}
                        <div
                            className={`absolute ${
                                isBottom
                                    ? '-top-1 border-b-slate-800 border-b-4'
                                    : '-bottom-1 border-t-slate-800 border-t-4'
                            } right-1/2 translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent`}
                        />
                        {editTooltip}
                    </div>
                </div>
            )}

            {/* Separator if both buttons exist and variant is transparent (in dropdowns) */}
            {variant === 'transparent' && onEdit && onDelete && (
                <div className="w-px h-4 bg-slate-100 mx-0.5"></div>
            )}

            {/* Delete Button */}
            {onDelete && (
                <div className="relative">
                    <button
                        type="button"
                        onClick={onDelete}
                        onMouseEnter={() => setHovered('delete')}
                        onMouseLeave={() => setHovered(null)}
                        className={`${btnPadding} ${deleteBtnStyle} rounded-lg flex items-center justify-center transition-colors focus:outline-none`}
                        aria-label={deleteTooltip}
                    >
                        <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                        </svg>
                    </button>
                    <div
                        className={`absolute ${
                            isBottom ? 'top-full mt-1.5' : 'bottom-full mb-1.5'
                        } right-1/2 translate-x-1/2 px-2 py-1 bg-red-600 text-white text-[11px] font-bold rounded-md pointer-events-none z-40 transition-all duration-150 shadow-md whitespace-nowrap`}
                        style={{
                            opacity: hovered === 'delete' ? 1 : 0,
                            visibility: hovered === 'delete' ? 'visible' : 'hidden',
                            transform:
                                hovered === 'delete'
                                    ? 'translate(50%, 0)'
                                    : isBottom
                                    ? 'translate(50%, -4px)'
                                    : 'translate(50%, 4px)',
                        }}
                    >
                        {/* Tooltip Arrow */}
                        <div
                            className={`absolute ${
                                isBottom
                                    ? '-top-1 border-b-red-600 border-b-4'
                                    : '-bottom-1 border-t-red-600 border-t-4'
                            } right-1/2 translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent`}
                        />
                        {deleteTooltip}
                    </div>
                </div>
            )}
        </div>
    );
}
