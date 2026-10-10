import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';

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

                                <button 
                                    type="submit" 
                                    disabled={processing}
                                    className={`w-full py-3.5 rounded-2xl font-extrabold transition-all shadow-lg hover:-translate-y-0.5 mt-2 shadow-[0_10px_15px_-3px_rgba(99,102,241,0.3)] ${processing ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    style={{ backgroundColor: '#6366f1', color: '#ffffff' }}
                                >
                                    {processing ? 'Menyimpan...' : 'Simpan Metode'}
                                </button>
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
                                        
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openEditModal(method)} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg transition-colors">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                                            </button>
                                            <button onClick={() => handleDelete(method.id)} className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-1 sm:col-span-2 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] p-16 text-center">
                                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm mb-6">
                                        <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
                                    </div>
                                    <p className="text-slate-500 font-extrabold text-lg">Belum ada metode pembayaran.</p>
                                    <p className="text-slate-400 text-sm mt-2 font-medium">Tambahkan metode pembayaran pertama Anda (seperti Cash, BCA, OVO).</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Edit */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => { setIsEditModalOpen(false); setEditingMethod(null); resetEdit(); }}></div>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative overflow-hidden border border-slate-100 z-10 animate-fade-in">
                        <form onSubmit={submitEdit} className="p-6 md:p-8">
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">Edit Metode</h2>
                            <p className="text-sm font-medium text-slate-500 mb-6">Ubah nama metode pembayaran Anda.</p>
                            
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
                                <button 
                                    type="button" 
                                    onClick={() => { setIsEditModalOpen(false); setEditingMethod(null); resetEdit(); }} 
                                    className="flex-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-3 rounded-xl transition-colors"
                                >
                                    Batal
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={editProcessing}
                                    className={`flex-1 font-bold py-3 rounded-xl transition-all shadow-md ${editProcessing ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-0.5'}`}
                                    style={{ backgroundColor: '#6366f1', color: '#ffffff' }}
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
