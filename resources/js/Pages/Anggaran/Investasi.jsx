import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import CurrencyInput from '@/Components/CurrencyInput';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button, TabFilter, ActionButtons, Modal, ProgressBar } from '@/Components/UI';

export default function Investasi({ currentMonth, currentBudgets, historyData, historyMonths, activeTargets, availableTargets }) {
    const [activeTab, setActiveTab] = useState('bulan_ini');
    
    // Form untuk membuat anggaran baru (Inline Form)
    const { data, setData, post, processing, reset, errors } = useForm({
        type: 'Tabungan',
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
        type: 'Tabungan',
        name: '',
        target_amount: '',
        is_recurring: false
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('anggaran.investasi.store'), {
            onSuccess: () => reset(),
        });
    };

    const openEditModal = (item) => {
        setEditingBudget(item);
        clearEditErrors();
        setEditData({
            type: item.type,
            name: item.name,
            target_amount: item.target,
            is_recurring: item.is_recurring
        });
        setIsEditModalOpen(true);
    };

    const submitEdit = (e) => {
        e.preventDefault();
        putEdit(route('anggaran.investasi.update', editingBudget.id), {
            onSuccess: () => {
                setIsEditModalOpen(false);
                setEditingBudget(null);
                resetEdit();
            }
        });
    };

    const handleDelete = (id) => {
        if (confirm('Apakah Anda yakin ingin menghapus anggaran ini?')) {
            router.delete(route('anggaran.investasi.destroy', id));
        }
    };

    const [filterMonth, setFilterMonth] = useState('Semua');
    const filteredHistory = filterMonth === 'Semua' ? (historyData || []) : (historyData || []).filter(row => row.month === filterMonth);

    const formatRp = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

    return (
        <AuthenticatedLayout>
            <Head title="Anggaran Tabungan & Target" />
            <div className="max-w-7xl mx-auto px-3.5 py-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 relative">
                
                {/* Header Page & Toolbar */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4 border-b border-slate-100 pb-3 sm:pb-4">
                    <div>
                        <p className="text-[11px] sm:text-xs font-bold text-[#009bd2] uppercase tracking-wider mb-0.5 sm:mb-1">Manajemen Aset</p>
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
                            Anggaran Tabungan & Target
                        </h1>
                        <p className="text-slate-500 font-medium text-xs sm:text-sm mt-0.5 sm:mt-1">Alokasikan dana bulanan untuk merealisasikan impian finansial Anda.</p>
                    </div>
                    
                    {/* Tab Navigation */}
                    <TabFilter
                        tabs={[
                            { key: 'bulan_ini', label: `Bulan Ini (${currentMonth})` },
                            { key: 'riwayat', label: 'Riwayat Bulanan' },
                        ]}
                        activeTab={activeTab}
                        onChange={setActiveTab}
                        activeColor="text-slate-800"
                    />
                </div>

                {/* TAB CONTENT: BULAN INI */}
                {activeTab === 'bulan_ini' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 animate-fade-in items-start">
                        {/* Form Kiri */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-100 lg:sticky lg:top-6">
                                <h2 className="text-base sm:text-lg md:text-xl font-black text-slate-800 mb-4 sm:mb-6 flex items-center gap-2.5 sm:gap-3">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
                                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/></svg>
                                    </div>
                                    <span>Buat Anggaran</span>
                                </h2>

                                <form onSubmit={submit} className="space-y-3.5 sm:space-y-5">
                                    <div>
                                        <label className="text-xs sm:text-sm font-bold text-slate-600 block mb-1 sm:mb-1.5">Pilih Tabungan/Target</label>
                                        <select 
                                            value={data.name}
                                            onChange={e => setData('name', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl sm:rounded-2xl px-3.5 py-2 sm:py-2.5 focus:outline-none focus:border-[#009bd2] focus:ring-1 focus:ring-[#009bd2] font-semibold transition-all text-xs sm:text-sm cursor-pointer"
                                        >
                                            <option value="" disabled>-- Pilih Data Target --</option>
                                            {availableTargets && availableTargets.length > 0 ? (
                                                availableTargets.map(target => (
                                                    <option key={target.id} value={target.name}>
                                                        {target.name} ({target.category} - Sisa: {formatRp(target.target_amount - target.current_amount)})
                                                    </option>
                                                ))
                                            ) : (
                                                <option value="" disabled>Semua target sudah dianggarkan</option>
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
                                                placeholder="500.000" 
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

                                    <Button 
                                        type="submit" 
                                        loading={processing}
                                        className="w-full"
                                    >
                                        Simpan Anggaran
                                    </Button>
                                </form>
                            </div>
                        </div>

                        {/* List Kanan */}
                        <div className="lg:col-span-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
                                {currentBudgets.length > 0 ? currentBudgets.map(item => {
                                    const percent = item.target > 0 ? Math.min((item.current / item.target) * 100, 100) : 0;
                                    const isFulfilled = item.current >= item.target;
                                    
                                    const colorStyle = item.type === 'Tabungan' 
                                        ? { text: 'text-blue-500', bg: 'bg-[#009bd2]', badge: 'bg-[#009bd2]/10 text-[#009bd2]' }
                                        : { text: 'text-emerald-500', bg: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-600' };
                                        
                                    return (
                                        <div key={item.id} className="bg-white p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-100 hover:shadow-md transition-all relative overflow-hidden group flex flex-col justify-between">
                                            {/* Action buttons (Visible on mobile, hover-revealed on desktop) */}
                                            <div className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                <ActionButtons
                                                    variant="soft"
                                                    size="sm"
                                                    onEdit={() => openEditModal(item)}
                                                    onDelete={() => handleDelete(item.id)}
                                                />
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
                                                <span className="text-[10px] sm:text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md inline-block mb-2">{item.type}</span>
                                                
                                                <div className="flex flex-col gap-0.5 text-xs sm:text-sm">
                                                    <p className="text-slate-500"><span className="text-slate-400 font-medium">Batas Bulan Ini:</span> <span className="font-bold text-slate-700">{formatRp(item.target)}</span></p>
                                                    {item.total_target > 0 && (
                                                        <p className={`text-[11px] sm:text-xs ${colorStyle.text}`}>
                                                            <span className="opacity-70 font-medium">Target Keseluruhan:</span> <span className="font-bold">{formatRp(item.total_target)}</span>
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Progress Bar Section */}
                                            <div className="pt-2 border-t border-slate-50 mt-auto">
                                                <div className="flex justify-between items-end mb-1">
                                                    <span className="text-lg sm:text-xl font-black text-slate-800 truncate" title={formatRp(item.current)}>{formatRp(item.current)}</span>
                                                    <span className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-md shrink-0 ${isFulfilled ? colorStyle.badge : percent >= 50 ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-600'}`}>
                                                        {percent.toFixed(0)}%
                                                    </span>
                                                </div>
                                                <ProgressBar 
                                                    value={item.current}
                                                    max={item.target}
                                                    variant={isFulfilled ? colorStyle.bg : percent >= 50 ? 'indigo' : 'bg-slate-300'}
                                                />
                                                
                                                <p className="text-[11px] sm:text-xs font-semibold text-slate-500 text-right mt-1.5">
                                                    {item.current >= item.target 
                                                        ? `Target terpenuhi!` 
                                                        : `Kurang ${formatRp(item.target - item.current)}`
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <div className="md:col-span-2 bg-slate-50/70 border-2 border-dashed border-slate-200 rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center">
                                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-xs mb-3 sm:mb-4 text-slate-300">
                                            <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                                        </div>
                                        <p className="text-slate-600 font-bold text-sm sm:text-base">Belum ada anggaran untuk bulan ini.</p>
                                        <p className="text-slate-400 text-xs sm:text-sm mt-1">Gunakan formulir untuk membuat alokasi anggaran target baru.</p>
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
                                    <span>Riwayat Target Anggaran</span>
                                </h2>
                                
                                {/* Filter Dropdown */}
                                <div className="w-full sm:w-auto">
                                    <select 
                                        value={filterMonth}
                                        onChange={(e) => setFilterMonth(e.target.value)}
                                        className="bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl px-3.5 py-2 focus:outline-none focus:border-[#009bd2] focus:ring-1 focus:ring-[#009bd2] transition-colors cursor-pointer text-xs sm:text-sm w-full sm:w-auto"
                                    >
                                        <option value="Semua">Semua Bulan</option>
                                        {historyMonths.map(m => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                                <table className="w-full text-left border-collapse min-w-[560px]">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-slate-400 text-[10px] sm:text-[11px] uppercase tracking-wider font-extrabold">
                                            <th className="pb-3 px-3">Bulan</th>
                                            <th className="pb-3 px-3">Kategori</th>
                                            <th className="pb-3 px-3">Nama Target</th>
                                            <th className="pb-3 px-3 text-right">Target</th>
                                            <th className="pb-3 px-3 text-right">Terkumpul</th>
                                            <th className="pb-3 px-3 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-xs sm:text-sm">
                                        {filteredHistory.length > 0 ? filteredHistory.map((row) => (
                                            <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                                <td className="py-3 sm:py-3.5 px-3 font-bold text-slate-700">{row.month}</td>
                                                <td className="py-3 sm:py-3.5 px-3 font-semibold text-slate-500">{row.type}</td>
                                                <td className="py-3 sm:py-3.5 px-3 font-bold text-slate-800">{row.name}</td>
                                                <td className="py-3 sm:py-3.5 px-3 font-bold text-slate-600 text-right">{formatRp(row.target)}</td>
                                                <td className="py-3 sm:py-3.5 px-3 font-bold text-slate-600 text-right">{formatRp(row.current)}</td>
                                                <td className="py-3 sm:py-3.5 px-3 text-center">
                                                    {row.status === 'Terpenuhi' ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wide bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                                                            Terpenuhi
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wide bg-rose-50 text-rose-600 border border-rose-100">
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/></svg>
                                                            Gagal
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="6" className="py-8 text-center text-slate-400 font-semibold text-xs sm:text-sm">
                                                    Belum ada riwayat untuk bulan tersebut.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Edit Anggaran */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => { setIsEditModalOpen(false); setEditingBudget(null); }}
                title="Edit Anggaran"
                subtitle={`Perbarui informasi batas anggaran ${currentMonth} Anda.`}
                maxWidth="md"
            >
                <form onSubmit={submitEdit}>
                    <div className="space-y-3.5 sm:space-y-4">
                        <div>
                            <label className="text-xs sm:text-sm font-bold text-slate-700 block mb-1 sm:mb-1.5">Nama Target</label>
                            <input 
                                type="text" 
                                value={editData.name}
                                disabled
                                className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded-xl px-3.5 py-2 sm:py-2.5 font-semibold text-xs sm:text-sm cursor-not-allowed" 
                            />
                            {editErrors.name && <p className="text-red-500 text-[11px] mt-1">{editErrors.name}</p>}
                        </div>

                        <div>
                            <label className="text-xs sm:text-sm font-bold text-slate-700 block mb-1 sm:mb-1.5">Target Nominal</label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-2 sm:top-2.5 text-slate-400 font-bold text-xs sm:text-sm">Rp</span>
                                <CurrencyInput 
                                    value={editData.target_amount}
                                    onValueChange={val => setEditData('target_amount', val)}
                                    placeholder="500.000" 
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl pl-10 sm:pl-12 pr-3.5 py-2 sm:py-2.5 focus:outline-none focus:border-[#009bd2] focus:ring-1 focus:ring-[#009bd2] focus:bg-white font-bold text-xs sm:text-sm transition-colors" 
                                />
                            </div>
                            {editErrors.target_amount && <p className="text-red-500 text-[11px] mt-1">{editErrors.target_amount}</p>}
                        </div>

                        {/* Checkbox Berulang */}
                        <div className="flex items-center p-2.5 sm:p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <input 
                                type="checkbox" 
                                id="edit_is_recurring"
                                checked={editData.is_recurring}
                                onChange={e => setEditData('is_recurring', e.target.checked)}
                                className="w-4 h-4 text-[#009bd2] bg-white border-slate-300 rounded focus:ring-[#009bd2] cursor-pointer" 
                            />
                            <label htmlFor="edit_is_recurring" className="ml-2.5 text-[11px] sm:text-xs font-bold text-slate-600 cursor-pointer select-none">
                                Anggarkan Setiap Bulan
                            </label>
                        </div>
                    </div>

                    <div className="pt-4 sm:pt-6 flex gap-2.5 sm:gap-3">
                        <Button 
                            variant="secondary"
                            onClick={() => { resetEdit(); setIsEditModalOpen(false); setEditingBudget(null); }} 
                            className="flex-1 !py-2.5 sm:!py-3"
                        >
                            Batal
                        </Button>
                        <Button 
                            type="submit" 
                            loading={editProcessing}
                            className="flex-1 !py-2.5 sm:!py-3"
                        >
                            Simpan Perubahan
                        </Button>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}

