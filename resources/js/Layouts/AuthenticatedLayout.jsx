import { Link, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import Dropdown from '@/Components/Dropdown';

const Icons = {
    Dashboard: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
    Anggaran: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 12H4M20 12a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0a2 2 0 00-2-2H6a2 2 0 00-2 2" /></svg>,
    Pengeluaran: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    Transaksi: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>,
    Laporan: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    Database: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>,
    Settings: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    Logout: <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
    Target: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" strokeWidth="1.5" /><circle cx="12" cy="12" r="5" strokeWidth="1.5" /><circle cx="12" cy="12" r="1.5" strokeWidth="1.5" fill="currentColor" /></svg>,
    News: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>,
    ChevronDown: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>,
    CollapseLeft: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>,
    AIAgent: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>,
};

export default function AuthenticatedLayout({ children }) {
    const user = usePage().props.auth.user || { name: 'Super Admin', email: 'admin@finance.track' };

    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        if (window.innerWidth < 768) {
            setSidebarOpen(false);
        }
    }, []);

    const [openMenus, setOpenMenus] = useState({
        anggaran: route().current('anggaran.*') || route().current('anggaran.investasi'),
        transaksi: route().current('transaksi.*') && !route().current('transaksi.index'),
        kelola: route().current('kelola.*') || route().current('kategori.*') || route().current('metode.*')
    });

    const toggleMenu = (menu) => {
        if (!sidebarOpen) setSidebarOpen(true);
        setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
    };

    const getInitials = (name) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    // Helper for Section Labels that animate without shifting
    const SectionLabel = ({ text }) => (
        <div className="h-8 flex items-center overflow-hidden whitespace-nowrap mt-2">
            <div className={`w-[72px] flex justify-center items-center shrink-0 transition-opacity duration-300 ${sidebarOpen ? 'opacity-0' : 'opacity-100'}`}>
                <span className="text-gray-300 text-[10px] tracking-widest">•••</span>
            </div>
            <div className={`transition-all duration-300 ${sidebarOpen ? '-ml-[72px] px-6 opacity-100' : 'opacity-0'}`}>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{text}</p>
            </div>
        </div>
    );

    // Helper for Menu Items that anchor icons so they never move during width transitions
    const MenuItem = ({ icon, text, active = false, routeName = "#" }) => (
        <Link href={routeName === '#' ? '#' : route(routeName)} className={`group relative flex items-center h-[40px] mx-3 rounded-xl transition-all duration-300 w-[calc(100%-1.5rem)] ${active ? 'bg-[#009bd2] text-white shadow-md shadow-[#009bd2]/30' : 'text-slate-600 hover:bg-white hover:shadow-[0_8px_15px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 hover:scale-[1.02] hover:z-10 hover:text-slate-900'}`}>
            <div className={`w-10 h-10 flex justify-center items-center shrink-0 transition-all duration-300 ease-out group-hover:scale-[1.1] group-hover:-rotate-[12deg] ${active ? '' : 'group-hover:text-[#009bd2]'}`}>
                {icon}
            </div>
            <div className={`flex items-center justify-between overflow-hidden whitespace-nowrap transition-all duration-300 ${sidebarOpen ? 'w-[150px] opacity-100' : 'w-0 opacity-0'}`}>
                <span className={`text-[13px] font-semibold transition-all duration-300 origin-left ${active ? '' : 'group-hover:scale-[1.02] group-hover:font-bold group-hover:tracking-tight'}`}>{text}</span>
            </div>
        </Link>
    );

    const SubMenuParent = ({ icon, text, menuKey, active = false }) => (
        <div className="relative">
            <button onClick={() => toggleMenu(menuKey)} className={`group relative flex items-center h-[40px] mx-3 rounded-xl transition-all duration-300 w-[calc(100%-1.5rem)] ${active ? 'bg-[#009bd2] text-white shadow-md shadow-[#009bd2]/30' : 'text-slate-600 hover:bg-white hover:shadow-[0_8px_15px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 hover:scale-[1.02] hover:z-10 hover:text-slate-900'}`}>
                <div className={`w-10 h-10 flex justify-center items-center shrink-0 transition-all duration-300 ease-out group-hover:scale-[1.1] group-hover:-rotate-[12deg] ${active ? 'text-white' : 'group-hover:text-[#009bd2]'}`}>
                    {icon}
                </div>
                <div className={`flex items-center justify-between overflow-hidden whitespace-nowrap transition-all duration-300 ${sidebarOpen ? 'w-[150px] opacity-100' : 'w-0 opacity-0'}`}>
                    <span className={`text-[13px] font-semibold transition-all duration-300 origin-left ${active ? '' : 'group-hover:scale-[1.02] group-hover:font-bold group-hover:tracking-tight'}`}>{text}</span>
                    <div className={`shrink-0 pr-2 transition-transform duration-300 ${openMenus[menuKey] ? 'rotate-180' : ''}`}>
                        {Icons.ChevronDown}
                    </div>
                </div>
            </button>
            {/* Submenu Items */}
            <div className={`overflow-hidden transition-all duration-300 ${sidebarOpen && openMenus[menuKey] ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="pl-[60px] pr-4 py-1 space-y-1">
                    {menuKey === 'anggaran' && (
                        <>
                            <Link href={route('anggaran.investasi')} className={`block py-1.5 text-[12.5px] transition-all whitespace-nowrap ${route().current('anggaran.investasi') ? 'text-[#009bd2] font-extrabold' : 'font-medium text-slate-500 hover:text-[#009bd2]'}`}>Anggaran Tabungan & Target</Link>
                            <Link href={route('anggaran.hutang')} className={`block py-1.5 text-[12.5px] transition-all whitespace-nowrap ${route().current('anggaran.hutang') ? 'text-[#009bd2] font-extrabold' : 'font-medium text-slate-500 hover:text-[#009bd2]'}`}>Anggaran Hutang</Link>
                            <Link href={route('anggaran.pengeluaran')} className={`block py-1.5 text-[12.5px] transition-all whitespace-nowrap ${route().current('anggaran.pengeluaran') ? 'text-[#009bd2] font-extrabold' : 'font-medium text-slate-500 hover:text-[#009bd2]'}`}>Pengeluaran Bulanan</Link>
                        </>
                    )}
                    {menuKey === 'transaksi' && (
                        <>
                            <Link href={route('transaksi.history', { type: 'semua' })} className={`block py-1.5 text-[12.5px] transition-all whitespace-nowrap ${usePage().url.startsWith('/transaksi/history/semua') || (usePage().url.startsWith('/transaksi/history') && !usePage().url.includes('pengeluaran') && !usePage().url.includes('pemasukan') && !usePage().url.includes('tabungan')) ? 'text-[#009bd2] font-extrabold' : 'font-medium text-slate-500 hover:text-[#009bd2]'}`}>Semua Transaksi</Link>
                            <Link href={route('transaksi.history', { type: 'pengeluaran' })} className={`block py-1.5 text-[12.5px] transition-all whitespace-nowrap ${usePage().url.startsWith('/transaksi/history/pengeluaran') ? 'text-[#009bd2] font-extrabold' : 'font-medium text-slate-500 hover:text-[#009bd2]'}`}>Pengeluaran</Link>
                            <Link href={route('transaksi.history', { type: 'pemasukan' })} className={`block py-1.5 text-[12.5px] transition-all whitespace-nowrap ${usePage().url.startsWith('/transaksi/history/pemasukan') ? 'text-[#009bd2] font-extrabold' : 'font-medium text-slate-500 hover:text-[#009bd2]'}`}>Pemasukan</Link>
                            <Link href={route('transaksi.history', { type: 'tabungan' })} className={`block py-1.5 text-[12.5px] transition-all whitespace-nowrap ${usePage().url.startsWith('/transaksi/history/tabungan') ? 'text-[#009bd2] font-extrabold' : 'font-medium text-slate-500 hover:text-[#009bd2]'}`}>Riwayat Tabungan</Link>
                        </>
                    )}
                    {menuKey === 'kelola' && (
                        <>
                            <Link href={route('kategori.index')} className={`block py-1.5 text-[12.5px] transition-all whitespace-nowrap ${route().current('kategori.index') ? 'text-[#009bd2] font-extrabold' : 'font-medium text-slate-500 hover:text-[#009bd2]'}`}>Kelola Kategori</Link>
                            <Link href={route('metode.index')} className={`block py-1.5 text-[12.5px] transition-all whitespace-nowrap ${route().current('metode.index') ? 'text-[#009bd2] font-extrabold' : 'font-medium text-slate-500 hover:text-[#009bd2]'}`}>Kelola Jenis Metode</Link>
                        </>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="h-screen overflow-hidden bg-[#fcfcfc] flex font-sans">

            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}

            {/* SIDEBAR */}
            <aside className={`fixed inset-y-0 left-0 md:relative bg-white border-r border-slate-100 flex flex-col transition-all duration-300 ease-in-out z-50 h-full ${sidebarOpen ? 'w-[240px] translate-x-0' : 'w-[240px] md:w-[72px] -translate-x-full md:translate-x-0'}`}>

                {/* Logo Area - Fixed Icon Width */}
                <div className="h-20 md:h-24 flex items-center shrink-0 overflow-hidden">
                    <div className="w-[72px] h-full flex justify-center items-center shrink-0">
                        <img src="/logo.png" alt="FinanceTrack Logo" className="w-8 h-8 object-contain" />
                    </div>
                    <div className={`overflow-hidden transition-all duration-300 ${sidebarOpen ? 'w-[150px] opacity-100' : 'w-0 opacity-0'}`}>
                        <h1 className="font-extrabold text-slate-800 text-[15px] leading-tight whitespace-nowrap tracking-tight">FinanceTrack</h1>
                        <p className="text-[10px] text-slate-400 font-bold whitespace-nowrap mt-0.5">Plan Together</p>
                    </div>
                </div>

                {/* Navigation Menu */}
                <div className="flex-1 overflow-y-auto pb-4 sidebar-scroll">

                    <SectionLabel text="Persiapan" />
                    <div className="space-y-1">
                        <MenuItem icon={Icons.Dashboard} text="Dashboard" active={route().current('dashboard')} routeName="dashboard" />
                        <MenuItem icon={Icons.Target} text="Tabungan dan Target" active={route().current('tabungan.*')} routeName="tabungan.target" />
                        <MenuItem icon={Icons.Transaksi} text="Hutang & Piutang" active={route().current('hutang-piutang.*')} routeName="hutang-piutang.index" />
                        <SubMenuParent icon={Icons.Anggaran} text="Anggaran" menuKey="anggaran" active={route().current('anggaran.*')} />
                        <MenuItem icon={Icons.Pengeluaran} text="Pengeluaran & Pemasukan" active={route().current('transaksi.index')} routeName="transaksi.index" />
                        <SubMenuParent icon={Icons.Transaksi} text="Transaksi" menuKey="transaksi" active={route().current('transaksi.*') && !route().current('transaksi.index')} />
                    </div>

                    <SectionLabel text="Inspirasi" />
                    <div className="space-y-1">
                        <MenuItem icon={Icons.News} text="Berita Hari Ini" active={route().current('news.*')} routeName="news.index" />
                        <MenuItem icon={Icons.Laporan} text="Laporan Keuangan" active={route().current('laporan.*')} routeName="laporan.index" />
                    </div>

                    <SectionLabel text="Kecerdasan Buatan" />
                    <div className="space-y-1">
                        <MenuItem icon={Icons.AIAgent} text="Integrasi Agent AI" active={route().current('ai-agent.*')} routeName="ai-agent.index" />
                    </div>

                    <SectionLabel text="Akun" />
                    <div className="space-y-1">
                        <SubMenuParent icon={Icons.Database} text="Kelola Data" menuKey="kelola" active={route().current('kelola.*') || route().current('kategori.*') || route().current('metode.*')} />
                        <MenuItem icon={Icons.Settings} text="Setting" active={route().current('profile.*')} routeName="profile.edit" />
                    </div>
                </div>

                {/* Sidebar Footer */}
                <div className="mt-auto shrink-0 border-t border-slate-100 bg-white">
                    {/* User Profile */}
                    <div className="flex items-center h-[64px] hover:bg-slate-50 transition-colors overflow-hidden">
                        <div className="w-[72px] h-full flex justify-center items-center shrink-0">
                            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px]">
                                {getInitials(user.name)}
                            </div>
                        </div>
                        <div className={`flex items-center justify-between overflow-hidden transition-all duration-300 whitespace-nowrap ${sidebarOpen ? 'w-[160px] opacity-100' : 'w-0 opacity-0'}`}>
                            <div className="overflow-hidden pr-2">
                                <p className="text-[13px] font-bold text-slate-800 truncate leading-tight">{user.name}</p>
                                <p className="text-[11px] font-medium text-slate-400 truncate mt-0.5">{user.email}</p>
                            </div>
                            <Link href={route('logout')} method="post" as="button" className="text-slate-400 hover:text-red-500 transition-colors p-2 shrink-0 mr-4">
                                {Icons.Logout}
                            </Link>
                        </div>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT WRAPPER */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#fbfbfb]">
                {/* TOP HEADER */}
                <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-6 lg:px-8 shrink-0">
                    <div className="flex items-center gap-5">
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-xl hover:bg-slate-50 transition-colors relative w-10 h-10 flex items-center justify-center group">
                            {/* Pure CSS Animated Hamburger */}
                            <div className="w-[20px] h-[14px] flex flex-col justify-between items-end">
                                <span className="w-full h-[2.5px] bg-slate-400 group-hover:bg-slate-600 rounded-full transition-all duration-300 ease-in-out"></span>
                                <span className={`h-[2.5px] bg-slate-400 group-hover:bg-slate-600 rounded-full transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-[55%]' : 'w-full'}`}></span>
                                <span className="w-full h-[2.5px] bg-slate-400 group-hover:bg-slate-600 rounded-full transition-all duration-300 ease-in-out"></span>
                            </div>
                        </button>
                        <div className="hidden sm:block">
                            <h2 className="text-xl font-extrabold text-slate-900">Dashboard Overview</h2>
                            <p className="text-[13px] font-semibold text-slate-400">Selamat datang kembali, {user.name}.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-5 sm:gap-6">

                        <div className="w-px h-6 bg-gray-200 hidden sm:block"></div>

                        <button className="relative text-slate-400 hover:text-[#009bd2] transition-colors p-1">
                            <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                            <span className="absolute top-1 right-1.5 w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-white"></span>
                        </button>

                        <div className="w-px h-6 bg-gray-200 hidden sm:block"></div>

                        <Dropdown>
                            <Dropdown.Trigger>
                                <button className="flex items-center gap-3 focus:outline-none text-left rounded-xl p-1 hover:bg-slate-50 transition-colors">
                                    <div className="relative">
                                        <div className="w-10 h-10 rounded-full bg-[#009bd2]/10 text-[#009bd2] flex items-center justify-center font-bold">
                                            {getInitials(user.name)}
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-[2px] shadow-sm">
                                            <span className="text-[10px] leading-none block">👋</span>
                                        </div>
                                    </div>
                                    <div className="hidden lg:block">
                                        <p className="text-sm font-bold text-slate-800 leading-tight">{user.name}</p>
                                        <p className="text-[11px] font-semibold text-slate-400 mt-0.5">Super Admin</p>
                                    </div>
                                    <svg className="w-4 h-4 text-gray-400 ml-1 hidden lg:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </button>
                            </Dropdown.Trigger>
                            <Dropdown.Content>
                                <Dropdown.Link href={route('profile.edit')}>Profile</Dropdown.Link>
                                <Dropdown.Link href={route('logout')} method="post" as="button">Log Out</Dropdown.Link>
                            </Dropdown.Content>
                        </Dropdown>
                    </div>
                </header>

                {/* DYNAMIC PAGE CONTENT */}
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
