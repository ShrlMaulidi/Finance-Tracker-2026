import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function Login({ status }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const [mood, setMood] = useState('happy');

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div 
            className="min-h-screen relative flex flex-col font-sans" 
            style={{ background: 'radial-gradient(circle at 75% 25%, #f0f7ff 0%, #fafcff 40%, #ffffff 100%)' }}
        >
            <Head title="Log in" />
            
            {/* Navbar / Header */}
            <nav className="flex justify-between items-center py-6 px-8 lg:px-12">
                <div className="text-2xl font-extrabold text-[#009bd2] tracking-tight">BrandName</div>
                <Link 
                    href={route('register')} 
                    className="px-6 py-2 border-2 border-[#009bd2] text-[#009bd2] font-semibold rounded-lg hover:bg-[#009bd2]/10 transition-colors text-sm"
                >
                    Sign Up
                </Link>
            </nav>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center px-4 w-full">
                <div className="w-full max-w-[420px] mx-auto space-y-8">
                    
                    <div className="text-center mb-10">
                        <h1 className="text-[32px] font-extrabold text-slate-900 tracking-tight">Welcome Back</h1>
                    </div>

                    {status && <div className="text-sm font-medium text-green-600 text-center">{status}</div>}

                    <form onSubmit={submit} className="space-y-5">
                        {/* Email Input */}
                        <div>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="Email Address"
                                className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#009bd2] focus:border-[#009bd2] outline-none transition-all placeholder:text-gray-400 shadow-sm"
                                required
                            />
                            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                        </div>

                        {/* Password Input */}
                        <div>
                            <input
                                id="password"
                                type="password"
                                name="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="Password"
                                className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#009bd2] focus:border-[#009bd2] outline-none transition-all placeholder:text-gray-400 shadow-sm"
                                required
                            />
                            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                        </div>

                        {/* Mood Selector (Interactive) */}
                        <div className="pt-2">
                            <p className="text-sm font-bold text-gray-700 mb-3">Bagaimana perasaan Anda hari ini? (Opsional)</p>
                            <div className="flex items-center gap-2 border border-gray-100 p-2 rounded-2xl bg-white shadow-sm">
                                <button type="button" onClick={() => setMood('happy')} className={`flex-1 py-3 text-2xl flex justify-center items-center rounded-xl transition-all ${mood === 'happy' ? 'border-[2px] border-[#009bd2] bg-[#009bd2]/10 scale-105' : 'border-2 border-transparent hover:bg-gray-50 opacity-40 hover:opacity-100'}`}>😁</button>
                                <button type="button" onClick={() => setMood('sad')} className={`flex-1 py-3 text-2xl flex justify-center items-center rounded-xl transition-all ${mood === 'sad' ? 'border-[2px] border-[#009bd2] bg-[#009bd2]/10 scale-105' : 'border-2 border-transparent hover:bg-gray-50 opacity-40 hover:opacity-100'}`}>😥</button>
                                <button type="button" onClick={() => setMood('angry')} className={`flex-1 py-3 text-2xl flex justify-center items-center rounded-xl transition-all ${mood === 'angry' ? 'border-[2px] border-[#009bd2] bg-[#009bd2]/10 scale-105' : 'border-2 border-transparent hover:bg-gray-50 opacity-40 hover:opacity-100'}`}>😠</button>
                                <button type="button" onClick={() => setMood('surprised')} className={`flex-1 py-3 text-2xl flex justify-center items-center rounded-xl transition-all ${mood === 'surprised' ? 'border-[2px] border-[#009bd2] bg-[#009bd2]/10 scale-105' : 'border-2 border-transparent hover:bg-gray-50 opacity-40 hover:opacity-100'}`}>😲</button>
                            </div>
                        </div>

                        {/* Continue with Email Button */}
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full bg-[#009bd2] hover:bg-[#0089ba] text-white font-semibold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-70 flex justify-center items-center"
                            >
                                Continue with Email
                            </button>
                        </div>
                    </form>

                    {/* Continue with Google Button */}
                    <div>
                        <button type="button" className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold py-3.5 rounded-xl transition-all shadow-sm">
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Continue with Google
                        </button>
                    </div>

                    {/* Don't have an account */}
                    <div className="text-center mt-6">
                        <p className="text-gray-500 text-sm font-medium">
                            Don't have an account? <Link href={route('register')} className="text-[#009bd2] font-bold hover:underline">Sign Up</Link>
                        </p>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="py-8 text-center text-[13px] text-gray-400 font-medium space-x-6">
                <a href="#" className="hover:text-gray-600 transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-gray-600 transition-colors">Privacy Policy</a>
            </footer>
        </div>
    );
}
