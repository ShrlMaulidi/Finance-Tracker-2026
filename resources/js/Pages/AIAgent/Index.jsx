import React, { useState, useEffect } from 'react';
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

    // Follow a number connected or disconnected from another device / tab
    useEffect(() => {
        setIsEditingPhone(!isPhoneConnected);
    }, [isPhoneConnected]);
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
                desc: 'Cukup foto nota belanja minimarket/supermarket. Sistem akan membaca total bayar dan nama toko otomatis.',
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
                desc: 'Bot akan membalas dengan ringkasan status dompet Anda.',
            },
            {
                text: 'Ringkasan bulan ini',
                parsed: { response: 'Menampilkan rekap pemasukan, pengeluaran, dan persentase arus kas bulanan.' },
                desc: 'Laporan singkat arus kas tanpa perlu membuka browser.',
            },
        ],
    };

    const tabs = [
        { id: 'pengeluaran', label: 'Pengeluaran' },
        { id: 'pemasukan', label: 'Pemasukan' },
        { id: 'struk', label: 'Foto Struk' },
        { id: 'tabungan', label: 'Tabungan' },
        { id: 'saldo', label: 'Cek Saldo' },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Integrasi WhatsApp" />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
                            Integrasi WhatsApp
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Catat transaksi atau unggah foto struk belanja langsung melalui pesan WhatsApp.
                        </p>
                    </div>

                    <div className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 self-start sm:self-auto">
                        <span className={`w-2 h-2 rounded-full ${isPhoneConnected ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                        <span className="text-xs font-medium text-slate-600">
                            {isPhoneConnected ? formatPhoneDisplay(phoneNumber) : 'Belum Terhubung'}
                        </span>
                    </div>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Column */}
                    <div className="lg:col-span-5 space-y-6">
                        {/* 1. Nomor WhatsApp Card */}
                        <div className="bg-white rounded-xl p-5 border border-slate-200">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-sm font-semibold text-slate-900">Nomor WhatsApp Terdaftar</h2>
                                    <p className="text-xs text-slate-500 mt-0.5">Digunakan untuk mengenali akun Anda saat mengirim pesan</p>
                                </div>
                                {isPhoneConnected && !isEditingPhone && (
                                    <button
                                        type="button"
                                        onClick={() => setIsEditingPhone(true)}
                                        className="text-xs font-medium text-[#009bd2] hover:underline"
                                    >
                                        Ubah
                                    </button>
                                )}
                            </div>

                            {isPhoneConnected && !isEditingPhone ? (
                                <div className="space-y-4">
                                    <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3.5 flex items-center justify-between">
                                        <div>
                                            <p className="text-[11px] text-slate-500">Nomor Aktif</p>
                                            <p className="text-sm font-semibold text-slate-900 mt-0.5">
                                                {formatPhoneDisplay(phoneNumber)}
                                            </p>
                                        </div>
                                        <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                            Terhubung
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 pt-1">
                                        <button
                                            type="button"
                                            onClick={() => setIsEditingPhone(true)}
                                            className="flex-1 py-2 px-3 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 transition-colors"
                                        >
                                            Ganti Nomor
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleDisconnectPhone}
                                            className="py-2 px-3 text-rose-600 hover:bg-rose-50 text-xs font-medium rounded-lg border border-rose-200 transition-colors"
                                        >
                                            Putuskan
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleSavePhone} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1.5">
                                            Nomor WhatsApp
                                        </label>
                                        <div className="flex rounded-lg">
                                            <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-slate-300 bg-slate-50 text-slate-600 text-xs font-medium">
                                                +62
                                            </span>
                                            <input
                                                type="text"
                                                value={data.phone_number}
                                                onChange={(e) => setData('phone_number', e.target.value)}
                                                placeholder="81234567890"
                                                className={`flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-lg text-sm border focus:outline-none ${
                                                    errors.phone_number
                                                        ? 'border-rose-400 focus:border-rose-500'
                                                        : 'border-slate-300 focus:border-[#009bd2]'
                                                }`}
                                            />
                                        </div>
                                        {errors.phone_number && (
                                            <p className="text-xs text-rose-600 mt-1.5">{errors.phone_number}</p>
                                        )}
                                        <p className="text-[11px] text-slate-400 mt-1">Contoh: 81234567890 atau 081234567890</p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="flex-1 py-2 px-4 bg-[#009bd2] hover:bg-[#0089ba] text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            {processing ? 'Menyimpan...' : 'Simpan Nomor'}
                                        </button>

                                        {isPhoneConnected && (
                                            <button
                                                type="button"
                                                onClick={() => setIsEditingPhone(false)}
                                                className="py-2 px-3 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 transition-colors"
                                            >
                                                Batal
                                            </button>
                                        )}
                                    </div>
                                </form>
                            )}
                        </div>

                        {/* 2. Bot Kontak Card */}
                        <div className="bg-white rounded-xl p-5 border border-slate-200 space-y-4">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900">Kontak Bot FinanceTrack</h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Simpan nomor berikut atau langsung buka ruang obrolan WhatsApp.
                                </p>
                            </div>

                            <div className="bg-slate-50 rounded-lg p-3 flex items-center justify-between border border-slate-200/80">
                                <div>
                                    <p className="text-[11px] text-slate-500">Nomor Bot</p>
                                    <p className="text-sm font-semibold text-slate-900 mt-0.5">
                                        {formatPhoneDisplay(botPhoneNumber)}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => copyText(botPhoneNumber, 'bot_num')}
                                    className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-xs font-medium transition-colors"
                                >
                                    {copiedKey === 'bot_num' ? 'Tersalin' : 'Salin'}
                                </button>
                            </div>

                            <a
                                href={botWaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-xs"
                            >
                                <span>Buka Chat WhatsApp</span>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </a>
                        </div>

                        {/* 3. Ringkasan Statistik */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white rounded-xl p-4 border border-slate-200">
                                <p className="text-xs text-slate-500">Transaksi via Bot</p>
                                <p className="text-xl font-semibold text-slate-900 mt-1">
                                    {stats.total_ai_transactions}
                                </p>
                            </div>
                            <div className="bg-white rounded-xl p-4 border border-slate-200">
                                <p className="text-xs text-slate-500">Pengeluaran Bulan Ini</p>
                                <p className="text-base font-semibold text-slate-900 mt-1.5">
                                    Rp {Number(stats.monthly_ai_expense).toLocaleString('id-ID')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* Panduan Format Pesan */}
                        <div className="bg-white rounded-xl p-5 border border-slate-200">
                            <div className="mb-4">
                                <h2 className="text-sm font-semibold text-slate-900">Panduan Format Pesan</h2>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Contoh kalimat yang dapat langsung dikirim ke WhatsApp
                                </p>
                            </div>

                            {/* Tabs */}
                            <div className="flex items-center gap-1 border-b border-slate-200 mb-4 overflow-x-auto scrollbar-none">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setActivePromptTab(tab.id)}
                                        className={`px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                                            activePromptTab === tab.id
                                                ? 'border-slate-900 text-slate-900'
                                                : 'border-transparent text-slate-500 hover:text-slate-700'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Examples List */}
                            <div className="space-y-3">
                                {promptGuides[activePromptTab]?.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="p-3.5 rounded-lg border border-slate-200/80 bg-slate-50/50 space-y-2"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <code className="text-xs font-medium text-slate-900 bg-white px-2.5 py-1 rounded border border-slate-200 font-mono">
                                                {item.text}
                                            </code>

                                            <button
                                                type="button"
                                                onClick={() => copyText(item.text, `prompt_${activePromptTab}_${idx}`)}
                                                className="px-2.5 py-1 text-[11px] font-medium text-slate-600 bg-white hover:bg-slate-100 rounded border border-slate-200 transition-colors shrink-0"
                                            >
                                                {copiedKey === `prompt_${activePromptTab}_${idx}` ? 'Tersalin' : 'Salin'}
                                            </button>
                                        </div>

                                        <p className="text-xs text-slate-500">{item.desc}</p>

                                        {/* Parsed Output */}
                                        <div className="pt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                                            {item.parsed.title && (
                                                <span>Judul: <strong className="font-medium text-slate-800">{item.parsed.title}</strong></span>
                                            )}
                                            {item.parsed.nominal && (
                                                <span>Nominal: <strong className="font-medium text-slate-800">{item.parsed.nominal}</strong></span>
                                            )}
                                            {item.parsed.kategori && (
                                                <span>Kategori: <strong className="font-medium text-slate-800">{item.parsed.kategori}</strong></span>
                                            )}
                                            {item.parsed.target && (
                                                <span>Target: <strong className="font-medium text-slate-800">{item.parsed.target}</strong></span>
                                            )}
                                            {item.parsed.metode && (
                                                <span>Metode: <strong className="font-medium text-slate-800">{item.parsed.metode}</strong></span>
                                            )}
                                            {item.parsed.response && (
                                                <span className="text-slate-600">{item.parsed.response}</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Riwayat Transaksi */}
                        <div className="bg-white rounded-xl p-5 border border-slate-200">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-900">Riwayat Pencatatan Bot</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Transaksi terakhir yang masuk melalui WhatsApp</p>
                                </div>
                                <span className="text-xs text-slate-400">
                                    {recentAiTransactions.length} transaksi
                                </span>
                            </div>

                            {recentAiTransactions.length > 0 ? (
                                <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                                    {recentAiTransactions.map((tx) => (
                                        <div key={tx.id} className="py-3 flex items-center justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-xs sm:text-sm font-medium text-slate-900 truncate">
                                                    {tx.title}
                                                </p>
                                                <p className="text-[11px] text-slate-400 mt-0.5">
                                                    {tx.category} • {tx.payment_method || 'Cash'} • {tx.date_formatted}
                                                </p>
                                            </div>

                                            <div className="text-right shrink-0">
                                                <p
                                                    className={`text-xs sm:text-sm font-semibold ${
                                                        tx.type === 'pemasukan'
                                                            ? 'text-emerald-600'
                                                            : tx.type === 'tabungan'
                                                                ? 'text-blue-600'
                                                                : 'text-slate-900'
                                                    }`}
                                                >
                                                    {tx.type === 'pemasukan' ? '+' : '-'} Rp {Number(tx.amount).toLocaleString('id-ID')}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-slate-50 rounded-lg border border-slate-200/60">
                                    <p className="text-xs font-medium text-slate-600">Belum ada riwayat transaksi</p>
                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                        Transaksi yang Anda kirim melalui WhatsApp akan muncul di sini.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}