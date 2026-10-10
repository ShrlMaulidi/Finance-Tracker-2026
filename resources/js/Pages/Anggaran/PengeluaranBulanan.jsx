import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import Dropdown from '@/Components/Dropdown';

export default function PengeluaranBulanan({ currentMonth, currentBudgets, expenseCategories }) {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingBudget, setEditingBudget] = useState(null);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        name: '',
        target_amount: '',
        is_recurring: false
    });

    const { data: editData, setData: setEditData, put: putEdit, processing: editProcessing, errors: editErrors, clearErrors: clearEditErrors, reset: resetEdit } = useForm({
        name: '',
        target_amount: '',
        is_recurring: false
    });

    const formatRp = (value) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('anggaran.pengeluaran.store'), {
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
        putEdit(route('anggaran.pengeluaran.update', editingBudget.id), {
            onSuccess: () => {
                setIsEditModalOpen(false);
                setEditingBudget(null);
                resetEdit();
            }
        });
    };

    const handleDelete = (id) => {
        if (confirm('Apakah Anda yakin ingin menghapus anggaran ini?')) {
            router.delete(route('anggaran.pengeluaran.destroy', id));
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Pengeluaran Bulanan" />

            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-10 space-y-6 sm:space-y-10 relative">
                
                {/* Header Page */}
                <div className="border-b border-slate-200 pb-4">
                    <p className="text-xs md:text-sm font-bold text-[#f43f5e] uppercase tracking-widest mb-1">Manajemen Anggaran</p>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
                        Pengeluaran Bulanan
                    </h1>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Form Kiri */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 sticky top-10">
                            <h2 className="text-xl font-extrabold text-slate-800 mb-6 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                                </div>
                                Buat Anggaran
                            </h2>

                            <form onSubmit={submit} className="space-y-5">
                                <div>
                                    <label className="text-[13px] font-bold text-slate-600 block mb-2">Pilih Kategori</label>
                                    <select 
                                        value={data.name}
                                        onChange={e => setData('name', e.target.value)}
                                        className="w-full bg-slate-50 border-2 border-slate-100 text-slate-800 rounded-2xl px-4 py-3 focus:outline-none focus:ring-0 focus:border-[#f43f5e] font-bold transition-all text-sm"
                                    >
                                        <option value="" disabled>Pilih Kategori Pengeluaran</option>
                                        {expenseCategories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                    {errors.name && <p className="text-red-500 text-xs font-bold mt-1">{errors.name}</p>}
                                </div>

                                <div>
                                    <label className="text-[13px] font-bold text-slate-600 block mb-2">Batas Anggaran</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-3.5 text-slate-400 font-extrabold">Rp</span>
                                        <input 
                                            type="number" 
                                            value={data.target_amount}
                                            onChange={e => setData('target_amount', e.target.value)}
                                            placeholder="3000000" 
                                            className="w-full bg-slate-50 border-2 border-slate-100 text-slate-800 rounded-2xl pl-12 pr-4 py-3 focus:outline-none focus:ring-0 focus:border-[#f43f5e] font-extrabold transition-all" 
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
                                        className="w-5 h-5 text-[#f43f5e] bg-white border-slate-300 rounded focus:ring-[#f43f5e] focus:ring-2 cursor-pointer"
                                    />
                                    <label htmlFor="is_recurring" className="ml-3 text-xs font-bold text-slate-600 cursor-pointer select-none">
                                        Tetapkan sebagai anggaran bulanan rutin
                                    </label>
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={processing}
                                    className={`w-full text-white py-3.5 rounded-2xl font-extrabold transition-all shadow-lg hover:-translate-y-0.5 mt-2 ${processing ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    style={{ backgroundColor: '#f43f5e', boxShadow: '0 10px 15px -3px rgba(244, 63, 94, 0.3)' }}
                                >
                                    {processing ? 'Menyimpan...' : 'Simpan Anggaran'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* List Kanan */}
                    <div className="lg:col-span-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {currentBudgets.length > 0 ? currentBudgets.map(budget => (
                                <div key={budget.id} className="bg-white p-5 md:p-6 rounded-3xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-slate-100 hover:shadow-[0_4px_20px_rgb(0,0,0,0.04)] transition-all relative overflow-hidden group">
                                    {/* Action buttons on hover */}
                                    <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                        <button onClick={() => openEditModal(budget)} className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg transition-colors">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                                        </button>
                                        <button onClick={() => handleDelete(budget.id)} className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                        </button>
                                    </div>
                                    
                                    <div className="flex justify-between items-start mb-4 pr-12">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-lg font-black text-slate-800">{budget.name}</h3>
                                                {budget.is_recurring && (
                                                    <span className="bg-slate-100 text-slate-400 p-1 rounded-md" title="Rutin">
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs font-bold text-slate-400">Batas: {formatRp(budget.target)}</p>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mb-3">
                                        <div className="flex justify-between items-end mb-1.5">
                                            <span className="text-2xl font-black text-slate-800">{formatRp(budget.current)}</span>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${budget.status === 'Melebihi' ? 'bg-red-100 text-red-600' : budget.percentage >= 80 ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                {budget.percentage}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                            <div 
                                                className={`h-3 rounded-full transition-all duration-1000 ${budget.status === 'Melebihi' ? 'bg-red-500' : budget.percentage >= 80 ? 'bg-orange-500' : 'bg-emerald-500'}`} 
                                                style={{ width: `${Math.min(100, budget.percentage)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    
                                    <p className="text-xs font-semibold text-slate-500 text-right mt-2">
                                        {budget.current > budget.target 
                                            ? `Melebihi batas sebesar ${formatRp(budget.current - budget.target)}!`
                                            : `Sisa anggaran: ${formatRp(budget.target - budget.current)}`
                                        }
                                    </p>
                                </div>
                            )) : (
                                <div className="col-span-1 md:col-span-2 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] p-16 text-center">
                                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm mb-6">
                                        <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                                    </div>
                                    <p className="text-slate-500 font-extrabold text-lg">Belum ada anggaran bulan ini.</p>
                                    <p className="text-slate-400 text-sm mt-2 font-medium">Buat anggaran pertama Anda untuk mengontrol pengeluaran.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Edit */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => { setIsEditModalOpen(false); setEditingBudget(null); resetEdit(); }}></div>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative overflow-hidden border border-slate-100 z-10 animate-fade-in">
                        <form onSubmit={submitEdit} className="p-6 md:p-8">
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">Edit Anggaran</h2>
                            <p className="text-sm font-medium text-slate-500 mb-6">Ubah batas anggaran pengeluaran Anda.</p>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-bold text-slate-700 block mb-2">Kategori</label>
                                    <select 
                                        value={editData.name}
                                        onChange={e => setEditData('name', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#f43f5e] focus:ring-1 focus:ring-[#f43f5e]"
                                    >
                                        <option value="" disabled>Pilih Kategori</option>
                                        {expenseCategories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                    {editErrors.name && <p className="text-red-500 text-xs mt-1">{editErrors.name}</p>}
                                </div>

                                <div>
                                    <label className="text-sm font-bold text-slate-700 block mb-2">Batas Anggaran</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-2.5 text-slate-500 font-bold">Rp</span>
                                        <input 
                                            type="number" 
                                            value={editData.target_amount}
                                            onChange={e => setEditData('target_amount', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl pl-12 pr-4 py-2.5 focus:outline-none focus:border-[#f43f5e] focus:ring-1 focus:ring-[#f43f5e] font-bold" 
                                        />
                                    </div>
                                    {editErrors.target_amount && <p className="text-red-500 text-xs mt-1">{editErrors.target_amount}</p>}
                                </div>

                                <div className="flex items-center mt-2">
                                    <input
                                        type="checkbox"
                                        id="edit_is_recurring"
                                        checked={editData.is_recurring}
                                        onChange={e => setEditData('is_recurring', e.target.checked)}
                                        className="w-4 h-4 text-[#f43f5e] bg-slate-50 border-slate-300 rounded focus:ring-[#f43f5e]"
                                    />
                                    <label htmlFor="edit_is_recurring" className="ml-2 text-sm font-bold text-slate-700">
                                        Rutin setiap bulan
                                    </label>
                                </div>
                            </div>

                            <div className="mt-8 flex gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => { setIsEditModalOpen(false); setEditingBudget(null); resetEdit(); }} 
                                    className="flex-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-3 rounded-xl transition-colors"
                                >
                                    Batal
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={editProcessing}
                                    className={`flex-1 text-white font-bold py-3 rounded-xl transition-all shadow-md ${editProcessing ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-0.5'}`}
                                    style={{ backgroundColor: '#f43f5e' }}
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
