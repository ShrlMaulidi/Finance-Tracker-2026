import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import UserAvatar from '@/Components/UserAvatar';

export default function Users({ users, filters, counts }) {
    const { auth } = usePage().props;
    const currentAdminId = auth?.user?.id;

    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    
    // Modal states
    const [selectedUser, setSelectedUser] = useState(null);
    const [modalAction, setModalAction] = useState(null); // 'toggleStatus' | 'changeTier' | 'delete'
    const [newTier, setNewTier] = useState('free');
    const [processing, setProcessing] = useState(false);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        router.get(route('admin.users.index'), {
            search: searchQuery,
            tier: filters.tier,
            status: filters.status,
            role: filters.role,
        }, { preserveState: true });
    };

    const handleFilterTab = (tierVal, statusVal) => {
        router.get(route('admin.users.index'), {
            search: searchQuery,
            tier: tierVal,
            status: statusVal,
            role: filters.role,
        }, { preserveState: true });
    };

    const openToggleStatusModal = (user) => {
        setSelectedUser(user);
        setModalAction('toggleStatus');
    };

    const openChangeTierModal = (user) => {
        setSelectedUser(user);
        setNewTier(user.subscription_tier || 'free');
        setModalAction('changeTier');
    };

    const openDeleteModal = (user) => {
        setSelectedUser(user);
        setModalAction('delete');
    };

    const closeModal = () => {
        if (processing) return;
        setSelectedUser(null);
        setModalAction(null);
    };

    const confirmToggleStatus = () => {
        if (!selectedUser) return;
        setProcessing(true);
        router.patch(route('admin.users.toggle-status', selectedUser.id), {}, {
            preserveScroll: true,
            onFinish: () => {
                setProcessing(false);
                closeModal();
            }
        });
    };

    const confirmChangeTier = () => {
        if (!selectedUser) return;
        setProcessing(true);
        router.patch(route('admin.users.update-tier', selectedUser.id), {
            tier: newTier
        }, {
            preserveScroll: true,
            onFinish: () => {
                setProcessing(false);
                closeModal();
            }
        });
    };

    const confirmDelete = () => {
        if (!selectedUser) return;
        setProcessing(true);
        router.delete(route('admin.users.destroy', selectedUser.id), {
            preserveScroll: true,
            onFinish: () => {
                setProcessing(false);
                closeModal();
            }
        });
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const getTierBadge = (tier) => {
        switch (tier) {
            case 'pro_plus':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200/80">
                        <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        Pro Plus
                    </span>
                );
            case 'pro':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#009bd2] border border-blue-200/80">
                        <svg className="w-3.5 h-3.5 text-[#009bd2]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                        Paket Pro
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        Gratis
                    </span>
                );
        }
    };

    return (
        <AdminLayout title="Kelola Pengguna">
            <Head title="Kelola User - Super Admin" />

            <div className="space-y-4 sm:space-y-6 lg:space-y-8 max-w-7xl mx-auto">
                
                {/* HEADER & SEARCH BAR */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-800 tracking-tight leading-tight">
                            Manajemen Pengguna
                        </h1>
                        <p className="text-slate-500 font-medium text-xs sm:text-sm mt-0.5">
                            Total {counts.total} pengguna terdaftar di ekosistem FinanceTrack
                        </p>
                    </div>

                    {/* Search Form - Full width on mobile */}
                    <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-72">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari nama atau email..."
                                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 pl-9 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#009bd2] focus:ring-1 focus:ring-[#009bd2] transition-all shadow-xs"
                            />
                            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchQuery('');
                                        router.get(route('admin.users.index'), {
                                            search: '',
                                            tier: filters.tier,
                                            status: filters.status,
                                        });
                                    }}
                                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                        <button
                            type="submit"
                            className="px-4 py-2.5 rounded-xl bg-[#009bd2] hover:bg-[#0088b9] text-white font-bold text-xs sm:text-sm shadow-xs transition-all shrink-0 active:scale-95"
                        >
                            Cari
                        </button>
                    </form>
                </div>

                {/* FILTER TABS & QUICK COUNTS - Smooth horizontal swipe on mobile */}
                <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1.5 -mx-3.5 px-3.5 sm:mx-0 sm:px-0 scrollbar-none">
                    <button
                        onClick={() => handleFilterTab('', '')}
                        className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                            !filters.tier && !filters.status
                                ? 'bg-[#009bd2] text-white shadow-xs'
                                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 shadow-xs'
                        }`}
                    >
                        <span>Semua User</span>
                        <span className="px-1.5 py-0.5 rounded-md bg-black/10 text-[9px] sm:text-[10px]">{counts.total}</span>
                    </button>

                    <button
                        onClick={() => handleFilterTab('free', '')}
                        className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                            filters.tier === 'free'
                                ? 'bg-slate-700 text-white shadow-xs'
                                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 shadow-xs'
                        }`}
                    >
                        <span>Paket Gratis</span>
                        <span className="px-1.5 py-0.5 rounded-md bg-black/10 text-[9px] sm:text-[10px]">{counts.free}</span>
                    </button>

                    <button
                        onClick={() => handleFilterTab('pro', '')}
                        className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                            filters.tier === 'pro'
                                ? 'bg-[#009bd2] text-white shadow-xs'
                                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 shadow-xs'
                        }`}
                    >
                        <span>Paket Pro</span>
                        <span className="px-1.5 py-0.5 rounded-md bg-black/10 text-[9px] sm:text-[10px]">{counts.pro}</span>
                    </button>

                    <button
                        onClick={() => handleFilterTab('pro_plus', '')}
                        className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                            filters.tier === 'pro_plus'
                                ? 'bg-purple-600 text-white shadow-xs'
                                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 shadow-xs'
                        }`}
                    >
                        <span>Paket Pro Plus</span>
                        <span className="px-1.5 py-0.5 rounded-md bg-black/10 text-[9px] sm:text-[10px]">{counts.pro_plus}</span>
                    </button>

                    <div className="w-px h-5 bg-slate-200 mx-0.5 shrink-0"></div>

                    <button
                        onClick={() => handleFilterTab('', 'active')}
                        className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                            filters.status === 'active'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 shadow-xs'
                        }`}
                    >
                        <span>Aktif</span>
                        <span className="px-1.5 py-0.5 rounded-md bg-black/10 text-[9px] sm:text-[10px]">{counts.active}</span>
                    </button>

                    <button
                        onClick={() => handleFilterTab('', 'suspended')}
                        className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                            filters.status === 'suspended'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 shadow-xs'
                        }`}
                    >
                        <span>Suspend</span>
                        <span className="px-1.5 py-0.5 rounded-md bg-black/10 text-[9px] sm:text-[10px]">{counts.suspended}</span>
                    </button>
                </div>

                {/* USER DATA TABLE */}
                <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs sm:text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-400 uppercase tracking-wider font-extrabold text-[9px] sm:text-xs">
                                    <th className="py-3 sm:py-4 px-3 sm:px-6">Pengguna</th>
                                    <th className="py-3 sm:py-4 px-3 sm:px-6">Paket Langganan</th>
                                    <th className="py-3 sm:py-4 px-3 sm:px-6">Status Akun</th>
                                    <th className="py-3 sm:py-4 px-3 sm:px-6">Terdaftar Pada</th>
                                    <th className="py-3 sm:py-4 px-3 sm:px-6 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                                {users.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-slate-400">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                <p className="font-bold text-xs sm:text-sm text-slate-600">Tidak ada pengguna yang cocok dengan kriteria filter.</p>
                                                <button
                                                    onClick={() => {
                                                        setSearchQuery('');
                                                        router.get(route('admin.users.index'));
                                                    }}
                                                    className="mt-1 text-xs font-bold text-[#009bd2] hover:underline"
                                                >
                                                    Reset Filter & Pencarian
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    users.data.map((user) => {
                                        const isSelf = user.id === currentAdminId;
                                        return (
                                            <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                                                
                                                {/* User Info */}
                                                <td className="py-3 sm:py-4 px-3 sm:px-6">
                                                    <div className="flex items-center gap-2.5 sm:gap-3">
                                                        <UserAvatar user={user} size="sm" className="w-8 h-8 sm:w-9 sm:h-9 shrink-0" />
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                <span className="font-bold text-slate-800 text-xs sm:text-sm truncate max-w-[120px] sm:max-w-[200px]">
                                                                    {user.name}
                                                                </span>
                                                                {user.role === 'superadmin' && (
                                                                    <span className="px-1.5 py-0.5 rounded-md text-[8px] sm:text-[9px] font-black uppercase tracking-wider bg-blue-50 text-[#009bd2] border border-blue-100 shrink-0">
                                                                        Super Admin
                                                                    </span>
                                                                )}
                                                                {isSelf && (
                                                                    <span className="px-1.5 py-0.5 rounded-md text-[8px] sm:text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100 shrink-0">
                                                                        Anda
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-[10px] sm:text-xs text-slate-400 font-medium truncate max-w-[120px] sm:max-w-[200px] mt-0.5">
                                                                {user.email}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Subscription Tier */}
                                                <td className="py-3 sm:py-4 px-3 sm:px-6 whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                                        {getTierBadge(user.subscription_tier)}
                                                        <button
                                                            onClick={() => openChangeTierModal(user)}
                                                            title="Ubah Paket Langganan"
                                                            className="text-slate-400 hover:text-[#009bd2] p-1 hover:bg-slate-100 rounded-lg transition-colors"
                                                        >
                                                            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                        </button>
                                                    </div>
                                                </td>

                                                {/* Status (Active / Suspended) */}
                                                <td className="py-3 sm:py-4 px-3 sm:px-6 whitespace-nowrap">
                                                    {user.is_active ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                            Aktif
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                                            Suspend
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Date */}
                                                <td className="py-3 sm:py-4 px-3 sm:px-6 text-slate-500 text-[10px] sm:text-xs whitespace-nowrap">
                                                    {formatDate(user.created_at)}
                                                </td>

                                                {/* Action Buttons */}
                                                <td className="py-3 sm:py-4 px-3 sm:px-6 text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        
                                                        {/* Toggle Suspend Button */}
                                                        {isSelf ? (
                                                            <span className="text-[10px] sm:text-[11px] text-slate-400 italic pr-1">Akun Anda</span>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    onClick={() => openToggleStatusModal(user)}
                                                                    className={`px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl font-bold text-[11px] sm:text-xs transition-all flex items-center gap-1.5 ${
                                                                        user.is_active
                                                                            ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                                                                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                                                    }`}
                                                                >
                                                                    {user.is_active ? (
                                                                        <>
                                                                            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                                                                            <span>Nonaktifkan</span>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                                            <span>Aktifkan</span>
                                                                        </>
                                                                    )}
                                                                </button>

                                                                {/* Delete User Button */}
                                                                <button
                                                                    onClick={() => openDeleteModal(user)}
                                                                    title="Hapus Akun Pengguna"
                                                                    className="p-1.5 sm:p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-all"
                                                                >
                                                                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* PAGINATION */}
                    {users.links && users.links.length > 3 && (
                        <div className="p-3.5 sm:p-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
                            <p className="text-[11px] sm:text-xs text-slate-500 font-medium text-center sm:text-left">
                                Menampilkan {users.from || 0} - {users.to || 0} dari {users.total} total pengguna
                            </p>

                            <div className="flex items-center justify-center gap-1 flex-wrap">
                                {users.links.map((link, idx) => (
                                    <Link
                                        key={idx}
                                        href={link.url || '#'}
                                        preserveScroll
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={`px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold transition-all ${
                                            link.active
                                                ? 'bg-[#009bd2] text-white shadow-xs'
                                                : link.url
                                                    ? 'bg-slate-50 text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/60'
                                                    : 'text-slate-300 cursor-not-allowed'
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* MODAL: TOGGLE STATUS (SUSPEND / ACTIVATE) */}
                {modalAction === 'toggleStatus' && selectedUser && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
                        <div className="bg-white border border-slate-100 rounded-2xl sm:rounded-3xl p-5 sm:p-7 max-w-sm sm:max-w-md w-full shadow-2xl space-y-4 sm:space-y-5 animate-scale-up max-h-[92vh] overflow-y-auto">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            </div>

                            <div>
                                <h3 className="text-base sm:text-lg font-black text-slate-800 leading-snug">
                                    {selectedUser.is_active ? 'Nonaktifkan Akun Pengguna?' : 'Aktifkan Kembali Akun?'}
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed font-medium">
                                    {selectedUser.is_active ? (
                                        <>
                                            Pengguna <strong className="text-slate-800">{selectedUser.name}</strong> ({selectedUser.email}) tidak akan dapat login ke aplikasi selama statusnya dinonaktifkan sementara. Seluruh data transaksi tetap aman.
                                        </>
                                    ) : (
                                        <>
                                            Pengguna <strong className="text-slate-800">{selectedUser.name}</strong> ({selectedUser.email}) akan dapat kembali login dan menggunakan akunnya secara normal.
                                        </>
                                    )}
                                </p>
                            </div>

                            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    onClick={closeModal}
                                    disabled={processing}
                                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-all text-center"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={confirmToggleStatus}
                                    disabled={processing}
                                    className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white transition-all shadow-xs text-center ${
                                        selectedUser.is_active
                                            ? 'bg-amber-600 hover:bg-amber-500'
                                            : 'bg-emerald-600 hover:bg-emerald-500'
                                    }`}
                                >
                                    {processing ? 'Memproses...' : selectedUser.is_active ? 'Ya, Nonaktifkan Sementara' : 'Ya, Aktifkan Akun'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL: CHANGE TIER */}
                {modalAction === 'changeTier' && selectedUser && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
                        <div className="bg-white border border-slate-100 rounded-2xl sm:rounded-3xl p-5 sm:p-7 max-w-sm sm:max-w-md w-full shadow-2xl space-y-4 sm:space-y-5 animate-scale-up max-h-[92vh] overflow-y-auto">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-50 text-[#009bd2] flex items-center justify-center shrink-0">
                                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4l3 6 5-4-2 12H6L4 6l5 4 3-6z" /></svg>
                            </div>

                            <div>
                                <h3 className="text-base sm:text-lg font-black text-slate-800 leading-snug">
                                    Ubah Paket Langganan
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                                    Atur status paket langganan untuk <strong className="text-slate-800">{selectedUser.name}</strong>.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-600 block">Pilih Paket:</label>
                                
                                <div
                                    onClick={() => setNewTier('free')}
                                    className={`p-3 rounded-xl sm:rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                                        newTier === 'free'
                                            ? 'bg-slate-50 border-slate-400 ring-2 ring-slate-400/20'
                                            : 'bg-white border-slate-200 hover:border-slate-300'
                                    }`}
                                >
                                    <div>
                                        <p className="text-xs sm:text-sm font-bold text-slate-800">Starter (Gratis)</p>
                                        <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium">Pencatatan dasar & modul standar</p>
                                    </div>
                                    <span className="text-xs font-bold text-slate-500 shrink-0 ml-2">Rp 0</span>
                                </div>

                                <div
                                    onClick={() => setNewTier('pro')}
                                    className={`p-3 rounded-xl sm:rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                                        newTier === 'pro'
                                            ? 'bg-blue-50/60 border-[#009bd2] ring-2 ring-[#009bd2]/20'
                                            : 'bg-white border-slate-200 hover:border-slate-300'
                                    }`}
                                >
                                    <div>
                                        <p className="text-xs sm:text-sm font-bold text-[#009bd2]">Paket Pro</p>
                                        <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium">Unlimited pencatatan, ekspor Excel & PDF</p>
                                    </div>
                                    <span className="text-xs font-bold text-[#009bd2] shrink-0 ml-2">Rp 14.999/bln</span>
                                </div>

                                <div
                                    onClick={() => setNewTier('pro_plus')}
                                    className={`p-3 rounded-xl sm:rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                                        newTier === 'pro_plus'
                                            ? 'bg-purple-50/60 border-purple-500 ring-2 ring-purple-500/20'
                                            : 'bg-white border-slate-200 hover:border-slate-300'
                                    }`}
                                >
                                    <div>
                                        <p className="text-xs sm:text-sm font-bold text-purple-700">Paket Pro Plus (AI & WA)</p>
                                        <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium">Akses AI asisten & integrasi bot WhatsApp</p>
                                    </div>
                                    <span className="text-xs font-bold text-purple-700 shrink-0 ml-2">Rp 29.999/bln</span>
                                </div>
                            </div>

                            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    onClick={closeModal}
                                    disabled={processing}
                                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-all text-center"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={confirmChangeTier}
                                    disabled={processing}
                                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#009bd2] hover:bg-[#0089ba] font-bold text-xs sm:text-sm text-white transition-all shadow-xs text-center"
                                >
                                    {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL: DELETE USER */}
                {modalAction === 'delete' && selectedUser && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
                        <div className="bg-white border border-rose-100 rounded-2xl sm:rounded-3xl p-5 sm:p-7 max-w-sm sm:max-w-md w-full shadow-2xl space-y-4 sm:space-y-5 animate-scale-up max-h-[92vh] overflow-y-auto">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </div>

                            <div>
                                <h3 className="text-base sm:text-lg font-black text-rose-700 leading-snug">
                                    Hapus Akun Pengguna Secara Permanen?
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed font-medium">
                                    Tindakan ini tidak dapat dibatalkan. Menghapus akun <strong className="text-slate-800">{selectedUser.name}</strong> ({selectedUser.email}) akan menghapus seluruh data transaksi, riwayat hutang, anggaran, dan target tabungan miliknya secara permanen.
                                </p>
                            </div>

                            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                                <svg className="w-4 h-4 shrink-0 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                <span>Pastikan Anda telah memastikan pengguna ini memang hendak dihapus.</span>
                            </div>

                            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    onClick={closeModal}
                                    disabled={processing}
                                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-all text-center"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    disabled={processing}
                                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 font-bold text-xs sm:text-sm text-white transition-all shadow-xs text-center"
                                >
                                    {processing ? 'Menghapus...' : 'Ya, Hapus Akun'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </AdminLayout>
    );
}
