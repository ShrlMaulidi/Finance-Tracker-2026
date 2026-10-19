import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Dropdown from '@/Components/Dropdown';
import CurrencyInput from '@/Components/CurrencyInput';
import { Button, TabFilter, ActionButtons, Modal, ProgressBar, DeleteConfirmModal } from '@/Components/UI';
import { compressImage } from '@/Utils/imageCompressor';

export default function Target({ dbTargets = [], isFree = false, canAdd = true, currentCount = 0 }) {
    const [activeTab, setActiveTab] = useState('berjalan');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTarget, setEditingTarget] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isCompressingImage, setIsCompressingImage] = useState(false);
    
    // Inertia form
    const { data, setData, post, processing, reset, errors, clearErrors } = useForm({
        name: '',
        category: '',
        target_amount: '',
        target_date: '',
        image: null
    });

    const openAddModal = () => {
        if (isFree && !canAdd) {
            router.visit(route('berlangganan.index'));
            return;
        }
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

    const [targetToDelete, setTargetToDelete] = useState(null);
    const [isDeletingTarget, setIsDeletingTarget] = useState(false);

    const handleDelete = (item) => {
        setTargetToDelete(item);
    };

    const confirmDeleteTarget = () => {
        if (!targetToDelete) return;

        router.delete(route('tabungan.target.destroy', targetToDelete.id), {
            preserveScroll: true,
            onStart: () => setIsDeletingTarget(true),
            onSuccess: () => setTargetToDelete(null),
            onFinish: () => setIsDeletingTarget(false),
        });
    };

    const handleImageChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) {
            setData('image', null);
            setImagePreview(null);
            return;
        }

        if (!file.type.startsWith('image/')) {
            alert('Berkas harus berupa gambar (JPG, PNG, WebP).');
            return;
        }

        setImagePreview(URL.createObjectURL(file));

        try {
            setIsCompressingImage(true);
            const compressed = await compressImage(file, {
                maxWidth: 1200,
                maxHeight: 1200,
                quality: 0.85,
            });
            setData('image', compressed);
        } catch (err) {
            console.error('Target image compression error:', err);
            setData('image', file);
        } finally {
            setIsCompressingImage(false);
        }
    };

    const submit = (e) => {
        e.preventDefault();
        
        if (editingTarget) {
            post(route('tabungan.target.update', editingTarget.id), {
                forceFormData: true,
                preserveScroll: true,
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
                preserveScroll: true,
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
            <Head title="Tabungan & Target" />
            <div className="max-w-7xl mx-auto px-3.5 py-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 relative">
                
                {/* Header Page & Toolbar */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4 border-b border-slate-100 pb-3 sm:pb-4">
                    <div>
                        <p className="text-[11px] sm:text-xs font-bold text-[#009bd2] uppercase tracking-wider mb-0.5 sm:mb-1">Jangka Panjang</p>
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
                            Tabungan & Target
                        </h1>
                        <p className="text-slate-500 font-medium text-xs sm:text-sm mt-0.5 sm:mt-1">Rencanakan dan pantau pencapaian impian finansial Anda.</p>
                    </div>
                    
                    {/* Actions & Tab Navigation */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full md:w-auto">
                        <TabFilter
                            tabs={[
                                { key: 'berjalan', label: 'Sedang Berjalan', mobileLabel: 'Berjalan', count: activeTargets.length },
                                { key: 'tercapai', label: 'Sudah Tercapai', mobileLabel: 'Tercapai', count: achievedTargets.length },
                            ]}
                            activeTab={activeTab}
                            onChange={setActiveTab}
                        />
                        <Button 
                            onClick={openAddModal}
                            variant={isFree && !canAdd ? 'secondary' : 'primary'}
                            className={`min-h-[42px] ${isFree && !canAdd ? '!border-amber-300 !bg-amber-50 !text-amber-800 hover:!bg-amber-100' : ''}`}
                            icon={isFree && !canAdd ? (
                                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                            ) : (
                                <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/></svg>
                            )}
                        >
                            {isFree && !canAdd ? 'Batas Tercapai (1/1)' : 'Tambah Target'}
                        </Button>
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
                                        Kuota Gratis: {currentCount}/1 Target
                                    </span>
                                    <span className={`text-[9px] uppercase font-black px-1.5 py-0.5 rounded ${!canAdd ? 'bg-amber-200/90 text-amber-900' : 'bg-emerald-100 text-emerald-800'}`}>
                                        {!canAdd ? 'Penuh' : 'Tersedia'}
                                    </span>
                                </div>
                                <p className="text-[10px] sm:text-[11.5px] text-amber-800/80 font-medium truncate mt-0.5">
                                    {!canAdd 
                                        ? 'Batas tercapai. Upgrade ke PRO untuk tambah target tanpa batas.' 
                                        : 'Akun Gratis dibatasi maksimal 1 target impian aktif.'}
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

                {/* Tab Sedang Berjalan */}
                {activeTab === 'berjalan' && (
                    <div className="space-y-4 sm:space-y-6 animate-fade-in">
                        {activeTargets.length > 0 ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-6">
                                {activeTargets.map(item => {
                                    const percent = Math.min(100, Math.round((item.current / item.target) * 100));
                                    const remaining = Math.max(0, item.target - item.current);
                                    
                                    return (
                                        <div key={item.id} className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-md transition-all flex flex-col overflow-hidden">
                                            {/* Half-Cover Image */}
                                            {item.image_path && (
                                                <div className="w-full shrink-0 bg-slate-100 relative overflow-hidden h-28 sm:h-36">
                                                    <img src={item.image_path} alt={item.name} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                                                </div>
                                            )}

                                            <div className="p-4 sm:p-6 md:p-8 flex-1 flex flex-col justify-between">
                                                <div>
                                                    <div className="flex justify-between items-start gap-2.5 mb-3 sm:mb-5">
                                                        <div className="flex items-start sm:items-center gap-3 min-w-0">
                                                            {!item.image_path && (
                                                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#009bd2]/10 text-[#009bd2] flex items-center justify-center shrink-0">
                                                                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" strokeWidth="1.5" /><circle cx="12" cy="12" r="5" strokeWidth="1.5" /><circle cx="12" cy="12" r="1.5" strokeWidth="1.5" fill="currentColor"/></svg>
                                                                </div>
                                                            )}
                                                            <div className="min-w-0">
                                                                <h3 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 leading-snug truncate" title={item.name}>{item.name}</h3>
                                                                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                                                    <span className="text-[10px] sm:text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">{item.category}</span>
                                                                    <span className="text-[11px] sm:text-xs font-semibold text-slate-400">• Target: {item.date}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Action Dropdown */}
                                                        <div className="shrink-0 -mr-1">
                                                            <Dropdown>
                                                                <Dropdown.Trigger>
                                                                    <button className="w-8 h-8 sm:w-9 sm:h-9 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg flex items-center justify-center transition-colors focus:outline-none">
                                                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z"/></svg>
                                                                    </button>
                                                                </Dropdown.Trigger>
                                                                <Dropdown.Content align="right" width="auto" contentClasses="p-1.5 bg-white border border-slate-100 shadow-xl flex items-center gap-1 rounded-xl">
                                                                    <ActionButtons
                                                                        onEdit={() => openEditModal(item)}
                                                                        onDelete={() => handleDelete(item)}
                                                                    />
                                                                </Dropdown.Content>
                                                            </Dropdown>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Progress Bar Section */}
                                                <div className="space-y-3 sm:space-y-4 mt-3 sm:mt-6 pt-2">
                                                    <div className="flex justify-between items-end gap-2">
                                                        <div className="min-w-0">
                                                            <p className="text-xl sm:text-2xl md:text-3xl font-black text-[#009bd2] tracking-tight truncate" title={formatRp(item.current)}>{formatRp(item.current)}</p>
                                                            <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-0.5 truncate">Terkumpul dari {formatRp(item.target)}</p>
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <span className="text-base sm:text-xl font-black text-slate-800">{percent}%</span>
                                                        </div>
                                                    </div>
                                                    
                                                    <ProgressBar 
                                                        value={item.current}
                                                        max={item.target}
                                                        variant="blue"
                                                    />
                                                    
                                                    <div className="flex justify-between items-center text-xs sm:text-sm font-bold pt-0.5 sm:pt-1">
                                                        <span className="text-slate-500 truncate mr-2">Sisa {formatRp(remaining)}</span>
                                                        <Link 
                                                            href={route('transaksi.index', { type: 'tabungan' })}
                                                            className="text-[#009bd2] hover:text-[#007da8] bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 font-extrabold shrink-0 active:scale-95 min-h-[32px]"
                                                        >
                                                            + Tambah Saldo
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="bg-slate-50/70 border-2 border-dashed border-slate-200 rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-xs mb-3 sm:mb-4 text-slate-300">
                                    <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                                </div>
                                <p className="text-slate-600 font-bold text-sm sm:text-base">Belum ada target yang sedang berjalan.</p>
                                <p className="text-slate-400 text-xs sm:text-sm mt-1">Tekan tombol 'Tambah Target' untuk mulai merencanakan tabungan.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Tab Sudah Tercapai */}
                {activeTab === 'tercapai' && (
                    <div className="space-y-4 sm:space-y-6 animate-fade-in">
                        {achievedTargets.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6">
                                {achievedTargets.map(item => (
                                    <div key={item.id} className="bg-emerald-50/70 border border-emerald-200/80 p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl relative flex flex-col justify-between hover:border-emerald-300 transition-all overflow-hidden shadow-[0_8px_30px_rgb(16,185,129,0.03)]">
                                        {/* Half-Cover Image for Achieved Targets */}
                                        {item.image_path && (
                                            <div className="absolute inset-x-0 top-0 bg-slate-100 opacity-40 mix-blend-luminosity overflow-hidden h-24 sm:h-28">
                                                <img src={item.image_path} alt={item.name} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-emerald-50 to-transparent"></div>
                                            </div>
                                        )}
                                        
                                        <div className="relative z-10 flex justify-between items-start mb-4 sm:mb-6">
                                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center border border-emerald-200/50 shadow-xs shrink-0">
                                                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                                            </div>
                                            
                                            {/* Action Dropdown */}
                                            <div className="shrink-0 -mr-1">
                                                <Dropdown>
                                                    <Dropdown.Trigger>
                                                        <button className="w-8 h-8 sm:w-9 sm:h-9 text-emerald-600/70 hover:text-emerald-700 hover:bg-emerald-100/50 rounded-lg flex items-center justify-center transition-colors focus:outline-none">
                                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z"/></svg>
                                                        </button>
                                                    </Dropdown.Trigger>
                                                        <Dropdown.Content align="right" width="auto" contentClasses="p-1.5 bg-white border border-slate-100 shadow-xl flex items-center gap-1 rounded-xl">
                                                            <ActionButtons
                                                                onDelete={() => handleDelete(item)}
                                                            />
                                                        </Dropdown.Content>
                                                </Dropdown>
                                            </div>
                                        </div>

                                        <div className="relative z-10 mt-2 sm:mt-4">
                                            <h3 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 leading-tight truncate" title={item.name}>{item.name}</h3>
                                            <div className="flex items-center gap-1.5 mt-1 mb-4 sm:mb-6">
                                                <span className="text-[10px] sm:text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">{item.category}</span>
                                                <span className="text-[11px] sm:text-xs font-semibold text-slate-500">• Tercapai: {item.date}</span>
                                            </div>
                                        </div>
                                        <div className="relative z-10 pt-2 border-t border-emerald-200/50">
                                            <p className="text-[11px] sm:text-xs font-bold text-slate-500 mb-0.5">Total Terkumpul</p>
                                            <p className="text-xl sm:text-2xl font-black text-emerald-600 tracking-tight truncate" title={formatRp(item.target)}>{formatRp(item.target)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-slate-50/70 border-2 border-dashed border-slate-200 rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-xs mb-3 sm:mb-4 text-slate-300">
                                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                </div>
                                <p className="text-slate-600 font-bold text-sm sm:text-base">Belum ada target yang tercapai.</p>
                                <p className="text-slate-400 text-xs sm:text-sm mt-1">Terus menabung secara konsisten dan wujudkan impianmu!</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal Tambah/Edit Target */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => { reset(); setIsModalOpen(false); setEditingTarget(null); setImagePreview(null); }}
                title={editingTarget ? 'Edit Target' : 'Target Baru'}
                subtitle={editingTarget ? 'Perbarui informasi tujuan finansial Anda.' : 'Buat target finansial masa depan Anda.'}
                maxWidth="md"
            >
                <form onSubmit={submit} className="space-y-3.5 sm:space-y-4">
                    <div>
                        <label className="text-xs sm:text-sm font-bold text-slate-700 block mb-1 sm:mb-1.5">Nama Target</label>
                        <input 
                            type="text" 
                            value={data.name}
                            onChange={e => setData('name', e.target.value)}
                            placeholder="Contoh: Beli Rumah, Dana Darurat" 
                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2 sm:py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#009bd2] focus:ring-1 focus:ring-[#009bd2] focus:bg-white transition-colors" 
                        />
                        {errors.name && <p className="text-red-500 text-[11px] mt-1">{errors.name}</p>}
                    </div>

                    {/* Upload Gambar Section */}
                    <div>
                        <label className="text-xs sm:text-sm font-bold text-slate-700 block mb-1 sm:mb-1.5">Gambar Target (Opsional)</label>
                        <div className="relative w-full bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center overflow-hidden hover:bg-slate-100 transition-colors group cursor-pointer h-24 sm:h-28">
                            {isCompressingImage ? (
                                <div className="text-center p-3 flex flex-col items-center gap-1.5">
                                    <svg className="w-5 h-5 text-[#009bd2] animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                    </svg>
                                    <span className="text-xs font-bold text-slate-600">Mengoptimasi gambar...</span>
                                </div>
                            ) : imagePreview ? (
                                <>
                                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-white text-xs font-bold bg-black/50 px-3 py-1.5 rounded-lg">Ganti Gambar</span>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center p-3">
                                    <svg className="w-6 h-6 sm:w-7 sm:h-7 text-slate-400 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                                    <span className="text-[11px] sm:text-xs font-semibold text-slate-500">Klik untuk unggah foto impianmu</span>
                                </div>
                            )}
                            <input 
                                type="file" 
                                accept="image/*"
                                disabled={isCompressingImage}
                                onChange={handleImageChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-wait"
                            />
                        </div>
                        {errors.image && <p className="text-red-500 text-[11px] mt-1">{errors.image}</p>}
                    </div>

                    <div>
                        <label className="text-xs sm:text-sm font-bold text-slate-700 block mb-1 sm:mb-1.5">Kategori</label>
                        <select 
                            value={data.category}
                            onChange={e => setData('category', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2 sm:py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#009bd2] focus:ring-1 focus:ring-[#009bd2] focus:bg-white transition-colors cursor-pointer"
                        >
                            <option value="" disabled>Pilih Kategori</option>
                            <option value="Tabungan">Tabungan</option>
                            <option value="Kendaraan">Kendaraan</option>
                            <option value="Properti">Properti</option>
                            <option value="Liburan">Liburan</option>
                            <option value="Pendidikan">Pendidikan</option>
                            <option value="Lainnya">Lainnya</option>
                        </select>
                        {errors.category && <p className="text-red-500 text-[11px] mt-1">{errors.category}</p>}
                    </div>
                    <div>
                        <label className="text-xs sm:text-sm font-bold text-slate-700 block mb-1 sm:mb-1.5">Target Nominal</label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-2 sm:top-2.5 text-slate-400 font-bold text-xs sm:text-sm">Rp</span>
                            <CurrencyInput 
                                value={data.target_amount}
                                onValueChange={val => setData('target_amount', val)}
                                placeholder="50.000.000" 
                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl pl-10 sm:pl-12 pr-3.5 py-2 sm:py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#009bd2] focus:ring-1 focus:ring-[#009bd2] focus:bg-white font-bold transition-colors" 
                            />
                        </div>
                        {errors.target_amount && <p className="text-red-500 text-[11px] mt-1">{errors.target_amount}</p>}
                    </div>
                    <div>
                        <label className="text-xs sm:text-sm font-bold text-slate-700 block mb-1 sm:mb-1.5">Target Tanggal Tercapai</label>
                        <input 
                            type="date" 
                            value={data.target_date}
                            onChange={e => setData('target_date', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2 sm:py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#009bd2] focus:ring-1 focus:ring-[#009bd2] focus:bg-white transition-colors" 
                        />
                        {errors.target_date && <p className="text-red-500 text-[11px] mt-1">{errors.target_date}</p>}
                    </div>

                    <div className="pt-3 sm:pt-4 flex gap-2.5 sm:gap-3">
                        <Button 
                            variant="secondary"
                            onClick={() => { reset(); setIsModalOpen(false); setEditingTarget(null); setImagePreview(null); }} 
                            className="flex-1 !py-2.5 sm:!py-3"
                        >
                            Batal
                        </Button>
                        <Button 
                            type="submit" 
                            loading={processing}
                            className="flex-1 !py-2.5 sm:!py-3"
                        >
                            {editingTarget ? 'Simpan' : 'Simpan Target'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Modal Konfirmasi Hapus Target */}
            <DeleteConfirmModal
                isOpen={!!targetToDelete}
                onClose={() => setTargetToDelete(null)}
                onConfirm={confirmDeleteTarget}
                loading={isDeletingTarget}
                title="Hapus Target Tabungan"
                subtitle="Tindakan ini tidak dapat dibatalkan."
                itemTitle={targetToDelete?.name}
                itemSubtitle={targetToDelete ? `Kategori: ${targetToDelete.category}` : ''}
                itemExtra={targetToDelete ? formatRp(targetToDelete.target) : ''}
                message="Target tabungan ini akan dihapus secara permanen dari sistem."
                confirmText="Hapus Target"
            />
            
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

