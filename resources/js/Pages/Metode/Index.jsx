import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { Button, ActionButtons, EmptyState, Modal } from '@/Components/UI';

export default function Index({ methods = [], isFree = false, canAdd = true, maxLimit = null, currentCount = 0 }) {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingMethod, setEditingMethod] = useState(null);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        name: ''
    });

    const { data: editData, setData: setEditData, put: putEdit, processing: editProcessing, errors: editErrors, clearErrors: clearEditErrors, reset: resetEdit } = useForm({
        name: ''
    });

    const submit = (e) => {
        e.preventDefault();
        if (isFree && !canAdd) {
            router.visit(route('berlangganan.index'));
            return;
        }
        post(route('metode.store'), {
            preserveScroll: true,
            onSuccess: () => reset('name'),
        });
    };

    const openEditModal = (item) => {
        setEditingMethod(item);
        clearEditErrors();
        setEditData({
            name: item.name
        });
        setIsEditModalOpen(true);
    };

    const submitEdit = (e) => {
        e.preventDefault();
        putEdit(route('metode.update', editingMethod.id), {
            preserveScroll: true,
            onSuccess: () => {
                setIsEditModalOpen(false);
                setEditingMethod(null);
                resetEdit();
            }
        });
    };

    const handleDelete = (id) => {
        if (confirm('Apakah Anda yakin ingin menghapus metode pembayaran ini?')) {
            router.delete(route('metode.destroy', id), {
                preserveScroll: true
            });
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Kelola Jenis Metode" />

            <div className="max-w-7xl mx-auto px-3.5 py-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 relative">
                
                {/* Header Page */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4 border-b border-slate-100 pb-3 sm:pb-4">
                    <div>
                        <p className="text-[11px] sm:text-xs font-bold text-[#009bd2] uppercase tracking-wider mb-0.5 sm:mb-1">Pengaturan</p>
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
                            Kelola Jenis Metode
                        </h1>
                    </div>
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
                                        Kuota Gratis: {currentCount}/3 Metode
                                    </span>
                                    <span className={`text-[9px] uppercase font-black px-1.5 py-0.5 rounded ${!canAdd ? 'bg-amber-200/90 text-amber-900' : 'bg-emerald-100 text-emerald-800'}`}>
                                        {!canAdd ? 'Penuh' : 'Tersedia'}
                                    </span>
                                </div>
                                <p className="text-[10px] sm:text-[11.5px] text-amber-800/80 font-medium truncate mt-0.5">
                                    {!canAdd 
                                        ? 'Batas tercapai. Upgrade ke PRO untuk menambah metode tanpa batas.' 
                                        : 'Akun Gratis dibatasi maksimal 3 metode pembayaran kustom.'}
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
                        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-100 lg:sticky lg:top-8">
                            <h2 className="text-base sm:text-xl font-extrabold text-slate-800 mb-4 sm:mb-6 flex items-center gap-2.5 sm:gap-3">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-[#eef2ff] text-[#6366f1] shrink-0">
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
                                </div>
                                Tambah Metode
                            </h2>

                            <form onSubmit={submit} className="space-y-3.5 sm:space-y-4">
                                <div>
                                    <label className="text-xs sm:text-[13px] font-bold text-slate-600 block mb-1.5 sm:mb-2">Nama Metode Pembayaran</label>
                                    <input 
                                        type="text" 
                                        value={data.name}
                                        onChange={e => setData('name', e.target.value)}
                                        placeholder="Cash, Bank, E-Wallet..." 
                                        className="w-full bg-slate-50 border-2 border-slate-100 text-slate-800 rounded-xl sm:rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 focus:outline-none focus:ring-0 focus:bg-white font-extrabold transition-all text-xs sm:text-sm focus:border-[#6366f1]" 
                                    />
                                    {errors.name && <p className="text-red-500 text-[11px] sm:text-xs font-bold mt-1">{errors.name}</p>}
                                </div>

                                <Button 
                                    type={isFree && !canAdd ? "button" : "submit"}
                                    onClick={isFree && !canAdd ? () => router.visit(route('berlangganan.index')) : undefined}
                                    loading={processing}
                                    size="lg"
                                    className={`w-full !rounded-xl sm:!rounded-2xl mt-2 ${
                                        isFree && !canAdd
                                            ? '!bg-amber-500 hover:!bg-amber-600 shadow-amber-500/25 !text-white'
                                            : '!bg-[#6366f1] hover:!bg-[#4f46e5] text-white shadow-md shadow-indigo-500/25'
                                    }`}
                                >
                                    {isFree && !canAdd ? 'Batas Tercapai (Upgrade PRO)' : 'Simpan Metode'}
                                </Button>
                            </form>
                        </div>
                    </div>

                    {/* List Kanan */}
                    <div className="lg:col-span-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
                            {methods.length > 0 ? (
                                methods.map(method => (
                                    <div key={method.id} className="bg-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl shadow-[0_2px_8px_rgb(0,0,0,0.02)] border border-slate-100 hover:border-slate-200 transition-all flex justify-between items-center gap-3 group">
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 bg-[#eef2ff] text-[#6366f1]">
                                                <svg className="w-4.5 h-4.5 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
                                            </div>
                                            <h3 className="text-xs sm:text-base font-extrabold text-slate-800 truncate">{method.name}</h3>
                                        </div>
                                        
                                        <ActionButtons
                                            variant="soft"
                                            onEdit={() => openEditModal(method)}
                                            onDelete={() => handleDelete(method.id)}
                                            className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                                        />
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-1 sm:col-span-2">
                                    <EmptyState
                                        title="Belum ada metode pembayaran."
                                        description="Tambahkan metode pembayaran pertama Anda (seperti Cash, BCA, OVO)."
                                        icon={<svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>}
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
                onClose={() => { setIsEditModalOpen(false); setEditingMethod(null); resetEdit(); }}
                title="Edit Metode"
                subtitle="Ubah nama metode pembayaran Anda."
                maxWidth="md"
            >
                <form onSubmit={submitEdit}>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-bold text-slate-700 block mb-2">Nama Metode</label>
                            <input 
                                type="text" 
                                value={editData.name}
                                onChange={e => setEditData('name', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 font-bold focus:border-[#6366f1] focus:ring-[#6366f1]" 
                            />
                            {editErrors.name && <p className="text-red-500 text-xs mt-1">{editErrors.name}</p>}
                        </div>
                    </div>

                    <div className="mt-8 flex gap-3">
                        <Button 
                            variant="secondary"
                            onClick={() => { setIsEditModalOpen(false); setEditingMethod(null); resetEdit(); }} 
                            className="flex-1 !py-3"
                        >
                            Batal
                        </Button>
                        <Button 
                            type="submit" 
                            loading={editProcessing}
                            className="flex-1 !py-3 !bg-[#6366f1] hover:!bg-[#4f46e5] text-white"
                        >
                            Simpan
                        </Button>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
