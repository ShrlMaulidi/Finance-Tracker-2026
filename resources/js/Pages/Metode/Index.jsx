import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { Button, ActionButtons, EmptyState, Modal } from '@/Components/UI';

export default function Index({ methods }) {
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
        post(route('metode.store'), {
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
            onSuccess: () => {
                setIsEditModalOpen(false);
                setEditingMethod(null);
                resetEdit();
            }
        });
    };

    const handleDelete = (id) => {
        if (confirm('Apakah Anda yakin ingin menghapus metode pembayaran ini?')) {
            router.delete(route('metode.destroy', id));
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Kelola Jenis Metode" />

            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-10 space-y-6 sm:space-y-10 relative">
                
                {/* Header Page */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-4">
                    <div>
                        <p className="text-xs md:text-sm font-bold text-[#009bd2] uppercase tracking-widest mb-1">Pengaturan</p>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
                            Kelola Jenis Metode
                        </h1>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Form Kiri */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 sticky top-10">
                            <h2 className="text-xl font-extrabold text-slate-800 mb-6 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#eef2ff] text-[#6366f1]">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
                                </div>
                                Tambah Metode
                            </h2>

                            <form onSubmit={submit} className="space-y-5">
                                <div>
                                    <label className="text-[13px] font-bold text-slate-600 block mb-2">Nama Metode Pembayaran</label>
                                    <input 
                                        type="text" 
                                        value={data.name}
                                        onChange={e => setData('name', e.target.value)}
                                        placeholder="Cash, Bank, E-Wallet..." 
                                        className="w-full bg-slate-50 border-2 border-slate-100 text-slate-800 rounded-2xl px-4 py-3 focus:outline-none focus:ring-0 font-extrabold transition-all focus:border-[#6366f1]" 
                                    />
                                    {errors.name && <p className="text-red-500 text-xs font-bold mt-1">{errors.name}</p>}
                                </div>

                                <Button 
                                    type="submit" 
                                    loading={processing}
                                    size="lg"
                                    className="w-full !rounded-2xl mt-2 !bg-[#6366f1] hover:!bg-[#4f46e5] text-white shadow-lg shadow-[0_10px_15px_-3px_rgba(99,102,241,0.3)] hover:-translate-y-0.5"
                                >
                                    Simpan Metode
                                </Button>
                            </form>
                        </div>
                    </div>

                    {/* List Kanan */}
                    <div className="lg:col-span-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {methods.length > 0 ? (
                                methods.map(method => (
                                    <div key={method.id} className="bg-white p-5 rounded-3xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-slate-100 hover:shadow-[0_4px_20px_rgb(0,0,0,0.04)] transition-all flex justify-between items-center group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-[#eef2ff] text-[#6366f1]">
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
                                            </div>
                                            <h3 className="text-lg font-extrabold text-slate-800">{method.name}</h3>
                                        </div>
                                        
                                        <ActionButtons
                                            variant="soft"
                                            onEdit={() => openEditModal(method)}
                                            onDelete={() => handleDelete(method.id)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity"
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
