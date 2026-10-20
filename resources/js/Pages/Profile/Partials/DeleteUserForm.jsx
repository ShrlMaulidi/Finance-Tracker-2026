import InputError from '@/Components/InputError';
import Modal from '@/Components/Modal';
import { useForm, usePage } from '@inertiajs/react';
import { useRef, useState } from 'react';

export default function DeleteUserForm({ className = '' }) {
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef();

    // Accounts registered with Google have no password, so they confirm by typing "HAPUS"
    const hasPassword = usePage().props.auth?.user?.has_password ?? true;

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: '',
        confirmation: '',
    });

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser = (e) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current?.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);
        clearErrors();
        reset();
    };

    return (
        <section className={`space-y-4 sm:space-y-6 ${className}`}>
            <header className="flex items-center gap-3 pb-3 border-b border-rose-100/60">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </div>
                <div>
                    <h2 className="text-base sm:text-lg font-black text-rose-700 leading-tight">
                        Zona Bahaya: Hapus Akun
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                        Tindakan ini permanen dan tidak dapat dibatalkan.
                    </p>
                </div>
            </header>

            <div className="bg-rose-50/70 border border-rose-200/70 rounded-xl p-3.5 sm:p-4 text-xs sm:text-sm font-semibold text-rose-800 leading-relaxed">
                Setelah akun Anda dihapus, semua data transaksi, target tabungan, anggaran, serta hutang piutang akan dihapus secara permanen dari basis data. Harap pastikan kembali sebelum melanjutkan.
            </div>

            <div>
                <button
                    type="button"
                    onClick={confirmUserDeletion}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white px-5 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm shadow-md shadow-rose-600/20 hover:shadow-lg transition-all"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    Hapus Akun Saya
                </button>
            </div>

            <Modal show={confirmingUserDeletion} onClose={closeModal}>
                <form onSubmit={deleteUser} className="p-4 sm:p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-black text-slate-800 leading-tight">
                                Yakin ingin menghapus akun?
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                                Seluruh data keuangan Anda akan dihapus secara permanen.
                            </p>
                        </div>
                    </div>

                    {hasPassword ? (
                    <div>
                        <label htmlFor="confirm_password" className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">
                            Masukkan kata sandi untuk konfirmasi
                        </label>

                        <input
                            id="confirm_password"
                            type="password"
                            name="password"
                            ref={passwordInput}
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
                            placeholder="Kata sandi akun Anda"
                            autoFocus
                        />

                        <InputError
                            message={errors.password}
                            className="mt-1.5"
                        />
                    </div>
                    ) : (
                    <div>
                        <label htmlFor="confirm_delete_text" className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">
                            Ketik <span className="font-black text-rose-600">HAPUS</span> untuk konfirmasi
                        </label>

                        <input
                            id="confirm_delete_text"
                            type="text"
                            name="confirmation"
                            ref={passwordInput}
                            value={data.confirmation}
                            onChange={(e) => setData('confirmation', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 uppercase focus:bg-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
                            placeholder="HAPUS"
                            autoComplete="off"
                            autoCapitalize="characters"
                            autoFocus
                        />

                        <InputError
                            message={errors.confirmation}
                            className="mt-1.5"
                        />
                    </div>
                    )}

                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-2">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all text-center"
                        >
                            Batal
                        </button>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/20 transition-all disabled:opacity-50 text-center"
                        >
                            {processing ? 'Menghapus...' : 'Ya, Hapus Akun'}
                        </button>
                    </div>
                </form>
            </Modal>
        </section>
    );
}
