import React, { useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, Link, InfiniteScroll } from '@inertiajs/react';

const TYPE_TABS = [
    { key: 'semua', label: 'Semua' },
    { key: 'pengeluaran', label: 'Pengeluaran' },
    { key: 'pemasukan', label: 'Pemasukan' },
    { key: 'tabungan', label: 'Tabungan' },
];

const PERIOD_MODES = [
    { key: 'month', label: 'Bulan' },
    { key: 'year', label: 'Tahun' },
    { key: 'all', label: 'Semua' },
];

const TYPE_ICON_STYLES = {
    pemasukan: 'bg-emerald-50 text-emerald-600',
    pengeluaran: 'bg-rose-50 text-rose-500',
    tabungan: 'bg-sky-50 text-[#009bd2]',
};

const toDateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export default function TransactionHistory({ title, currentType, filters, availableYears, summary, transactions }) {
    const formatRp = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);

    const visitHistory = (params) => {
        router.get(route('transaksi.history', { type: currentType }), params, { preserveState: true, preserveScroll: true });
    };

    const activeYear = filters.year || new Date().getFullYear();
    const activeMonth = filters.month || new Date().getMonth() + 1;

    const goToMonth = (year, month) => visitHistory({ filter_type: 'month', filter_month: month, filter_year: year });
    const goToYear = (year) => visitHistory({ filter_type: 'year', filter_year: year });

    const goToPreviousPeriod = () => {
        if (filters.type === 'month') {
            const previous = new Date(activeYear, activeMonth - 2, 1);
            goToMonth(previous.getFullYear(), previous.getMonth() + 1);
        } else {
            goToYear(activeYear - 1);
        }
    };

    const goToNextPeriod = () => {
        if (filters.type === 'month') {
            const next = new Date(activeYear, activeMonth, 1);
            goToMonth(next.getFullYear(), next.getMonth() + 1);
        } else {
            goToYear(activeYear + 1);
        }
    };

    const handleMonthChange = (e) => {
        if (e.target.value) {
            const [year, month] = e.target.value.split('-');
            goToMonth(parseInt(year), parseInt(month));
        }
    };

    const monthLabel = (format) => new Date(activeYear, activeMonth - 1, 1).toLocaleDateString('id-ID', { month: format, year: 'numeric' });

    // Type tabs keep the selected period
    const getTabUrl = (typeKey) => {
        const params = { type: typeKey };
        if (filters.type) params.filter_type = filters.type;
        if (filters.month) params.filter_month = filters.month;
        if (filters.year) params.filter_year = filters.year;
        return route('transaksi.history', params);
    };

    // Period totals are aggregated on the server so they cover every row, not only the pages loaded so far
    const rows = transactions.data;

    // Loaded rows grouped per day, newest first
    const dateGroups = useMemo(() => {
        const todayKey = toDateKey(new Date());
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayKey = toDateKey(yesterday);

        const groups = new Map();
        rows.forEach((item) => {
            const dateKey = String(item.date || '').substring(0, 10);
            if (!groups.has(dateKey)) {
                groups.set(dateKey, {
                    date: dateKey,
                    label: dateKey === todayKey ? 'Hari ini' : dateKey === yesterdayKey ? 'Kemarin' : item.date_formatted,
                    items: [],
                });
            }
            groups.get(dateKey).items.push(item);
        });

        return [...groups.values()];
    }, [rows]);

    const summaryItems = currentType === 'semua'
        ? [
            { label: 'Pemasukan', value: `+${formatRp(summary.pemasukan)}`, className: 'text-emerald-600' },
            { label: 'Pengeluaran', value: `-${formatRp(summary.pengeluaran)}`, className: 'text-slate-900' },
            { label: 'Tabungan', value: formatRp(summary.tabungan), className: 'text-slate-900' },
        ]
        : [
            {
                label: `Total ${TYPE_TABS.find((tab) => tab.key === currentType)?.label.toLowerCase()}`,
                value: currentType === 'pemasukan' ? `+${formatRp(summary.pemasukan)}` : formatRp(currentType === 'pengeluaran' ? summary.pengeluaran : summary.tabungan),
                className: currentType === 'pemasukan' ? 'text-emerald-600' : 'text-slate-900',
            },
        ];

    const periodNavButtonClass = 'w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition active:scale-90 shrink-0';

    return (
        <AuthenticatedLayout>
            <Head title={title} />

            <div className="max-w-3xl mx-auto px-3.5 py-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-5">

                {/* Header */}
                <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Riwayat Transaksi</h1>

                {/* Type tabs */}
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-none -mx-1 px-1">
                    {TYPE_TABS.map((tab) => (
                        <Link
                            key={tab.key}
                            href={getTabUrl(tab.key)}
                            preserveScroll
                            preserveState
                            className={`h-8 sm:h-9 px-3.5 rounded-full text-xs sm:text-sm font-semibold flex items-center whitespace-nowrap shrink-0 transition ${
                                currentType === tab.key ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            {tab.label}
                        </Link>
                    ))}
                </div>

                {/* Summary + period filter */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-4 sm:p-6 space-y-4 sm:space-y-5">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-0.5 min-w-0">
                            {filters.type !== 'all' && (
                                <button type="button" onClick={goToPreviousPeriod} className={periodNavButtonClass} aria-label="Periode sebelumnya">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                                </button>
                            )}

                            {/* Tapping the label opens the native month / year picker */}
                            <div className="relative px-1 min-w-0">
                                <span className="block text-[15px] sm:text-base font-extrabold text-slate-800 tracking-tight whitespace-nowrap capitalize">
                                    {filters.type === 'month' ? (
                                        <>
                                            <span className="sm:hidden">{monthLabel('short')}</span>
                                            <span className="hidden sm:inline">{monthLabel('long')}</span>
                                        </>
                                    ) : filters.type === 'year' ? activeYear : 'Semua Waktu'}
                                </span>
                                {filters.type === 'month' && (
                                    <input
                                        type="month"
                                        value={`${activeYear}-${String(activeMonth).padStart(2, '0')}`}
                                        onChange={handleMonthChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        aria-label="Pilih bulan"
                                    />
                                )}
                                {filters.type === 'year' && (
                                    <select
                                        value={activeYear}
                                        onChange={(e) => goToYear(parseInt(e.target.value))}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        aria-label="Pilih tahun"
                                    >
                                        {availableYears.map((year) => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {filters.type !== 'all' && (
                                <button type="button" onClick={goToNextPeriod} className={periodNavButtonClass} aria-label="Periode berikutnya">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                                </button>
                            )}
                        </div>

                        <div className="flex items-center p-0.5 rounded-full bg-slate-100/90 shrink-0">
                            {PERIOD_MODES.map((mode) => (
                                <button
                                    key={mode.key}
                                    type="button"
                                    onClick={() => visitHistory({ filter_type: mode.key })}
                                    aria-pressed={filters.type === mode.key}
                                    className={`h-7 sm:h-8 px-2.5 sm:px-3.5 rounded-full text-[11px] sm:text-xs font-bold transition-all duration-200 ${
                                        filters.type === mode.key
                                            ? 'bg-white text-slate-800 shadow-[0_1px_4px_rgba(15,23,42,0.12)]'
                                            : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    {mode.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={`grid gap-3 ${summaryItems.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                        {summaryItems.map((item) => (
                            <div key={item.label} className="min-w-0">
                                <p className="text-[11px] sm:text-xs font-medium text-slate-400 truncate">{item.label}</p>
                                <p className={`text-sm sm:text-xl font-extrabold tracking-tight tabular-nums truncate mt-0.5 ${item.className}`}>{item.value}</p>
                            </div>
                        ))}
                        {summaryItems.length === 1 && (
                            <div className="min-w-0">
                                <p className="text-[11px] sm:text-xs font-medium text-slate-400">Jumlah</p>
                                <p className="text-sm sm:text-xl font-extrabold text-slate-900 tracking-tight tabular-nums mt-0.5">{summary.count} transaksi</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Transaction list (50 rows per page, more load while scrolling) */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] px-2 sm:px-4 py-2">
                    {rows.length === 0 ? (
                        <div className="min-h-[220px] flex flex-col items-center justify-center text-center px-6">
                            <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                                <svg className="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            </div>
                            <p className="text-slate-500 font-bold text-sm">Belum ada transaksi</p>
                        </div>
                    ) : (
                        <InfiniteScroll
                            data="transactions"
                            onlyNext
                            preserveUrl
                            buffer={600}
                            loading={() => (
                                <div className="py-4 text-center text-xs font-semibold text-slate-400">Memuat...</div>
                            )}
                        >
                            {dateGroups.map((group) => (
                                <section key={group.date} className="mb-1">
                                    <div className="px-2 sm:px-3 pt-3 pb-1.5">
                                        <span className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">{group.label}</span>
                                    </div>

                                    <ul className="divide-y divide-slate-100">
                                        {group.items.map((item) => (
                                            <li key={item.id} className="flex items-center gap-3 px-2 sm:px-3 py-3 rounded-2xl hover:bg-slate-50/80 transition-colors">
                                                <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center shrink-0 ${TYPE_ICON_STYLES[item.type] || TYPE_ICON_STYLES.pengeluaran}`}>
                                                    <svg className="w-[18px] h-[18px] sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        {item.type === 'pengeluaran' ? (
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M12 5v14m0 0l6-6m-6 6l-6-6" />
                                                        ) : item.type === 'pemasukan' ? (
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M12 19V5m0 0l-6 6m6-6l6 6" />
                                                        ) : (
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                                        )}
                                                    </svg>
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <h3 className="text-[13px] sm:text-[15px] font-bold text-slate-800 leading-snug line-clamp-2 break-words" title={item.description || item.title}>
                                                        {item.title}
                                                    </h3>
                                                    <p className="text-[11px] sm:text-xs font-medium text-slate-400 truncate mt-0.5">
                                                        {[item.category, item.payment_method].filter(Boolean).join(' · ')}
                                                    </p>
                                                </div>

                                                <p className={`text-[13px] sm:text-base font-extrabold tracking-tight tabular-nums shrink-0 ${item.type === 'pemasukan' ? 'text-emerald-600' : 'text-slate-800'}`}>
                                                    {item.type === 'pemasukan' ? '+' : '-'}{formatRp(item.amount)}
                                                </p>
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            ))}
                        </InfiniteScroll>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
