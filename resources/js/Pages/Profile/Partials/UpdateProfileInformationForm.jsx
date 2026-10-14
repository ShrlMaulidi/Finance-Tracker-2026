import React, { useState, useRef } from 'react';
import InputError from '@/Components/InputError';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';
import { compressImage } from '@/Utils/imageCompressor';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}) {
    const user = usePage().props.auth.user;
    const [avatarPreview, setAvatarPreview] = useState(user.avatar || null);
    const [isCompressing, setIsCompressing] = useState(false);
    const [clientError, setClientError] = useState(null);
    const fileInputRef = useRef(null);

    const { data, setData, post, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name,
            email: user.email,
            avatar: null,
            remove_avatar: false,
        });

    const getInitials = (name) => {
        if (!name) return 'FT';
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setClientError(null);

        if (!file.type.startsWith('image/')) {
            setClientError('Berkas yang dipilih harus berupa gambar (JPG, PNG, WebP).');
            return;
        }

        try {
            setIsCompressing(true);

            // Preview instan
            const reader = new FileReader();
            reader.onload = (ev) => {
                setAvatarPreview(ev.target.result);
            };
            reader.readAsDataURL(file);

            // Kompres gambar otomatis (maks 600x600 px, kualitas 85%)
            // Menurunkan ukuran foto kamera 5MB-15MB menjadi ~100KB-250KB
            const compressed = await compressImage(file, {
                maxWidth: 600,
                maxHeight: 600,
                quality: 0.85,
            });

            setData((prev) => ({ ...prev, avatar: compressed, remove_avatar: false }));
        } catch (err) {
            console.error('Error saat kompresi avatar:', err);
            setData((prev) => ({ ...prev, avatar: file, remove_avatar: false }));
        } finally {
            setIsCompressing(false);
        }
    };

    const handleRemoveAvatar = () => {
        setData((prev) => ({ ...prev, avatar: null, remove_avatar: true }));
        setAvatarPreview(null);
        setClientError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('profile.update'), {
            preserveScroll: true,
            onSuccess: () => {
                setData('avatar', null);
                setData('remove_avatar', false);
            },
        });
    };

    return (
        <section className={`space-y-4 sm:space-y-6 ${className}`}>
            <header className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#009bd2] flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7 7z" /></svg>
                </div>
                <div>
                    <h2 className="text-base sm:text-lg font-black text-slate-800 leading-tight">
                        Informasi Profil
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                        Perbarui foto profil, nama, dan alamat email akun Anda.
                    </p>
                </div>
            </header>

            <form onSubmit={submit} className="space-y-4 sm:space-y-5">
                {/* Photo Profile Uploader */}
                <div>
                    <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2">
                        Foto Profil
                    </label>
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
                        {/* Avatar Display / Preview */}
                        <div className="relative shrink-0">
                            {avatarPreview ? (
                                <img
                                    src={avatarPreview}
                                    alt=""
                                    onError={() => setAvatarPreview(null)}
                                    className="w-20 h-20 rounded-2xl object-cover shadow-sm border-2 border-white ring-2 ring-[#009bd2]/20"
                                />
                            ) : (
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#009bd2] to-sky-400 text-white font-black text-2xl flex items-center justify-center shadow-md shadow-[#009bd2]/20 border-2 border-white">
                                    {getInitials(user.name)}
                                </div>
                            )}
                        </div>

                        {/* Controls */}
                        <div className="flex-1 text-center sm:text-left space-y-2">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleAvatarChange}
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                className="hidden"
                                id="avatar-input"
                            />
                            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                                <button
                                    type="button"
                                    disabled={isCompressing}
                                    onClick={() => fileInputRef.current?.click()}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black text-white bg-[#009bd2] hover:bg-[#0087b8] active:scale-95 shadow-sm shadow-[#009bd2]/20 transition-all cursor-pointer disabled:opacity-70"
                                >
                                    {isCompressing ? (
                                        <>
                                            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                            </svg>
                                            <span>Mengoptimasi Gambar...</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                            <span>{avatarPreview ? 'Ganti Foto' : 'Unggah Foto'}</span>
                                        </>
                                    )}
                                </button>
                                {avatarPreview && !isCompressing && (
                                    <button
                                        type="button"
                                        onClick={handleRemoveAvatar}
                                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 active:scale-95 transition-all cursor-pointer"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        <span>Hapus Foto</span>
                                    </button>
                                )}
                            </div>
                            <p className="text-[11px] text-slate-400 font-medium">
                                Format: JPG, PNG, WEBP, atau GIF. Gambar besar akan otomatis dioptimasi.
                            </p>
                            <InputError className="mt-1" message={clientError || errors.avatar} />
                        </div>
                    </div>
                </div>

                <div>
                    <label htmlFor="name" className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">
                        Nama Lengkap
                    </label>

                    <input
                        id="name"
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#009bd2] focus:ring-1 focus:ring-[#009bd2] transition-all"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        autoComplete="name"
                    />

                    <InputError className="mt-1.5" message={errors.name} />
                </div>

                <div>
                    <label htmlFor="email" className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">
                        Alamat Email
                    </label>

                    <input
                        id="email"
                        type="email"
                        className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#009bd2] focus:ring-1 focus:ring-[#009bd2] transition-all"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        autoComplete="username"
                    />

                    <InputError className="mt-1.5" message={errors.email} />
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div className="bg-amber-50 rounded-xl p-3 border border-amber-200/80">
                        <p className="text-xs font-semibold text-amber-800">
                            Alamat email Anda belum terverifikasi.
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="block sm:inline ml-0 sm:ml-1 font-bold text-[#009bd2] hover:underline"
                            >
                                Klik di sini untuk mengirim ulang email verifikasi.
                            </Link>
                        </p>

                        {status === 'verification-link-sent' && (
                            <div className="mt-2 text-xs font-bold text-emerald-600">
                                Tautan verifikasi baru telah dikirim ke alamat email Anda.
                            </div>
                        )}
                    </div>
                )}

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#009bd2] hover:bg-[#0087b8] active:scale-95 text-white px-5 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm shadow-md shadow-[#009bd2]/20 hover:shadow-lg transition-all disabled:opacity-50"
                    >
                        {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-out duration-300"
                        enterFrom="opacity-0 translate-y-1"
                        enterTo="opacity-100 translate-y-0"
                        leave="transition ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 justify-center">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                            Tersimpan!
                        </span>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
