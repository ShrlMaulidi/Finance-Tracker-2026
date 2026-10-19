import React, { useState, useEffect } from 'react';
import { Head, useForm, router, usePage, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Dropdown from '@/Components/Dropdown';
import CurrencyInput from '@/Components/CurrencyInput';
import { ActionButtons, Modal, Button, DeleteConfirmModal } from '@/Components/UI';

export default function Index({ transactions, summary, currentMonthName, targets, pemasukanCategories, pengeluaranCategories, paymentMethods, activeBills = [], activeDebts = [] }) {
    const { flash } = usePage().props;
    const formatRp = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);


    const tabunganCategories = targets && targets.length > 0 
        ? targets.map(t => ({ id: t.name, label: t.name })) 
        : [{ id: '', label: 'Belum ada target tabungan' }];

    const { data, setData, post, processing, reset, errors, clearErrors } = useForm({
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

    const selectedBill = data.type === 'pengeluaran' && data.category === 'Tagihan Rutin'
        ? (activeBills.find(b => String(b.id) === String(data.bill_id)) || null)
        : null;

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

    // Listen to flash messages from Inertia
    useEffect(() => {
        if (flash?.success) {
            setPopupNotification({
                show: true,
                title: 'Transaksi Berhasil!',
                message: flash.success,
                type: 'success',
            });
        }
    }, [flash?.success]);

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

    const submit = (e) => {
        e.preventDefault();
        const currentTitle = data.title;
        const currentAmount = data.amount;
        const currentType = data.type;

        post(route('transaksi.store'), {
            preserveScroll: true,
            onSuccess: () => {
                reset('amount', 'category', 'bill_id', 'debt_id', 'title', 'description', 'payment_method');
                if (typeof window !== 'undefined' && window.innerWidth < 640) {
                    setMobileTab('riwayat');
                }
                setPopupNotification({
                    show: true,
                    title: 'Transaksi Berhasil Dicatat! 🎉',
                    message: currentTitle 
                        ? `${currentType === 'pengeluaran' ? 'Pengeluaran' : currentType === 'pemasukan' ? 'Pemasukan' : 'Tabungan'} "${currentTitle}" sebesar ${formatRp(currentAmount)} telah tersimpan.`
                        : 'Catatan transaksi telah berhasil disimpan ke pembukuan.',
                    type: 'success',
                });
            },
        });
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
        putEdit(route('transaksi.update', editingTx.id), {
            preserveScroll: true,
            onSuccess: () => {
                setIsEditModalOpen(false);
                setEditingTx(null);
                resetEdit();
                setPopupNotification({
                    show: true,
                    title: 'Perubahan Disimpan!',
                    message: 'Data transaksi berhasil diperbarui.',
                    type: 'success',
                });
            }
        });
    };

    const [txToDelete, setTxToDelete] = useState(null);
    const [isDeletingTx, setIsDeletingTx] = useState(false);

    const handleDelete = (tx) => {
        setTxToDelete(tx);
    };

    const confirmDeleteTx = () => {
        if (!txToDelete) return;

        router.delete(route('transaksi.destroy', txToDelete.id), {
            preserveScroll: true,
            onStart: () => setIsDeletingTx(true),
            onSuccess: () => {
                setTxToDelete(null);
                setPopupNotification({
                    show: true,
                    title: 'Transaksi Dihapus',
                    message: 'Catatan transaksi telah berhasil dihapus.',
                    type: 'info',
                });
            },
            onFinish: () => {
                setIsDeletingTx(false);
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
                        <div className="bg-white/95 backdrop-blur-md border border-emerald-200/90 rounded-2xl p-3.5 sm:p-4 shadow-[0_12px_36px_rgba(0,0,0,0.12)] flex items-start gap-3">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 shadow-2xs">
                                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
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
                            <span>Riwayat ({transactions.length})</span>
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
                        <h2 className="text-base sm:text-xl md:text-2xl font-black tracking-tight truncate" title={formatRp(summary.pemasukan)}>{formatRp(summary.pemasukan)}</h2>
                    </div>

                    <div className="bg-rose-500 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 md:p-6 text-white shadow-md shadow-rose-500/15 flex flex-col justify-between min-h-[86px] sm:min-h-[110px] relative overflow-hidden group">
                        <div className="flex items-center justify-between gap-1 mb-1">
                            <p className="text-rose-100 font-bold text-[10px] sm:text-xs tracking-wide uppercase truncate">Pengeluaran {currentMonthName}</p>
                            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>
                            </div>
                        </div>
                        <h2 className="text-base sm:text-xl md:text-2xl font-black tracking-tight truncate" title={formatRp(summary.pengeluaran)}>{formatRp(summary.pengeluaran)}</h2>
                    </div>

                    <div className="rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 md:p-6 text-white shadow-md flex flex-col justify-between min-h-[86px] sm:min-h-[110px] relative overflow-hidden group" style={{ backgroundColor: '#009bd2', boxShadow: '0 8px 20px -3px rgba(0, 155, 210, 0.25)' }}>
                        <div className="flex items-center justify-between gap-1 mb-1">
                            <p className="font-bold text-[10px] sm:text-xs tracking-wide uppercase truncate text-white/90">Ditabung {currentMonthName}</p>
                            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                            </div>
                        </div>
                        <h2 className="text-base sm:text-xl md:text-2xl font-black tracking-tight truncate" title={formatRp(summary.tabungan)}>{formatRp(summary.tabungan)}</h2>
                    </div>

                    <div className="bg-slate-800 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 md:p-6 text-white shadow-md shadow-slate-800/15 flex flex-col justify-between min-h-[86px] sm:min-h-[110px] relative overflow-hidden group">
                        <div className="flex items-center justify-between gap-1 mb-1">
                            <p className="text-slate-300 font-bold text-[10px] sm:text-xs tracking-wide uppercase truncate">Sisa Saldo Aktif</p>
                            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                        </div>
                        <h2 className="text-base sm:text-xl md:text-2xl font-black tracking-tight truncate" title={formatRp(summary.saldo)}>{formatRp(summary.saldo)}</h2>
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
                        <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-100 flex flex-col">
                            <h2 className="text-base sm:text-xl font-extrabold text-slate-800 mb-4 sm:mb-6 flex items-center gap-2.5 sm:gap-3 shrink-0">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#009bd2]/10 text-[#009bd2] flex items-center justify-center shrink-0">
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/></svg>
                                </div>
                                Catat Transaksi
                            </h2>
                            
                            <form onSubmit={submit} className="space-y-3 sm:space-y-4">
                                <div>
                                    <label className="text-xs sm:text-[13px] font-bold text-slate-600 block mb-1.5 sm:mb-2">Jenis Transaksi</label>
                                    <div className="flex bg-slate-100/80 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl items-center gap-1">
                                        <button 
                                            type="button"
                                            onClick={() => { setData(data => ({...data, type: 'pemasukan', category: pemasukanCategories.length > 0 ? pemasukanCategories[0].id : '', bill_id: '', debt_id: ''})); clearErrors('type'); }}
                                            className={`flex-1 py-2 sm:py-2.5 px-1 sm:px-2 min-h-[40px] rounded-lg sm:rounded-xl font-extrabold text-[11px] sm:text-xs tracking-wide transition-all duration-300 ${data.type === 'pemasukan' ? 'bg-white text-emerald-600 shadow-[0_2px_8px_rgba(0,0,0,0.06)]' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            Pemasukan
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => { setData(data => ({...data, type: 'pengeluaran', category: pengeluaranCategories.length > 0 ? pengeluaranCategories[0].id : '', bill_id: '', debt_id: ''})); clearErrors('type'); }}
                                            className={`flex-1 py-2 sm:py-2.5 px-1 sm:px-2 min-h-[40px] rounded-lg sm:rounded-xl font-extrabold text-[11px] sm:text-xs tracking-wide transition-all duration-300 ${data.type === 'pengeluaran' ? 'bg-white text-rose-600 shadow-[0_2px_8px_rgba(0,0,0,0.06)]' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            Pengeluaran
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => { setData(data => ({...data, type: 'tabungan', category: tabunganCategories[0].id, bill_id: '', debt_id: ''})); clearErrors('type'); }}
                                            className={`flex-1 py-2 sm:py-2.5 px-1 sm:px-2 min-h-[40px] rounded-lg sm:rounded-xl font-extrabold text-[11px] sm:text-xs tracking-wide transition-all duration-300 ${data.type === 'tabungan' ? 'bg-white text-[#009bd2] shadow-[0_2px_8px_rgba(0,0,0,0.06)]' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            Tabungan
                                        </button>
                                    </div>
                                    {errors.type && <p className="text-red-500 text-[11px] sm:text-xs font-bold mt-1">{errors.type}</p>}
                                </div>

                                <div>
                                    <label className="text-xs sm:text-[13px] font-bold text-slate-600 block mb-1.5 sm:mb-2">Kategori</label>
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
                                        className="w-full bg-slate-50 border-2 border-slate-100 text-slate-800 rounded-xl sm:rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 min-h-[44px] focus:outline-none focus:ring-0 focus:border-[#009bd2] focus:bg-white font-bold transition-all text-xs sm:text-sm cursor-pointer"
                                    >
                                        <option value="" disabled>Pilih Kategori</option>
                                        {(data.type === 'pengeluaran' ? pengeluaranCategories : data.type === 'pemasukan' ? pemasukanCategories : tabunganCategories).map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.label}</option>
                                        ))}
                                    </select>
                                    {errors.category && <p className="text-red-500 text-[11px] sm:text-xs font-bold mt-1">{errors.category}</p>}
                                </div>

                                {/* Dropdown Tambahan Ketika Pilih Kategori Tagihan Rutin */}
                                {data.type === 'pengeluaran' && data.category === 'Tagihan Rutin' && (
                                    <div className="p-3.5 bg-sky-50/70 border border-sky-100 rounded-xl sm:rounded-2xl space-y-2 transition-all">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs sm:text-[13px] font-bold text-slate-700 flex items-center gap-1.5">
                                                <svg className="w-4 h-4 text-[#009bd2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                </svg>
                                                <span>Pilih Tagihan Rutin <span className="text-rose-500">*</span></span>
                                            </label>
                                            {availableBillsForInput.length > 0 && (
                                                <span className="text-[10px] font-extrabold text-[#009bd2] bg-white border border-sky-200/60 px-2 py-0.5 rounded-full shadow-2xs">
                                                    {availableBillsForInput.length} Belum Lunas
                                                </span>
                                            )}
                                        </div>

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
                                            disabled={availableBillsForInput.length === 0}
                                            className="w-full bg-white border-2 border-sky-200/80 text-slate-800 rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3 min-h-[44px] focus:outline-none focus:ring-0 focus:border-[#009bd2] font-bold transition-all text-xs sm:text-sm cursor-pointer shadow-2xs disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                                        >
                                            <option value="">
                                                {availableBillsForInput.length === 0 ? '-- Semua Tagihan Periode Ini Sudah Lunas --' : '-- Pilih Tagihan Rutin --'}
                                            </option>
                                            {availableBillsForInput.map(b => (
                                                <option key={b.id} value={b.id}>
                                                    {b.name} - {formatRp(b.amount)} {b.due_day ? `(Jatuh tempo tgl ${b.due_day})` : ''}
                                                </option>
                                            ))}
                                        </select>

                                        {availableBillsForInput.length === 0 ? (
                                            activeBills.length === 0 ? (
                                                <p className="text-[11px] text-amber-700 font-medium flex items-center gap-1.5 pt-1">
                                                    <svg className="w-3.5 h-3.5 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                    </svg>
                                                    <span>Belum ada data tagihan rutin.</span>
                                                    <Link href={route('tagihan.index')} className="text-[#009bd2] font-bold underline hover:text-[#0086b6]">
                                                        Tambah Tagihan
                                                    </Link>
                                                </p>
                                            ) : (
                                                <div className="p-2.5 bg-emerald-50/90 border border-emerald-200/80 rounded-xl text-emerald-800 text-[11px] font-semibold flex items-center gap-2">
                                                    <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <span>Semua tagihan rutin untuk periode ini sudah lunas!</span>
                                                </div>
                                            )
                                        ) : (
                                            <p className="text-[11px] text-slate-500 font-medium">
                                                Hanya menampilkan tagihan rutin yang belum lunas pada periode ini.
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Dropdown Tambahan Ketika Pilih Kategori Hutang */}
                                {data.type === 'pengeluaran' && data.category === 'Hutang' && (
                                    <div className="p-3.5 bg-rose-50/70 border border-rose-100 rounded-xl sm:rounded-2xl space-y-2 transition-all">
                                        <div className="flex items-center justify-between gap-2">
                                            <label className="text-xs sm:text-[13px] font-bold text-slate-700 flex items-center gap-1.5 shrink-0">
                                                <svg className="w-4 h-4 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                                </svg>
                                                <span>Pilih Hutang</span>
                                            </label>
                                            {activeDebts.length > 0 && (
                                                <span className="text-[10px] font-extrabold text-rose-600 bg-white border border-rose-200/80 px-2 py-0.5 rounded-full shadow-2xs whitespace-nowrap shrink-0">
                                                    {activeDebts.length} Belum Lunas
                                                </span>
                                            )}
                                        </div>

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
                                            disabled={activeDebts.length === 0}
                                            className="w-full bg-white border-2 border-rose-200/80 text-slate-800 rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3 min-h-[44px] focus:outline-none focus:ring-0 focus:border-rose-400 font-bold transition-all text-xs sm:text-sm cursor-pointer shadow-2xs disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed truncate"
                                        >
                                            <option value="">
                                                {activeDebts.length === 0 ? '-- Tidak Ada Hutang Belum Lunas --' : '-- Pilih Data Hutang --'}
                                            </option>
                                            {activeDebts.map(d => (
                                                <option key={d.id} value={d.id}>
                                                    {d.name} • Sisa {formatRp(d.remaining_amount)}
                                                </option>
                                            ))}
                                        </select>

                                        {activeDebts.length === 0 && (
                                            <p className="text-[11px] text-amber-700 font-medium flex items-center gap-1.5 pt-1">
                                                <svg className="w-3.5 h-3.5 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                </svg>
                                                <span>Belum ada hutang aktif yang belum lunas.</span>
                                                <Link href={route('hutang-piutang.index')} className="text-rose-600 font-bold underline hover:text-rose-700">
                                                    Tambah Hutang
                                                </Link>
                                            </p>
                                        )}
                                    </div>
                                )}

                                <div>
                                    <label className="text-xs sm:text-[13px] font-bold text-slate-600 block mb-1.5 sm:mb-2">Metode Pembayaran</label>
                                    <select 
                                        value={data.payment_method}
                                        onChange={e => setData('payment_method', e.target.value)}
                                        className="w-full bg-slate-50 border-2 border-slate-100 text-slate-800 rounded-xl sm:rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 min-h-[44px] focus:outline-none focus:ring-0 focus:border-[#009bd2] focus:bg-white font-bold transition-all text-xs sm:text-sm cursor-pointer"
                                    >
                                        <option value="" disabled>Pilih Metode Pembayaran</option>
                                        {paymentMethods && paymentMethods.length > 0 ? paymentMethods.map(method => (
                                            <option key={method} value={method}>{method}</option>
                                        )) : (
                                            <option value="" disabled>Belum ada metode</option>
                                        )}
                                    </select>
                                    {errors.payment_method && <p className="text-red-500 text-[11px] sm:text-xs font-bold mt-1">{errors.payment_method}</p>}
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                                        <label className="text-xs sm:text-[13px] font-bold text-slate-600">Nominal</label>
                                        {selectedBill && (
                                            <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded-md">
                                                <svg className="w-3 h-3 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                </svg>
                                                Nominal Terkunci ({selectedBill.name})
                                            </span>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-2.5 sm:left-4 sm:top-3.5 text-slate-400 font-extrabold text-xs sm:text-sm">Rp</span>
                                        <CurrencyInput 
                                            value={data.amount}
                                            onValueChange={val => {
                                                if (!selectedBill) {
                                                    setData('amount', val);
                                                }
                                            }}
                                            readOnly={Boolean(selectedBill)}
                                            disabled={Boolean(selectedBill)}
                                            placeholder="50000" 
                                            className={`w-full border-2 rounded-xl sm:rounded-2xl pl-10 sm:pl-12 pr-3.5 py-2.5 sm:py-3 min-h-[44px] font-black text-sm sm:text-base transition-all ${
                                                selectedBill
                                                    ? 'bg-slate-100/90 border-slate-200 text-slate-600 cursor-not-allowed select-none focus:outline-none'
                                                    : 'bg-slate-50 border-slate-100 text-slate-800 focus:outline-none focus:ring-0 focus:border-[#009bd2] focus:bg-white'
                                            }`} 
                                        />
                                    </div>
                                    {selectedBill && (
                                        <p className="text-[11px] text-amber-600 font-medium mt-1 flex items-center gap-1">
                                            <svg className="w-3 h-3 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                            <span>Nominal terkunci sesuai tagihan <strong>{selectedBill.name}</strong> ({formatRp(selectedBill.amount)}).</span>
                                        </p>
                                    )}
                                    {errors.amount && <p className="text-red-500 text-[11px] sm:text-xs font-bold mt-1">{errors.amount}</p>}
                                </div>

                                <div>
                                    <label className="text-xs sm:text-[13px] font-bold text-slate-600 block mb-1.5 sm:mb-2">Nama Transaksi</label>
                                    <input 
                                        type="text" 
                                        value={data.title}
                                        onChange={e => setData('title', e.target.value)}
                                        placeholder={data.type === 'pengeluaran' ? 'Makan siang...' : 'Gaji bulanan...'}
                                        className="w-full bg-slate-50 border-2 border-slate-100 text-slate-800 rounded-xl sm:rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 min-h-[44px] focus:outline-none focus:ring-0 focus:border-[#009bd2] focus:bg-white font-bold transition-all text-xs sm:text-sm" 
                                    />
                                    {errors.title && <p className="text-red-500 text-[11px] sm:text-xs font-bold mt-1">{errors.title}</p>}
                                </div>

                                <div>
                                    <label className="text-xs sm:text-[13px] font-bold text-slate-600 block mb-1.5 sm:mb-2">Tanggal</label>
                                    <input 
                                        type="date" 
                                        value={data.date}
                                        onChange={e => setData('date', e.target.value)}
                                        className="w-full bg-slate-50 border-2 border-slate-100 text-slate-800 rounded-xl sm:rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 min-h-[44px] focus:outline-none focus:ring-0 focus:border-[#009bd2] focus:bg-white font-bold transition-all text-xs sm:text-sm" 
                                    />
                                    {errors.date && <p className="text-red-500 text-[11px] sm:text-xs font-bold mt-1">{errors.date}</p>}
                                </div>

                                <button 
                                    type="submit"
                                    disabled={processing}
                                    className={`w-full ${data.type === 'pengeluaran' ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/25' : data.type === 'pemasukan' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/25' : ''} text-white py-3 sm:py-3.5 min-h-[46px] sm:min-h-[50px] rounded-xl sm:rounded-2xl font-black text-sm sm:text-base transition-all shadow-md active:scale-[0.99] mt-2 ${processing ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    style={data.type === 'tabungan' ? { backgroundColor: '#009bd2', boxShadow: '0 8px 16px -3px rgba(0, 155, 210, 0.25)' } : {}}
                                >
                                    {processing ? 'Menyimpan...' : 'Simpan Transaksi'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* List Kanan */}
                    <div className={`${mobileTab === 'riwayat' ? 'block' : 'hidden'} sm:block desktop-col-span-2`}>
                        <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-100 h-full lg:h-[760px] flex flex-col">
                            <div className="flex items-center justify-between gap-2 mb-3 sm:mb-6 shrink-0">
                                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>
                                    </div>
                                    <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                                        <h2 className="text-sm sm:text-xl font-extrabold text-slate-800 truncate">
                                            Riwayat Transaksi
                                        </h2>
                                        <span className="text-[10px] sm:text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                                            {transactions.length} Data
                                        </span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setMobileTab('catat')}
                                    className="sm:hidden px-3 py-1.5 min-h-[36px] rounded-xl bg-[#009bd2] hover:bg-[#0086b6] text-white font-bold text-xs flex items-center gap-1.5 active:scale-95 shadow-xs shrink-0 transition"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/>
                                    </svg>
                                    <span>Catat Baru</span>
                                </button>
                            </div>
                            
                            <div className="space-y-2.5 sm:space-y-3.5 overflow-y-auto pr-0 sm:pr-2 flex-1 min-h-0">
                                {transactions.length > 0 ? transactions.map((item) => (
                                    <div key={item.id} className="bg-white p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl shadow-[0_2px_8px_rgb(0,0,0,0.02)] border border-slate-100 hover:border-slate-200 hover:shadow-[0_4px_16px_rgb(0,0,0,0.04)] transition-all flex items-center justify-between gap-2.5 sm:gap-4 group">
                                        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                                            <div 
                                                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 ${item.type === 'pengeluaran' ? 'bg-rose-50 text-rose-500' : item.type === 'pemasukan' ? 'bg-emerald-50 text-emerald-500' : ''}`}
                                                style={item.type === 'tabungan' ? { backgroundColor: '#e6f5fb', color: '#007ca8' } : {}}
                                            >
                                                {item.type === 'pengeluaran' ? (
                                                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>
                                                ) : item.type === 'pemasukan' ? (
                                                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>
                                                ) : (
                                                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-xs sm:text-base font-extrabold text-slate-800 leading-snug truncate">{item.title}</h3>
                                                <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 mt-0.5 sm:mt-1">
                                                    <span className="text-[10px] sm:text-xs font-bold text-slate-500 bg-slate-50 px-1.5 sm:px-2 py-0.5 rounded-md border border-slate-100">{item.category}</span>
                                                    {item.payment_method && (
                                                        <span className="text-[10px] sm:text-xs font-bold text-indigo-500 bg-indigo-50 px-1.5 sm:px-2 py-0.5 rounded-md border border-indigo-100">{item.payment_method}</span>
                                                    )}
                                                    <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400">{item.date_formatted}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
                                            <div className="text-right">
                                                <p 
                                                    className={`text-xs sm:text-base md:text-lg font-black tracking-tight ${item.type === 'pengeluaran' ? 'text-rose-600' : item.type === 'pemasukan' ? 'text-emerald-600' : ''}`}
                                                    style={item.type === 'tabungan' ? { color: '#007ca8' } : {}}
                                                >
                                                    {item.type === 'pengeluaran' ? '-' : item.type === 'tabungan' ? '-' : '+'}{formatRp(item.amount)}
                                                </p>
                                            </div>
                                            
                                            {/* Action Buttons: Edit & Hapus (Directly accessible on Desktop & Mobile, never cut off or clipped) */}
                                            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 pl-1">
                                                <button
                                                    type="button"
                                                    onClick={() => openEditModal(item)}
                                                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-slate-100 hover:bg-[#009bd2]/10 text-slate-500 hover:text-[#009bd2] border border-slate-200/60 flex items-center justify-center transition-all active:scale-95 shadow-2xs group/btn"
                                                    title="Edit Transaksi"
                                                    aria-label="Edit Transaksi"
                                                >
                                                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover/btn:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                                                    </svg>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(item)}
                                                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-500 hover:text-rose-600 border border-rose-200/60 flex items-center justify-center transition-all active:scale-95 shadow-2xs group/btn"
                                                    title="Hapus Transaksi"
                                                    aria-label="Hapus Transaksi"
                                                >
                                                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover/btn:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-2xl sm:rounded-3xl p-6 sm:p-12 text-center h-full flex flex-col justify-center">
                                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm mb-3 sm:mb-4">
                                            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                                        </div>
                                        <p className="text-slate-600 font-extrabold text-xs sm:text-base">Belum ada catatan transaksi.</p>
                                        <p className="text-slate-400 text-[11px] sm:text-sm mt-1">Gunakan form di atas untuk mencatat transaksi baru.</p>
                                    </div>
                                )}
                            </div>

                            {transactions.length > 0 && (
                                <div className="mt-3 pt-2.5 border-t border-slate-100 shrink-0">
                                    <Link
                                        href={route('transaksi.history')}
                                        className="text-xs font-bold text-[#009bd2] hover:text-[#0086b6] hover:bg-sky-50/70 p-2 rounded-xl flex items-center justify-center gap-1.5 transition text-center"
                                    >
                                        <span>Lihat Semua Riwayat & Filter Lengkap</span>
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3"/>
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
                loading={isDeletingTx}
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
