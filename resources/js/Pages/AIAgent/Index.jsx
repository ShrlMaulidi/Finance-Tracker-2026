import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Index({
    phoneNumber,
    isPhoneConnected,
    botPhoneNumber = '6281234567890',
    recentAiTransactions = [],
    stats = { total_ai_transactions: 0, monthly_ai_expense: 0 },
    categories = { pemasukan: [], pengeluaran: [] },
    paymentMethods = [],
    integrationConfig = { webhook_url: '', secret_token: '', is_admin: false },
}) {
    const [isEditingPhone, setIsEditingPhone] = useState(!isPhoneConnected);
    const [activePromptTab, setActivePromptTab] = useState('pengeluaran');
    const [copiedKey, setCopiedKey] = useState(null);
    const [showTechnicalDocs, setShowTechnicalDocs] = useState(false);
    const [showSecretToken, setShowSecretToken] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        phone_number: phoneNumber || '',
    });

    const handleSavePhone = (e) => {
        e.preventDefault();
        post(route('ai-agent.update-phone'), {
            preserveScroll: true,
            onSuccess: () => {
                setIsEditingPhone(false);
            },
        });
    };

    const handleDisconnectPhone = () => {
        if (confirm('Apakah Anda yakin ingin memutuskan tautan nomor WhatsApp dari akun ini? Bot tidak akan dapat mencatat transaksi dari nomor ini lagi.')) {
            router.delete(route('ai-agent.disconnect-phone'), {
                preserveScroll: true,
                onSuccess: () => {
                    reset();
                    setIsEditingPhone(true);
                },
            });
        }
    };

    const copyText = (text, key) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2500);
    };

    // Format phone display (+62 8xx-xxxx-xxxx)
    const formatPhoneDisplay = (num) => {
        if (!num) return '-';
        const str = String(num).replace(/\D/g, '');
        if (str.startsWith('62')) {
            const rest = str.substring(2);
            return `+62 ${rest.replace(/(\d{3})(\d{4})(\d+)/, '$1-$2-$3')}`;
        }
        return num;
    };

    const botWaUrl = `https://wa.me/${botPhoneNumber}?text=${encodeURIComponent('Halo FinanceTrack! Saya ingin mulai mencatat keuangan.')}`;

    const promptGuides = {
        pengeluaran: [
            {
                text: 'Makan siang padang 35rb pake gopay',
                parsed: { title: 'Makan siang padang', nominal: 'Rp 35.000', kategori: 'Makan & Minum', metode: 'GoPay' },
                desc: 'Pencatatan pengeluaran harian lengkap dengan metode dompet digital.',
            },
            {
                text: 'Beli bensin pertalite 50.000 cash',
                parsed: { title: 'Beli bensin pertalite', nominal: 'Rp 50.000', kategori: 'Transportasi', metode: 'Cash' },
                desc: 'Pengeluaran transportasi dengan metode tunai.',
            },
            {
                text: 'Nongkrong di cafe 48rb qris',
                parsed: { title: 'Nongkrong di cafe', nominal: 'Rp 48.000', kategori: 'Hiburan', metode: 'E-Wallet' },
                desc: 'Pengeluaran santai menggunakan QRIS/E-Wallet.',
            },
        ],
        pemasukan: [
            {
                text: 'Gaji bulanan masuk 8.500.000 transfer bca',
                parsed: { title: 'Gaji bulanan masuk', nominal: 'Rp 8.500.000', kategori: 'Gaji', metode: 'Transfer Bank BCA' },
                desc: 'Pemasukan gaji rutin ke rekening bank.',
            },
            {
                text: 'Dapat fee freelance desain 1.200.000 mandiri',
                parsed: { title: 'Fee freelance desain', nominal: 'Rp 1.200.000', kategori: 'Freelance', metode: 'E-Banking' },
                desc: 'Pemasukan proyek sampingan.',
            },
        ],
        struk: [
            {
                text: '[Kirim Foto Struk / Nota Belanja]',
                parsed: { title: 'Belanja Bulanan Indomaret', nominal: 'Rp 142.500', kategori: 'Kebutuhan', metode: 'Cash' },
                desc: 'Cukup foto nota belanja minimarket/supermarket. Vision AI Hermes akan membaca total bayar dan nama toko otomatis!',
            },
        ],
        tabungan: [
            {
                text: 'Nabung untuk beli laptop 500rb via bca',
                parsed: { title: 'Nabung Beli Laptop', nominal: 'Rp 500.000', target: 'Target Laptop', metode: 'BCA' },
                desc: 'Otomatis menambah saldo pada Target Tabungan Anda yang sedang berjalan.',
            },
        ],
        saldo: [
            {
                text: 'Cek saldo sekarang',
                parsed: { response: 'Menampilkan sisa saldo kas siap pakai, total tabungan, dan total pengeluaran bulan ini.' },
                desc: 'Asisten AI akan membalas dengan ringkasan status dompet Anda dalam hitungan detik.',
            },
            {
                text: 'Ringkasan bulan ini',
                parsed: { response: 'Menampilkan rekap pemasukan, pengeluaran, dan persentase arus kas bulanan.' },
                desc: 'Laporan kilat arus kas tanpa perlu membuka browser.',
            },
        ],
    };

    return (
        <AuthenticatedLayout>
            <Head title="Integrasi AI Agent WhatsApp" />

            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-10 space-y-6 sm:space-y-8 animate-fade-in relative z-10 pb-24">
                {/* Header Banner */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
                    <div>
                        <div className="flex items-center gap-2.5 mb-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-purple-100 text-purple-700 border border-purple-200 shadow-2xs">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                </svg>
                                Paket Pro Plus Aktif
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                AI Hermes Engine Ready
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
                            Integrasi Agent AI WhatsApp
                        </h1>
                        <p className="text-sm text-slate-500 mt-1 max-w-2xl font-medium">
                            Catat pengeluaran, pemasukan, atau kirim foto struk belanja cukup lewat WhatsApp. Sistem cerdas otomatis membukukan transaksi ke akun Anda.
                        </p>
                    </div>

                    {/* Status Pill Card */}
                    <div className="flex items-center gap-3 bg-white/80 backdrop-blur-md px-5 py-3.5 rounded-2xl border border-slate-200/90 shadow-2xs shrink-0">
                        <div className={`w-3.5 h-3.5 rounded-full ${isPhoneConnected ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-pulse' : 'bg-amber-400'}`} />
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Status Koneksi WhatsApp</p>
                            <p className="text-sm font-extrabold text-slate-900">
                                {isPhoneConnected ? formatPhoneDisplay(phoneNumber) : 'Belum Terhubung'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main 2-Column Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
                    {/* Left Column: Connection & Action Cards */}
                    <div className="lg:col-span-5 space-y-6">
                        {/* 1. WhatsApp Number Connection Card */}
                        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.03)] relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.54 2.02.825 3.094.825 3.181 0 5.767-2.586 5.768-5.766 0-3.18-2.587-5.766-5.766-5.766zm10.22 5.767c-.004 5.632-4.582 10.21-10.216 10.21-1.792 0-3.528-.469-5.062-1.361l-5.631 1.477 1.503-5.485c-.977-1.589-1.493-3.414-1.494-5.289.004-5.631 4.583-10.21 10.218-10.21 5.633 0 10.212 4.578 10.216 10.208z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="text-base font-extrabold text-slate-900">Nomor WhatsApp Anda</h2>
                                        <p className="text-xs text-slate-500 font-medium">Kunci otentikasi pengirim chat</p>
                                    </div>
                                </div>

                                {isPhoneConnected && !isEditingPhone && (
                                    <button
                                        type="button"
                                        onClick={() => setIsEditingPhone(true)}
                                        className="text-xs font-bold text-[#009bd2] hover:text-[#0089ba] hover:underline"
                                    >
                                        Ubah
                                    </button>
                                )}
                            </div>

                            {/* Connected View */}
                            {isPhoneConnected && !isEditingPhone ? (
                                <div className="space-y-4">
                                    <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                                            <div>
                                                <p className="text-xs text-emerald-800 font-bold uppercase tracking-wider">Terhubung Aktif</p>
                                                <p className="text-base font-black text-slate-900">{formatPhoneDisplay(phoneNumber)}</p>
                                            </div>
                                        </div>
                                        <span className="text-xs font-extrabold text-emerald-700 bg-white/80 px-2.5 py-1 rounded-lg border border-emerald-200">
                                            Verified
                                        </span>
                                    </div>

                                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                        Setiap pesan teks atau foto struk yang dikirim dari nomor ini ke Bot resmi akan otomatis dibukukan ke akun Anda.
                                    </p>

                                    <div className="flex items-center gap-2 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsEditingPhone(true)}
                                            className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
                                        >
                                            Ganti Nomor
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleDisconnectPhone}
                                            className="py-2.5 px-3 text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-xl transition-all border border-rose-200/70"
                                        >
                                            Putuskan Sambungan
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* Input / Edit Form */
                                <form onSubmit={handleSavePhone} className="space-y-4">
                                    <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 text-xs text-slate-600 leading-relaxed">
                                        Masukkan nomor WhatsApp pribadi yang akan Mas gunakan untuk mengirim chat ke AI bot.
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                                            Nomor WhatsApp
                                        </label>
                                        <div className="relative flex rounded-xl shadow-2xs">
                                            <span className="inline-flex items-center px-3.5 rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 text-slate-600 text-xs font-black">
                                                🇮🇩 +62
                                            </span>
                                            <input
                                                type="text"
                                                value={data.phone_number}
                                                onChange={(e) => setData('phone_number', e.target.value)}
                                                placeholder="81234567890"
                                                className={`flex-1 min-w-0 block w-full px-3.5 py-2.5 rounded-none rounded-r-xl text-sm font-semibold border ${errors.phone_number ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-200 focus:ring-[#009bd2] focus:border-[#009bd2]'}`}
                                            />
                                        </div>
                                        {errors.phone_number && (
                                            <p className="text-xs text-rose-500 font-bold mt-1.5">{errors.phone_number}</p>
                                        )}
                                        <p className="text-[11px] text-slate-400 mt-1">Bisa format 0812... atau 812...</p>
                                    </div>

                                    <div className="flex items-center gap-2 pt-1">
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="flex-1 py-3 px-4 bg-[#009bd2] hover:bg-[#0089ba] text-white text-xs font-extrabold rounded-xl transition-all shadow-md shadow-[#009bd2]/25 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {processing ? (
                                                <>
                                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                                    </svg>
                                                    <span>Menyimpan...</span>
                                                </>
                                            ) : (
                                                <span>Simpan & Tautkan Nomor</span>
                                            )}
                                        </button>

                                        {isPhoneConnected && (
                                            <button
                                                type="button"
                                                onClick={() => setIsEditingPhone(false)}
                                                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
                                            >
                                                Batal
                                            </button>
                                        )}
                                    </div>
                                </form>
                            )}
                        </div>

                        {/* 2. Official WhatsApp Bot Card */}
                        <div className="bg-gradient-to-br from-[#128C7E] to-[#075E54] rounded-3xl p-6 sm:p-7 text-white shadow-xl shadow-emerald-950/15 relative overflow-hidden">
                            <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-white/10 rounded-full blur-xl pointer-events-none" />

                            <div className="flex items-center justify-between mb-4">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-white/20 text-white backdrop-blur-md">
                                    <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping"></span>
                                    Bot WhatsApp Siap 24 Jam
                                </span>
                                <svg className="w-7 h-7 text-white/80" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.54 2.02.825 3.094.825 3.181 0 5.767-2.586 5.768-5.766 0-3.18-2.587-5.766-5.766-5.766zm10.22 5.767c-.004 5.632-4.582 10.21-10.216 10.21-1.792 0-3.528-.469-5.062-1.361l-5.631 1.477 1.503-5.485c-.977-1.589-1.493-3.414-1.494-5.289.004-5.631 4.583-10.21 10.218-10.21 5.633 0 10.212 4.578 10.216 10.208z" />
                                </svg>
                            </div>

                            <h3 className="text-xl font-black mb-1">FinanceTrack AI Assistant</h3>
                            <p className="text-xs text-white/80 font-medium mb-4 leading-relaxed">
                                Simpan nomor ini di kontak handphone Anda agar mudah mengirim pesan pencatatan kapan saja.
                            </p>

                            <div className="bg-black/20 backdrop-blur-md rounded-2xl p-3.5 flex items-center justify-between mb-5 border border-white/10">
                                <div>
                                    <p className="text-[10px] text-emerald-200 font-bold uppercase tracking-wider">Nomor Bot Resmi</p>
                                    <p className="text-base font-black tracking-wide">{formatPhoneDisplay(botPhoneNumber)}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => copyText(botPhoneNumber, 'bot_num')}
                                    className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold transition-all"
                                >
                                    {copiedKey === 'bot_num' ? 'Tersalin! ✓' : 'Salin'}
                                </button>
                            </div>

                            <a
                                href={botWaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full bg-white hover:bg-emerald-50 text-[#075E54] font-extrabold py-3.5 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-95 text-sm"
                            >
                                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.54 2.02.825 3.094.825 3.181 0 5.767-2.586 5.768-5.766 0-3.18-2.587-5.766-5.766-5.766zm10.22 5.767c-.004 5.632-4.582 10.21-10.216 10.21-1.792 0-3.528-.469-5.062-1.361l-5.631 1.477 1.503-5.485c-.977-1.589-1.493-3.414-1.494-5.289.004-5.631 4.583-10.21 10.218-10.21 5.633 0 10.212 4.578 10.216 10.208z" />
                                </svg>
                                <span>Mulai Chat di WhatsApp</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </a>
                        </div>

                        {/* 3. Stat Highlights */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Trx via AI</p>
                                <p className="text-2xl font-black text-slate-900 mt-1">{stats.total_ai_transactions}</p>
                                <p className="text-[11px] text-emerald-600 font-semibold mt-1">Otomatis Terinput</p>
                            </div>
                            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pengeluaran AI Bln Ini</p>
                                <p className="text-lg font-black text-slate-900 mt-1">
                                    Rp {Number(stats.monthly_ai_expense).toLocaleString('id-ID')}
                                </p>
                                <p className="text-[11px] text-slate-500 font-semibold mt-1">Tercatat Akurat</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Interactive Prompt Cheatsheet & WhatsApp Simulator */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* Interactive Cheatsheet */}
                        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-100 pb-4">
                                <div>
                                    <h2 className="text-lg font-extrabold text-slate-900">Kamus & Format Pesan AI</h2>
                                    <p className="text-xs text-slate-500 font-medium">Contoh gaya chat yang langsung dipahami oleh Hermes AI</p>
                                </div>
                                <span className="text-[11px] font-extrabold text-[#009bd2] bg-blue-50 px-3 py-1 rounded-full border border-blue-100/80 self-start sm:self-auto">
                                    Natural Language NLP
                                </span>
                            </div>

                            {/* Prompt Category Tabs */}
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-5">
                                {[
                                    { id: 'pengeluaran', label: '📉 Pengeluaran' },
                                    { id: 'pemasukan', label: '📈 Pemasukan' },
                                    { id: 'struk', label: '📸 Foto Struk' },
                                    { id: 'tabungan', label: '🎯 Nabung' },
                                    { id: 'saldo', label: '💵 Cek Saldo' },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setActivePromptTab(tab.id)}
                                        className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                                            activePromptTab === tab.id
                                                ? 'bg-slate-900 text-white shadow-sm'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Active Tab Examples */}
                            <div className="space-y-3.5">
                                {promptGuides[activePromptTab]?.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="group p-4 rounded-2xl border border-slate-200/70 hover:border-[#009bd2]/50 hover:bg-blue-50/20 transition-all space-y-2.5 relative"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black flex items-center justify-center shrink-0">
                                                    {idx + 1}
                                                </span>
                                                <code className="text-xs sm:text-sm font-bold text-slate-900 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60 font-sans">
                                                    "{item.text}"
                                                </code>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => copyText(item.text, `prompt_${activePromptTab}_${idx}`)}
                                                className="px-2.5 py-1 text-[11px] font-bold text-slate-600 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 shadow-2xs transition-all shrink-0"
                                            >
                                                {copiedKey === `prompt_${activePromptTab}_${idx}` ? 'Tersalin! ✓' : 'Salin'}
                                            </button>
                                        </div>

                                        <p className="text-xs text-slate-500 font-medium">{item.desc}</p>

                                        {/* Parsed Visual Preview */}
                                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-wrap items-center gap-3 text-[11px]">
                                            <span className="font-bold text-slate-400">Hasil Deteksi AI:</span>
                                            {item.parsed.title && (
                                                <span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-semibold text-slate-700">
                                                    Judul: <strong className="text-slate-900">{item.parsed.title}</strong>
                                                </span>
                                            )}
                                            {item.parsed.nominal && (
                                                <span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-semibold text-emerald-700">
                                                    Nominal: <strong>{item.parsed.nominal}</strong>
                                                </span>
                                            )}
                                            {item.parsed.kategori && (
                                                <span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-semibold text-blue-700">
                                                    Kategori: <strong>{item.parsed.kategori}</strong>
                                                </span>
                                            )}
                                            {item.parsed.metode && (
                                                <span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-semibold text-purple-700">
                                                    Metode: <strong>{item.parsed.metode}</strong>
                                                </span>
                                            )}
                                            {item.parsed.response && (
                                                <span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-semibold text-slate-700">
                                                    {item.parsed.response}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Transactions Recorded via AI */}
                        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-base font-extrabold text-slate-900">Riwayat Transaksi Masuk via Bot</h3>
                                    <p className="text-xs text-slate-500 font-medium">Transaksi terakhir yang otomatis dibukukan oleh AI</p>
                                </div>
                                <span className="text-xs font-bold text-slate-400">
                                    {recentAiTransactions.length} Transaksi Terakhir
                                </span>
                            </div>

                            {recentAiTransactions.length > 0 ? (
                                <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                                    {recentAiTransactions.map((tx) => (
                                        <div key={tx.id} className="py-3 flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div
                                                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                                        tx.type === 'pemasukan'
                                                            ? 'bg-emerald-50 text-emerald-600'
                                                            : tx.type === 'tabungan'
                                                            ? 'bg-blue-50 text-blue-600'
                                                            : 'bg-rose-50 text-rose-600'
                                                    }`}
                                                >
                                                    {tx.type === 'pemasukan' ? (
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                                                    ) : (
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">{tx.title}</p>
                                                    <p className="text-[11px] text-slate-400 font-medium">
                                                        {tx.category} • {tx.payment_method || 'Cash'} • {tx.date_formatted}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="text-right shrink-0">
                                                <p
                                                    className={`text-xs sm:text-sm font-black ${
                                                        tx.type === 'pemasukan'
                                                            ? 'text-emerald-600'
                                                            : tx.type === 'tabungan'
                                                            ? 'text-blue-600'
                                                            : 'text-rose-600'
                                                    }`}
                                                >
                                                    {tx.type === 'pemasukan' ? '+' : '-'} Rp {Number(tx.amount).toLocaleString('id-ID')}
                                                </p>
                                                <span className="text-[10px] font-bold text-slate-400">via Bot WA</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-slate-50/60 rounded-2xl border border-slate-100">
                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-2 text-slate-400 shadow-2xs">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                    </div>
                                    <p className="text-xs font-bold text-slate-700">Belum Ada Transaksi dari WhatsApp</p>
                                    <p className="text-[11px] text-slate-400 max-w-sm mx-auto mt-0.5">
                                        Tautkan nomor WhatsApp Anda di samping, lalu coba kirim pesan chat pertama ke Bot.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Technical Configuration Card for VPS / n8n / Hermes Setup */}
                <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-slate-800 flex items-center justify-center text-purple-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-base sm:text-lg font-black text-white">
                                    Dokumentasi Teknis Integrasi VPS (n8n, Hermes & 9router)
                                </h3>
                                <p className="text-xs text-slate-400 font-medium">
                                    Parameter webhook yang perlu dimasukkan ke node HTTP Request pada workflow n8n Anda di VPS
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowTechnicalDocs(!showTechnicalDocs)}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-xl transition-all border border-slate-700 self-start sm:self-auto"
                        >
                            {showTechnicalDocs ? 'Sembunyikan Detail ▲' : 'Buka Parameter n8n ▼'}
                        </button>
                    </div>

                    {showTechnicalDocs && (
                        <div className="mt-6 space-y-6 text-xs animate-fade-in">
                            {/* Endpoint URL & Secret */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                            Webhook URL (Method POST)
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => copyText(integrationConfig.webhook_url, 'url_doc')}
                                            className="text-[10px] text-purple-400 hover:underline font-bold"
                                        >
                                            {copiedKey === 'url_doc' ? 'Tersalin! ✓' : 'Salin URL'}
                                        </button>
                                    </div>
                                    <code className="text-xs text-emerald-400 font-mono block break-all">
                                        {integrationConfig.webhook_url}
                                    </code>
                                </div>

                                <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                            Header: X-AI-Secret-Key
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowSecretToken(!showSecretToken)}
                                                className="text-[10px] text-slate-400 hover:text-white"
                                            >
                                                {showSecretToken ? 'Sembunyikan' : 'Lihat'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => copyText(integrationConfig.secret_token, 'token_doc')}
                                                className="text-[10px] text-purple-400 hover:underline font-bold"
                                            >
                                                {copiedKey === 'token_doc' ? 'Tersalin! ✓' : 'Salin Token'}
                                            </button>
                                        </div>
                                    </div>
                                    <code className="text-xs text-amber-300 font-mono block">
                                        {showSecretToken ? integrationConfig.secret_token : '••••••••••••••••••••••••'}
                                    </code>
                                </div>
                            </div>

                            {/* JSON Body Sample for n8n */}
                            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        Format Payload JSON (Dikirim oleh n8n setelah diproses Hermes AI)
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            copyText(
                                                JSON.stringify(
                                                    {
                                                        sender_phone: '6281234567890',
                                                        type: 'pengeluaran',
                                                        amount: 35000,
                                                        title: 'Makan siang padang',
                                                        category: 'Makan & Minum',
                                                        payment_method: 'GoPay',
                                                        date: '2026-10-15',
                                                        description: 'Dicatat otomatis via WhatsApp AI Bot',
                                                    },
                                                    null,
                                                    2
                                                ),
                                                'json_doc'
                                            )
                                        }
                                        className="text-[10px] text-purple-400 hover:underline font-bold"
                                    >
                                        {copiedKey === 'json_doc' ? 'Tersalin! ✓' : 'Salin Contoh JSON'}
                                    </button>
                                </div>
                                <pre className="p-3 bg-slate-900 rounded-xl overflow-x-auto text-[11px] font-mono text-slate-300 leading-relaxed">
{`{
  "sender_phone": "6281234567890", // Nomor WhatsApp pengirim chat
  "type": "pengeluaran",            // 'pengeluaran' | 'pemasukan' | 'tabungan'
  "amount": 35000,                  // Nominal angka murni
  "title": "Makan siang padang",     // Judul transaksi
  "category": "Makan & Minum",      // Kategori (otomatis dicocokkan atau dibuatkan)
  "payment_method": "GoPay",        // Dompet / Rekening pembayaran
  "date": "2026-10-15",             // Tanggal transaksi (YYYY-MM-DD, opsional)
  "description": "Dicatat via WA"   // Catatan tambahan (opsional)
}`}
                                </pre>
                            </div>

                            {/* Response Example */}
                            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Format Response Balasan dari Web (Langsung Teruskan response.message ke User WhatsApp)
                                </span>
                                <pre className="p-3 bg-slate-900 rounded-xl overflow-x-auto text-[11px] font-mono text-emerald-400 leading-relaxed">
{`{
  "status": "success",
  "message": "✅ *Transaksi Berhasil Dicatat!*\\n\\n📉 *Pengeluaran:* Makan siang padang\\n💰 *Nominal:* Rp 35.000\\n🏷 *Kategori:* Makan & Minum\\n💳 *Metode:* GoPay\\n📅 *Tanggal:* 15 Oktober 2026\\n\\n💵 *Sisa Saldo Kas:* Rp 2.465.000"
}`}
                                </pre>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
