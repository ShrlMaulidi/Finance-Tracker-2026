import { Head, Link, useForm } from '@inertiajs/react';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <div 
            className="min-h-screen relative flex flex-col font-sans" 
            style={{ background: 'radial-gradient(circle at 75% 25%, #f0f7ff 0%, #fafcff 40%, #ffffff 100%)' }}
        >
            <Head title="Register" />
            
            {/* Navbar / Header */}
            <nav className="flex justify-between items-center py-6 px-8 lg:px-12">
                <div className="text-2xl font-extrabold text-[#009bd2] tracking-tight">BrandName</div>
                <Link 
                    href={route('login')} 
                    className="px-6 py-2 border-2 border-[#009bd2] text-[#009bd2] font-semibold rounded-lg hover:bg-[#009bd2]/10 transition-colors text-sm"
                >
                    Log In
                </Link>
            </nav>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center px-4 w-full py-8">
                <div className="w-full max-w-[440px] mx-auto space-y-6">
                    
                    <div className="text-center mb-6">
                        <h1 className="text-[32px] font-extrabold text-slate-900 tracking-tight">Create an Account</h1>
                        <p className="text-slate-500 mt-2 font-medium">Join us to manage your finances seamlessly.</p>
                    </div>

                    {/* Form Container */}
                    <form onSubmit={submit} className="space-y-5 bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                        
                        {/* Name Input */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">Full Name</label>
                            <input
                                id="name"
                                type="text"
                                name="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="John Doe"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#009bd2] focus:border-[#009bd2] outline-none transition-all placeholder:text-gray-400 shadow-sm"
                                required
                            />
                            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                        </div>

                        {/* Email Input */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">Email Address</label>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="name@example.com"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#009bd2] focus:border-[#009bd2] outline-none transition-all placeholder:text-gray-400 shadow-sm"
                                required
                            />
                            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                        </div>

                        {/* Password Input */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">Password</label>
                            <input
                                id="password"
                                type="password"
                                name="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="••••••••"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#009bd2] focus:border-[#009bd2] outline-none transition-all placeholder:text-gray-400 shadow-sm"
                                required
                            />
                            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                        </div>

                        {/* Confirm Password Input */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">Confirm Password</label>
                            <input
                                id="password_confirmation"
                                type="password"
                                name="password_confirmation"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                placeholder="••••••••"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#009bd2] focus:border-[#009bd2] outline-none transition-all placeholder:text-gray-400 shadow-sm"
                                required
                            />
                            {errors.password_confirmation && <p className="text-red-500 text-sm mt-1">{errors.password_confirmation}</p>}
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full bg-[#009bd2] hover:bg-[#0089ba] text-white font-bold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-70"
                            >
                                Sign Up
                            </button>
                        </div>
                    </form>

                    {/* Login Link */}
                    <div className="text-center mt-2">
                        <p className="text-gray-500 text-sm font-medium">
                            Already have an account? <Link href={route('login')} className="text-[#009bd2] font-bold hover:underline">Log In</Link>
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
