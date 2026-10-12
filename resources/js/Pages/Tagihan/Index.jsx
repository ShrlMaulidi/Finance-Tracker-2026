import React, { useState } from 'react';
import { Head, Link, useForm, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Dropdown from '@/Components/Dropdown';
import CurrencyInput from '@/Components/CurrencyInput';
import { Button, KpiCard, TabFilter, ActionButtons, Modal, AlertBanner } from '@/Components/UI';

export default function TagihanIndex({
    bills = [],
    isFree = false,
    canAdd = true,
    maxLimit = null,
    currentCount = 0,
    summary = {},
    selectedMonth,
    selectedMonthLabel,
    calendarDays = [],
    paymentHistory = [],
    categories = [],
    paymentMethods = [],
}) {
    const { flash } = usePage().props;
    const [activeTab, setActiveTab] = useState('daftar'); // 'daftar' | 'kalender' | 'riwayat'
    const [filterStatus, setFilterStatus] = useState('semua'); // 'semua' | 'belum' | 'lunas' | 'terlambat'
    const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);

    // Modal Create / Edit Bill
    const [isBillModalOpen, setIsBillModalOpen] = useState(false);
    const [editingBill, setEditingBill] = useState(null);

    const billForm = useForm({
        name: '',
        amount: '',
        due_day: 1,
        category_name: '',
        reminder_days: 3,
        account_number: '',
        notes: '',
    });

    // Modal Quick Pay
    const [isPayModalOpen, setIsPayModalOpen] = useState(false);
    const [payingBill, setPayingBill] = useState(null);

    const payForm = useForm({
        amount: '',
        paid_at: new Date().toISOString().split('T')[0],
        payment_method: paymentMethods[0] || 'Tunai / Cash',
        month: selectedMonth,
        notes: '',
    });

    const formatRp = (num) =>
        new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(num || 0);

    // Format Rupiah

    // Open Bill Modal (Create / Edit)
    const openCreateModal = () => {
        if (isFree && !canAdd) {
            router.visit(route('berlangganan.index'));
            return;
        }
        setEditingBill(null);
        billForm.reset();
        billForm.clearErrors();
        billForm.setData({
            name: '',
            amount: '',
            due_day: 10,
            category_name: '',
            reminder_days: 3,
            account_number: '',
            notes: '',
        });
        setIsBillModalOpen(true);
    };

    const openEditModal = (bill) => {
        setEditingBill(bill);
        billForm.clearErrors();
        billForm.setData({
            name: bill.name,
            amount: bill.amount,
            due_day: bill.due_day,
            category_name: bill.category_name,
            reminder_days: bill.reminder_days,
            account_number: bill.account_number || '',
            notes: bill.notes || '',
        });
        setIsBillModalOpen(true);
    };

    const submitBillForm = (e) => {
        e.preventDefault();
        if (editingBill) {
            billForm.put(route('tagihan.update', editingBill.id), {
                preserveScroll: true,
                onSuccess: () => {
                    setIsBillModalOpen(false);
                    setEditingBill(null);
                    billForm.reset();
                },
            });
        } else {
            billForm.post(route('tagihan.store'), {
                preserveScroll: true,
                onSuccess: () => {
                    setIsBillModalOpen(false);
                    billForm.reset();
                },
            });
        }
    };

    const handleDeleteBill = (bill) => {
        if (confirm(`Apakah Anda yakin ingin menghapus tagihan '${bill.name}'?`)) {
            router.delete(route('tagihan.destroy', bill.id), {
                preserveScroll: true,
            });
        }
    };

    // Open Quick Pay Modal
    const openQuickPay = (bill) => {
        setPayingBill(bill);
        payForm.clearErrors();
        payForm.setData({
            amount: bill.amount,
            paid_at: new Date().toISOString().split('T')[0],
            payment_method: paymentMethods[0] || 'Tunai / Cash',
            month: selectedMonth,
            notes: `Bayar tagihan ${bill.name} (${selectedMonthLabel})`,
        });
        setIsPayModalOpen(true);
    };

    const submitQuickPay = (e) => {
        e.preventDefault();
        if (!payingBill) return;

        payForm.post(route('tagihan.pay', payingBill.id), {
            preserveScroll: true,
            onSuccess: () => {
                setIsPayModalOpen(false);
                setPayingBill(null);
                payForm.reset();
            },
        });
    };

    // Filter bills
    const filteredBills = bills.filter((b) => {
        if (filterStatus === 'belum') return !b.is_paid;
        if (filterStatus === 'lunas') return b.is_paid;
        if (filterStatus === 'terlambat') return !b.is_paid && b.status === 'terlambat';
        return true;
    });

    // Helper for Status Badge styling
    const renderStatusBadge = (bill) => {
        if (bill.is_paid) {
            return (
                <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs">
                    <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    Lunas
                </span>
            );
        }

        switch (bill.status) {
            case 'terlambat':
                return (
                    <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-extrabold bg-rose-50 text-rose-700 border border-rose-200 shadow-xs">
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-rose-500 animate-ping"></span>
                        {bill.countdown_text}
                    </span>
                );
            case 'hari_ini':
                return (
                    <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-black bg-rose-500 text-white shadow-xs animate-pulse">
                        <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Hari Ini!
                    </span>
                );
            case 'segera':
                return (
                    <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-xs">
                        <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {bill.countdown_text}
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200">
                        <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {bill.countdown_text}
                    </span>
                );
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Tagihan Rutin" />

            <div className="max-w-7xl mx-auto px-3.5 py-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 relative">
                
                {/* Header Notification Banner */}
                {flash?.success && (
                    <AlertBanner message={flash.success} />
                )}

                {/* Header Page & Toolbar */}
                {/* Desktop Header */}
                <div className="hidden md:flex md:items-end justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                        <p className="text-xs font-bold text-[#009bd2] uppercase tracking-wider mb-1">
                            Kalender & Jadwal Bulanan
                        </p>
                        <h1 className="text-2xl lg:text-3xl font-black text-slate-800 tracking-tight">
                            Tagihan Rutin
                        </h1>
                        <p className="text-slate-500 font-medium text-sm mt-1">
                            Kelola jadwal jatuh tempo bulanan, pantau countdown, dan bayar cepat hanya dengan satu klik.
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <Button
                            onClick={openCreateModal}
                            variant={isFree && !canAdd ? 'secondary' : 'primary'}
                            className={isFree && !canAdd ? '!border-amber-300 !bg-amber-50 !text-amber-800 hover:!bg-amber-100' : ''}
                            icon={isFree && !canAdd ? (
                                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                            ) : (
                                <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                            )}
                        >
                            {isFree && !canAdd ? 'Batas Tercapai (2/2)' : 'Tambah Tagihan'}
                        </Button>
                    </div>
                </div>

                {/* Mobile Header (Clean & Compact) */}
                <div className="flex md:hidden items-center justify-between border-b border-slate-100/80 pb-3">
                    <div>
                        <span className="text-[10px] font-bold text-[#009bd2] uppercase tracking-wider block leading-tight">
                            {selectedMonthLabel}
                        </span>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
                            Tagihan Rutin
                        </h1>
                    </div>

                    <Button
                        size="sm"
                        onClick={openCreateModal}
                        variant={isFree && !canAdd ? 'secondary' : 'primary'}
                        className={isFree && !canAdd ? '!border-amber-300 !bg-amber-50 !text-amber-800' : ''}
                        icon={isFree && !canAdd ? (
                            <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                        ) : (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                        )}
                    >
                        {isFree && !canAdd ? 'Batas (2/2)' : 'Tambah'}
                    </Button>
                </div>

                {/* Free Tier Limit Banner */}
                {isFree && (
                    <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 flex items-center justify-between gap-2.5 sm:gap-4 shadow-2xs">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[11.5px] sm:text-xs font-black text-amber-950 truncate">
                                        Kuota Gratis: {currentCount}/2 Tagihan
                                    </span>
                                    <span className={`text-[9px] uppercase font-black px-1.5 py-0.5 rounded ${!canAdd ? 'bg-amber-200/90 text-amber-900' : 'bg-emerald-100 text-emerald-800'}`}>
                                        {!canAdd ? 'Penuh' : 'Tersedia'}
                                    </span>
                                </div>
                                <p className="text-[10px] sm:text-[11.5px] text-amber-800/80 font-medium truncate mt-0.5">
                                    {!canAdd 
                                        ? 'Batas tercapai. Upgrade ke PRO untuk kelola semua tagihan tanpa batas.' 
                                        : 'Akun Gratis dibatasi maksimal 2 tagihan rutin bulanan.'}
                                </p>
                            </div>
                        </div>
                        <Link 
                            href={route('berlangganan.index')}
                            className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-2 text-[11px] sm:text-xs font-black text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 rounded-lg sm:rounded-xl shadow-2xs transition-all shrink-0 active:scale-95"
                        >
                            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                            <span>Upgrade Pro</span>
                        </Link>
                    </div>
                )}

                {/* KPI Summary - Desktop View (4 Full Cards) */}
                <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <KpiCard
                        title="Total Tagihan"
                        value={formatRp(summary.total_tagihan)}
                        subtitle={`${summary.count_total} pos tagihan rutin`}
                        variant="primary"
                        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
                    />
                    <KpiCard
                        title="Sudah Dibayar"
                        value={formatRp(summary.total_dibayar)}
                        subtitle={`${summary.count_lunas} lunas (${summary.count_total > 0 ? Math.round((summary.count_lunas / summary.count_total) * 100) : 0}%)`}
                        variant="success"
                        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                    />
                    <KpiCard
                        title="Sisa Tagihan"
                        value={formatRp(summary.total_sisa)}
                        subtitle={`${summary.count_belum} tagihan tersisa`}
                        variant="warning"
                        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    />
                    <KpiCard
                        title="Perhatian / Segera"
                        value={summary.count_terlambat > 0 ? `${summary.count_terlambat} Terlambat` : `${summary.count_segera} Segera`}
                        subtitle={summary.count_terlambat > 0 ? 'Perlu tindakan cepat!' : 'Aman terkendali'}
                        variant="danger"
                        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
                    />
                </div>

                {/* KPI Summary - Mobile View (Single Hero Summary Card ala Mobile Banking) */}
                <div className="sm:hidden bg-white rounded-2xl p-4 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            TAGIHAN BULAN INI
                        </span>
                        {summary.count_terlambat > 0 ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/60">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                                {summary.count_terlambat} Terlambat
                            </span>
                        ) : summary.count_belum === 0 && summary.count_total > 0 ? (
                            <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                                Semua Lunas ✨
                            </span>
                        ) : (
                            <span className="text-[10px] font-extrabold text-[#009bd2] bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
                                {summary.count_belum} Belum Bayar
                            </span>
                        )}
                    </div>

                    <div>
                        <div className="text-2xl font-black text-slate-900 tracking-tight">
                            {formatRp(summary.total_sisa)}
                        </div>
                        <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                            Sisa yang harus dibayar dari total {formatRp(summary.total_tagihan)}
                        </p>
                    </div>

                    {/* Progress Bar & Sub-metrics */}
                    {summary.count_total > 0 && (
                        <div className="space-y-1.5 pt-1">
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.round((summary.count_lunas / summary.count_total) * 100)}%` }}
                                />
                            </div>
                            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    <span>Dibayar: {formatRp(summary.total_dibayar)}</span>
                                </div>
                                <span className="text-slate-400">
                                    {summary.count_lunas}/{summary.count_total} Lunas ({Math.round((summary.count_lunas / summary.count_total) * 100)}%)
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Tabs & Filters Navigation */}
                {/* Desktop Toolbar */}
                <div className="hidden sm:flex items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-xs">
                    <TabFilter
                        tabs={[
                            {
                                key: 'daftar',
                                label: 'Tagihan Bulan Ini',
                                icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                            },
                            {
                                key: 'kalender',
                                label: 'Kalender Jatuh Tempo',
                                icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            },
                            {
                                key: 'riwayat',
                                label: 'Riwayat Pembayaran',
                                icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            },
                        ]}
                        activeTab={activeTab}
                        onChange={setActiveTab}
                        activeColor="text-slate-800"
                    />

                    {activeTab === 'daftar' && (
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-0">
                            <span className="text-[11px] font-bold text-slate-400 px-1 shrink-0">Filter:</span>
                            {[
                                { key: 'semua', label: 'Semua' },
                                { key: 'belum', label: 'Belum Bayar' },
                                { key: 'lunas', label: 'Lunas' },
                                { key: 'terlambat', label: 'Terlambat' },
                            ].map((tab) => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setFilterStatus(tab.key)}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap shrink-0 ${filterStatus === tab.key ? 'bg-slate-800 text-white shadow-xs' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Mobile Toolbar (Clean, Compact & Segmented) */}
                <div className="sm:hidden space-y-2">
                    <TabFilter
                        tabs={[
                            {
                                key: 'daftar',
                                label: 'Daftar',
                                icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                            },
                            {
                                key: 'kalender',
                                label: 'Kalender',
                                icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            },
                            {
                                key: 'riwayat',
                                label: 'Riwayat',
                                icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            },
                        ]}
                        activeTab={activeTab}
                        onChange={setActiveTab}
                        activeColor="text-slate-800"
                    />

                    {/* Filter Status Chips (Mobile) */}
                    {activeTab === 'daftar' && (
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-0.5">
                            {[
                                { key: 'semua', label: 'Semua', count: summary.count_total },
                                { key: 'belum', label: 'Belum Bayar', count: summary.count_belum },
                                { key: 'lunas', label: 'Lunas', count: summary.count_lunas },
                                ...(summary.count_terlambat > 0 ? [{ key: 'terlambat', label: 'Terlambat', count: summary.count_terlambat }] : []),
                            ].map((tab) => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setFilterStatus(tab.key)}
                                    className={`px-3 py-1 rounded-full text-xs font-bold transition whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                                        filterStatus === tab.key
                                            ? 'bg-slate-800 text-white shadow-xs'
                                            : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
                                    }`}
                                >
                                    <span>{tab.label}</span>
                                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${filterStatus === tab.key ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-500'}`}>
                                        {tab.count}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* TAB 1: DAFTAR TAGIHAN & COUNTDOWN */}
                {activeTab === 'daftar' && (
                    <div>
                        {filteredBills.length === 0 ? (
                            <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-10 text-center border border-slate-100 shadow-xs">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-sky-50 text-[#009bd2] flex items-center justify-center mx-auto mb-3">
                                    <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h6m-6 4h4" />
                                    </svg>
                                </div>
                                <h3 className="text-sm sm:text-base font-extrabold text-slate-800">Belum ada tagihan rutin</h3>
                                <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                                    Tambahkan tagihan bulanan seperti listrik, air, internet, sewa, asuransi, atau cicilan agar tidak pernah telat bayar.
                                </p>
                                <Button
                                    onClick={openCreateModal}
                                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}
                                >
                                    Tambah Tagihan Sekarang
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                                {filteredBills.map((bill) => {
                                    const isOverdue = !bill.is_paid && bill.status === 'terlambat';
                                    const isToday = !bill.is_paid && bill.status === 'hari_ini';

                                    return (
                                        <div
                                            key={bill.id}
                                            className={`bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border transition-all duration-200 relative flex flex-col justify-between shadow-xs hover:shadow-md ${
                                                bill.is_paid
                                                    ? 'border-emerald-100/80 bg-linear-to-b from-white to-emerald-50/20'
                                                    : isOverdue
                                                    ? 'border-rose-200 bg-rose-50/10'
                                                    : 'border-slate-100 hover:border-[#009bd2]/40'
                                            }`}
                                        >
                                            <div>
                                                {/* Top Row: Icon + Name & Category + Status Badge + 3 Dots Menu */}
                                                <div className="flex items-start justify-between gap-2.5 mb-3">
                                                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                        {/* Category/Status Squircle Icon */}
                                                        <div
                                                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                                                bill.is_paid
                                                                    ? 'bg-emerald-50 text-emerald-600'
                                                                    : isOverdue
                                                                    ? 'bg-rose-50 text-rose-600'
                                                                    : isToday
                                                                    ? 'bg-amber-50 text-amber-600'
                                                                    : 'bg-sky-50 text-[#009bd2]'
                                                            }`}
                                                        >
                                                            {bill.is_paid ? (
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            ) : (
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h6m-6 4h4" />
                                                                </svg>
                                                            )}
                                                        </div>

                                                        <div className="min-w-0 flex-1">
                                                            <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate leading-snug" title={bill.name}>
                                                                {bill.name}
                                                            </h3>
                                                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold mt-0.5 truncate">
                                                                <span className="truncate">{bill.category_name}</span>
                                                                {bill.account_number && (
                                                                    <>
                                                                        <span>•</span>
                                                                        <span className="font-mono text-slate-500 truncate">{bill.account_number}</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Status Badge & 3-Dots Dropdown */}
                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        {renderStatusBadge(bill)}

                                                        <Dropdown>
                                                            <Dropdown.Trigger>
                                                                <button
                                                                    type="button"
                                                                    className="w-7 h-7 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg flex items-center justify-center transition-colors focus:outline-none"
                                                                    aria-label="Menu Opsi"
                                                                >
                                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                                        <path d="M12 8a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
                                                                    </svg>
                                                                </button>
                                                            </Dropdown.Trigger>
                                                            <Dropdown.Content align="right" width="auto" contentClasses="p-1 bg-white border border-slate-100 shadow-xl flex items-center rounded-xl">
                                                                <ActionButtons
                                                                    size="sm"
                                                                    variant="transparent"
                                                                    onEdit={() => openEditModal(bill)}
                                                                    onDelete={() => handleDeleteBill(bill)}
                                                                />
                                                            </Dropdown.Content>
                                                        </Dropdown>
                                                    </div>
                                                </div>

                                                {/* Middle Info: Due Date & Amount */}
                                                <div className="flex items-baseline justify-between gap-2 pt-2 border-t border-slate-100/80">
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                                            <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                            <span>Tgl {bill.due_day}</span>
                                                            <span className="text-slate-400 font-normal">({bill.due_date_formatted})</span>
                                                        </div>
                                                        {bill.notes && (
                                                            <p className="text-[11px] text-slate-400 italic truncate mt-1 max-w-[200px]">
                                                                "{bill.notes}"
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="text-right shrink-0">
                                                        <div className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                                                            {formatRp(bill.amount)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Bottom Action Area */}
                                            <div className="mt-3 pt-2.5 border-t border-slate-100/60">
                                                {bill.is_paid ? (
                                                    <div className="flex items-center justify-between text-[11px] text-emerald-700 bg-emerald-50/70 border border-emerald-100/70 rounded-xl px-3 py-1.5">
                                                        <span className="font-bold flex items-center gap-1.5">
                                                            <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                            Telah Dibayar
                                                        </span>
                                                        <span className="font-medium text-emerald-600/80 truncate">
                                                            {bill.paid_at} • {bill.paid_payment_method}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => openQuickPay(bill)}
                                                        className="w-full py-2 px-3.5 bg-[#009bd2] hover:bg-[#0086b6] text-white text-xs font-bold rounded-xl shadow-xs hover:shadow transition active:scale-98 flex items-center justify-center gap-2"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                                        </svg>
                                                        <span>Bayar Sekarang</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 2: KALENDER JATUH TEMPO */}
                {activeTab === 'kalender' && (
                    <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 border border-slate-100 shadow-xs space-y-3 sm:space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3">
                            <div>
                                <h2 className="text-sm sm:text-lg font-black text-slate-800">
                                    Kalender Jatuh Tempo — {selectedMonthLabel}
                                </h2>
                                <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                                    Ketuk tanggal untuk melihat detail tagihan jatuh tempo.
                                </p>
                            </div>
                            <div className="flex items-center flex-wrap gap-2.5 sm:gap-3 text-[11px] sm:text-xs font-semibold">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                                    <span className="text-slate-600">Lunas</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-amber-500 shrink-0"></span>
                                    <span className="text-slate-600">Belum Bayar</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-rose-500 shrink-0"></span>
                                    <span className="text-slate-600">Hari Ini / Lewat</span>
                                </div>
                            </div>
                        </div>

                        {/* Calendar Weekday Header */}
                        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-wider py-1">
                            <div>Sen</div>
                            <div>Sel</div>
                            <div>Rab</div>
                            <div>Kam</div>
                            <div>Jum</div>
                            <div className="text-amber-500">Sab</div>
                            <div className="text-rose-500">Min</div>
                        </div>

                        {/* Calendar Grid Matrix */}
                        <div className="grid grid-cols-7 gap-1 sm:gap-2">
                            {calendarDays.map((cell, idx) => {
                                if (!cell.is_current_month) {
                                    return (
                                        <div
                                            key={`empty-${idx}`}
                                            className="min-h-[52px] sm:min-h-[90px] rounded-xl sm:rounded-2xl bg-slate-50/40 border border-transparent"
                                        />
                                    );
                                }

                                const isSelected = selectedCalendarDate === cell.day;
                                const hasBills = cell.bills && cell.bills.length > 0;
                                const hasUnpaid = cell.bills && cell.bills.some((b) => !b.is_paid);

                                return (
                                    <div
                                        key={`day-${cell.day}`}
                                        onClick={() => setSelectedCalendarDate(cell.day === selectedCalendarDate ? null : cell.day)}
                                        className={`min-h-[52px] sm:min-h-[90px] rounded-xl sm:rounded-2xl p-1 sm:p-2 border transition-all cursor-pointer flex flex-col justify-between ${cell.is_today ? 'ring-2 ring-[#009bd2] bg-sky-50/20' : ''} ${isSelected ? 'border-[#009bd2] bg-sky-50/40 shadow-xs' : 'border-slate-100 hover:border-slate-300 bg-white'}`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span
                                                className={`inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full text-[11px] sm:text-xs font-black ${cell.is_today ? 'bg-[#009bd2] text-white shadow-xs' : isSelected ? 'bg-slate-800 text-white' : 'text-slate-700'}`}
                                            >
                                                {cell.day}
                                            </span>

                                            {hasBills && (
                                                <span
                                                    className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${hasUnpaid ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}
                                                    title={`${cell.bills.length} tagihan`}
                                                />
                                            )}
                                        </div>

                                        {/* Mobile Indicators: Dot markers */}
                                        {hasBills && (
                                            <div className="flex sm:hidden items-center justify-center gap-0.5 mt-1 flex-wrap">
                                                {cell.bills.slice(0, 3).map((b) => (
                                                    <span
                                                        key={`m-dot-${b.id}`}
                                                        className={`w-1.5 h-1.5 rounded-full ${b.is_paid ? 'bg-emerald-500' : b.status === 'terlambat' ? 'bg-rose-500' : 'bg-amber-500'}`}
                                                    />
                                                ))}
                                                {cell.bills.length > 3 && (
                                                    <span className="text-[8px] font-bold text-slate-400 leading-none">+</span>
                                                )}
                                            </div>
                                        )}

                                        {/* Desktop Badges on Calendar Tile */}
                                        <div className="hidden sm:block space-y-1 mt-1 overflow-hidden">
                                            {cell.bills.slice(0, 2).map((bill) => (
                                                <div
                                                    key={`cal-bill-${bill.id}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (!bill.is_paid) openQuickPay(bill);
                                                    }}
                                                    title={`${bill.name} (${formatRp(bill.amount)}) - ${bill.is_paid ? 'Lunas' : 'Belum Bayar'}`}
                                                    className={`truncate text-[10px] sm:text-[11px] font-bold px-1.5 py-0.5 rounded-md transition ${bill.is_paid ? 'bg-emerald-100/70 text-emerald-800' : bill.status === 'terlambat' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100/80 text-amber-900 hover:ring-1 hover:ring-amber-300'}`}
                                                >
                                                    {bill.name}
                                                </div>
                                            ))}
                                            {cell.bills.length > 2 && (
                                                <div className="text-[9px] font-extrabold text-slate-400 text-center">
                                                    +{cell.bills.length - 2} lainnya
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Selected Date Detail Drawer */}
                        {selectedCalendarDate && (
                            <div className="mt-3 sm:mt-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200/80 animate-fadeIn">
                                <div className="flex items-center justify-between mb-2.5 sm:mb-3">
                                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 flex items-center gap-1.5 sm:gap-2">
                                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#009bd2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span>Jatuh Tempo Tanggal {selectedCalendarDate} {selectedMonthLabel}</span>
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedCalendarDate(null)}
                                        className="text-xs font-bold text-slate-400 hover:text-slate-600 px-2 py-1"
                                    >
                                        Tutup
                                    </button>
                                </div>

                                {(() => {
                                    const dayObj = calendarDays.find((d) => d.day === selectedCalendarDate);
                                    if (!dayObj || !dayObj.bills || dayObj.bills.length === 0) {
                                        return (
                                            <p className="text-xs text-slate-500 italic">
                                                Tidak ada tagihan yang jatuh tempo pada tanggal {selectedCalendarDate}.
                                            </p>
                                        );
                                    }
                                    return (
                                        <div className="space-y-2">
                                            {dayObj.bills.map((b) => (
                                                <div
                                                    key={`sel-${b.id}`}
                                                    className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-xs"
                                                >
                                                    <div className="min-w-0">
                                                        <div className="text-xs sm:text-sm font-extrabold text-slate-800 truncate">{b.name}</div>
                                                        <div className="text-[11px] text-slate-500 font-medium">
                                                            {b.category_name} • <span className="font-bold text-slate-700">{formatRp(b.amount)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                                                        {renderStatusBadge(b)}
                                                        {!b.is_paid && (
                                                            <button
                                                                type="button"
                                                                onClick={() => openQuickPay(b)}
                                                                className="px-3 py-1.5 bg-[#009bd2] text-white text-xs font-bold rounded-xl hover:bg-[#0086b6] transition active:scale-95 shadow-xs"
                                                            >
                                                                Bayar
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 3: RIWAYAT PEMBAYARAN */}
                {activeTab === 'riwayat' && (
                    <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-100 shadow-xs space-y-3 sm:space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                                <h2 className="text-base sm:text-lg font-black text-slate-800">Riwayat Pembayaran Tagihan</h2>
                                <p className="text-xs text-slate-500 font-medium">
                                    Catatan transaksi pembayaran tagihan rutin yang telah masuk ke pembukuan pengeluaran.
                                </p>
                            </div>
                        </div>

                        {paymentHistory.length === 0 ? (
                            <div className="text-center py-8 sm:py-10 text-slate-400">
                                <svg className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                <p className="text-xs sm:text-sm font-semibold">Belum ada riwayat pembayaran tagihan.</p>
                            </div>
                        ) : (
                            <>
                                {/* Mobile View: Card List (No horizontal scrolling headache) */}
                                <div className="md:hidden space-y-2.5">
                                    {paymentHistory.map((item) => (
                                        <div key={item.id} className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 space-y-2">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-semibold text-slate-500">{item.paid_at}</span>
                                                <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200/60 font-semibold text-[11px] text-slate-700">
                                                    {item.payment_method}
                                                </span>
                                            </div>
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <div className="font-bold text-slate-800 text-sm truncate">{item.bill_name}</div>
                                                    <div className="text-[11px] font-medium text-slate-400">{item.category_name} • {item.month_label}</div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <div className="font-black text-emerald-600 text-sm">{formatRp(item.amount)}</div>
                                                </div>
                                            </div>
                                            {item.notes && (
                                                <p className="text-[11px] text-slate-500 italic pt-1.5 border-t border-slate-200/50">
                                                    "{item.notes}"
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Desktop View: Full Table */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full text-left text-xs sm:text-sm">
                                        <thead>
                                            <tr className="border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                                                <th className="py-2.5 px-3">Tanggal</th>
                                                <th className="py-2.5 px-3">Nama Tagihan</th>
                                                <th className="py-2.5 px-3">Periode</th>
                                                <th className="py-2.5 px-3">Metode</th>
                                                <th className="py-2.5 px-3 text-right">Nominal</th>
                                                <th className="py-2.5 px-3">Catatan</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 font-medium">
                                            {paymentHistory.map((item) => (
                                                <tr key={item.id} className="hover:bg-slate-50/60 transition">
                                                    <td className="py-3 px-3 font-semibold text-slate-700 whitespace-nowrap">
                                                        {item.paid_at}
                                                    </td>
                                                    <td className="py-3 px-3 font-bold text-slate-800">
                                                        <div>{item.bill_name}</div>
                                                        <div className="text-[11px] font-medium text-slate-400">{item.category_name}</div>
                                                    </td>
                                                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                                                        {item.month_label}
                                                    </td>
                                                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                                                        <span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-xs">
                                                            {item.payment_method}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-3 text-right font-black text-emerald-600 whitespace-nowrap">
                                                        {formatRp(item.amount)}
                                                    </td>
                                                    <td className="py-3 px-3 text-slate-500 italic max-w-xs truncate">
                                                        {item.notes || '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* MODAL: TAMBAH / UBAH TAGIHAN RUTIN */}
                <Modal
                    isOpen={isBillModalOpen}
                    onClose={() => setIsBillModalOpen(false)}
                    title={editingBill ? 'Ubah Tagihan Rutin' : 'Tambah Tagihan Rutin'}
                    subtitle="Setiap tagihan akan otomatis dimasukkan ke Kategori Pengeluaran."
                    maxWidth="lg"
                >
                    <form onSubmit={submitBillForm} className="space-y-4">
                                {/* Nama Tagihan */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Nama Tagihan <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Misal: WiFi Indihome, Listrik PLN, Sewa Rumah, BPJS"
                                        value={billForm.data.name}
                                        onChange={(e) => {
                                            billForm.setData('name', e.target.value);
                                            if (!editingBill && !billForm.data.category_name) {
                                                billForm.setData('category_name', e.target.value);
                                            }
                                        }}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#009bd2] focus:bg-white"
                                        required
                                    />
                                    {billForm.errors.name && (
                                        <p className="text-xs text-rose-500 mt-1 font-semibold">{billForm.errors.name}</p>
                                    )}
                                </div>

                                {/* Nominal Tagihan */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Nominal Tagihan per Bulan <span className="text-rose-500">*</span>
                                    </label>
                                    <CurrencyInput
                                        value={billForm.data.amount}
                                        onValueChange={(val) => billForm.setData('amount', val)}
                                        placeholder="Rp 0"
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#009bd2] focus:bg-white"
                                        required
                                    />
                                    {billForm.errors.amount && (
                                        <p className="text-xs text-rose-500 mt-1 font-semibold">{billForm.errors.amount}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {/* Tanggal Jatuh Tempo */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            Jatuh Tempo Setiap Tgl <span className="text-rose-500">*</span>
                                        </label>
                                        <select
                                            value={billForm.data.due_day}
                                            onChange={(e) => billForm.setData('due_day', parseInt(e.target.value, 10))}
                                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#009bd2] focus:bg-white"
                                        >
                                            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                                                <option key={d} value={d}>
                                                    Tanggal {d} setiap bulan
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Pengingat H- */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            Ingatkan H- (Hari Sebelumnya)
                                        </label>
                                        <select
                                            value={billForm.data.reminder_days}
                                            onChange={(e) => billForm.setData('reminder_days', parseInt(e.target.value, 10))}
                                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#009bd2] focus:bg-white"
                                        >
                                            <option value={1}>1 hari sebelumnya</option>
                                            <option value={2}>2 hari sebelumnya</option>
                                            <option value={3}>3 hari sebelumnya</option>
                                            <option value={5}>5 hari sebelumnya</option>
                                            <option value={7}>7 hari sebelumnya (1 minggu)</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Kategori Pengeluaran */}
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="text-xs font-bold text-slate-700">
                                            Kategori Pengeluaran
                                        </label>
                                        <span className="text-[10px] font-semibold text-[#009bd2] bg-sky-50 px-2 py-0.5 rounded-full">
                                            Otomatis sinkron transaksi
                                        </span>
                                    </div>
                                    <input
                                        type="text"
                                        list="existing-categories"
                                        placeholder="Pilih atau ketik kategori baru..."
                                        value={billForm.data.category_name}
                                        onChange={(e) => billForm.setData('category_name', e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#009bd2] focus:bg-white"
                                    />
                                    <datalist id="existing-categories">
                                        {categories.map((c, i) => (
                                            <option key={i} value={c} />
                                        ))}
                                    </datalist>
                                    <p className="text-[11px] text-slate-400 mt-1">
                                        Kategori ini akan otomatis didaftarkan dan dapat dipilih pada form input transaksi pengeluaran.
                                    </p>
                                </div>

                                {/* Nomor Pelanggan / Rekening */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        No. Pelanggan / ID Tagihan (Opsional)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Misal ID PLN: 5123456789 atau Virtual Account"
                                        value={billForm.data.account_number}
                                        onChange={(e) => billForm.setData('account_number', e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#009bd2] focus:bg-white"
                                    />
                                </div>

                                {/* Catatan */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Catatan / Keterangan (Opsional)
                                    </label>
                                    <textarea
                                        rows={2}
                                        placeholder="Catatan tambahan seperti link pembayaran atau ketentuan..."
                                        value={billForm.data.notes}
                                        onChange={(e) => billForm.setData('notes', e.target.value)}
                                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-[#009bd2] focus:bg-white resize-none"
                                    />
                                </div>

                                {/* Actions */}
                                <div className="pt-3 sm:pt-4 flex gap-2.5 sm:gap-3">
                                    <Button
                                        variant="secondary"
                                        onClick={() => setIsBillModalOpen(false)}
                                        className="flex-1 !py-2.5 sm:!py-3"
                                    >
                                        Batal
                                    </Button>
                                    <Button
                                        type="submit"
                                        loading={billForm.processing}
                                        className="flex-[2] !py-2.5 sm:!py-3"
                                    >
                                        {editingBill ? 'Simpan Perubahan' : 'Tambah Tagihan'}
                                    </Button>
                                </div>
                            </form>
                </Modal>

                {/* MODAL: TOMBOL CEPAT "BAYAR" */}
                <Modal
                    isOpen={isPayModalOpen && !!payingBill}
                    onClose={() => setIsPayModalOpen(false)}
                    title="Tombol Cepat: Bayar Tagihan"
                    subtitle={`Periode ${selectedMonthLabel}`}
                    maxWidth="md"
                >
                    {payingBill && (
                        <>

                            {/* Bill Header Info Card */}
                            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 mb-4">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                            {payingBill.category_name}
                                        </span>
                                        <h4 className="text-sm font-black text-slate-800">{payingBill.name}</h4>
                                        {payingBill.account_number && (
                                            <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                                                ID: {payingBill.account_number}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jatuh Tempo</span>
                                        <div className="text-xs font-black text-slate-700">Tgl {payingBill.due_day}</div>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={submitQuickPay} className="space-y-3.5">
                                {/* Nominal Pembayaran */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Nominal yang Dibayar <span className="text-rose-500">*</span>
                                    </label>
                                    <CurrencyInput
                                        value={payForm.data.amount}
                                        onValueChange={(val) => payForm.setData('amount', val)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-black text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#009bd2] focus:bg-white"
                                        required
                                    />
                                    {payForm.errors.amount && (
                                        <p className="text-xs text-rose-500 mt-1 font-semibold">{payForm.errors.amount}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {/* Tanggal Pembayaran */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            Tanggal Bayar <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            value={payForm.data.paid_at}
                                            onChange={(e) => payForm.setData('paid_at', e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-[#009bd2] focus:bg-white"
                                            required
                                        />
                                    </div>

                                    {/* Metode Pembayaran */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            Metode Bayar <span className="text-rose-500">*</span>
                                        </label>
                                        <select
                                            value={payForm.data.payment_method}
                                            onChange={(e) => payForm.setData('payment_method', e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-[#009bd2] focus:bg-white"
                                        >
                                            {paymentMethods.map((pm, idx) => (
                                                <option key={idx} value={pm}>
                                                    {pm}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Catatan */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Catatan Transaksi (Opsional)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Misal: Bukti transfer BCA #1234"
                                        value={payForm.data.notes}
                                        onChange={(e) => payForm.setData('notes', e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-[#009bd2] focus:bg-white"
                                    />
                                </div>

                                <div className="p-3 bg-sky-50/70 border border-sky-100 rounded-xl text-[11px] text-sky-800 flex items-start gap-2">
                                    <svg className="w-4 h-4 text-[#009bd2] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>
                                        Otomatis mencatat transaksi pengeluaran sebesar{' '}
                                        <strong className="font-bold">{formatRp(payForm.data.amount)}</strong> pada kategori{' '}
                                        <strong>"{payingBill.category_name}"</strong>.
                                    </span>
                                </div>

                                {/* Actions */}
                                <div className="pt-3 sm:pt-4 flex gap-2.5 sm:gap-3">
                                    <Button
                                        variant="secondary"
                                        onClick={() => setIsPayModalOpen(false)}
                                        className="flex-1 !py-2.5 sm:!py-3"
                                    >
                                        Batal
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="success"
                                        loading={payForm.processing}
                                        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                                        className="flex-[2] !py-2.5 sm:!py-3"
                                    >
                                        Konfirmasi Bayar
                                    </Button>
                                </div>
                            </form>
                        </>
                    )}
                </Modal>
            </div>
        </AuthenticatedLayout>
    );
}
