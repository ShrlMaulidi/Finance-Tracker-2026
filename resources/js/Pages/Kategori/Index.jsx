import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import Dropdown from '@/Components/Dropdown';

export default function Index({ categories }) {
    const [activeTab, setActiveTab] = useState('pengeluaran');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        type: 'pengeluaran',
        name: ''
    });

    const { data: editData, setData: setEditData, put: putEdit, processing: editProcessing, errors: editErrors, clearErrors: clearEditErrors, reset: resetEdit } = useForm({
        type: 'pengeluaran',
        name: ''
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('kategori.store'), {
            onSuccess: () => reset('name'),
        });
    };

    const openEditModal = (item) => {
        setEditingCategory(item);
        clearEditErrors();
        setEditData({
            type: item.type,
            name: item.name
        });
        setIsEditModalOpen(true);
    };

    const submitEdit = (e) => {
        e.preventDefault();
        putEdit(route('kategori.update', editingCategory.id), {
            onSuccess: () => {
                setIsEditModalOpen(false);
                setEditingCategory(null);
                resetEdit();
            }
        });
    };

    const handleDelete = (id) => {
        if (confirm('Apakah Anda yakin ingin menghapus kategori ini?')) {
            router.delete(route('kategori.destroy', id));
        }
    };

    const pengeluaranCategories = categories.filter(c => c.type === 'pengeluaran');
    const pemasukanCategories = categories.filter(c => c.type === 'pemasukan');

    return (
        <AuthenticatedLayout>
            <Head title="Kelola Kategori Transaksi" />

            <div className="max-w-7xl mx-auto px-3.5 py-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 relative">
                
                {/* Header Page & Tabs */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4 border-b border-slate-100 pb-3 sm:pb-4">
                    <div>
                        <p className="text-[11px] sm:text-xs font-bold text-[#009bd2] uppercase tracking-wider mb-0.5 sm:mb-1">Pengaturan</p>
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
                            Kelola Kategori
                        </h1>
                    </div>
                    
                    {/* Tab Navigation (Segmented Control on mobile) */}
                    <div className="flex items-center w-full md:w-auto bg-slate-100/90 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl gap-1 sm:gap-1.5">
                        <button 
                            type="button"
                            onClick={() => { setActiveTab('pengeluaran'); setData('type', 'pengeluaran'); clearErrors(); }}
                            className={`flex-1 md:flex-none px-3.5 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-extrabold text-xs sm:text-sm transition-all duration-300 text-center ${activeTab === 'pengeluaran' ? 'bg-white text-rose-600 shadow-[0_2px_8px_rgba(0,0,0,0.06)]' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Kategori Pengeluaran ({pengeluaranCategories.length})
                        </button>
                        <button 
                            type="button"
                            onClick={() => { setActiveTab('pemasukan'); setData('type', 'pemasukan'); clearErrors(); }}
                            className={`flex-1 md:flex-none px-3.5 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-extrabold text-xs sm:text-sm transition-all duration-300 text-center ${activeTab === 'pemasukan' ? 'bg-white text-emerald-600 shadow-[0_2px_8px_rgba(0,0,0,0.06)]' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Kategori Pemasukan ({pemasukanCategories.length})
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                    {/* Form Kiri */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-100 lg:sticky lg:top-8">
                            <h2 className="text-base sm:text-xl font-extrabold text-slate-800 mb-4 sm:mb-6 flex items-center gap-2.5 sm:gap-3">
                                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${activeTab === 'pengeluaran' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                                </div>
                                Buat Kategori Baru
                            </h2>

                            <form onSubmit={submit} className="space-y-3.5 sm:space-y-4">
                                <div>
                                    <label className="text-xs sm:text-[13px] font-bold text-slate-600 block mb-1.5 sm:mb-2">Tipe Kategori</label>
                                    <select 
                                        value={data.type}
                                        onChange={e => {
                                            setData('type', e.target.value);
                                            setActiveTab(e.target.value);
                                        }}
                                        className={`w-full bg-slate-50 border-2 border-slate-100 text-slate-800 rounded-xl sm:rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 focus:outline-none focus:ring-0 focus:bg-white font-bold transition-all text-xs sm:text-sm cursor-pointer ${activeTab === 'pengeluaran' ? 'focus:border-rose-500' : 'focus:border-emerald-500'}`}
                                    >
                                        <option value="pengeluaran">Pengeluaran</option>
                                        <option value="pemasukan">Pemasukan</option>
                                    </select>
                                    {errors.type && <p className="text-red-500 text-[11px] sm:text-xs font-bold mt-1">{errors.type}</p>}
                                </div>

                                <div>
                                    <label className="text-xs sm:text-[13px] font-bold text-slate-600 block mb-1.5 sm:mb-2">Nama Kategori</label>
                                    <input 
                                        type="text" 
                                        value={data.name}
                                        onChange={e => setData('name', e.target.value)}
                                        placeholder={activeTab === 'pengeluaran' ? 'Makan & Minum...' : 'Gaji Bulanan...'} 
                                        className={`w-full bg-slate-50 border-2 border-slate-100 text-slate-800 rounded-xl sm:rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 focus:outline-none focus:ring-0 focus:bg-white font-extrabold transition-all text-xs sm:text-sm ${activeTab === 'pengeluaran' ? 'focus:border-rose-500' : 'focus:border-emerald-500'}`} 
                                    />
                                    {errors.name && <p className="text-red-500 text-[11px] sm:text-xs font-bold mt-1">{errors.name}</p>}
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={processing}
                                    className={`w-full text-white py-3 sm:py-3.5 rounded-xl sm:rounded-2xl font-black text-sm sm:text-base transition-all shadow-md active:scale-[0.99] mt-2 ${processing ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-0.5'} ${activeTab === 'pengeluaran' ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/25' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/25'}`}
                                >
                                    {processing ? 'Menyimpan...' : 'Simpan Kategori'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* List Kanan */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center justify-between mb-3 sm:mb-4 px-1">
                            <h2 className="text-xs sm:text-base font-extrabold text-slate-700">
                                Daftar Kategori {activeTab === 'pengeluaran' ? 'Pengeluaran' : 'Pemasukan'}
                            </h2>
                            <span className="text-[10px] sm:text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                                {(activeTab === 'pengeluaran' ? pengeluaranCategories : pemasukanCategories).length} Kategori
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
                            {(activeTab === 'pengeluaran' ? pengeluaranCategories : pemasukanCategories).length > 0 ? (
                                (activeTab === 'pengeluaran' ? pengeluaranCategories : pemasukanCategories).map(category => (
                                    <div key={category.id} className="bg-white p-3.5 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl shadow-[0_2px_8px_rgb(0,0,0,0.02)] border border-slate-100 hover:border-slate-200 hover:shadow-[0_4px_16px_rgb(0,0,0,0.04)] transition-all flex justify-between items-center gap-3 group">
                                        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                                            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 ${activeTab === 'pengeluaran' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                                {activeTab === 'pengeluaran' ? (
                                                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                                                ) : (
                                                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                )}
                                            </div>
                                            <h3 className="text-xs sm:text-base font-extrabold text-slate-800 truncate">{category.name}</h3>
                                        </div>
                                        
                                        {/* Action Buttons: always accessible on mobile, hover on desktop */}
                                        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                                            <button 
                                                onClick={() => openEditModal(category)} 
                                                className="w-8 h-8 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-600 rounded-lg flex items-center justify-center transition-colors"
                                                title="Edit Kategori"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(category.id)} 
                                                className="w-8 h-8 bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-500 rounded-lg flex items-center justify-center transition-colors"
                                                title="Hapus Kategori"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-1 sm:col-span-2 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl sm:rounded-[2.5rem] p-8 sm:p-16 text-center">
                                    <div className="w-14 h-14 sm:w-20 sm:h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm mb-4 sm:mb-6">
                                        <svg className="w-7 h-7 sm:w-10 sm:h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                                    </div>
                                    <p className="text-slate-600 font-extrabold text-sm sm:text-lg">Belum ada kategori {activeTab}.</p>
                                    <p className="text-slate-400 text-xs sm:text-sm mt-1 sm:mt-2 font-medium">Buat kategori pertama Anda untuk mengelompokkan transaksi.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Edit */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => { setIsEditModalOpen(false); setEditingCategory(null); resetEdit(); }}></div>
                    <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-md relative overflow-hidden border border-slate-100 z-10 animate-fade-in">
                        <form onSubmit={submitEdit} className="p-4 sm:p-6 md:p-8">
                            <div className="flex items-start justify-between mb-4 sm:mb-6">
                                <div>
                                    <h2 className="text-lg sm:text-2xl font-extrabold text-slate-900">Edit Kategori</h2>
                                    <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">Ubah nama kategori transaksi Anda.</p>
                                </div>
                                <button 
                                    type="button" 
                                    onClick={() => { setIsEditModalOpen(false); setEditingCategory(null); resetEdit(); }}
                                    className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center -mr-1 -mt-1 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                            
                            <div className="space-y-3.5 sm:space-y-4">
                                <div>
                                    <label className="text-xs sm:text-sm font-bold text-slate-700 block mb-1.5 sm:mb-2">Tipe Kategori</label>
                                    <select 
                                        value={editData.type}
                                        onChange={e => setEditData('type', e.target.value)}
                                        className={`w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2 sm:px-4 sm:py-2.5 focus:outline-none focus:ring-1 font-bold text-xs sm:text-sm cursor-pointer ${editData.type === 'pengeluaran' ? 'focus:border-rose-500 focus:ring-rose-500' : 'focus:border-emerald-500 focus:ring-emerald-500'}`}
                                    >
                                        <option value="pengeluaran">Pengeluaran</option>
                                        <option value="pemasukan">Pemasukan</option>
                                    </select>
                                    {editErrors.type && <p className="text-red-500 text-[11px] sm:text-xs mt-1 font-bold">{editErrors.type}</p>}
                                </div>

                                <div>
                                    <label className="text-xs sm:text-sm font-bold text-slate-700 block mb-1.5 sm:mb-2">Nama Kategori</label>
                                    <input 
                                        type="text" 
                                        value={editData.name}
                                        onChange={e => setEditData('name', e.target.value)}
                                        className={`w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2 sm:px-4 sm:py-2.5 focus:outline-none focus:ring-1 font-bold text-xs sm:text-sm ${editData.type === 'pengeluaran' ? 'focus:border-rose-500 focus:ring-rose-500' : 'focus:border-emerald-500 focus:ring-emerald-500'}`} 
                                    />
                                    {editErrors.name && <p className="text-red-500 text-[11px] sm:text-xs mt-1 font-bold">{editErrors.name}</p>}
                                </div>
                            </div>

                            <div className="mt-6 sm:mt-8 flex gap-2.5 sm:gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => { setIsEditModalOpen(false); setEditingCategory(null); resetEdit(); }} 
                                    className="flex-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-2.5 sm:py-3 rounded-xl transition-colors text-xs sm:text-sm"
                                >
                                    Batal
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={editProcessing}
                                    className={`flex-1 text-white font-bold py-2.5 sm:py-3 rounded-xl transition-all shadow-md text-xs sm:text-sm ${editProcessing ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-0.5'} ${editData.type === 'pengeluaran' ? 'bg-rose-500' : 'bg-emerald-500'}`}
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
