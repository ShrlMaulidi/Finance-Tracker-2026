import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import CurrencyInput from '@/Components/CurrencyInput';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Dropdown from '@/Components/Dropdown';

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
    const [hoveredIcon, setHoveredIcon] = useState(null);
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
    const filteredHistory = filterMonth === 'Semua' ? historyData : historyData.filter(row => row.month === filterMonth);

    const formatRp = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

    return (
        <AuthenticatedLayout>
            <Head title="Anggaran Hutang" />
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-10 space-y-6 sm:space-y-10 relative">
                
                {/* Header Page & Tabs */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-4">
                    <div>
                        <p className="text-xs md:text-sm font-bold text-[#009bd2] uppercase tracking-widest mb-1">Manajemen Anggaran</p>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
                            Anggaran Hutang
                        </h1>
                    </div>
                    
                    {/* Tab Navigation */}
                    <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
                        <button 
                            onClick={() => setActiveTab('bulan_ini')}
                            className={`px-4 md:px-6 py-2 md:py-2.5 rounded-xl font-bold text-[13px] md:text-sm transition-all duration-300 ${activeTab === 'bulan_ini' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Bulan Ini ({currentMonth})
                        </button>
                        <button 
                            onClick={() => setActiveTab('riwayat')}
                            className={`px-4 md:px-6 py-2 md:py-2.5 rounded-xl font-bold text-[13px] md:text-sm transition-all duration-300 ${activeTab === 'riwayat' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Riwayat Bulanan
                        </button>
                    </div>
                </div>


                {/* TAB CONTENT: BULAN INI */}
                {activeTab === 'bulan_ini' && (
                    <div className="grid lg:grid-cols-3 gap-8 animate-fade-in">
                        {/* Form Kiri */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 sticky top-10">
                                <h2 className="text-xl font-extrabold text-slate-800 mb-6 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-[#009bd2]/10 text-[#009bd2] flex items-center justify-center">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                                    </div>
                                    Buat Anggaran
                                </h2>

                                <form onSubmit={submit} className="space-y-5">
                                    <div>
                                        <label className="text-[13px] font-bold text-slate-600 block mb-2">Pilih Hutang/Piutang</label>
                                        <select 
                                            value={data.name}
                                            onChange={e => setData('name', e.target.value)}
                                            className="w-full bg-slate-50 border-2 border-slate-100 text-slate-800 rounded-2xl px-4 py-3 focus:outline-none focus:ring-0 focus:border-[#009bd2] font-bold transition-all text-sm"
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
                                        {errors.name && <p className="text-red-500 text-xs font-bold mt-1">{errors.name}</p>}
                                    </div>

                                    <div>
                                        <label className="text-[13px] font-bold text-slate-600 block mb-2">Batas Anggaran</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-3.5 text-slate-400 font-extrabold">Rp</span>
                                            <CurrencyInput 
                                                value={data.target_amount}
                                                onChange={e => setData('target_amount', e.target.value)}
                                                placeholder="3000000" 
                                                className="w-full bg-slate-50 border-2 border-slate-100 text-slate-800 rounded-2xl pl-12 pr-4 py-3 focus:outline-none focus:ring-0 focus:border-[#009bd2] font-extrabold transition-all" 
                                            />
                                        </div>
                                        {errors.target_amount && <p className="text-red-500 text-xs font-bold mt-1">{errors.target_amount}</p>}
                                    </div>

                                    <div className="flex items-center mt-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <input
                                            type="checkbox"
                                            id="is_recurring"
                                            checked={data.is_recurring}
                                            onChange={e => setData('is_recurring', e.target.checked)}
                                            className="w-5 h-5 text-[#009bd2] bg-white border-slate-300 rounded focus:ring-[#009bd2] focus:ring-2 cursor-pointer"
                                        />
                                        <label htmlFor="is_recurring" className="ml-3 text-xs font-bold text-slate-600 cursor-pointer select-none">
                                            Tetapkan sebagai anggaran bulanan rutin
                                        </label>
                                    </div>

                                    <button 
                                        type="submit" 
                                        disabled={processing}
                                        className={`w-full text-white py-3.5 rounded-2xl font-extrabold transition-all shadow-lg hover:-translate-y-0.5 mt-2 ${processing ? 'opacity-70 cursor-not-allowed' : ''}`}
                                        style={{ backgroundColor: '#009bd2', boxShadow: '0 10px 15px -3px rgba(0, 155, 210, 0.3)' }}
                                    >
                                        {processing ? 'Menyimpan...' : 'Simpan Anggaran'}
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* List Kanan */}
                        <div className="lg:col-span-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {currentBudgets.length > 0 ? currentBudgets.map(item => {
                                    const percent = item.target > 0 ? Math.min((item.used / item.target) * 100, 100) : 0;
                                    const isOverbudget = item.used > item.target;
                                    const relatedDebt = activeDebts?.find(d => d.name === item.name);
                                    
                                    return (
                                        <div key={item.id} className="bg-white p-5 md:p-6 rounded-3xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-slate-100 hover:shadow-[0_4px_20px_rgb(0,0,0,0.04)] transition-all relative overflow-hidden group">
                                            {/* Action buttons on hover */}
                                            <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                <button onClick={() => openEditModal(item)} className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg transition-colors">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                                                </button>
                                                <button onClick={() => handleDelete(item.id)} className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                                </button>
                                            </div>
                                            
                                            <div className="flex justify-between items-start mb-4 pr-12">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="text-lg font-black text-slate-800">{item.name}</h3>
                                                        {item.is_recurring && (
                                                            <span className="bg-slate-100 text-slate-400 p-1 rounded-md" title="Rutin">
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                                                            </span>
                                                        )}
                                                    </div>
                                                    {relatedDebt?.description && (
                                                        <p className="text-xs font-semibold text-slate-500 mb-1">{relatedDebt.description}</p>
                                                    )}
                                                    <div className="flex flex-col gap-1 mt-2">
                                                        <p className="text-[13px] text-slate-500"><span className="text-slate-400">Anggaran:</span> <span className="font-bold text-slate-700">{formatRp(item.target)}</span></p>
                                                        {item.total_debt !== undefined && (
                                                            <p className={`text-[13px] ${item.debt_type === 'hutang' ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                                <span className="opacity-70">Sisa {item.debt_type === 'hutang' ? 'Hutang' : 'Piutang'}:</span> <span className="font-bold">{formatRp(item.total_debt)}</span>
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="mb-3">
                                                <div className="flex justify-between items-end mb-1.5">
                                                    <span className="text-2xl font-black text-slate-800">{formatRp(item.used)}</span>
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${isOverbudget ? 'bg-red-100 text-red-600' : percent >= 80 ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                        {percent.toFixed(0)}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                                    <div 
                                                        className={`h-3 rounded-full transition-all duration-1000 ${isOverbudget ? 'bg-red-500' : percent >= 80 ? 'bg-orange-500' : 'bg-emerald-500'}`} 
                                                        style={{ width: `${percent}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                            
                                            <p className="text-xs font-semibold text-slate-500 text-right mt-2">
                                                {item.used > item.target 
                                                    ? `Melebihi batas sebesar ${formatRp(item.used - item.target)}!`
                                                    : `Sisa anggaran: ${formatRp(item.target - item.used)}`
                                                }
                                            </p>
                                        </div>
                                    );
                                }) : (
                                    <div className="col-span-1 md:col-span-2 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] p-16 text-center">
                                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm mb-6">
                                            <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                                        </div>
                                        <p className="text-slate-500 font-extrabold text-lg">Belum ada anggaran bulan ini.</p>
                                        <p className="text-slate-400 text-sm mt-2 font-medium">Buat anggaran pertama Anda untuk mulai membayar hutang.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB CONTENT: RIWAYAT */}
                {activeTab === 'riwayat' && (
                    <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6 sm:p-8 animate-fade-in">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <h2 className="text-xl font-extrabold text-slate-800 mb-0">
                                Riwayat Pembayaran Hutang
                            </h2>
                            
                            {/* Filter Dropdown */}
                            <div className="relative">
                                <select 
                                    value={filterMonth}
                                    onChange={(e) => setFilterMonth(e.target.value)}
                                    className="appearance-none bg-none bg-slate-50 border-2 border-slate-100 text-slate-700 font-bold rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:border-[#009bd2] focus:ring-0 transition-colors cursor-pointer text-sm w-full sm:w-auto"
                                >
                                    <option value="Semua">Semua Bulan</option>
                                    {historyMonths.map((m, i) => (
                                        <option key={i} value={m}>{m}</option>
                                    ))}
                                </select>
                                <svg className="w-4 h-4 absolute right-3.5 top-3.5 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7"/></svg>
                            </div>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[600px]">
                                <thead>
                                    <tr className="border-b-2 border-slate-100 text-slate-400 text-[11px] uppercase tracking-widest font-bold">
                                        <th className="pb-4 px-4">Bulan</th>
                                        <th className="pb-4 px-4">Peminjam</th>
                                        <th className="pb-4 px-4 text-right">Anggaran</th>
                                        <th className="pb-4 px-4 text-right">Telah Dibayar</th>
                                        <th className="pb-4 px-4 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {filteredHistory.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="py-8 text-center text-slate-400 font-semibold">
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
                                                    <td className="py-4 px-4 font-bold text-slate-700">{row.month}</td>
                                                    <td className="py-4 px-4">
                                                        <div className="font-extrabold text-slate-800">{row.name}</div>
                                                        {relatedDebt && relatedDebt.description && (
                                                            <div className="text-[11px] font-semibold text-slate-500 mt-0.5">{relatedDebt.description}</div>
                                                        )}
                                                    </td>
                                                    <td className="py-4 px-4 font-bold text-slate-600 text-right">{formatRp(row.target)}</td>
                                                    <td className="py-4 px-4 font-extrabold text-slate-800 text-right">{formatRp(row.used)}</td>
                                                    <td className="py-4 px-4 text-center">
                                                        {isPerfect ? (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-extrabold uppercase tracking-wide bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                                                                Sesuai
                                                            </span>
                                                        ) : isOver ? (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-extrabold uppercase tracking-wide bg-rose-50 text-rose-600 border border-rose-100">
                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12"/></svg>
                                                                Overbudget
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-extrabold uppercase tracking-wide bg-[#009bd2]/10 text-[#009bd2] border border-[#009bd2]/20">
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
                )}
            </div>

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => { setIsEditModalOpen(false); setEditingBudget(null); resetEdit(); }}></div>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative overflow-hidden border border-slate-100 z-10 animate-fade-in">
                        <form onSubmit={submitEdit} className="p-6 md:p-8">
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">Edit Anggaran</h2>
                            <p className="text-sm font-medium text-slate-500 mb-6">Sesuaikan anggaran hutang ini.</p>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1.5">Pilih Hutang/Piutang</label>
                                    <select 
                                        value={editData.name}
                                        onChange={e => setEditData('name', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#009bd2] focus:ring-1 focus:ring-[#009bd2] text-sm"
                                    >
                                        <option value="" disabled>-- Pilih Data Hutang --</option>
                                        {activeDebts && activeDebts.map(debt => (
                                            <option key={debt.id} value={debt.name}>
                                                {debt.name} ({debt.type === 'hutang' ? 'Hutang' : 'Piutang'} - Sisa: {formatRp(debt.remaining_amount)})
                                            </option>
                                        ))}
                                    </select>
                                    {editErrors.name && <p className="text-red-500 text-xs mt-1 font-bold">{editErrors.name}</p>}
                                </div>
                                
                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1.5">Anggaran (Rp)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-slate-500 font-bold text-sm">Rp</span>
                                        <CurrencyInput 
                                            value={editData.target_amount}
                                            onChange={e => setEditData('target_amount', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-[#009bd2] focus:ring-1 focus:ring-[#009bd2] font-bold text-sm" 
                                        />
                                    </div>
                                    {editErrors.target_amount && <p className="text-red-500 text-xs mt-1 font-bold">{editErrors.target_amount}</p>}
                                </div>

                                <label className="flex items-center gap-3 cursor-pointer group mt-6">
                                    <div className="relative flex items-center">
                                        <input 
                                            type="checkbox" 
                                            checked={editData.is_recurring}
                                            onChange={e => setEditData('is_recurring', e.target.checked)}
                                            className="peer sr-only" 
                                        />
                                        <div className="w-12 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-[#009bd2] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-sm"></div>
                                    </div>
                                    <span className="text-[13px] font-bold text-slate-600 group-hover:text-slate-900 transition-colors">Anggaran Berulang Tiap Bulan</span>
                                </label>
                            </div>
                            
                            <div className="mt-8 flex gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => { setIsEditModalOpen(false); setEditingBudget(null); resetEdit(); }}
                                    className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors text-sm"
                                >
                                    Batal
                                </button>
                                <button 
                                    type="submit"
                                    disabled={editProcessing}
                                    className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-[#009bd2] hover:bg-[#0089ba] transition-all shadow-md hover:shadow-lg disabled:opacity-50 text-sm"
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
