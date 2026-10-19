import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import Dropdown from '@/Components/Dropdown';
import { Button, TabFilter, ActionButtons, EmptyState, Modal, DeleteConfirmModal } from '@/Components/UI';

export default function Index({ categories = [], isFree = false, canAdd = true, maxLimit = null, currentCount = 0 }) {
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
        if (isFree && !canAdd) {
            router.visit(route('berlangganan.index'));
            return;
        }
        post(route('kategori.store'), {
            preserveScroll: true,
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
            preserveScroll: true,
            onSuccess: () => {
                setIsEditModalOpen(false);
                setEditingCategory(null);
                resetEdit();
            }
        });
    };

    const [categoryToDelete, setCategoryToDelete] = useState(null);
    const [isDeletingCategory, setIsDeletingCategory] = useState(false);

    const handleDelete = (category) => {
        setCategoryToDelete(category);
    };

    const confirmDeleteCategory = () => {
        if (!categoryToDelete) return;

        router.delete(route('kategori.destroy', categoryToDelete.id), {
            preserveScroll: true,
            onStart: () => setIsDeletingCategory(true),
            onSuccess: () => setCategoryToDelete(null),
            onFinish: () => setIsDeletingCategory(false),
        });
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
                    <TabFilter
                        tabs={[
                            { key: 'pengeluaran', label: 'Kategori Pengeluaran', mobileLabel: 'Pengeluaran', count: pengeluaranCategories.length, activeColor: 'text-rose-600' },
                            { key: 'pemasukan', label: 'Kategori Pemasukan', mobileLabel: 'Pemasukan', count: pemasukanCategories.length, activeColor: 'text-emerald-600' },
                        ]}
                        activeTab={activeTab}
                        onChange={(key) => { setActiveTab(key); setData('type', key); clearErrors(); }}
                        className="!rounded-xl sm:!rounded-2xl !p-1 sm:!p-1.5"
                    />
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
                                        Kuota Gratis: {maxLimit ? `${currentCount}/${maxLimit}` : currentCount} Kategori
                                    </span>
                                    <span className={`text-[9px] uppercase font-black px-1.5 py-0.5 rounded ${!canAdd ? 'bg-amber-200/90 text-amber-900' : 'bg-emerald-100 text-emerald-800'}`}>
                                        {!canAdd ? 'Penuh' : 'Tersedia'}
                                    </span>
                                </div>
                                <p className="text-[10px] sm:text-[11.5px] text-amber-800/80 font-medium truncate mt-0.5">
                                    {!canAdd 
                                        ? 'Batas tercapai. Upgrade ke PRO untuk menambah kategori tanpa batas.' 
                                        : `Akun Gratis dibatasi maksimal ${maxLimit ?? 15} kategori.`}
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
                                        className={`w-full bg-slate-50 border-2 border-slate-100 text-slate-800 rounded-xl sm:rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 min-h-[44px] focus:outline-none focus:ring-0 focus:bg-white font-bold transition-all text-xs sm:text-sm cursor-pointer ${activeTab === 'pengeluaran' ? 'focus:border-rose-500' : 'focus:border-emerald-500'}`}
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
                                        className={`w-full bg-slate-50 border-2 border-slate-100 text-slate-800 rounded-xl sm:rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 min-h-[44px] focus:outline-none focus:ring-0 focus:bg-white font-extrabold transition-all text-xs sm:text-sm ${activeTab === 'pengeluaran' ? 'focus:border-rose-500' : 'focus:border-emerald-500'}`} 
                                    />
                                    {errors.name && <p className="text-red-500 text-[11px] sm:text-xs font-bold mt-1">{errors.name}</p>}
                                </div>

                                <Button 
                                    type={isFree && !canAdd ? "button" : "submit"}
                                    onClick={isFree && !canAdd ? () => router.visit(route('berlangganan.index')) : undefined}
                                    loading={processing}
                                    size="lg"
                                    className={`w-full !rounded-xl sm:!rounded-2xl mt-2 min-h-[46px] ${
                                        isFree && !canAdd 
                                            ? '!bg-amber-500 hover:!bg-amber-600 shadow-amber-500/25 !text-white' 
                                            : activeTab === 'pengeluaran' ? '!bg-rose-500 hover:!bg-rose-600 shadow-rose-500/25' : '!bg-emerald-500 hover:!bg-emerald-600 shadow-emerald-500/25'
                                    }`}
                                >
                                    {isFree && !canAdd ? 'Batas Tercapai (Upgrade PRO)' : 'Simpan Kategori'}
                                </Button>
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
                                        <ActionButtons
                                            variant="soft"
                                            onEdit={() => openEditModal(category)}
                                            onDelete={() => handleDelete(category)}
                                            className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                                        />
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-1 sm:col-span-2">
                                    <EmptyState
                                        title={`Belum ada kategori ${activeTab}.`}
                                        description="Buat kategori pertama Anda untuk mengelompokkan transaksi."
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Edit */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => { setIsEditModalOpen(false); setEditingCategory(null); resetEdit(); }}
                title="Edit Kategori"
                subtitle="Ubah nama kategori transaksi Anda."
                maxWidth="md"
            >
                <form onSubmit={submitEdit}>
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
                        <Button 
                            variant="secondary"
                            onClick={() => { setIsEditModalOpen(false); setEditingCategory(null); resetEdit(); }} 
                            className="flex-1 !py-2.5 sm:!py-3"
                        >
                            Batal
                        </Button>
                        <Button 
                            type="submit" 
                            loading={editProcessing}
                            className={`flex-1 !py-2.5 sm:!py-3 ${editData.type === 'pengeluaran' ? '!bg-rose-500 hover:!bg-rose-600' : '!bg-emerald-500 hover:!bg-emerald-600'}`}
                        >
                            Simpan
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Modal Konfirmasi Hapus Kategori */}
            <DeleteConfirmModal
                isOpen={!!categoryToDelete}
                onClose={() => setCategoryToDelete(null)}
                onConfirm={confirmDeleteCategory}
                loading={isDeletingCategory}
                title="Hapus Kategori"
                subtitle="Tindakan ini tidak dapat dibatalkan."
                itemTitle={categoryToDelete?.name}
                itemSubtitle={categoryToDelete ? `Tipe: ${categoryToDelete.type === 'pengeluaran' ? 'Pengeluaran' : 'Pemasukan'}` : ''}
                message="Kategori ini akan dihapus secara permanen. Transaksi yang telah menggunakan kategori ini tetap tersimpan."
                confirmText="Hapus Kategori"
            />
        </AuthenticatedLayout>
    );
}
