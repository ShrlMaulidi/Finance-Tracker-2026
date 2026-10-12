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
}) {
    return (
        <div
            className={`flex bg-slate-100/90 p-1 rounded-xl w-full sm:w-auto gap-1 ${className}`}
        >
            {tabs.map((tab) => {
                const tabKey = typeof tab === 'string' ? tab : tab.key || tab.id;
                const tabLabel = typeof tab === 'string' ? tab : tab.label;
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
                            flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg font-extrabold text-xs sm:text-sm transition-all duration-300
                            ${
                                isActive
                                    ? `bg-white ${tabActiveColor} shadow-[0_2px_8px_rgba(0,0,0,0.06)]`
                                    : 'text-slate-500 hover:text-slate-700'
                            }
                        `}
                    >
                        {tabIcon && <span className="shrink-0">{tabIcon}</span>}
                        <span>{tabLabel}</span>
                        {tabCount !== null && (
                            <span className="opacity-90 font-bold">({tabCount})</span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
