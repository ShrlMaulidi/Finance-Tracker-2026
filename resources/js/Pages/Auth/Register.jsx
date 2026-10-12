import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem('hasSeenOffer');
            sessionStorage.setItem('justLoggedIn', 'true');
            sessionStorage.setItem('justLoggedInForPwa', 'true');
        }
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <div 
            className="min-h-screen relative flex flex-col font-sans justify-between" 
            style={{ background: 'radial-gradient(circle at 75% 25%, #f0f7ff 0%, #fafcff 40%, #ffffff 100%)' }}
        >
            <Head title="Daftar - FinanceTrack" />
            
            {/* Navbar / Header */}
            <header className="w-full">
                <nav className="max-w-7xl mx-auto flex justify-between items-center py-4 px-4 sm:px-8">
                    <Link href="/" className="flex items-center gap-2 group">
                        <img src="/logo.png" alt="FinanceTrack Logo" className="w-8 h-8 sm:w-9 sm:h-9 object-contain" />
                        <span className="text-xl sm:text-2xl font-black text-[#009bd2] tracking-tight">FinanceTrack</span>
                    </Link>
                    <Link 
                        href={route('login')} 
                        className="px-3.5 py-1.5 sm:px-5 sm:py-2 border border-[#009bd2] text-[#009bd2] font-semibold rounded-xl hover:bg-[#009bd2]/10 active:scale-95 transition-all text-xs sm:text-sm"
                    >
                        Masuk
                    </Link>
                </nav>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center px-4 py-3 sm:py-8 w-full">
                <div className="w-full max-w-[420px] mx-auto">
                    
                    {/* Header Heading */}
                    <div className="text-center mb-4 sm:mb-6">
                        <h1 className="text-2xl sm:text-[28px] font-black text-slate-900 tracking-tight">
                            Buat Akun Baru
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                            Mulai kelola keuangan & tabungan Anda secara cerdas
                        </p>
                    </div>

                    {/* Card Container */}
                    <div className="bg-white/95 sm:bg-white backdrop-blur-sm p-5 sm:p-7 rounded-2xl sm:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
                        <form onSubmit={submit} className="space-y-3.5 sm:space-y-4">
                            
                            {/* Name Input */}
                            <div>
                                <label htmlFor="name" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">
                                    Nama Lengkap
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <input
                                        id="name"
                                        type="text"
                                        name="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Nama lengkap Anda"
                                        className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#009bd2]/20 focus:border-[#009bd2] outline-none transition-all shadow-sm"
                                        required
                                        autoComplete="name"
                                    />
                                </div>
                                {errors.name && <p className="text-red-500 text-xs mt-1 font-medium">{errors.name}</p>}
                            </div>

                            {/* Email Input */}
                            <div>
                                <label htmlFor="email" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">
                                    Alamat Email
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
                                        autoComplete="email"
                                    />
                                </div>
                                {errors.email && <p className="text-red-500 text-xs mt-1 font-medium">{errors.email}</p>}
                            </div>

                            {/* Password Input */}
                            <div>
                                <label htmlFor="password" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">
                                    Kata Sandi
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="Minimal 8 karakter"
                                        className="w-full pl-10 pr-11 py-2.5 sm:py-3 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#009bd2]/20 focus:border-[#009bd2] outline-none transition-all shadow-sm"
                                        required
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                                        tabIndex={-1}
                                        aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                                    >
                                        {showPassword ? (
                                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                                            </svg>
                                        ) : (
                                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                {errors.password && <p className="text-red-500 text-xs mt-1 font-medium">{errors.password}</p>}
                            </div>

                            {/* Confirm Password Input */}
                            <div>
                                <label htmlFor="password_confirmation" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">
                                    Konfirmasi Kata Sandi
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                    </div>
                                    <input
                                        id="password_confirmation"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        name="password_confirmation"
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        placeholder="Ulangi kata sandi"
                                        className="w-full pl-10 pr-11 py-2.5 sm:py-3 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#009bd2]/20 focus:border-[#009bd2] outline-none transition-all shadow-sm"
                                        required
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                                        tabIndex={-1}
                                        aria-label={showConfirmPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                                    >
                                        {showConfirmPassword ? (
                                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                                            </svg>
                                        ) : (
                                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                {errors.password_confirmation && <p className="text-red-500 text-xs mt-1 font-medium">{errors.password_confirmation}</p>}
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
                                            <span>Mendaftarkan...</span>
                                        </>
                                    ) : (
                                        <span>Daftar Akun</span>
                                    )}
                                </button>
                            </div>
                        </form>

                        {/* Divider */}
                        <div className="relative my-3.5 sm:my-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200"></div>
                            </div>
                            <div className="relative flex justify-center text-[10px] sm:text-xs uppercase">
                                <span className="bg-white px-2.5 text-slate-400 font-semibold tracking-wider">
                                    Atau daftar dengan
                                </span>
                            </div>
                        </div>

                        {/* Continue with Google Button */}
                        <div>
                            <a 
                                href={route('google.login')} 
                                onClick={() => {
                                    if (typeof window !== 'undefined') {
                                        sessionStorage.removeItem('hasSeenOffer');
                                        sessionStorage.setItem('justLoggedIn', 'true');
                                        sessionStorage.setItem('justLoggedInForPwa', 'true');
                                    }
                                }}
                                className="w-full flex items-center justify-center gap-2.5 bg-white border border-slate-200 hover:bg-slate-50 active:scale-[0.99] text-slate-700 font-semibold py-2.5 sm:py-3 text-xs sm:text-sm rounded-xl transition-all shadow-sm"
                            >
                                <svg className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                <span>Daftar dengan Google</span>
                            </a>
                        </div>
                    </div>

                    {/* Already have an account */}
                    <div className="text-center mt-3.5 sm:mt-4">
                        <p className="text-slate-500 text-xs sm:text-sm font-medium">
                            Sudah punya akun?{' '}
                            <Link href={route('login')} className="text-[#009bd2] font-bold hover:underline">
                                Masuk
                            </Link>
                        </p>
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
