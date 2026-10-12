import { Head, Link, useForm } from '@inertiajs/react';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <div 
            className="min-h-screen relative flex flex-col font-sans justify-between" 
            style={{ background: 'radial-gradient(circle at 75% 25%, #f0f7ff 0%, #fafcff 40%, #ffffff 100%)' }}
        >
            <Head title="Lupa Kata Sandi - FinanceTrack" />
            
            {/* Navbar / Header */}
            <header className="w-full">
                <nav className="max-w-7xl mx-auto flex justify-between items-center py-4 px-4 sm:px-8">
                    <Link href="/" className="flex items-center gap-2 group">
                        <img src="/logo.png" alt="FinanceTrack Logo" className="w-8 h-8 sm:w-9 sm:h-9 object-contain" />
                        <span className="text-xl sm:text-2xl font-black text-[#009bd2] tracking-tight">FinanceTrack</span>
                    </Link>
                    <Link 
                        href={route('login')} 
                        className="flex items-center gap-1.5 px-3.5 py-1.5 sm:px-5 sm:py-2 border border-[#009bd2] text-[#009bd2] font-semibold rounded-xl hover:bg-[#009bd2]/10 active:scale-95 transition-all text-xs sm:text-sm"
                    >
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span>Masuk</span>
                    </Link>
                </nav>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center px-4 py-3 sm:py-8 w-full">
                <div className="w-full max-w-[420px] mx-auto">
                    
                    {/* Header Heading */}
                    <div className="text-center mb-5 sm:mb-6">
                        <div className="inline-flex w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#009bd2]/10 text-[#009bd2] items-center justify-center mb-3 shadow-inner">
                            <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl sm:text-[28px] font-black text-slate-900 tracking-tight">
                            Lupa Kata Sandi?
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1.5 max-w-sm mx-auto leading-relaxed">
                            Masukkan email akun Anda. Kami akan mengirimkan tautan untuk mengatur ulang kata sandi Anda.
                        </p>
                    </div>

                    {/* Status Alert */}
                    {status && (
                        <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm font-semibold text-emerald-800 flex items-start gap-2.5 shadow-sm">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{status}</span>
                        </div>
                    )}

                    {/* Card Container */}
                    <div className="bg-white/95 sm:bg-white backdrop-blur-sm p-5 sm:p-7 rounded-2xl sm:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
                        <form onSubmit={submit} className="space-y-4">
                            
                            {/* Email Input */}
                            <div>
                                <label htmlFor="email" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">
                                    Alamat Email Terdaftar
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <input
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="nama@email.com"
                                        className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#009bd2]/20 focus:border-[#009bd2] outline-none transition-all shadow-sm"
                                        required
                                        autoFocus
                                        autoComplete="email"
                                    />
                                </div>
                                {errors.email && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.email}</p>}
                            </div>

                            {/* Submit Button */}
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full bg-[#009bd2] hover:bg-[#0089ba] active:scale-[0.99] text-white font-bold py-2.5 sm:py-3 text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-[#009bd2]/20 disabled:opacity-70 flex justify-center items-center gap-2"
                                >
                                    {processing ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                            </svg>
                                            <span>Mengirim Tautan...</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                            <span>Kirim Tautan Reset Sandi</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Back to Login */}
                    <div className="text-center mt-4 sm:mt-5">
                        <Link 
                            href={route('login')} 
                            className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 hover:text-[#009bd2] font-semibold transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            <span>Kembali ke Halaman Masuk</span>
                        </Link>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="py-3 sm:py-5 text-center text-[11px] sm:text-xs text-slate-400 font-medium space-x-3 sm:space-x-4">
                <a href="#" className="hover:text-slate-600 transition-colors">Syarat & Ketentuan</a>
                <span>&bull;</span>
                <a href="#" className="hover:text-slate-600 transition-colors">Kebijakan Privasi</a>
            </footer>
        </div>
    );
}
