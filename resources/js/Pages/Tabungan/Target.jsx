import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Dropdown from '@/Components/Dropdown';
import CurrencyInput from '@/Components/CurrencyInput';

export default function Target({ dbTargets }) {
    const [activeTab, setActiveTab] = useState('berjalan');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTarget, setEditingTarget] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [hoveredIcon, setHoveredIcon] = useState(null);
    
    // Inertia form
    const { data, setData, post, processing, reset, errors, clearErrors } = useForm({
        name: '',
        category: '',
        target_amount: '',
        target_date: '',
        image: null
    });

    const openAddModal = () => {
        setEditingTarget(null);
        clearErrors();
        reset();
        setImagePreview(null);
        setIsModalOpen(true);
    };

    const openEditModal = (item) => {
        setEditingTarget(item);
        clearErrors();
        setData({
            name: item.name,
            category: item.category,
            target_amount: item.target,
            target_date: item.raw_date || '',
            image: null
        });
        setImagePreview(item.image_path || null);
        setIsModalOpen(true);
    };

    const handleDelete = (id) => {
        if (confirm('Apakah Anda yakin ingin menghapus target ini?')) {
            router.delete(route('tabungan.target.destroy', id));
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        setData('image', file);
        if (file) {
            setImagePreview(URL.createObjectURL(file));
        } else {
            setImagePreview(null);
        }
    };

    const submit = (e) => {
        e.preventDefault();
        
        if (editingTarget) {
            post(route('tabungan.target.update', editingTarget.id), {
                forceFormData: true,
                onSuccess: () => {
                    reset();
                    setIsModalOpen(false);
                    setEditingTarget(null);
                    setImagePreview(null);
                },
            });
        } else {
            post(route('tabungan.target.store'), {
                forceFormData: true,
                onSuccess: () => {
                    reset();
                    setIsModalOpen(false);
                    setImagePreview(null);
                },
            });
        }
    };

    const formatRp = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

    const activeTargets = dbTargets.filter(t => t.status === 'Berjalan');
    const achievedTargets = dbTargets.filter(t => t.status === 'Tercapai');

    return (
        <AuthenticatedLayout>
            <Head title="Tabungan dan Target" />
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-10 space-y-6 sm:space-y-8 relative">
                
                {/* Header Page & Tabs */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-6">
                    <div>
                        <p className="text-xs md:text-sm font-bold text-[#009bd2] uppercase tracking-widest mb-1 md:mb-2">Jangka Panjang</p>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                            Tabungan & Target
                        </h1>
                    </div>
                    
                    {/* Tab Navigation */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex flex-wrap items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-2xl w-full md:w-auto">
                            <button 
                                onClick={() => setActiveTab('berjalan')}
                                className={`flex-1 md:flex-none px-4 md:px-6 py-2 md:py-2.5 rounded-xl font-bold text-[13px] md:text-sm transition-all duration-200 ${activeTab === 'berjalan' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                            >
                                Sedang Berjalan ({activeTargets.length})
                            </button>
                            <button 
                                onClick={() => setActiveTab('tercapai')}
                                className={`flex-1 md:flex-none px-4 md:px-6 py-2 md:py-2.5 rounded-xl font-bold text-[13px] md:text-sm transition-all duration-200 ${activeTab === 'tercapai' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                            >
                                Sudah Tercapai ({achievedTargets.length})
                            </button>
                        </div>
                        <button 
                            onClick={openAddModal}
                            className="bg-[#009bd2] hover:bg-[#0089ba] text-white px-5 py-3 rounded-xl font-bold transition-colors flex items-center gap-2 text-sm shadow-sm hover:shadow-md hover:-translate-y-0.5"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/></svg>
                            Tambah Baru
                        </button>
                    </div>
                </div>

                {activeTab === 'berjalan' && (
                    <div className="space-y-6 animate-fade-in">
                        {activeTargets.length > 0 ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {activeTargets.map(item => {
                                    const percent = Math.min(100, Math.round((item.current / item.target) * 100));
                                    const remaining = item.target - item.current;
                                    
                                    return (
                                        <div key={item.id} className="bg-white rounded-3xl border border-slate-200 hover:border-slate-300 transition-colors group relative overflow-hidden flex flex-col">
                                            {/* Half-Cover Image */}
                                            {item.image_path && (
                                                <div className="w-full shrink-0 bg-slate-100 relative overflow-hidden" style={{ height: '128px' }}>
                                                    <img src={item.image_path} alt={item.name} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                                                </div>
                                            )}

                                            <div className="p-6 md:p-8 flex-1 flex flex-col">
                                                <div className="flex justify-between items-start mb-6">
                                                    <div className="flex items-center gap-4">
                                                        {!item.image_path && (
                                                            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" strokeWidth="1.5" /><circle cx="12" cy="12" r="5" strokeWidth="1.5" /><circle cx="12" cy="12" r="1.5" strokeWidth="1.5" fill="currentColor"/></svg>
                                                            </div>
                                                        )}
                                                        <div>
                                                            <h3 className="text-xl font-bold text-slate-900 leading-tight">{item.name}</h3>
                                                            <p className="text-sm font-semibold text-slate-500 mt-1">{item.category} • Target: {item.date}</p>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Action Dropdown */}
                                                    <div className="flex items-center shrink-0 -mt-1 -mr-2">
                                                        <Dropdown>
                                                            <Dropdown.Trigger>
                                                                <button className="w-9 h-9 bg-transparent hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg flex items-center justify-center transition-colors focus:outline-none">
                                                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z"/></svg>
                                                                </button>
                                                            </Dropdown.Trigger>
                                                            <Dropdown.Content align="right" width="auto" contentClasses="p-1.5 bg-white border border-slate-100 shadow-xl flex items-center gap-1 rounded-xl">
                                                                <div className="relative">
                                                                    <button 
                                                                        onClick={() => openEditModal(item)} 
                                                                        onMouseEnter={() => setHoveredIcon(`edit-${item.id}`)}
                                                                        onMouseLeave={() => setHoveredIcon(null)}
                                                                        className="w-9 h-9 bg-transparent hover:bg-slate-50 text-slate-500 rounded-lg flex items-center justify-center transition-colors focus:outline-none"
                                                                    >
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                                                                    </button>
                                                                    <div 
                                                                        className="absolute bottom-full right-1/2 translate-x-1/2 mb-1.5 px-2 py-1 bg-slate-800 text-white text-[11px] font-bold rounded pointer-events-none z-30 transition-all duration-200 shadow-sm whitespace-nowrap"
                                                                        style={{ 
                                                                            opacity: hoveredIcon === `edit-${item.id}` ? 1 : 0,
                                                                            visibility: hoveredIcon === `edit-${item.id}` ? 'visible' : 'hidden',
                                                                            transform: hoveredIcon === `edit-${item.id}` ? 'translate(50%, 0)' : 'translate(50%, 4px)'
                                                                        }}
                                                                    >
                                                                        Edit
                                                                    </div>
                                                                </div>
                                                                
                                                                <div className="w-px h-5 bg-slate-100 mx-0.5"></div>

                                                                <div className="relative">
                                                                    <button 
                                                                        onClick={() => handleDelete(item.id)} 
                                                                        onMouseEnter={() => setHoveredIcon(`hapus-${item.id}`)}
                                                                        onMouseLeave={() => setHoveredIcon(null)}
                                                                        className="w-9 h-9 bg-transparent hover:bg-red-50 text-red-500 rounded-lg flex items-center justify-center transition-colors focus:outline-none"
                                                                    >
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                                                    </button>
                                                                    <div 
                                                                        className="absolute bottom-full right-1/2 translate-x-1/2 mb-1.5 px-2 py-1 bg-red-600 text-white text-[11px] font-bold rounded pointer-events-none z-30 transition-all duration-200 shadow-sm whitespace-nowrap"
                                                                        style={{ 
                                                                            opacity: hoveredIcon === `hapus-${item.id}` ? 1 : 0,
                                                                            visibility: hoveredIcon === `hapus-${item.id}` ? 'visible' : 'hidden',
                                                                            transform: hoveredIcon === `hapus-${item.id}` ? 'translate(50%, 0)' : 'translate(50%, 4px)'
                                                                        }}
                                                                    >
                                                                        Hapus
                                                                    </div>
                                                                </div>
                                                            </Dropdown.Content>
                                                        </Dropdown>
                                                    </div>
                                                </div>

                                                {/* Progress Bar Section */}
                                                <div className="space-y-4 mt-auto">
                                                    <div className="flex justify-between items-end">
                                                        <div>
                                                            <p className="text-3xl font-black text-[#009bd2] tracking-tight">{formatRp(item.current)}</p>
                                                            <p className="text-sm font-semibold text-slate-500 mt-1">Terkumpul dari {formatRp(item.target)}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-xl font-bold text-slate-800">{percent}%</span>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                                        <div 
                                                            className="h-full bg-[#009bd2] transition-all duration-1000 ease-out"
                                                            style={{ width: `${percent}%` }}
                                                        ></div>
                                                    </div>
                                                    
                                                    <div className="flex justify-between items-center text-sm font-bold pt-2">
                                                        <span className="text-slate-500">Sisa {formatRp(remaining)}</span>
                                                        <button className="text-[#009bd2] hover:text-[#007da8] transition-colors flex items-center gap-1">
                                                            + Tambah Saldo
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm mb-4">
                                    <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                                </div>
                                <p className="text-slate-500 font-bold">Belum ada target yang sedang berjalan.</p>
                                <p className="text-slate-400 text-sm mt-1">Tekan tombol 'Tambah Baru' untuk mulai menabung.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'tercapai' && (
                    <div className="space-y-6 animate-fade-in">
                        {achievedTargets.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {achievedTargets.map(item => (
                                    <div key={item.id} className="bg-emerald-50 border border-emerald-200 p-6 md:p-8 rounded-3xl group relative flex flex-col justify-between hover:border-emerald-300 transition-colors overflow-hidden">
                                        {/* Half-Cover Image for Achieved Targets (Opacity lowered for achieved look) */}
                                        {item.image_path && (
                                            <div className="absolute inset-x-0 top-0 bg-slate-100 opacity-60 mix-blend-luminosity overflow-hidden" style={{ height: '96px' }}>
                                                <img src={item.image_path} alt={item.name} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-emerald-50 to-transparent"></div>
                                            </div>
                                        )}
                                        
                                        <div className="relative z-10 flex justify-between items-start mb-5">
                                            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center border border-emerald-200/50 shadow-sm">
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                                            </div>
                                            
                                            {/* Action Dropdown */}
                                            <div className="flex items-center shrink-0 -mt-1 -mr-2">
                                                <Dropdown>
                                                    <Dropdown.Trigger>
                                                        <button className="w-9 h-9 bg-transparent hover:bg-emerald-100/50 text-emerald-600/70 hover:text-emerald-700 rounded-lg flex items-center justify-center transition-colors focus:outline-none">
                                                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z"/></svg>
                                                        </button>
                                                    </Dropdown.Trigger>
                                                    <Dropdown.Content align="right" width="auto" contentClasses="p-1.5 bg-white border border-slate-100 shadow-xl flex items-center justify-center rounded-xl">
                                                        <div className="relative">
                                                            <button 
                                                                onClick={() => handleDelete(item.id)} 
                                                                onMouseEnter={() => setHoveredIcon(`hapus-${item.id}`)}
                                                                onMouseLeave={() => setHoveredIcon(null)}
                                                                className="w-9 h-9 bg-transparent hover:bg-red-50 text-red-500 rounded-lg flex items-center justify-center transition-colors focus:outline-none"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                                            </button>
                                                            <div 
                                                                className="absolute bottom-full right-1/2 translate-x-1/2 mb-1.5 px-2 py-1 bg-red-600 text-white text-[11px] font-bold rounded pointer-events-none z-30 transition-all duration-200 shadow-sm whitespace-nowrap"
                                                                style={{ 
                                                                    opacity: hoveredIcon === `hapus-${item.id}` ? 1 : 0,
                                                                    visibility: hoveredIcon === `hapus-${item.id}` ? 'visible' : 'hidden',
                                                                    transform: hoveredIcon === `hapus-${item.id}` ? 'translate(50%, 0)' : 'translate(50%, 4px)'
                                                                }}
                                                            >
                                                                Hapus
                                                            </div>
                                                        </div>
                                                    </Dropdown.Content>
                                                </Dropdown>
                                            </div>
                                        </div>

                                        <div className="relative z-10 mt-8">
                                            <h3 className="text-xl font-bold text-slate-900 leading-tight">{item.name}</h3>
                                            <p className="text-sm font-semibold text-slate-500 mt-2 mb-8">Tercapai: {item.date}</p>
                                        </div>
                                        <div className="relative z-10">
                                            <p className="text-sm font-semibold text-slate-500 mb-1">Total Terkumpul</p>
                                            <p className="text-2xl font-black text-emerald-600 tracking-tight">{formatRp(item.target)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm mb-4">
                                    <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                </div>
                                <p className="text-slate-500 font-bold">Belum ada target yang tercapai.</p>
                                <p className="text-slate-400 text-sm mt-1">Terus menabung dan capai mimpimu!</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal Tambah/Edit Target */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => { setIsModalOpen(false); setEditingTarget(null); setImagePreview(null); }}></div>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative animate-fade-in overflow-hidden border border-slate-100 max-h-[90vh] overflow-y-auto">
                        <form onSubmit={submit} className="p-8">
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">{editingTarget ? 'Edit Target' : 'Target Baru'}</h2>
                            <p className="text-sm font-medium text-slate-500 mb-6">{editingTarget ? 'Perbarui informasi tujuan finansial Anda.' : 'Buat tujuan finansial masa depan Anda.'}</p>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-bold text-slate-700 block mb-2">Nama Target</label>
                                    <input 
                                        type="text" 
                                        value={data.name}
                                        onChange={e => setData('name', e.target.value)}
                                        placeholder="Contoh: Beli Rumah" 
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#009bd2] focus:ring-1 focus:ring-[#009bd2] focus:bg-white transition-colors" 
                                    />
                                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                                </div>

                                {/* Upload Gambar Section */}
                                <div>
                                    <label className="text-sm font-bold text-slate-700 block mb-2">Gambar Target (Opsional)</label>
                                    <div className="relative w-full bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center overflow-hidden hover:bg-slate-100 transition-colors group cursor-pointer" style={{ height: '128px' }}>
                                        {imagePreview ? (
                                            <>
                                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="text-white text-xs font-bold bg-black/50 px-3 py-1.5 rounded-lg">Ganti Gambar</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center p-4">
                                                <svg className="w-8 h-8 text-slate-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                                                <span className="text-xs font-semibold text-slate-500">Klik untuk unggah foto impianmu</span>
                                            </div>
                                        )}
                                        <input 
                                            type="file" 
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                    </div>
                                    {errors.image && <p className="text-red-500 text-xs mt-1">{errors.image}</p>}
                                </div>

                                <div>
                                    <label className="text-sm font-bold text-slate-700 block mb-2">Kategori</label>
                                    <div className="relative">
                                        <select 
                                            value={data.category}
                                            onChange={e => setData('category', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#009bd2] focus:ring-1 focus:ring-[#009bd2] focus:bg-white appearance-none transition-colors"
                                        >
                                            <option value="" disabled>Pilih Kategori</option>
                                            <option value="Tabungan">Tabungan</option>
                                            <option value="Kendaraan">Kendaraan</option>
                                            <option value="Properti">Properti</option>
                                            <option value="Liburan">Liburan</option>
                                            <option value="Pendidikan">Pendidikan</option>
                                            <option value="Lainnya">Lainnya</option>
                                        </select>
                                        <svg className="w-4 h-4 absolute right-4 top-3.5 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                                    </div>
                                    {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-slate-700 block mb-2">Target Nominal</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-2.5 text-slate-500 font-bold">Rp</span>
                                        <CurrencyInput 
                                            value={data.target_amount}
                                            onValueChange={val => setData('target_amount', val)}
                                            placeholder="50.000.000" 
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl pl-12 pr-4 py-2.5 focus:outline-none focus:border-[#009bd2] focus:ring-1 focus:ring-[#009bd2] focus:bg-white font-bold transition-colors" 
                                        />
                                    </div>
                                    {errors.target_amount && <p className="text-red-500 text-xs mt-1">{errors.target_amount}</p>}
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-slate-700 block mb-2">Target Tanggal Tercapai</label>
                                    <input 
                                        type="date" 
                                        value={data.target_date}
                                        onChange={e => setData('target_date', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#009bd2] focus:ring-1 focus:ring-[#009bd2] focus:bg-white transition-colors" 
                                    />
                                    {errors.target_date && <p className="text-red-500 text-xs mt-1">{errors.target_date}</p>}
                                </div>
                            </div>

                            <div className="mt-8 flex gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => { reset(); setIsModalOpen(false); setEditingTarget(null); setImagePreview(null); }} 
                                    className="flex-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-3 rounded-xl transition-colors"
                                >
                                    Batal
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={processing}
                                    className={`flex-1 bg-[#009bd2] hover:bg-[#0089ba] text-white font-bold py-3 rounded-xl transition-colors ${processing ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {processing ? 'Menyimpan...' : (editingTarget ? 'Simpan Perubahan' : 'Simpan Target')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            <style jsx>{`
                .animate-fade-in {
                    animation: fadeIn 0.2s ease-out forwards;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </AuthenticatedLayout>
    );
}
