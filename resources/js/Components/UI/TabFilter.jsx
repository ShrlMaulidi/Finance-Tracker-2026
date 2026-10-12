import React from 'react';

/**
 * Reusable TabFilter component (Segmented Control).
 * Standardizes tab buttons across all views (Hutang, Target, Anggaran, Tagihan, etc.).
 */
export default function TabFilter({
    tabs = [],
    activeTab,
    onChange,
    activeColor = 'text-[#009bd2]', // Default active text color class
    className = '',
    fullWidthMobile = true,
    size = 'md', // 'sm' | 'md'
}) {
    const isSm = size === 'sm';

    return (
        <div
            className={`
                bg-slate-100/90 rounded-xl gap-1
                ${fullWidthMobile ? 'grid sm:flex w-full sm:w-auto' : 'inline-flex w-auto'}
                ${isSm ? 'p-1' : 'p-1'}
                ${className}
            `}
            style={
                fullWidthMobile && tabs.length > 0
                    ? { gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }
                    : undefined
            }
        >
            {tabs.map((tab) => {
                const tabKey = typeof tab === 'string' ? tab : tab.key || tab.id;
                const tabLabel = typeof tab === 'string' ? tab : tab.label;
                const tabMobileLabel = typeof tab === 'object' && tab.mobileLabel ? tab.mobileLabel : null;
                const tabCount = typeof tab === 'object' && tab.count !== undefined ? tab.count : null;
                const tabIcon = typeof tab === 'object' && tab.icon ? tab.icon : null;
                const tabActiveColor = (typeof tab === 'object' && tab.activeColor) || activeColor;

                const isActive = activeTab === tabKey;

                return (
                    <button
                        key={tabKey}
                        type="button"
                        onClick={() => onChange(tabKey)}
                        className={`
                            ${fullWidthMobile ? 'flex-1 sm:flex-none' : ''}
                            min-w-0 flex items-center justify-center gap-1 rounded-lg font-extrabold transition-all duration-200
                            ${isSm ? 'px-1 sm:px-3 py-1.5 text-[11px] sm:text-xs' : 'px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm'}
                            ${
                                isActive
                                    ? `bg-white ${tabActiveColor} shadow-2xs font-black`
                                    : 'text-slate-500 hover:text-slate-700'
                            }
                        `}
                    >
                        {tabIcon && <span className="shrink-0">{tabIcon}</span>}
                        <span className="truncate">
                            {tabMobileLabel ? (
                                <>
                                    <span className="inline sm:hidden">{tabMobileLabel}</span>
                                    <span className="hidden sm:inline">{tabLabel}</span>
                                </>
                            ) : (
                                tabLabel
                            )}
                        </span>
                        {tabCount !== null && (
                            <span className="opacity-90 font-bold text-[10px] sm:text-xs">({tabCount})</span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
