import React, { useState, useEffect, useMemo } from 'react';
import { Head, useForm, router, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Dropdown from '@/Components/Dropdown';
import CurrencyInput from '@/Components/CurrencyInput';
import { ActionButtons, Modal, Button, DeleteConfirmModal } from '@/Components/UI';
import useOptimisticList from '@/Utils/useOptimisticList';

// Colors of the "Catat Transaksi" form follow the selected transaction type
const TRANSACTION_FORM_THEMES = {
    pemasukan: {
        soft: 'bg-emerald-50 text-emerald-600',
        text: 'text-emerald-600',
        chip: 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30',
        panel: 'bg-emerald-50/60 border-emerald-100',
        focus: 'focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10',
        button: 'from-emerald-500 to-emerald-600 shadow-emerald-500/30',
    },
    pengeluaran: {
        soft: 'bg-rose-50 text-rose-500',
        text: 'text-rose-600',
        chip: 'bg-rose-500 text-white shadow-sm shadow-rose-500/30',
        panel: 'bg-rose-50/60 border-rose-100',
        focus: 'focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10',
        button: 'from-rose-500 to-rose-600 shadow-rose-500/30',
    },
    tabungan: {
        soft: 'bg-sky-50 text-[#009bd2]',
        text: 'text-[#009bd2]',
        chip: 'bg-[#009bd2] text-white shadow-sm shadow-[#009bd2]/30',
        panel: 'bg-sky-50/70 border-sky-100',
        focus: 'focus:border-[#009bd2] focus:ring-4 focus:ring-[#009bd2]/10',
        button: 'from-[#00b5f8] to-[#009bd2] shadow-[#009bd2]/30',
    },
};

const formFieldClass = 'w-full h-12 bg-slate-50/80 border border-slate-200/80 text-slate-800 rounded-2xl px-3.5 font-bold text-xs sm:text-sm transition-all duration-200 focus:outline-none focus:bg-white';

export default function Index({ transactions, summary, currentMonthName, currentMonthKey, targets, pemasukanCategories, pengeluaranCategories, paymentMethods, activeBills = [], activeDebts = [] }) {
    const formatRp = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);


    const tabunganCategories = targets && targets.length > 0 
        ? targets.map(t => ({ id: t.name, label: t.name })) 
        : [{ id: '', label: 'Belum ada target tabungan' }];

    const { data, setData, post, processing, reset, errors, setError, clearErrors } = useForm({
        type: 'pengeluaran',
        amount: '',
        category: '',
        bill_id: '',
        debt_id: '',
        payment_method: '',
        title: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
    });

    // The list and monthly summary update the moment the user submits; requests finish in the background
    // and every pending change falls back to the server data automatically if it fails.
    const optimisticTransactions = useOptimisticList(transactions);
    // This page lists the running month only, so a just-saved entry dated in another month isn't shown here
    const visibleTransactions = optimisticTransactions.items.filter((item) => String(item.date || '').substring(0, 7) === currentMonthKey);
    const [summaryAdjustments, setSummaryAdjustments] = useState([]);

    const adjustSummary = (changes) => {
        const relevantChanges = changes.filter((change) => String(change.date || '').substring(0, 7) === currentMonthKey);
        const adjustmentId = Symbol('summary-adjustment');
        setSummaryAdjustments((current) => [...current, { adjustmentId, changes: relevantChanges }]);
        return () => setSummaryAdjustments((current) => current.filter((adjustment) => adjustment.adjustmentId !== adjustmentId));
    };

    const liveSummary = useMemo(() => {
        const totals = { pemasukan: Number(summary.pemasukan) || 0, pengeluaran: Number(summary.pengeluaran) || 0, tabungan: Number(summary.tabungan) || 0 };
        summaryAdjustments.forEach(({ changes }) => changes.forEach(({ type, amount }) => {
            if (type in totals) {
                totals[type] += amount;
            }
        }));
        return { ...totals, saldo: totals.pemasukan - totals.pengeluaran - totals.tabungan };
    }, [summary, summaryAdjustments]);

    // Recent transactions grouped per day (newest first) with each day's net total
    const transactionDateGroups = useMemo(() => {
        const toDateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const todayKey = toDateKey(new Date());
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayKey = toDateKey(yesterday);

        const groups = new Map();
        visibleTransactions.forEach((item) => {
            const dateKey = String(item.date || '').substring(0, 10);
            if (!groups.has(dateKey)) {
                groups.set(dateKey, {
                    date: dateKey,
                    label: dateKey === todayKey ? 'Hari ini' : dateKey === yesterdayKey ? 'Kemarin' : item.date_formatted,
                    net: 0,
                    items: [],
                });
            }
            const group = groups.get(dateKey);
            group.items.push(item);
            group.net += item.type === 'pemasukan' ? Number(item.amount) : -Number(item.amount);
        });

        return [...groups.values()].sort((a, b) => b.date.localeCompare(a.date));
    }, [visibleTransactions]);

    const toOptimisticTransaction = (formData) => ({
        type: formData.type,
        amount: Number(formData.amount) || 0,
        category: formData.category,
        debt_id: formData.debt_id || null,
        payment_method: formData.payment_method,
        title: formData.title,
        description: formData.description,
        date: formData.date,
        date_formatted: formData.date
            ? new Date(formData.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
            : '',
    });

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingTx, setEditingTx] = useState(null);
    const [mobileTab, setMobileTab] = useState('catat'); // 'catat' | 'riwayat'

    const currentMonthStr = new Date().toISOString().substring(0, 7);
    const selectedInputMonth = data.date ? String(data.date).substring(0, 7) : currentMonthStr;

    // Filter bills: hide bills that have status 'lunas' (fully paid) for the selected input period
    const availableBillsForInput = activeBills.filter(b => {
        if (b.paid_months && Array.isArray(b.paid_months)) {
            return !b.paid_months.includes(selectedInputMonth);
        }
        return !b.is_paid;
    });

    const formTheme = TRANSACTION_FORM_THEMES[data.type] || TRANSACTION_FORM_THEMES.pengeluaran;

    const selectedBill = data.type === 'pengeluaran' && data.category === 'Tagihan Rutin'
        ? (activeBills.find(b => String(b.id) === String(data.bill_id)) || null)
        : null;

    // A recurring-bill expense can only be saved once a bill has been picked
    const isBillSelectionMissing = data.type === 'pengeluaran' && data.category === 'Tagihan Rutin' && !data.bill_id;

    // Pop-up Notification State
    const [popupNotification, setPopupNotification] = useState({
        show: false,
        title: '',
        message: '',
        type: 'success',
    });

    // Auto dismiss notification after 4.5 seconds
    useEffect(() => {
        if (popupNotification.show) {
            const timer = setTimeout(() => {
                setPopupNotification(prev => ({ ...prev, show: false }));
            }, 4500);
            return () => clearTimeout(timer);
        }
    }, [popupNotification.show]);

    // Popups are shown the moment the user submits (the save finishes in the background),
    // so the server's flash message is not shown again when the response arrives.
    const showSaveFailedPopup = () => setPopupNotification({
        show: true,
        title: 'Transaksi Gagal Disimpan',
        message: 'Periksa kembali isian yang ditandai lalu simpan ulang.',
        type: 'error',
    });

    const { 
        data: editData, 
        setData: setEditData, 
        put: putEdit, 
        processing: editProcessing, 
        reset: resetEdit, 
        clearErrors: clearEditErrors,
        errors: editErrors 
    } = useForm({
        type: 'pengeluaran',
        amount: '',
        category: '',
        bill_id: '',
        debt_id: '',
        payment_method: '',
        title: '',
        description: '',
        date: ''
    });

    const selectedEditMonth = editData.date ? String(editData.date).substring(0, 7) : currentMonthStr;

    // In edit mode: keep the currently linked bill, while hiding other already-paid bills for the period
    const availableBillsForEdit = activeBills.filter(b => {
        if (String(b.id) === String(editData.bill_id)) {
            return true;
        }
        if (b.paid_months && Array.isArray(b.paid_months)) {
            return !b.paid_months.includes(selectedEditMonth);
        }
        return !b.is_paid;
    });

    const editSelectedBill = editData.type === 'pengeluaran' && editData.category === 'Tagihan Rutin'
        ? (activeBills.find(b => String(b.id) === String(editData.bill_id)) || null)
        : null;

    // Older recurring-bill expenses may have lost their bill, so only require one when switching into the category
    const isEditBillSelectionMissing = editData.type === 'pengeluaran' && editData.category === 'Tagihan Rutin' && !editData.bill_id
        && !(editingTx?.type === 'pengeluaran' && editingTx?.category === 'Tagihan Rutin');

    const submit = (e) => {
        e.preventDefault();
        if (isBillSelectionMissing) return;
        if (!data.payment_method) {
            setError('payment_method', 'Metode pembayaran wajib dipilih.');
            return;
        }
        const submittedData = { ...data };
        const newTransaction = toOptimisticTransaction(submittedData);

        const settleList = optimisticTransactions.add(newTransaction);
        const settleSummary = adjustSummary([{ type: newTransaction.type, amount: newTransaction.amount, date: newTransaction.date }]);

        setPopupNotification({
            show: true,
            title: 'Transaksi Berhasil Dicatat! 🎉',
            message: submittedData.title
                ? `${submittedData.type === 'pengeluaran' ? 'Pengeluaran' : submittedData.type === 'pemasukan' ? 'Pemasukan' : 'Tabungan'} "${submittedData.title}" sebesar ${formatRp(submittedData.amount)} telah tersimpan.`
                : 'Catatan transaksi telah berhasil disimpan ke pembukuan.',
            type: 'success',
        });

        post(route('transaksi.store'), {
            preserveScroll: true,
            async: true,
            // Validation failed: bring back what the user typed so the errors can be fixed
            onError: () => {
                setData(submittedData);
                showSaveFailedPopup();
            },
            onFinish: () => {
                settleList();
                settleSummary();
            },
        });

        // Clear the form right away so the next transaction can be typed without waiting
        reset('amount', 'category', 'bill_id', 'debt_id', 'title', 'description', 'payment_method');
        if (typeof window !== 'undefined' && window.innerWidth < 640) {
            setMobileTab('riwayat');
        }
    };

    const openEditModal = (item) => {
        setEditingTx(item);
        clearEditErrors();

        let matchedBillId = '';
        if (item.type === 'pengeluaran' && item.category === 'Tagihan Rutin') {
            const found = activeBills.find(b => 
                (item.title && item.title.toLowerCase().includes(b.name.toLowerCase())) ||
                (item.description && item.description.toLowerCase().includes(b.name.toLowerCase()))
            );
            if (found) {
                matchedBillId = found.id;
            }
        }

        let matchedDebtId = item.debt_id || '';
        if (!matchedDebtId && item.type === 'pengeluaran' && item.category === 'Hutang') {
            const found = activeDebts.find(d => 
                (item.title && item.title.toLowerCase().includes(d.name.toLowerCase())) ||
                (item.description && item.description.toLowerCase().includes(d.name.toLowerCase()))
            );
            if (found) {
                matchedDebtId = found.id;
            }
        }

        setEditData({
            type: item.type,
            amount: item.amount,
            category: item.category,
            bill_id: matchedBillId,
            debt_id: matchedDebtId,
            payment_method: item.payment_method || '',
            title: item.title,
            description: item.description || '',
            date: item.date
        });
        setIsEditModalOpen(true);
    };

    const submitEdit = (e) => {
        e.preventDefault();
        if (isEditBillSelectionMissing) return;
        const transactionBeingEdited = editingTx;
        const updatedTransaction = toOptimisticTransaction(editData);

        const settleList = optimisticTransactions.update({ ...updatedTransaction, id: transactionBeingEdited.id });
        const settleSummary = adjustSummary([
            { type: transactionBeingEdited.type, amount: -Number(transactionBeingEdited.amount), date: transactionBeingEdited.date },
            { type: updatedTransaction.type, amount: updatedTransaction.amount, date: updatedTransaction.date },
        ]);

        setIsEditModalOpen(false);
        setEditingTx(null);

        setPopupNotification({
            show: true,
            title: 'Perubahan Disimpan!',
            message: 'Data transaksi berhasil diperbarui.',
            type: 'success',
        });

        putEdit(route('transaksi.update', transactionBeingEdited.id), {
            preserveScroll: true,
            async: true,
            onError: () => {
                setEditingTx(transactionBeingEdited);
                setIsEditModalOpen(true);
                showSaveFailedPopup();
            },
            onFinish: () => {
                settleList();
                settleSummary();
            },
        });
    };

    const [txToDelete, setTxToDelete] = useState(null);

    const handleDelete = (tx) => {
        setTxToDelete(tx);
    };

    const confirmDeleteTx = () => {
        if (!txToDelete) return;

        const transactionBeingDeleted = txToDelete;
        const settleList = optimisticTransactions.remove(transactionBeingDeleted.id);
        const settleSummary = adjustSummary([
            { type: transactionBeingDeleted.type, amount: -Number(transactionBeingDeleted.amount), date: transactionBeingDeleted.date },
        ]);
        setTxToDelete(null);

        setPopupNotification({
            show: true,
            title: 'Transaksi Dihapus',
            message: 'Catatan transaksi telah berhasil dihapus.',
            type: 'info',
        });

        router.delete(route('transaksi.destroy', transactionBeingDeleted.id), {
            preserveScroll: true,
            async: true,
            onFinish: () => {
                settleList();
                settleSummary();
            },
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Transaksi" />
            <div className="max-w-7xl mx-auto px-3.5 py-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 relative">
                
                {/* Pop-up Notification (Toast Banner Pop-up) */}
                {popupNotification.show && (
                    <div className="fixed top-4 inset-x-3 sm:inset-x-auto sm:right-6 sm:top-6 z-50 max-w-sm sm:max-w-md mx-auto sm:mx-0 animate-bounce-in">
                        <div className={`bg-white/95 backdrop-blur-md border rounded-2xl p-3.5 sm:p-4 shadow-[0_12px_36px_rgba(0,0,0,0.12)] flex items-start gap-3 ${popupNotification.type === 'error' ? 'border-rose-200/90' : 'border-emerald-200/90'}`}>
                            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs ${popupNotification.type === 'error' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {popupNotification.type === 'error' ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                    )}
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0 pr-1">
                                <h4 className="text-xs sm:text-sm font-extrabold text-slate-800 leading-snug">
                                    {popupNotification.title}
                                </h4>
                                <p className="text-[11px] sm:text-xs font-medium text-slate-500 mt-0.5 leading-relaxed">
                                    {popupNotification.message}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setPopupNotification(prev => ({ ...prev, show: false }))}
                                className="w-7 h-7 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg flex items-center justify-center shrink-0 transition"
                                aria-label="Tutup notifikasi"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 sm:gap-4 border-b border-slate-100 pb-3 sm:pb-4">
                    <div>
                        <p className="text-[11px] sm:text-xs font-bold text-[#009bd2] uppercase tracking-wider mb-0.5 sm:mb-1">Pencatatan Keuangan</p>
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
                            Transaksi
                        </h1>
                    </div>
                </div>

                {/* Mobile Tab Switcher (Catat Transaksi vs Riwayat) */}
                <div className="sm:hidden">
                    <div className="bg-slate-100/90 p-1 rounded-xl flex items-center gap-1 shadow-2xs">
                        <button
                            type="button"
                            onClick={() => setMobileTab('catat')}
                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                mobileTab === 'catat'
                                    ? 'bg-white text-slate-800 shadow-xs'
                                    : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            <svg className="w-3.5 h-3.5 text-[#009bd2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                            </svg>
                            <span>Catat Transaksi</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setMobileTab('riwayat')}
                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                mobileTab === 'riwayat'
                                    ? 'bg-white text-slate-800 shadow-xs'
                                    : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                            </svg>
                            <span>Riwayat ({visibleTransactions.length})</span>
                        </button>
                    </div>
                </div>

                {/* Summary Cards - Hidden on Mobile (already shown on Home/Dashboard) */}
                <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
                    <div className="bg-emerald-500 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 md:p-6 text-white shadow-md shadow-emerald-500/15 flex flex-col justify-between min-h-[86px] sm:min-h-[110px] relative overflow-hidden group">
                        <div className="flex items-center justify-between gap-1 mb-1">
                            <p className="text-emerald-100 font-bold text-[10px] sm:text-xs tracking-wide uppercase truncate">Pemasukan {currentMonthName}</p>
                            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>
                            </div>
                        </div>
                        <h2 className="text-base sm:text-xl md:text-2xl font-black tracking-tight truncate" title={formatRp(liveSummary.pemasukan)}>{formatRp(liveSummary.pemasukan)}</h2>
                    </div>

                    <div className="bg-rose-500 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 md:p-6 text-white shadow-md shadow-rose-500/15 flex flex-col justify-between min-h-[86px] sm:min-h-[110px] relative overflow-hidden group">
                        <div className="flex items-center justify-between gap-1 mb-1">
                            <p className="text-rose-100 font-bold text-[10px] sm:text-xs tracking-wide uppercase truncate">Pengeluaran {currentMonthName}</p>
                            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>
                            </div>
                        </div>
                        <h2 className="text-base sm:text-xl md:text-2xl font-black tracking-tight truncate" title={formatRp(liveSummary.pengeluaran)}>{formatRp(liveSummary.pengeluaran)}</h2>
                    </div>

                    <div className="rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 md:p-6 text-white shadow-md flex flex-col justify-between min-h-[86px] sm:min-h-[110px] relative overflow-hidden group" style={{ backgroundColor: '#009bd2', boxShadow: '0 8px 20px -3px rgba(0, 155, 210, 0.25)' }}>
                        <div className="flex items-center justify-between gap-1 mb-1">
                            <p className="font-bold text-[10px] sm:text-xs tracking-wide uppercase truncate text-white/90">Ditabung {currentMonthName}</p>
                            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                            </div>
                        </div>
                        <h2 className="text-base sm:text-xl md:text-2xl font-black tracking-tight truncate" title={formatRp(liveSummary.tabungan)}>{formatRp(liveSummary.tabungan)}</h2>
                    </div>

                    <div className="bg-slate-800 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 md:p-6 text-white shadow-md shadow-slate-800/15 flex flex-col justify-between min-h-[86px] sm:min-h-[110px] relative overflow-hidden group">
                        <div className="flex items-center justify-between gap-1 mb-1">
                            <p className="text-slate-300 font-bold text-[10px] sm:text-xs tracking-wide uppercase truncate">Sisa Saldo Aktif</p>
                            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                        </div>
                        <h2 className="text-base sm:text-xl md:text-2xl font-black tracking-tight truncate" title={formatRp(liveSummary.saldo)}>{formatRp(liveSummary.saldo)}</h2>
                    </div>
                </div>

                <style>
                    {`
                        @media (min-width: 1024px) {
                            .desktop-col-span-2 { grid-column: span 2 / span 2; }
                        }
                    `}
                </style>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                    
                    {/* Form Kiri */}
                    <div className={`${mobileTab === 'catat' ? 'block' : 'hidden'} sm:block lg:col-span-1`}>
                        <div className="bg-white rounded-3xl sm:rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
                            <form onSubmit={submit} className="p-4 sm:p-6 md:p-7 flex flex-col gap-4 sm:gap-5">
                                <div>
                                    <h2 className="text-base sm:text-xl font-extrabold text-slate-800 tracking-tight">Catat Transaksi</h2>
                                </div>

                                {/* Jenis Transaksi */}
                                <div>
                                    <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-slate-100/80 rounded-2xl">
                                        {[
                                            { key: 'pemasukan', label: 'Pemasukan', onSelect: () => setData(data => ({...data, type: 'pemasukan', category: pemasukanCategories.length > 0 ? pemasukanCategories[0].id : '', bill_id: '', debt_id: ''})), icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M12 19V5m0 0l-6 6m6-6l6 6" /> },
                                            { key: 'pengeluaran', label: 'Pengeluaran', onSelect: () => setData(data => ({...data, type: 'pengeluaran', category: pengeluaranCategories.length > 0 ? pengeluaranCategories[0].id : '', bill_id: '', debt_id: ''})), icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M12 5v14m0 0l6-6m-6 6l-6-6" /> },
                                            { key: 'tabungan', label: 'Tabungan', onSelect: () => setData(data => ({...data, type: 'tabungan', category: tabunganCategories[0].id, bill_id: '', debt_id: ''})), icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /> },
                                        ].map((option) => {
                                            const isSelected = data.type === option.key;
                                            const optionTheme = TRANSACTION_FORM_THEMES[option.key];
                                            return (
                                                <button
                                                    key={option.key}
                                                    type="button"
                                                    onClick={() => { option.onSelect(); clearErrors('type'); }}
                                                    className={`flex flex-col items-center justify-center gap-1 py-2 sm:py-2.5 min-h-[56px] rounded-xl font-extrabold text-[11px] sm:text-xs transition-all duration-300 ${isSelected ? `bg-white shadow-[0_4px_12px_rgba(15,23,42,0.08)] ${optionTheme.text}` : 'text-slate-500 hover:text-slate-700'}`}
                                                >
                                                    <span className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors duration-300 ${isSelected ? optionTheme.chip : 'bg-slate-200/70 text-slate-500'}`}>
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">{option.icon}</svg>
                                                    </span>
                                                    {option.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {errors.type && <p className="text-red-500 text-[11px] sm:text-xs font-bold mt-1">{errors.type}</p>}
                                </div>

                                {/* Kategori */}
                                <div>
                                    <label className="text-xs sm:text-[13px] font-bold text-slate-600 block mb-1.5">Kategori</label>
                                    <div className="relative">
                                        <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                                        <select
                                            value={data.category}
                                            onChange={e => {
                                                const val = e.target.value;
                                                setData(prev => ({
                                                    ...prev,
                                                    category: val,
                                                    bill_id: val === 'Tagihan Rutin' ? prev.bill_id : '',
                                                    debt_id: val === 'Hutang' ? prev.debt_id : '',
                                                }));
                                            }}
                                            className={`${formFieldClass} ${formTheme.focus} pl-10 pr-10 appearance-none bg-none cursor-pointer`}
                                        >
                                            <option value="" disabled>Pilih Kategori</option>
                                            {(data.type === 'pengeluaran' ? pengeluaranCategories : data.type === 'pemasukan' ? pemasukanCategories : tabunganCategories).map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.label}</option>
                                            ))}
                                        </select>
                                        <svg className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                    {errors.category && <p className="text-red-500 text-[11px] sm:text-xs font-bold mt-1">{errors.category}</p>}
                                </div>

                                {/* Pilih Tagihan Rutin */}
                                {data.type === 'pengeluaran' && data.category === 'Tagihan Rutin' && (
                                    <div>
                                        <label className="text-xs sm:text-[13px] font-bold text-slate-600 block mb-1.5">Tagihan</label>
                                        {availableBillsForInput.length > 0 ? (
                                            <div className="relative">
                                                <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                                <select
                                                    value={data.bill_id}
                                                    onChange={e => {
                                                        const billId = e.target.value;
                                                        const matched = activeBills.find(b => String(b.id) === String(billId));
                                                        setData(prev => ({
                                                            ...prev,
                                                            bill_id: billId,
                                                            ...(matched ? {
                                                                amount: matched.amount,
                                                                title: `Bayar Tagihan ${matched.name}`
                                                            } : {})
                                                        }));
                                                    }}
                                                    className={`${formFieldClass} ${formTheme.focus} pl-10 pr-10 appearance-none bg-none cursor-pointer truncate`}
                                                >
                                                    <option value="">Pilih tagihan</option>
                                                    {availableBillsForInput.map(b => (
                                                        <option key={b.id} value={b.id}>{b.name} · {formatRp(b.amount)}</option>
                                                    ))}
                                                </select>
                                                <svg className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M19 9l-7 7-7-7" /></svg>
                                            </div>
                                        ) : (
                                            <p className="h-12 flex items-center gap-1.5 px-3.5 rounded-2xl bg-slate-50/80 border border-dashed border-slate-200 text-xs font-semibold text-slate-500">
                                                {activeBills.length === 0 ? (
                                                    <>Belum ada tagihan. <Link href={route('tagihan.index')} className="text-[#009bd2] font-bold hover:underline">Tambah</Link></>
                                                ) : 'Semua tagihan bulan ini sudah lunas'}
                                            </p>
                                        )}
                                        {errors.bill_id && <p className="text-red-500 text-[11px] sm:text-xs font-bold mt-1">{errors.bill_id}</p>}
                                    </div>
                                )}

                                {/* Pilih Hutang */}
                                {data.type === 'pengeluaran' && data.category === 'Hutang' && (
                                    <div>
                                        <label className="text-xs sm:text-[13px] font-bold text-slate-600 block mb-1.5">Hutang</label>
                                        {activeDebts.length > 0 ? (
                                            <div className="relative">
                                                <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                                <select
                                                    value={data.debt_id}
                                                    onChange={e => {
                                                        const debtId = e.target.value;
                                                        const matched = activeDebts.find(d => String(d.id) === String(debtId));
                                                        setData(prev => ({
                                                            ...prev,
                                                            debt_id: debtId,
                                                            ...(matched ? {
                                                                amount: matched.remaining_amount || matched.amount,
                                                                title: `Bayar Hutang ${matched.name}`
                                                            } : {})
                                                        }));
                                                    }}
                                                    className={`${formFieldClass} ${formTheme.focus} pl-10 pr-10 appearance-none bg-none cursor-pointer truncate`}
                                                >
                                                    <option value="">Pilih hutang</option>
                                                    {activeDebts.map(d => (
                                                        <option key={d.id} value={d.id}>{d.name} · Sisa {formatRp(d.remaining_amount)}</option>
                                                    ))}
                                                </select>
                                                <svg className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M19 9l-7 7-7-7" /></svg>
                                            </div>
                                        ) : (
                                            <p className="h-12 flex items-center gap-1.5 px-3.5 rounded-2xl bg-slate-50/80 border border-dashed border-slate-200 text-xs font-semibold text-slate-500">
                                                Tidak ada hutang aktif. <Link href={route('hutang-piutang.index')} className="text-rose-600 font-bold hover:underline">Tambah</Link>
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Nominal */}
                                <div className={`rounded-2xl px-4 py-3 sm:py-3.5 border transition-colors duration-300 ${formTheme.panel}`}>
                                    <div className="flex items-center justify-between gap-2">
                                        <label className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Nominal</label>
                                        {selectedBill && (
                                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Nominal mengikuti tagihan"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                        )}
                                    </div>
                                    <div className="flex items-baseline gap-2 mt-0.5">
                                        <span className={`text-lg sm:text-xl font-black ${formTheme.text}`}>Rp</span>
                                        <CurrencyInput
                                            value={data.amount}
                                            onValueChange={val => {
                                                if (!selectedBill) {
                                                    setData('amount', val);
                                                }
                                            }}
                                            readOnly={Boolean(selectedBill)}
                                            disabled={Boolean(selectedBill)}
                                            inputMode="numeric"
                                            placeholder="0"
                                            className={`w-full min-w-0 bg-transparent border-0 p-0 text-3xl sm:text-4xl font-black tracking-tight focus:outline-none focus:ring-0 placeholder:text-slate-300 ${selectedBill ? 'text-slate-500 cursor-not-allowed select-none' : formTheme.text}`}
                                        />
                                    </div>
                                    {errors.amount && <p className="text-red-500 text-[11px] sm:text-xs font-bold mt-1">{errors.amount}</p>}
                                </div>

                                {/* Nama Transaksi */}
                                <div>
                                    <label className="text-xs sm:text-[13px] font-bold text-slate-600 block mb-1.5">Nama Transaksi</label>
                                    <div className="relative">
                                        <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                        <input
                                            type="text"
                                            value={data.title}
                                            onChange={e => setData('title', e.target.value)}
                                            placeholder={data.type === 'pengeluaran' ? 'Makan siang...' : data.type === 'pemasukan' ? 'Gaji bulanan...' : 'Setoran tabungan...'}
                                            className={`${formFieldClass} ${formTheme.focus} pl-10`}
                                        />
                                    </div>
                                    {errors.title && <p className="text-red-500 text-[11px] sm:text-xs font-bold mt-1">{errors.title}</p>}
                                </div>

                                {/* Metode Pembayaran & Tanggal */}
                                <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                                    <div className="min-w-0">
                                        <label className="text-xs sm:text-[13px] font-bold text-slate-600 block mb-1.5">Metode</label>
                                        <div className="relative">
                                            <select
                                                value={data.payment_method}
                                                onChange={e => {
                                                    setData('payment_method', e.target.value);
                                                    clearErrors('payment_method');
                                                }}
                                                className={`${formFieldClass} ${formTheme.focus} pr-9 appearance-none bg-none cursor-pointer truncate`}
                                            >
                                                <option value="" disabled>Pilih Metode</option>
                                                {paymentMethods && paymentMethods.length > 0 ? paymentMethods.map(method => (
                                                    <option key={method} value={method}>{method}</option>
                                                )) : (
                                                    <option value="" disabled>Belum ada metode</option>
                                                )}
                                            </select>
                                            <svg className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                        {errors.payment_method && <p className="text-red-500 text-[11px] sm:text-xs font-bold mt-1">{errors.payment_method}</p>}
                                    </div>
                                    <div className="min-w-0">
                                        <label className="text-xs sm:text-[13px] font-bold text-slate-600 block mb-1.5">Tanggal</label>
                                        <input
                                            type="date"
                                            value={data.date}
                                            onChange={e => setData('date', e.target.value)}
                                            className={`${formFieldClass} ${formTheme.focus}`}
                                        />
                                        {errors.date && <p className="text-red-500 text-[11px] sm:text-xs font-bold mt-1">{errors.date}</p>}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing || isBillSelectionMissing}
                                    className={`w-full flex items-center justify-center gap-2 bg-gradient-to-r ${formTheme.button} text-white min-h-[50px] sm:min-h-[54px] rounded-2xl font-black text-sm sm:text-base tracking-wide shadow-lg transition-all duration-300 hover:brightness-105 active:scale-[0.98] ${processing || isBillSelectionMissing ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                    {processing ? 'Menyimpan...' : 'Simpan Transaksi'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* List Kanan */}
                    <div className={`${mobileTab === 'riwayat' ? 'block' : 'hidden'} sm:block desktop-col-span-2`}>
                        <div className="bg-white rounded-3xl sm:rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 h-full lg:h-[760px] flex flex-col overflow-hidden">
                            <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-3 sm:px-6 sm:pt-6 sm:pb-4 shrink-0">
                                <div className="flex items-center gap-2 min-w-0">
                                    <h2 className="text-base sm:text-xl font-extrabold text-slate-800 tracking-tight truncate">Riwayat <span className="text-slate-400 font-bold">{currentMonthName}</span></h2>
                                    <span className="text-[10px] sm:text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                                        {visibleTransactions.length}
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setMobileTab('catat')}
                                    className="sm:hidden h-9 px-3.5 rounded-full bg-[#009bd2] text-white font-bold text-xs flex items-center gap-1.5 active:scale-95 shadow-sm shadow-[#009bd2]/30 shrink-0 transition"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/>
                                    </svg>
                                    <span>Catat</span>
                                </button>
                            </div>

                            <div className="overflow-y-auto flex-1 min-h-0 px-2 sm:px-4 pb-2">
                                {transactionDateGroups.length > 0 ? transactionDateGroups.map((group) => (
                                    <section key={group.date} className="mb-2">
                                        {/* Date header with that day's net total */}
                                        <div className="sticky top-0 z-[1] bg-white/95 backdrop-blur-sm flex items-center justify-between px-2 sm:px-3 py-2">
                                            <span className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">{group.label}</span>
                                            <span className={`text-[11px] sm:text-xs font-bold tabular-nums ${group.net >= 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                                                {group.net >= 0 ? '+' : '-'}{formatRp(Math.abs(group.net))}
                                            </span>
                                        </div>

                                        <ul className="divide-y divide-slate-100">
                                            {group.items.map((item) => {
                                                const itemTheme = TRANSACTION_FORM_THEMES[item.type] || TRANSACTION_FORM_THEMES.pengeluaran;
                                                return (
                                                    <li key={item.id} className={`group flex items-center gap-3 px-2 sm:px-3 py-3 rounded-2xl hover:bg-slate-50/80 transition-colors ${item.isOptimistic ? 'opacity-60 pointer-events-none' : ''}`}>
                                                        <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center shrink-0 ${itemTheme.soft}`}>
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
                                                            {/* Long names wrap to two lines instead of being cut to one; full name on hover */}
                                                            <h3 className="text-[13px] sm:text-[15px] font-bold text-slate-800 leading-snug line-clamp-2 break-words" title={item.title}>{item.title}</h3>
                                                            <p className="text-[11px] sm:text-xs font-medium text-slate-400 truncate mt-0.5">
                                                                {[item.category, item.payment_method].filter(Boolean).join(' · ')}
                                                            </p>
                                                        </div>

                                                        <p className={`text-[13px] sm:text-base font-extrabold tracking-tight tabular-nums shrink-0 ${item.type === 'pemasukan' ? 'text-emerald-600' : 'text-slate-800'}`}>
                                                            {item.type === 'pemasukan' ? '+' : '-'}{formatRp(item.amount)}
                                                        </p>

                                                        {/* Subtle actions: always reachable on touch, revealed on hover on desktop */}
                                                        <div className="flex items-center shrink-0 -mr-1 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                                            <button
                                                                type="button"
                                                                onClick={() => openEditModal(item)}
                                                                className="w-8 h-8 rounded-full text-slate-300 hover:text-[#009bd2] hover:bg-[#009bd2]/10 flex items-center justify-center transition active:scale-90"
                                                                title="Edit Transaksi"
                                                                aria-label="Edit Transaksi"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                                                                </svg>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDelete(item)}
                                                                className="w-8 h-8 rounded-full text-slate-300 hover:text-rose-500 hover:bg-rose-50 flex items-center justify-center transition active:scale-90"
                                                                title="Hapus Transaksi"
                                                                aria-label="Hapus Transaksi"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </section>
                                )) : (
                                    <div className="h-full min-h-[240px] flex flex-col items-center justify-center text-center px-6">
                                        <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                                            <svg className="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                                        </div>
                                        <p className="text-slate-500 font-bold text-sm">Belum ada transaksi</p>
                                    </div>
                                )}
                            </div>

                            {visibleTransactions.length > 0 && (
                                <div className="px-4 py-3 sm:px-6 border-t border-slate-100 shrink-0">
                                    <Link
                                        href={route('transaksi.history')}
                                        className="text-xs sm:text-sm font-bold text-[#009bd2] hover:text-[#0086b6] flex items-center justify-center gap-1.5 transition"
                                    >
                                        <span>Lihat semua riwayat</span>
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/>
                                        </svg>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Edit Transaksi */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => { resetEdit(); setIsEditModalOpen(false); setEditingTx(null); }}
                title="Edit Transaksi"
                subtitle="Perbarui catatan keuangan Anda."
                maxWidth="md"
            >
                <form onSubmit={submitEdit}>
                            
                            <div className="space-y-3 sm:space-y-4">
                                <div>
                                    <label className="text-xs sm:text-sm font-bold text-slate-700 block mb-1.5 sm:mb-2">Jenis Transaksi</label>
                                    <div className="flex bg-slate-100/80 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl items-center gap-1">
                                        <button 
                                            type="button"
                                            onClick={() => setEditData(data => ({...data, type: 'pemasukan', category: pemasukanCategories.length > 0 ? pemasukanCategories[0].id : '', bill_id: '', debt_id: ''}))}
                                            className={`flex-1 py-1.5 sm:py-2 px-1.5 sm:px-2 rounded-lg sm:rounded-xl font-extrabold text-[11px] sm:text-xs tracking-wide transition-all duration-300 ${editData.type === 'pemasukan' ? 'bg-white text-emerald-600 shadow-[0_2px_8px_rgba(0,0,0,0.06)]' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            Pemasukan
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => setEditData(data => ({...data, type: 'pengeluaran', category: pengeluaranCategories.length > 0 ? pengeluaranCategories[0].id : '', bill_id: '', debt_id: ''}))}
                                            className={`flex-1 py-1.5 sm:py-2 px-1.5 sm:px-2 rounded-lg sm:rounded-xl font-extrabold text-[11px] sm:text-xs tracking-wide transition-all duration-300 ${editData.type === 'pengeluaran' ? 'bg-white text-rose-600 shadow-[0_2px_8px_rgba(0,0,0,0.06)]' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            Pengeluaran
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => setEditData(data => ({...data, type: 'tabungan', category: tabunganCategories[0].id, bill_id: '', debt_id: ''}))}
                                            className={`flex-1 py-1.5 sm:py-2 px-1.5 sm:px-2 rounded-lg sm:rounded-xl font-extrabold text-[11px] sm:text-xs tracking-wide transition-all duration-300 ${editData.type === 'tabungan' ? 'bg-white text-[#009bd2] shadow-[0_2px_8px_rgba(0,0,0,0.06)]' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            Tabungan
                                        </button>
                                    </div>
                                    {editErrors.type && <p className="text-red-500 text-[11px] sm:text-xs font-bold mt-1">{editErrors.type}</p>}
                                </div>

                                <div>
                                    <label className="text-xs sm:text-sm font-bold text-slate-700 block mb-1.5 sm:mb-2">Kategori</label>
                                    <select 
                                        value={editData.category}
                                        onChange={e => {
                                            const val = e.target.value;
                                            setEditData(prev => ({
                                                ...prev,
                                                category: val,
                                                bill_id: val === 'Tagihan Rutin' ? prev.bill_id : '',
                                                debt_id: val === 'Hutang' ? prev.debt_id : '',
                                            }));
                                        }}
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2 sm:px-4 sm:py-2.5 focus:outline-none focus:border-[#009bd2] focus:ring-1 focus:ring-[#009bd2] focus:bg-white transition-colors text-xs sm:text-sm font-bold cursor-pointer"
                                    >
                                        <option value="" disabled>Pilih Kategori</option>
                                        {(editData.type === 'pengeluaran' ? pengeluaranCategories : editData.type === 'pemasukan' ? pemasukanCategories : tabunganCategories).map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.label}</option>
                                        ))}
                                    </select>
                                    {editErrors.category && <p className="text-red-500 text-[11px] sm:text-xs mt-1 font-bold">{editErrors.category}</p>}
                                </div>

                                {/* Dropdown Tambahan Ketika Pilih Kategori Tagihan Rutin di Edit Modal */}
                                {editData.type === 'pengeluaran' && editData.category === 'Tagihan Rutin' && (
                                    <div className="p-3 bg-sky-50/70 border border-sky-100 rounded-xl space-y-2">
                                        <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                                            <span>Pilih Tagihan Rutin</span>
                                            {availableBillsForEdit.length > 0 && (
                                                <span className="text-[10px] font-extrabold text-[#009bd2] bg-white border border-sky-200/60 px-2 py-0.5 rounded-full">
                                                    {availableBillsForEdit.length} Tagihan
                                                </span>
                                            )}
                                        </label>
                                        <select 
                                            value={editData.bill_id}
                                            onChange={e => {
                                                const billId = e.target.value;
                                                const matched = activeBills.find(b => String(b.id) === String(billId));
                                                setEditData(prev => ({
                                                    ...prev,
                                                    bill_id: billId,
                                                    ...(matched ? {
                                                        amount: matched.amount,
                                                        title: prev.title && !prev.title.startsWith('Bayar Tagihan ') ? prev.title : `Bayar Tagihan ${matched.name}`
                                                    } : {})
                                                }));
                                            }}
                                            className="w-full bg-white border border-sky-200 text-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold focus:outline-none focus:border-[#009bd2]"
                                        >
                                            <option value="">-- Pilih Tagihan Rutin --</option>
                                            {availableBillsForEdit.map(b => (
                                                <option key={b.id} value={b.id}>
                                                    {b.name} - {formatRp(b.amount)} {b.due_day ? `(Tgl ${b.due_day})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                        {activeBills.length === 0 && (
                                            <p className="text-[11px] sm:text-xs font-semibold text-slate-500">
                                                Belum ada tagihan. <Link href={route('tagihan.index')} className="text-[#009bd2] font-bold hover:underline">Tambah</Link>
                                            </p>
                                        )}
                                        {editErrors.bill_id && <p className="text-red-500 text-[11px] sm:text-xs mt-1 font-bold">{editErrors.bill_id}</p>}
                                    </div>
                                )}

                                {/* Dropdown Tambahan Ketika Pilih Kategori Hutang di Edit Modal */}
                                {editData.type === 'pengeluaran' && editData.category === 'Hutang' && (
                                    <div className="p-3 bg-rose-50/70 border border-rose-100 rounded-xl space-y-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 shrink-0">
                                                <svg className="w-4 h-4 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                                </svg>
                                                <span>Pilih Hutang</span>
                                            </label>
                                            {activeDebts.length > 0 && (
                                                <span className="text-[10px] font-extrabold text-rose-600 bg-white border border-rose-200/80 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
                                                    {activeDebts.length} Belum Lunas
                                                </span>
                                            )}
                                        </div>
                                        <select 
                                            value={editData.debt_id}
                                            onChange={e => {
                                                const debtId = e.target.value;
                                                const matched = activeDebts.find(d => String(d.id) === String(debtId));
                                                setEditData(prev => ({
                                                    ...prev,
                                                    debt_id: debtId,
                                                    ...(matched ? {
                                                        amount: matched.remaining_amount || matched.amount,
                                                        title: prev.title && !prev.title.startsWith('Bayar Hutang ') ? prev.title : `Bayar Hutang ${matched.name}`
                                                    } : {})
                                                }));
                                            }}
                                            className="w-full bg-white border border-rose-200 text-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold focus:outline-none focus:border-rose-400 truncate"
                                        >
                                            <option value="">-- Pilih Data Hutang --</option>
                                            {activeDebts.map(d => (
                                                <option key={d.id} value={d.id}>
                                                    {d.name} • Sisa {formatRp(d.remaining_amount)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div>
                                    <label className="text-xs sm:text-sm font-bold text-slate-700 block mb-1.5 sm:mb-2">Metode Pembayaran</label>
                                    <select 
                                        value={editData.payment_method}
                                        onChange={e => setEditData('payment_method', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2 sm:px-4 sm:py-2.5 focus:outline-none focus:border-[#009bd2] focus:ring-1 focus:ring-[#009bd2] focus:bg-white transition-colors text-xs sm:text-sm font-bold cursor-pointer"
                                    >
                                        <option value="" disabled>Pilih Metode Pembayaran</option>
                                        {paymentMethods && paymentMethods.length > 0 ? paymentMethods.map(method => (
                                            <option key={method} value={method}>{method}</option>
                                        )) : (
                                            <option value="" disabled>Belum ada metode</option>
                                        )}
                                    </select>
                                    {editErrors.payment_method && <p className="text-red-500 text-[11px] sm:text-xs mt-1 font-bold">{editErrors.payment_method}</p>}
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                                        <label className="text-xs sm:text-sm font-bold text-slate-700">Nominal</label>
                                        {editSelectedBill && (
                                            <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded-md">
                                                <svg className="w-3 h-3 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                </svg>
                                                Nominal Terkunci ({editSelectedBill.name})
                                            </span>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-2 sm:left-4 sm:top-2.5 text-slate-500 font-bold text-xs sm:text-sm">Rp</span>
                                        <CurrencyInput 
                                            value={editData.amount}
                                            onValueChange={val => {
                                                if (!editSelectedBill) {
                                                    setEditData('amount', val);
                                                }
                                            }}
                                            readOnly={Boolean(editSelectedBill)}
                                            disabled={Boolean(editSelectedBill)}
                                            className={`w-full rounded-xl pl-10 sm:pl-12 pr-3.5 py-2 sm:py-2.5 font-bold transition-colors text-xs sm:text-sm ${
                                                editSelectedBill
                                                    ? 'bg-slate-100/90 border border-slate-200 text-slate-600 cursor-not-allowed select-none focus:outline-none'
                                                    : 'bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#009bd2] focus:ring-1 focus:ring-[#009bd2] focus:bg-white'
                                            }`} 
                                        />
                                    </div>
                                    {editSelectedBill && (
                                        <p className="text-[11px] text-amber-600 font-medium mt-1 flex items-center gap-1">
                                            <svg className="w-3 h-3 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                            <span>Nominal terkunci sesuai tagihan <strong>{editSelectedBill.name}</strong> ({formatRp(editSelectedBill.amount)}).</span>
                                        </p>
                                    )}
                                    {editErrors.amount && <p className="text-red-500 text-[11px] sm:text-xs mt-1 font-bold">{editErrors.amount}</p>}
                                </div>

                                <div>
                                    <label className="text-xs sm:text-sm font-bold text-slate-700 block mb-1.5 sm:mb-2">Nama Transaksi</label>
                                    <input 
                                        type="text" 
                                        value={editData.title}
                                        onChange={e => setEditData('title', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2 sm:px-4 sm:py-2.5 focus:outline-none focus:border-[#009bd2] focus:ring-1 focus:ring-[#009bd2] focus:bg-white transition-colors text-xs sm:text-sm font-bold" 
                                    />
                                    {editErrors.title && <p className="text-red-500 text-[11px] sm:text-xs mt-1 font-bold">{editErrors.title}</p>}
                                </div>

                                <div>
                                    <label className="text-xs sm:text-sm font-bold text-slate-700 block mb-1.5 sm:mb-2">Tanggal</label>
                                    <input 
                                        type="date" 
                                        value={editData.date}
                                        onChange={e => setEditData('date', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2 sm:px-4 sm:py-2.5 focus:outline-none focus:border-[#009bd2] focus:ring-1 focus:ring-[#009bd2] focus:bg-white transition-colors text-xs sm:text-sm font-bold" 
                                    />
                                    {editErrors.date && <p className="text-red-500 text-[11px] sm:text-xs mt-1 font-bold">{editErrors.date}</p>}
                                </div>
                            </div>

                            <div className="mt-6 sm:mt-8 flex gap-2.5 sm:gap-3">
                                <Button 
                                    variant="secondary"
                                    onClick={() => { resetEdit(); setIsEditModalOpen(false); setEditingTx(null); }} 
                                    className="flex-1 !py-2.5 sm:!py-3"
                                >
                                    Batal
                                </Button>
                                <Button 
                                    type="submit" 
                                    loading={editProcessing}
                                    disabled={isEditBillSelectionMissing}
                                    className={`flex-1 !py-2.5 sm:!py-3 ${editData.type === 'pengeluaran' ? '!bg-rose-500 hover:!bg-rose-600' : '!bg-emerald-500 hover:!bg-emerald-600'}`}
                                >
                                    Simpan Perubahan
                                </Button>
                            </div>
                        </form>
            </Modal>

            {/* MODAL: KONFIRMASI HAPUS TRANSAKSI */}
            <DeleteConfirmModal
                isOpen={!!txToDelete}
                onClose={() => setTxToDelete(null)}
                onConfirm={confirmDeleteTx}
                title="Hapus Transaksi"
                subtitle="Tindakan ini tidak dapat dibatalkan."
                itemTitle={txToDelete?.title}
                itemSubtitle={txToDelete ? `${txToDelete.date_formatted || txToDelete.date} • ${txToDelete.category}` : ''}
                itemExtra={txToDelete ? formatRp(txToDelete.amount) : ''}
                message="Catatan transaksi ini akan dihapus secara permanen dari riwayat keuangan Anda."
                confirmText="Hapus Transaksi"
            />
            
            {/* Simple animation keyframes */}
            <style jsx>{`
                .animate-fade-in {
                    animation: fadeIn 0.4s ease-out forwards;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </AuthenticatedLayout>
    );
}
