import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import UserAvatar from '@/Components/UserAvatar';

export default function Edit({ mustVerifyEmail, status }) {
    const user = usePage().props.auth.user || { name: 'Super Admin', email: 'admin@finance.track' };
    const userMoodEmoji = user?.mood_emoji || (typeof window !== 'undefined' ? localStorage.getItem('user_mood_emoji') : null) || '👋';
    const [activeTab, setActiveTab] = useState('profil'); // 'profil', 'keamanan', 'bahaya'

    const getInitials = (name) => {
        if (!name) return 'FT';
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();
    };

    return (
        <AuthenticatedLayout>
            <Head title="Pengaturan" />

            <div className="max-w-6xl mx-auto px-3.5 py-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
                
                {/* Header */}
                <div className="border-b border-slate-100 pb-3 sm:pb-4">
                    <p className="text-[11px] sm:text-xs md:text-sm font-bold text-[#009bd2] uppercase tracking-wider sm:tracking-widest mb-0.5 sm:mb-1">
                        Akun & Preferensi
                    </p>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
                        Pengaturan
                    </h1>
                    <p className="text-slate-500 font-medium text-xs sm:text-sm mt-0.5 sm:mt-1">
                        Kelola data profil pengguna, keamanan kata sandi, dan privasi akun Anda.
                    </p>
                </div>

                {/* Mobile Tab Pills Bar (Screens < 1024px) */}
                <div className="lg:hidden grid grid-cols-3 bg-slate-100 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('profil')}
                        className={`py-2 px-2 text-center rounded-lg text-xs font-black transition-all duration-200 flex items-center justify-center gap-1.5 ${
                            activeTab === 'profil' 
                                ? 'bg-white text-[#009bd2] shadow-xs' 
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7 7z" /></svg>
                        <span>Profil</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('keamanan')}
                        className={`py-2 px-2 text-center rounded-lg text-xs font-black transition-all duration-200 flex items-center justify-center gap-1.5 ${
                            activeTab === 'keamanan' 
                                ? 'bg-white text-amber-600 shadow-xs' 
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        <span>Keamanan</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('bahaya')}
                        className={`py-2 px-2 text-center rounded-lg text-xs font-black transition-all duration-200 flex items-center justify-center gap-1.5 ${
                            activeTab === 'bahaya' 
                                ? 'bg-white text-rose-600 shadow-xs' 
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        <span>Hapus Akun</span>
                    </button>
                </div>

                {/* 2-Column Responsive Layout (Desktop & Mobile) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
                    
                    {/* LEFT COLUMN: Profile Overview & Desktop Navigation Sidebar */}
                    <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-4">
                        
                        {/* Profile Summary Card */}
                        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-xs relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#009bd2]/5 rounded-full blur-2xl pointer-events-none"></div>
                            
                            <div className="flex lg:flex-col items-center lg:text-center gap-4 lg:gap-3">
                                <div className="relative shrink-0">
                                    <UserAvatar user={user} size="xl" rounded="rounded-2xl sm:rounded-3xl" className="w-14 h-14 sm:w-20 sm:h-20 shadow-md sm:shadow-lg" />
                                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-md border border-slate-100">
                                        <span className="text-base sm:text-lg leading-none block">{userMoodEmoji}</span>
                                    </div>
                                </div>
                                <div className="min-w-0 flex-1 lg:w-full">
                                    <h3 className="text-base sm:text-lg font-black text-slate-800 truncate leading-tight">
                                        {user.name}
                                    </h3>
                                    <p className="text-xs sm:text-sm font-semibold text-slate-400 mt-0.5 truncate">
                                        {user.email}
                                    </p>
                                    <div className="mt-2.5 flex items-center lg:justify-center gap-1.5 flex-wrap">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-black bg-blue-50 text-[#009bd2]">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#009bd2] animate-pulse"></span>
                                            {user.role === 'superadmin' ? 'Super Admin' : (user.subscription_tier === 'pro_plus' ? 'Pro Plus Member' : (user.subscription_tier === 'pro' ? 'Pro Member' : 'Free Member'))}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Account Status Meta (Desktop) */}
                            <div className="hidden lg:block mt-6 pt-5 border-t border-slate-100 space-y-2.5 text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-slate-400">Status Akun</span>
                                    <span className="font-black text-emerald-600 flex items-center gap-1">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                        Aktif
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-slate-400">Proteksi Sandi</span>
                                    <span className="font-bold text-slate-700">Enkripsi SHA/Bcrypt</span>
                                </div>
                            </div>
                        </div>

                        {/* Desktop Navigation Links */}
                        <div className="hidden lg:block bg-white rounded-3xl p-2.5 border border-slate-100 shadow-xs space-y-1">
                            <button
                                onClick={() => setActiveTab('profil')}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl font-bold text-sm transition-all duration-200 ${
                                    activeTab === 'profil'
                                        ? 'bg-blue-50/80 text-[#009bd2] font-black shadow-xs'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${activeTab === 'profil' ? 'bg-[#009bd2] text-white' : 'bg-slate-100 text-slate-500'}`}>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7 7z" /></svg>
                                    </div>
                                    <span>Informasi Profil</span>
                                </div>
                                <svg className={`w-4 h-4 transition-transform ${activeTab === 'profil' ? 'text-[#009bd2] translate-x-0.5' : 'text-slate-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                            </button>

                            <button
                                onClick={() => setActiveTab('keamanan')}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl font-bold text-sm transition-all duration-200 ${
                                    activeTab === 'keamanan'
                                        ? 'bg-amber-50/80 text-amber-700 font-black shadow-xs'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${activeTab === 'keamanan' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                    </div>
                                    <span>Keamanan & Sandi</span>
                                </div>
                                <svg className={`w-4 h-4 transition-transform ${activeTab === 'keamanan' ? 'text-amber-600 translate-x-0.5' : 'text-slate-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                            </button>

                            <button
                                onClick={() => setActiveTab('bahaya')}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl font-bold text-sm transition-all duration-200 ${
                                    activeTab === 'bahaya'
                                        ? 'bg-rose-50/80 text-rose-700 font-black shadow-xs'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${activeTab === 'bahaya' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </div>
                                    <span>Zona Bahaya</span>
                                </div>
                                <svg className={`w-4 h-4 transition-transform ${activeTab === 'bahaya' ? 'text-rose-600 translate-x-0.5' : 'text-slate-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Active Form Pane */}
                    <div className="lg:col-span-8">
                        {activeTab === 'profil' && (
                            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-slate-100 shadow-xs animate-fade-in">
                                <UpdateProfileInformationForm
                                    mustVerifyEmail={mustVerifyEmail}
                                    status={status}
                                />
                            </div>
                        )}

                        {activeTab === 'keamanan' && (
                            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-slate-100 shadow-xs animate-fade-in">
                                <UpdatePasswordForm />
                            </div>
                        )}

                        {activeTab === 'bahaya' && (
                            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-rose-100 shadow-xs animate-fade-in">
                                <DeleteUserForm />
                            </div>
                        )}
                    </div>

                </div>

            </div>
        </AuthenticatedLayout>
    );
}
