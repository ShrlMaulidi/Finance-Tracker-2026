import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import CurrencyInput from '@/Components/CurrencyInput';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function AnggaranHutang({ currentMonth, currentBudgets, historyData, historyMonths, activeDebts, availableDebts, totalHutang, totalPiutang }) {
    const [activeTab, setActiveTab] = useState('bulan_ini');
    
    // Form untuk membuat anggaran baru (Inline Form)
    const { data, setData, post, processing, reset, errors } = useForm({
        name: '',
        target_amount: '',
        is_recurring: false
    });

    // State & Form khusus untuk Edit Modal
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingBudget, setEditingBudget] = useState(null);
    const { 
        data: editData, 
        setData: setEditData, 
        put: putEdit, 
        processing: editProcessing, 
        reset: resetEdit, 
        clearErrors: clearEditErrors,
        errors: editErrors 
    } = useForm({
        name: '',
        target_amount: '',
        is_recurring: false
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('anggaran.hutang.store'), {
            onSuccess: () => reset(),
        });
    };

    const openEditModal = (item) => {
        setEditingBudget(item);
        clearEditErrors();
        setEditData({
            name: item.name,
            target_amount: item.target,
            is_recurring: item.is_recurring
        });
        setIsEditModalOpen(true);
    };

    const submitEdit = (e) => {
        e.preventDefault();
        putEdit(route('anggaran.hutang.update', editingBudget.id), {
            onSuccess: () => {
                setIsEditModalOpen(false);
                setEditingBudget(null);
                resetEdit();
            }
        });
    };

    const handleDelete = (id) => {
        if (confirm('Apakah Anda yakin ingin menghapus anggaran ini?')) {
            router.delete(route('anggaran.hutang.destroy', id));
        }
    };

    const [filterMonth, setFilterMonth] = useState('Semua');
    const filteredHistory = filterMonth === 'Semua' ? (historyData || []) : (historyData || []).filter(row => row.month === filterMonth);

    const formatRp = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

    return (
        <AuthenticatedLayout>
            <Head title="Anggaran Hutang" />
            <div className="max-w-7xl mx-auto px-3.5 py-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 relative">
                
                {/* Header Page & Toolbar */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4 border-b border-slate-100 pb-3 sm:pb-4">
                    <div>
                        <p className="text-[11px] sm:text-xs font-bold text-[#009bd2] uppercase tracking-wider mb-0.5 sm:mb-1">Manajemen Anggaran</p>
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
                            Anggaran Hutang
                        </h1>
                        <p className="text-slate-500 font-medium text-xs sm:text-sm mt-0.5 sm:mt-1">Rencanakan pembayaran tagihan dan piutang Anda tepat waktu.</p>
                    </div>
                    
                    {/* Tab Navigation */}
                    <div className="flex bg-slate-100/90 p-1 rounded-xl w-full sm:w-auto gap-1">
                        <button 
                            onClick={() => setActiveTab('bulan_ini')}
                            className={`flex-1 sm:flex-none text-center px-3 sm:px-5 py-2 rounded-lg font-extrabold text-xs sm:text-sm transition-all duration-300 ${activeTab === 'bulan_ini' ? 'bg-white text-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.06)]' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Bulan Ini ({currentMonth})
                        </button>
                        <button 
                            onClick={() => setActiveTab('riwayat')}
                            className={`flex-1 sm:flex-none text-center px-3 sm:px-5 py-2 rounded-lg font-extrabold text-xs sm:text-sm transition-all duration-300 ${activeTab === 'riwayat' ? 'bg-white text-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.06)]' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Riwayat Bulanan
                        </button>
                    </div>
                </div>

                {/* TAB CONTENT: BULAN INI */}
                {activeTab === 'bulan_ini' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 animate-fade-in items-start">
                        {/* Form Kiri */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-100 lg:sticky lg:top-6">
                                <h2 className="text-base sm:text-lg md:text-xl font-black text-slate-800 mb-4 sm:mb-6 flex items-center gap-2.5 sm:gap-3">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#009bd2]/10 text-[#009bd2] flex items-center justify-center shrink-0">
                                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                                    </div>
                                    <span>Buat Anggaran</span>
                                </h2>

                                <form onSubmit={submit} className="space-y-3.5 sm:space-y-5">
                                    <div>
                                        <label className="text-xs sm:text-sm font-bold text-slate-600 block mb-1 sm:mb-1.5">Pilih Hutang/Piutang</label>
                                        <select 
                                            value={data.name}
                                            onChange={e => setData('name', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl sm:rounded-2xl px-3.5 py-2 sm:py-2.5 focus:outline-none focus:border-[#009bd2] focus:ring-1 focus:ring-[#009bd2] font-semibold transition-all text-xs sm:text-sm cursor-pointer"
                                        >
                                            <option value="" disabled>-- Pilih Data Hutang --</option>
                                            {availableDebts && availableDebts.length > 0 ? (
                                                availableDebts.map(debt => (
                                                    <option key={debt.id} value={debt.name}>
                                                        {debt.name} ({debt.type === 'hutang' ? 'Hutang' : 'Piutang'} - Sisa: {formatRp(debt.remaining_amount)})
                                                    </option>
                                                ))
                                            ) : (
                                                <option value="" disabled>Semua tagihan sudah dianggarkan</option>
                                            )}
                                        </select>
                                        {errors.name && <p className="text-red-500 text-[11px] font-bold mt-1">{errors.name}</p>}
                                    </div>

                                    <div>
                                        <label className="text-xs sm:text-sm font-bold text-slate-600 block mb-1 sm:mb-1.5">Batas Anggaran</label>
                                        <div className="relative">
                                            <span className="absolute left-3.5 top-2 sm:top-2.5 text-slate-400 font-bold text-xs sm:text-sm">Rp</span>
                                            <CurrencyInput 
                                                value={data.target_amount}
                                                onValueChange={val => setData('target_amount', val)}
                                                placeholder="1.000.000" 
                                                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl sm:rounded-2xl pl-10 sm:pl-12 pr-3.5 py-2 sm:py-2.5 focus:outline-none focus:border-[#009bd2] focus:ring-1 focus:ring-[#009bd2] font-bold transition-all text-xs sm:text-sm" 
                                            />
                                        </div>
                                        {errors.target_amount && <p className="text-red-500 text-[11px] font-bold mt-1">{errors.target_amount}</p>}
                                    </div>

                                    <div className="flex items-center p-2.5 sm:p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <input
                                            type="checkbox"
                                            id="is_recurring"
                                            checked={data.is_recurring}
                                            onChange={e => setData('is_recurring', e.target.checked)}
                                            className="w-4 h-4 text-[#009bd2] bg-white border-slate-300 rounded focus:ring-[#009bd2] cursor-pointer"
                                        />
                                        <label htmlFor="is_recurring" className="ml-2.5 text-[11px] sm:text-xs font-bold text-slate-600 cursor-pointer select-none">
                                            Tetapkan sebagai anggaran bulanan rutin
                                        </label>
                                    </div>

                                    <button 
                                        type="submit" 
                                        disabled={processing}
                                        className={`w-full text-white py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-bold transition-all shadow-xs hover:shadow-md text-xs sm:text-sm ${processing ? 'opacity-70 cursor-not-allowed' : ''}`}
                                        style={{ backgroundColor: '#009bd2' }}
                                    >
                                        {processing ? 'Menyimpan...' : 'Simpan Anggaran'}
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* List Kanan */}
                        <div className="lg:col-span-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
                                {currentBudgets.length > 0 ? currentBudgets.map(item => {
                                    const percent = item.target > 0 ? Math.min((item.used / item.target) * 100, 100) : 0;
                                    const isOverbudget = item.used > item.target;
                                    const relatedDebt = activeDebts?.find(d => d.name === item.name);
                                    
                                    return (
                                        <div key={item.id} className="bg-white p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-100 hover:shadow-md transition-all relative overflow-hidden group flex flex-col justify-between">
                                            {/* Action buttons (Visible on mobile, hover-revealed on desktop) */}
                                            <div className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 flex items-center gap-1 z-10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => openEditModal(item)} 
                                                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg transition-colors"
                                                    title="Edit Anggaran"
                                                >
                                                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(item.id)} 
                                                    className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-lg transition-colors"
                                                    title="Hapus Anggaran"
                                                >
                                                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                                </button>
                                            </div>
                                            
                                            <div className="pr-16 mb-3 sm:mb-4">
                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                    <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate" title={item.name}>{item.name}</h3>
                                                    {item.is_recurring && (
                                                        <span className="bg-slate-100 text-slate-400 p-0.5 sm:p-1 rounded shrink-0" title="Rutin Setiap Bulan">
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                                                        </span>
                                                    )}
                                                </div>
                                                {relatedDebt?.description && (
                                                    <p className="text-[10px] sm:text-xs font-semibold text-slate-500 mb-2 truncate max-w-[180px] sm:max-w-none">{relatedDebt.description}</p>
                                                )}
                                                <div className="flex flex-col gap-0.5 text-xs sm:text-sm mt-1">
                                                    <p className="text-slate-500"><span className="text-slate-400 font-medium">Batas Anggaran:</span> <span className="font-bold text-slate-700">{formatRp(item.target)}</span></p>
                                                    {item.total_debt !== undefined && (
                                                        <p className={`text-[11px] sm:text-xs ${item.debt_type === 'hutang' ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                            <span className="opacity-70 font-medium">Sisa {item.debt_type === 'hutang' ? 'Hutang' : 'Piutang'}:</span> <span className="font-bold">{formatRp(item.total_debt)}</span>
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Progress Bar Section */}
                                            <div className="pt-2 border-t border-slate-50 mt-auto">
                                                <div className="flex justify-between items-end mb-1">
                                                    <span className="text-lg sm:text-xl font-black text-slate-800 truncate" title={formatRp(item.used)}>{formatRp(item.used)}</span>
                                                    <span className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-md shrink-0 ${isOverbudget ? 'bg-rose-50 text-rose-600' : percent >= 80 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                        {percent.toFixed(0)}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-slate-100 rounded-full h-2.5 sm:h-3 overflow-hidden">
                                                    <div 
                                                        className={`h-full rounded-full transition-all duration-1000 ${isOverbudget ? 'bg-rose-500' : percent >= 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                                                        style={{ width: `${percent}%` }}
                                                    ></div>
                                                </div>
                                                
                                                <p className="text-[11px] sm:text-xs font-semibold text-slate-500 text-right mt-1.5">
                                                    {item.used > item.target 
                                                        ? `Melebihi batas sebesar ${formatRp(item.used - item.target)}!`
                                                        : `Sisa anggaran: ${formatRp(item.target - item.used)}`
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <div className="col-span-1 md:col-span-2 bg-slate-50/70 border-2 border-dashed border-slate-200 rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center">
                                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-xs mb-3 sm:mb-4 text-slate-300">
                                            <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                                        </div>
                                        <p className="text-slate-600 font-bold text-sm sm:text-base">Belum ada anggaran bulan ini.</p>
                                        <p className="text-slate-400 text-xs sm:text-sm mt-1">Buat anggaran pertama Anda untuk mulai membayar hutang.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB CONTENT: RIWAYAT */}
                {activeTab === 'riwayat' && (
                    <div className="space-y-4 sm:space-y-6 animate-fade-in">
                        <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-100">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
                                <h2 className="text-base sm:text-lg md:text-xl font-black text-slate-800 flex items-center gap-2.5">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                    </div>
                                    <span>Riwayat Pembayaran Hutang</span>
                                </h2>
                                
                                {/* Filter Dropdown */}
                                <div className="w-full sm:w-auto">
                                    <select 
                                        value={filterMonth}
                                        onChange={(e) => setFilterMonth(e.target.value)}
                                        className="bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl px-3.5 py-2 focus:outline-none focus:border-[#009bd2] focus:ring-1 focus:ring-[#009bd2] transition-colors cursor-pointer text-xs sm:text-sm w-full sm:w-auto"
                                    >
                                        <option value="Semua">Semua Bulan</option>
                                        {historyMonths.map((m, i) => (
                                            <option key={i} value={m}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            
                            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                                <table className="w-full text-left border-collapse min-w-[560px]">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-slate-400 text-[10px] sm:text-[11px] uppercase tracking-wider font-extrabold">
                                            <th className="pb-3 px-3">Bulan</th>
                                            <th className="pb-3 px-3">Peminjam</th>
                                            <th className="pb-3 px-3 text-right">Anggaran</th>
                                            <th className="pb-3 px-3 text-right">Telah Dibayar</th>
                                            <th className="pb-3 px-3 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-xs sm:text-sm">
                                        {filteredHistory.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="py-8 text-center text-slate-400 font-semibold text-xs sm:text-sm">
                                                    Belum ada riwayat untuk bulan tersebut.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredHistory.map((row, idx) => {
                                                const isOver = row.used > row.target;
                                                const isPerfect = row.used === row.target;
                                                const relatedDebt = activeDebts?.find(d => d.name === row.name);
                                                
                                                return (
                                                    <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                                        <td className="py-3 sm:py-3.5 px-3 font-bold text-slate-700">{row.month}</td>
                                                        <td className="py-3 sm:py-3.5 px-3">
                                                            <div className="font-extrabold text-slate-800">{row.name}</div>
                                                            {relatedDebt && relatedDebt.description && (
                                                                <div className="text-[10px] sm:text-[11px] font-semibold text-slate-400 mt-0.5">{relatedDebt.description}</div>
                                                            )}
                                                        </td>
                                                        <td className="py-3 sm:py-3.5 px-3 font-bold text-slate-600 text-right">{formatRp(row.target)}</td>
                                                        <td className="py-3 sm:py-3.5 px-3 font-extrabold text-slate-800 text-right">{formatRp(row.used)}</td>
                                                        <td className="py-3 sm:py-3.5 px-3 text-center">
                                                            {isPerfect ? (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wide bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                                                                    Sesuai
                                                                </span>
                                                            ) : isOver ? (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wide bg-rose-50 text-rose-600 border border-rose-100">
                                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/></svg>
                                                                    Overbudget
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wide bg-[#009bd2]/10 text-[#009bd2] border border-[#009bd2]/20">
                                                                    Aman
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => { setIsEditModalOpen(false); setEditingBudget(null); resetEdit(); }}></div>
                    <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-md relative overflow-hidden border border-slate-100 z-10 animate-fade-in flex flex-col max-h-[92vh]">
                        <form onSubmit={submitEdit} className="p-4 sm:p-6 md:p-8 overflow-y-auto">
                            <h2 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 mb-1">Edit Anggaran</h2>
                            <p className="text-xs sm:text-sm font-medium text-slate-500 mb-4 sm:mb-6">Sesuaikan batas anggaran hutang ini.</p>
                            
                            <div className="space-y-3.5 sm:space-y-4">
                                <div>
                                    <label className="text-xs sm:text-sm font-bold text-slate-700 block mb-1 sm:mb-1.5">Pilih Hutang/Piutang</label>
                                    <select 
                                        value={editData.name}
                                        onChange={e => setEditData('name', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2 sm:py-2.5 focus:outline-none focus:border-[#009bd2] focus:ring-1 focus:ring-[#009bd2] text-xs sm:text-sm font-semibold cursor-pointer"
                                    >
                                        <option value="" disabled>-- Pilih Data Hutang --</option>
                                        {activeDebts && activeDebts.map(debt => (
                                            <option key={debt.id} value={debt.name}>
                                                {debt.name} ({debt.type === 'hutang' ? 'Hutang' : 'Piutang'} - Sisa: {formatRp(debt.remaining_amount)})
                                            </option>
                                        ))}
                                    </select>
                                    {editErrors.name && <p className="text-red-500 text-[11px] font-bold mt-1">{editErrors.name}</p>}
                                </div>
                                
                                <div>
                                    <label className="text-xs sm:text-sm font-bold text-slate-700 block mb-1 sm:mb-1.5">Anggaran (Rp)</label>
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-2 sm:top-2.5 text-slate-400 font-bold text-xs sm:text-sm">Rp</span>
                                        <CurrencyInput 
                                            value={editData.target_amount}
                                            onValueChange={val => setEditData('target_amount', val)}
                                            placeholder="1.000.000"
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl pl-10 sm:pl-12 pr-3.5 py-2 sm:py-2.5 focus:outline-none focus:border-[#009bd2] focus:ring-1 focus:ring-[#009bd2] font-bold text-xs sm:text-sm transition-colors" 
                                        />
                                    </div>
                                    {editErrors.target_amount && <p className="text-red-500 text-[11px] font-bold mt-1">{editErrors.target_amount}</p>}
                                </div>

                                <div className="flex items-center p-2.5 sm:p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <input 
                                        type="checkbox" 
                                        id="edit_is_recurring_debt"
                                        checked={editData.is_recurring}
                                        onChange={e => setEditData('is_recurring', e.target.checked)}
                                        className="w-4 h-4 text-[#009bd2] bg-white border-slate-300 rounded focus:ring-[#009bd2] cursor-pointer" 
                                    />
                                    <label htmlFor="edit_is_recurring_debt" className="ml-2.5 text-[11px] sm:text-xs font-bold text-slate-600 cursor-pointer select-none">
                                        Anggarkan Setiap Bulan
                                    </label>
                                </div>
                            </div>
                            
                            <div className="pt-4 sm:pt-6 flex gap-2.5 sm:gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => { setIsEditModalOpen(false); setEditingBudget(null); resetEdit(); }}
                                    className="flex-1 px-4 py-2.5 sm:py-3 rounded-xl font-bold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 transition-colors text-xs sm:text-sm"
                                >
                                    Batal
                                </button>
                                <button 
                                    type="submit"
                                    disabled={editProcessing}
                                    className="flex-1 px-4 py-2.5 sm:py-3 rounded-xl font-bold text-white bg-[#009bd2] hover:bg-[#0089ba] transition-all shadow-xs hover:shadow-md disabled:opacity-50 text-xs sm:text-sm"
                                >
                                    {editProcessing ? 'Menyimpan...' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

