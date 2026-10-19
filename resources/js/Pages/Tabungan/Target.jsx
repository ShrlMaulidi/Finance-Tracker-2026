import React, { useState, useEffect } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Dropdown from '@/Components/Dropdown';
import CurrencyInput from '@/Components/CurrencyInput';
import { Button, KpiCard, TabFilter, ActionButtons, Modal, DeleteConfirmModal } from '@/Components/UI';
import { compressImage } from '@/Utils/imageCompressor';
import useOptimisticList from '@/Utils/useOptimisticList';

export default function Target({ dbTargets = [], isFree = false, canAdd = true, currentCount = 0 }) {
    const [activeTab, setActiveTab] = useState('berjalan');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTarget, setEditingTarget] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isCompressingImage, setIsCompressingImage] = useState(false);
    const optimisticTargets = useOptimisticList(dbTargets);
    
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

    // Full-screen photo viewer
    const [viewedPhoto, setViewedPhoto] = useState(null); // { src, name }

    useEffect(() => {
        if (!viewedPhoto) {
            return undefined;
        }
        const closeOnEscape = (e) => e.key === 'Escape' && setViewedPhoto(null);
        document.addEventListener('keydown', closeOnEscape);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', closeOnEscape);
            document.body.style.overflow = '';
        };
    }, [viewedPhoto]);

    const handleDelete = (item) => {
        setTargetToDelete(item);
    };

    const confirmDeleteTarget = () => {
        if (!targetToDelete) return;

        const settle = optimisticTargets.remove(targetToDelete.id);
        router.delete(route('tabungan.target.destroy', targetToDelete.id), {
            preserveScroll: true,
            async: true,
            onFinish: settle,
        });
        setTargetToDelete(null);
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

    // Close the modal and show the change instantly; the upload/save finishes in the background.
    // If validation fails, the list reverts by itself and the modal reopens with the errors.
    const submit = (e) => {
        e.preventDefault();

        const targetBeingEdited = editingTarget;
        const optimisticTarget = {
            name: data.name,
            category: data.category,
            target: Number(data.target_amount) || 0,
            raw_date: data.target_date || null,
            date: data.target_date
                ? new Date(data.target_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                : '-',
            image_path: imagePreview,
        };
        const settle = targetBeingEdited
            ? optimisticTargets.update({ ...optimisticTarget, id: targetBeingEdited.id })
            : optimisticTargets.add({ ...optimisticTarget, current: 0, status: 'Berjalan' });

        setIsModalOpen(false);
        setEditingTarget(null);

        post(targetBeingEdited ? route('tabungan.target.update', targetBeingEdited.id) : route('tabungan.target.store'), {
            forceFormData: true,
            preserveScroll: true,
            async: true,
            onError: () => {
                setEditingTarget(targetBeingEdited);
                setIsModalOpen(true);
            },
            onFinish: settle,
        });
    };

    const formatRp = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

    const activeTargets = optimisticTargets.items.filter(t => t.status === 'Berjalan');
    const achievedTargets = optimisticTargets.items.filter(t => t.status === 'Tercapai');

    // Combined progress of all running targets for the summary card
    const overallSaved = activeTargets.reduce((sum, t) => sum + (Number(t.current) || 0), 0);
    const overallGoal = activeTargets.reduce((sum, t) => sum + (Number(t.target) || 0), 0);
    const overallPercent = overallGoal > 0 ? Math.min(100, Math.round((overallSaved / overallGoal) * 100)) : 0;

    return (
        <AuthenticatedLayout>
            <Head title="Tabungan & Target" />
            <div className="max-w-7xl mx-auto px-3.5 py-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">

                {/* Desktop Header (same layout as Tagihan Rutin) */}
                <div className="hidden md:flex md:items-end justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                        <p className="text-xs font-bold text-[#009bd2] uppercase tracking-wider mb-1">Jangka Panjang</p>
                        <h1 className="text-2xl lg:text-3xl font-black text-slate-800 tracking-tight">Tabungan & Target</h1>
                        <p className="text-slate-500 font-medium text-sm mt-1">Rencanakan dan pantau pencapaian target finansial Anda.</p>
                    </div>
                    <Button
                        onClick={openAddModal}
                        variant={isFree && !canAdd ? 'secondary' : 'primary'}
                        className={isFree && !canAdd ? '!border-amber-300 !bg-amber-50 !text-amber-800 hover:!bg-amber-100' : ''}
                        icon={isFree && !canAdd ? (
                            <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/></svg>
                        )}
                    >
                        {isFree && !canAdd ? 'Batas Tercapai (1/1)' : 'Tambah Target'}
                    </Button>
                </div>

                {/* Mobile Header */}
                <div className="flex md:hidden items-center justify-between gap-3">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Tabungan & Target</h1>
                    <Button
                        size="sm"
                        onClick={openAddModal}
                        variant={isFree && !canAdd ? 'secondary' : 'primary'}
                        className={`!rounded-full ${isFree && !canAdd ? '!border-amber-300 !bg-amber-50 !text-amber-800 hover:!bg-amber-100' : ''}`}
                        icon={isFree && !canAdd ? (
                            <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                        ) : (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/></svg>
                        )}
                    >
                        {isFree && !canAdd ? 'Batas 1/1' : 'Target'}
                    </Button>
                </div>

                {/* Free tier: one-line quota notice */}
                {isFree && (
                    <div className="flex items-center justify-between gap-3 rounded-2xl bg-amber-50/80 px-4 py-2.5">
                        <span className="text-xs font-semibold text-amber-900 truncate">
                            Paket gratis · {currentCount}/1 target
                        </span>
                        <Link href={route('berlangganan.index')} className="text-xs font-bold text-amber-700 hover:text-amber-900 shrink-0">
                            Upgrade
                        </Link>
                    </div>
                )}

                {/* KPI Summary - Desktop (same cards as Tagihan Rutin) */}
                <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <KpiCard
                        title="Total Target"
                        value={formatRp(overallGoal)}
                        subtitle={`${activeTargets.length} target berjalan`}
                        variant="primary"
                        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" strokeWidth={2} /><circle cx="12" cy="12" r="4.5" strokeWidth={2} /><circle cx="12" cy="12" r="1" strokeWidth={2} fill="currentColor" /></svg>}
                    />
                    <KpiCard
                        title="Sudah Terkumpul"
                        value={formatRp(overallSaved)}
                        subtitle={`${overallPercent}% dari total target`}
                        variant="success"
                        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>}
                    />
                    <KpiCard
                        title="Sisa Target"
                        value={formatRp(Math.max(0, overallGoal - overallSaved))}
                        subtitle="Yang masih perlu ditabung"
                        variant="warning"
                        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    />
                    <KpiCard
                        title="Target Tercapai"
                        value={`${achievedTargets.length} Target`}
                        subtitle={achievedTargets.length > 0 ? 'Selamat, terus pertahankan!' : 'Belum ada yang tercapai'}
                        variant="default"
                        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>}
                    />
                </div>

                {/* Overall progress of running targets (phones) */}
                {activeTargets.length > 0 && (
                    <div className="sm:hidden bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-5">
                        <p className="text-xs font-semibold text-slate-400">Total terkumpul</p>
                        <div className="flex items-baseline justify-between gap-3 mt-1">
                            <p className="text-[28px] sm:text-3xl leading-tight font-extrabold text-slate-900 tracking-tight tabular-nums truncate">
                                {formatRp(overallSaved)}
                            </p>
                            <span className="text-sm font-bold text-slate-400 tabular-nums shrink-0">{overallPercent}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-4">
                            <div className="h-full bg-[#009bd2] rounded-full transition-all duration-500" style={{ width: `${overallPercent}%` }} />
                        </div>
                        <p className="text-[11px] font-medium text-slate-400 mt-2">dari {formatRp(overallGoal)} · {activeTargets.length} target berjalan</p>
                    </div>
                )}

                {/* Desktop Toolbar (same as Tagihan Rutin) */}
                <div className="hidden sm:flex items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-xs">
                    <TabFilter
                        tabs={[
                            {
                                key: 'berjalan',
                                label: 'Sedang Berjalan',
                                count: activeTargets.length,
                                icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" strokeWidth={2} /><circle cx="12" cy="12" r="4.5" strokeWidth={2} /></svg>,
                            },
                            {
                                key: 'tercapai',
                                label: 'Sudah Tercapai',
                                count: achievedTargets.length,
                                icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
                            },
                        ]}
                        activeTab={activeTab}
                        onChange={setActiveTab}
                        activeColor="text-slate-800"
                    />
                </div>

                {/* Tabs (phones) */}
                <div className="flex sm:hidden items-center gap-1">
                    {[
                        { key: 'berjalan', label: 'Berjalan', count: activeTargets.length },
                        { key: 'tercapai', label: 'Tercapai', count: achievedTargets.length },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setActiveTab(tab.key)}
                            className={`h-8 sm:h-9 px-3.5 rounded-full text-xs sm:text-sm font-semibold transition flex items-center gap-1 ${
                                activeTab === tab.key ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            {tab.label}
                            <span className={activeTab === tab.key ? 'text-white/60' : 'text-slate-300'}>{tab.count}</span>
                        </button>
                    ))}
                </div>

                {/* Running targets */}
                {activeTab === 'berjalan' && (
                    activeTargets.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                            {activeTargets.map(item => {
                                const percent = item.target > 0 ? Math.min(100, Math.round((item.current / item.target) * 100)) : 0;
                                const remaining = Math.max(0, item.target - item.current);

                                return (
                                    <div key={item.id} className={`bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-4 sm:p-5 ${item.isOptimistic ? 'opacity-60' : ''}`}>
                                        <div className="flex items-center gap-3">
                                            {item.image_path ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setViewedPhoto({ src: item.image_path, name: item.name })}
                                                    className="shrink-0 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#009bd2] active:scale-95 transition"
                                                    aria-label={`Lihat foto ${item.name}`}
                                                >
                                                    <img src={item.image_path} alt={item.name} className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl object-cover bg-slate-100" />
                                                </button>
                                            ) : (
                                                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-sky-50 text-[#009bd2] flex items-center justify-center shrink-0">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" strokeWidth={2} /><circle cx="12" cy="12" r="4.5" strokeWidth={2} /><circle cx="12" cy="12" r="1" strokeWidth={2} fill="currentColor" /></svg>
                                                </div>
                                            )}

                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-sm sm:text-base font-bold text-slate-800 leading-snug line-clamp-2 break-words" title={item.name}>{item.name}</h3>
                                                <p className="text-[11px] sm:text-xs font-medium text-slate-400 truncate mt-0.5">
                                                    {[item.category, item.date !== '-' ? item.date : null].filter(Boolean).join(' · ')}
                                                </p>
                                            </div>

                                            {/* Action menu (hidden until the server confirms a just-saved item) */}
                                            <div className={`shrink-0 -mr-2 ${item.isOptimistic ? 'invisible' : ''}`}>
                                                <Dropdown>
                                                    <Dropdown.Trigger>
                                                        <button className="w-8 h-8 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-full flex items-center justify-center transition-colors focus:outline-none" aria-label="Menu Opsi">
                                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z"/></svg>
                                                        </button>
                                                    </Dropdown.Trigger>
                                                    <Dropdown.Content align="right" width="auto" contentClasses="p-1 bg-white border border-slate-100 shadow-xl flex items-center rounded-xl">
                                                        <ActionButtons
                                                            size="sm"
                                                            variant="transparent"
                                                            onEdit={() => openEditModal(item)}
                                                            onDelete={() => handleDelete(item)}
                                                        />
                                                    </Dropdown.Content>
                                                </Dropdown>
                                            </div>
                                        </div>

                                        <div className="mt-4 flex items-baseline justify-between gap-2">
                                            <p className="min-w-0 truncate">
                                                <span className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight tabular-nums">{formatRp(item.current)}</span>
                                                <span className="text-xs font-medium text-slate-400"> / {formatRp(item.target)}</span>
                                            </p>
                                            <span className="text-sm font-bold text-[#009bd2] tabular-nums shrink-0">{percent}%</span>
                                        </div>

                                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2.5">
                                            <div className="h-full bg-[#009bd2] rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
                                        </div>

                                        <div className="mt-3 flex items-center justify-between gap-2">
                                            <span className="text-[11px] sm:text-xs font-medium text-slate-400 truncate">Sisa {formatRp(remaining)}</span>
                                            <Link
                                                href={route('transaksi.index', { type: 'tabungan' })}
                                                className="h-7 px-3 rounded-full text-[11px] sm:text-xs font-bold text-[#009bd2] hover:bg-[#009bd2]/10 flex items-center transition shrink-0"
                                            >
                                                + Tambah saldo
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl border border-slate-100 min-h-[220px] flex flex-col items-center justify-center text-center px-6">
                            <div className="w-14 h-14 rounded-full bg-slate-50 text-slate-300 flex items-center justify-center mb-3">
                                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" strokeWidth={1.75} /><circle cx="12" cy="12" r="4.5" strokeWidth={1.75} /></svg>
                            </div>
                            <p className="text-slate-500 font-bold text-sm">Belum ada target berjalan</p>
                        </div>
                    )
                )}

                {/* Achieved targets */}
                {activeTab === 'tercapai' && (
                    achievedTargets.length > 0 ? (
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] divide-y divide-slate-100">
                            {achievedTargets.map(item => (
                                <div key={item.id} className={`flex items-center gap-3 px-4 sm:px-5 py-3.5 ${item.isOptimistic ? 'opacity-60' : ''}`}>
                                    {item.image_path ? (
                                        <button
                                            type="button"
                                            onClick={() => setViewedPhoto({ src: item.image_path, name: item.name })}
                                            className="shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#009bd2] active:scale-95 transition"
                                            aria-label={`Lihat foto ${item.name}`}
                                        >
                                            <img src={item.image_path} alt={item.name} className="w-10 h-10 rounded-full object-cover bg-slate-100" />
                                        </button>
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                                        </div>
                                    )}

                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-sm sm:text-[15px] font-bold text-slate-800 leading-snug line-clamp-2 break-words" title={item.name}>{item.name}</h3>
                                        <p className="text-[11px] sm:text-xs font-medium text-slate-400 truncate mt-0.5">
                                            {item.category} · <span className="text-emerald-600">Tercapai</span>
                                        </p>
                                    </div>

                                    <span className="text-sm sm:text-base font-extrabold text-slate-800 tracking-tight tabular-nums shrink-0">{formatRp(item.target)}</span>

                                    <div className={`shrink-0 -mr-2 ${item.isOptimistic ? 'invisible' : ''}`}>
                                        <Dropdown>
                                            <Dropdown.Trigger>
                                                <button className="w-8 h-8 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-full flex items-center justify-center transition-colors focus:outline-none" aria-label="Menu Opsi">
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z"/></svg>
                                                </button>
                                            </Dropdown.Trigger>
                                            <Dropdown.Content align="right" width="auto" contentClasses="p-1 bg-white border border-slate-100 shadow-xl flex items-center rounded-xl">
                                                <ActionButtons
                                                    size="sm"
                                                    variant="transparent"
                                                    onDelete={() => handleDelete(item)}
                                                />
                                            </Dropdown.Content>
                                        </Dropdown>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl border border-slate-100 min-h-[220px] flex flex-col items-center justify-center text-center px-6">
                            <div className="w-14 h-14 rounded-full bg-slate-50 text-slate-300 flex items-center justify-center mb-3">
                                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                            </div>
                            <p className="text-slate-500 font-bold text-sm">Belum ada target tercapai</p>
                        </div>
                    )
                )}
            </div>

            {/* Full-screen photo viewer: tap the backdrop, the close button or press Esc to close */}
            {viewedPhoto && (
                <div
                    className="fixed inset-0 z-[80] bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(1rem+env(safe-area-inset-bottom))]"
                    onClick={() => setViewedPhoto(null)}
                    role="dialog"
                    aria-modal="true"
                    aria-label={`Foto ${viewedPhoto.name}`}
                >
                    <button
                        type="button"
                        onClick={() => setViewedPhoto(null)}
                        className="absolute top-[calc(1rem+env(safe-area-inset-top))] right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
                        aria-label="Tutup foto"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>

                    <img
                        src={viewedPhoto.src}
                        alt={viewedPhoto.name}
                        onClick={(e) => e.stopPropagation()}
                        className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
                    />
                    <p className="mt-4 text-sm font-semibold text-white/90 text-center line-clamp-2 max-w-md">{viewedPhoto.name}</p>
                </div>
            )}

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
                title="Hapus Target Tabungan"
                subtitle="Tindakan ini tidak dapat dibatalkan."
                itemTitle={targetToDelete?.name}
                itemSubtitle={targetToDelete ? `Kategori: ${targetToDelete.category}` : ''}
                itemExtra={targetToDelete ? formatRp(targetToDelete.target) : ''}
                message="Target tabungan ini akan dihapus secara permanen dari sistem."
                confirmText="Hapus Target"
            />
            
        </AuthenticatedLayout>
    );
}

