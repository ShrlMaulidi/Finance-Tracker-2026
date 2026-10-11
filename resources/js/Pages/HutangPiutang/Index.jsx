import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import CurrencyInput from '@/Components/CurrencyInput';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Dropdown from '@/Components/Dropdown';

export default function Hutang({ debts }) {
    const formatRp = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

    const [activeTab, setActiveTab] = useState('hutang');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDebt, setEditingDebt] = useState(null);

    const { data, setData, post, put, processing, reset, errors, clearErrors } = useForm({
        type: 'hutang',
        name: '',
        amount: '',
        remaining_amount: '',
        due_date: '',
        status: 'belum_lunas',
        description: ''
    });

    const openAddModal = () => {
        setEditingDebt(null);
        clearErrors();
        reset();
        setData('type', activeTab === 'riwayat' ? 'hutang' : activeTab);
        setIsModalOpen(true);
    };

    const openEditModal = (item) => {
        setEditingDebt(item);
        clearErrors();
        setData({
            type: item.type,
            name: item.name,
            amount: item.amount,
            remaining_amount: item.remaining_amount,
            due_date: item.due_date || '',
            status: item.status,
            description: item.description || ''
        });
        setIsModalOpen(true);
    };

    const submit = (e) => {
        e.preventDefault();
        
        if (editingDebt) {
            put(route('hutang-piutang.update', editingDebt.id), {
                onSuccess: () => {
                    setIsModalOpen(false);
                    setEditingDebt(null);
                    reset();
                }
            });
        } else {
            post(route('hutang-piutang.store'), {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                },
            });
        }
    };

    const handleDelete = (id) => {
        if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
            router.delete(route('hutang-piutang.destroy', id));
        }
    };

    const activeDebts = debts.filter(d => d.type === 'hutang' && d.status !== 'lunas');
    const activeReceivables = debts.filter(d => d.type === 'piutang' && d.status !== 'lunas');
    const historyDebts = debts.filter(d => d.status === 'lunas');
    
    const displayData = activeTab === 'hutang' ? activeDebts : activeTab === 'piutang' ? activeReceivables : historyDebts;

    return (
        <AuthenticatedLayout>
            <Head title="Hutang & Piutang" />
            <div className="max-w-7xl mx-auto px-3.5 py-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 relative">
                
                {/* Header Page & Toolbar */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4 border-b border-slate-100 pb-3 sm:pb-4">
                    <div>
                        <p className="text-[11px] sm:text-xs font-bold text-[#009bd2] uppercase tracking-wider mb-0.5 sm:mb-1">Manajemen Utang</p>
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
                            Hutang & Piutang
                        </h1>
                        <p className="text-slate-500 font-medium text-xs sm:text-sm mt-0.5 sm:mt-1">Pantau kewajiban pinjaman dan hak piutang Anda secara teratur.</p>
                    </div>
                    
                    {/* Tab Navigation & Add Action */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full md:w-auto">
                        <div className="flex bg-slate-100/90 p-1 rounded-xl w-full sm:w-auto gap-1">
                            <button 
                                onClick={() => setActiveTab('hutang')}
                                className={`flex-1 sm:flex-none text-center px-2.5 sm:px-4 py-2 rounded-lg font-extrabold text-xs sm:text-sm transition-all duration-300 ${activeTab === 'hutang' ? 'bg-white text-rose-500 shadow-[0_2px_8px_rgba(0,0,0,0.06)]' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Hutang ({activeDebts.length})
                            </button>
                            <button 
                                onClick={() => setActiveTab('piutang')}
                                className={`flex-1 sm:flex-none text-center px-2.5 sm:px-4 py-2 rounded-lg font-extrabold text-xs sm:text-sm transition-all duration-300 ${activeTab === 'piutang' ? 'bg-white text-emerald-600 shadow-[0_2px_8px_rgba(0,0,0,0.06)]' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Piutang ({activeReceivables.length})
                            </button>
                            <button 
                                onClick={() => setActiveTab('riwayat')}
                                className={`flex-1 sm:flex-none text-center px-2.5 sm:px-4 py-2 rounded-lg font-extrabold text-xs sm:text-sm transition-all duration-300 ${activeTab === 'riwayat' ? 'bg-white text-[#009bd2] shadow-[0_2px_8px_rgba(0,0,0,0.06)]' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Riwayat ({historyDebts.length})
                            </button>
                        </div>
                        <button 
                            onClick={openAddModal}
                            className="bg-[#009bd2] hover:bg-[#0089ba] text-white px-4 sm:px-5 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-xs sm:text-sm shadow-xs hover:shadow-md shrink-0"
                        >
                            <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/></svg>
                            <span>Tambah Data</span>
                        </button>
                    </div>
                </div>

                {/* Data List */}
                <div className="space-y-4 sm:space-y-6 animate-fade-in">
                    {displayData.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-6">
                            {displayData.map(item => {
                                const paidAmount = Math.max(0, item.amount - item.remaining_amount);
                                const percent = Math.min(100, Math.round((paidAmount / item.amount) * 100));
                                
                                return (
                                    <div key={item.id} className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-md transition-all flex flex-col overflow-hidden">
                                        
                                        <div className="p-4 sm:p-6 md:p-8 flex-1 flex flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between items-start gap-2.5 mb-3 sm:mb-5">
                                                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                                                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 ${item.type === 'hutang' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                                            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                {item.type === 'hutang' ? (
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                ) : (
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                )}
                                                            </svg>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h3 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 leading-snug truncate" title={item.name}>{item.name}</h3>
                                                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                                                <span className="text-[10px] sm:text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md truncate max-w-[140px] sm:max-w-none">{item.description || 'Tanpa keterangan'}</span>
                                                                <span className="text-[11px] sm:text-xs font-semibold text-slate-400">
                                                                    • {item.due_date ? `Jatuh Tempo: ${new Date(item.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}` : 'Tanpa tempo'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Action Dropdown */}
                                                    <div className="shrink-0 -mr-1">
                                                        <Dropdown>
                                                            <Dropdown.Trigger>
                                                                <button className="w-8 h-8 sm:w-9 sm:h-9 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg flex items-center justify-center transition-colors focus:outline-none">
                                                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z"/></svg>
                                                                </button>
                                                            </Dropdown.Trigger>
                                                            <Dropdown.Content align="right" width="40" contentClasses="py-1 bg-white border border-slate-100 shadow-xl rounded-xl">
                                                                <button 
                                                                    onClick={() => openEditModal(item)} 
                                                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                                                                >
                                                                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                                                                    <span>Edit Data</span>
                                                                </button>
                                                                <div className="h-px bg-slate-100 my-1"></div>
                                                                <button 
                                                                    onClick={() => handleDelete(item.id)} 
                                                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs sm:text-sm font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                                                                >
                                                                    <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                                                    <span>Hapus Data</span>
                                                                </button>
                                                            </Dropdown.Content>
                                                        </Dropdown>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Progress Bar Section */}
                                            <div className="space-y-3 sm:space-y-4 mt-3 sm:mt-6 pt-2">
                                                <div className="flex justify-between items-end gap-2">
                                                    <div className="min-w-0">
                                                        <p className={`text-xl sm:text-2xl md:text-3xl font-black tracking-tight truncate ${item.type === 'hutang' ? 'text-rose-500' : 'text-emerald-500'}`} title={formatRp(item.amount)}>
                                                            {formatRp(item.amount)}
                                                        </p>
                                                        <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-0.5 truncate">Total {item.type === 'hutang' ? 'Hutang' : 'Piutang'}</p>
                                                    </div>
                                                    <div className="text-right shrink-0 flex flex-col items-end">
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider mb-1 ${item.status === 'lunas' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                            {item.status === 'lunas' ? 'Lunas' : 'Belum Lunas'}
                                                        </span>
                                                        <span className="text-base sm:text-xl font-black text-slate-800">{percent}%</span>
                                                    </div>
                                                </div>
                                                
                                                <div className="h-2.5 sm:h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full transition-all duration-1000 ease-out rounded-full ${item.type === 'hutang' ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                                        style={{ width: `${percent}%` }}
                                                    ></div>
                                                </div>
                                                
                                                <div className="flex justify-between items-center text-xs sm:text-sm font-bold pt-0.5 sm:pt-1 gap-2">
                                                    <span className="text-slate-500 truncate">Telah Dibayar {formatRp(paidAmount)}</span>
                                                    <span className={`shrink-0 font-extrabold ${item.type === 'hutang' ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                        Sisa {formatRp(item.remaining_amount)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12 sm:py-16 px-4 bg-slate-50/70 rounded-2xl sm:rounded-3xl border-2 border-dashed border-slate-200">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-xs text-slate-300">
                                <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            </div>
                            <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-1">Belum ada {activeTab === 'riwayat' ? 'data riwayat' : activeTab === 'hutang' ? 'hutang' : 'piutang'}</h3>
                            <p className="text-slate-500 font-medium text-xs sm:text-sm max-w-sm mx-auto">Klik tombol 'Tambah Data' di atas untuk mencatat data {activeTab === 'riwayat' ? 'riwayat' : activeTab === 'hutang' ? 'hutang' : 'piutang'} Anda.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Form Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => { setIsModalOpen(false); setEditingDebt(null); reset(); }}></div>
                    <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-lg relative overflow-hidden border border-slate-100 z-10 animate-fade-in flex flex-col max-h-[92vh]">
                        <div className="p-4 sm:p-6 md:p-8 overflow-y-auto">
                            <h2 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 mb-1">
                                {editingDebt ? 'Edit Data' : 'Tambah Data Baru'}
                            </h2>
                            <p className="text-xs sm:text-sm font-medium text-slate-500 mb-4 sm:mb-6">
                                Lengkapi formulir di bawah ini untuk menyimpan data.
                            </p>
                            
                            <form id="debtForm" onSubmit={submit} className="space-y-3.5 sm:space-y-4">
                                <div className="flex bg-slate-100/90 p-1 rounded-xl gap-1">
                                    <button 
                                        type="button"
                                        onClick={() => setData('type', 'hutang')}
                                        className={`flex-1 py-2 sm:py-2.5 rounded-lg font-extrabold text-xs sm:text-sm transition-all duration-300 ${data.type === 'hutang' ? 'bg-white text-rose-500 shadow-[0_2px_8px_rgba(0,0,0,0.06)]' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Hutang (Saya Pinjam)
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setData('type', 'piutang')}
                                        className={`flex-1 py-2 sm:py-2.5 rounded-lg font-extrabold text-xs sm:text-sm transition-all duration-300 ${data.type === 'piutang' ? 'bg-white text-emerald-600 shadow-[0_2px_8px_rgba(0,0,0,0.06)]' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Piutang (Orang Pinjam)
                                    </button>
                                </div>

                                <div>
                                    <label className="text-xs sm:text-sm font-bold text-slate-700 block mb-1 sm:mb-1.5">Nama Orang / Instansi</label>
                                    <input 
                                        type="text" 
                                        value={data.name}
                                        onChange={e => setData('name', e.target.value)}
                                        placeholder="Contoh: Budi, Bank BCA"
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2 sm:py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#009bd2] focus:ring-1 focus:ring-[#009bd2] font-semibold transition-colors" 
                                    />
                                    {errors.name && <p className="text-red-500 text-[11px] mt-1 font-semibold">{errors.name}</p>}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <div>
                                        <label className="text-xs sm:text-sm font-bold text-slate-700 block mb-1 sm:mb-1.5">Total Nominal</label>
                                        <div className="relative">
                                            <span className="absolute left-3.5 top-2 sm:top-2.5 text-slate-400 font-bold text-xs sm:text-sm">Rp</span>
                                            <CurrencyInput 
                                                value={data.amount}
                                                onValueChange={val => setData('amount', val)}
                                                placeholder="1.000.000"
                                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl pl-10 sm:pl-12 pr-3.5 py-2 sm:py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#009bd2] focus:ring-1 focus:ring-[#009bd2] font-bold transition-colors" 
                                            />
                                        </div>
                                        {errors.amount && <p className="text-red-500 text-[11px] mt-1 font-semibold">{errors.amount}</p>}
                                    </div>
                                    <div>
                                        <label className="text-xs sm:text-sm font-bold text-slate-700 block mb-1 sm:mb-1.5">Sisa Belum Dibayar</label>
                                        <div className="relative">
                                            <span className="absolute left-3.5 top-2 sm:top-2.5 text-slate-400 font-bold text-xs sm:text-sm">Rp</span>
                                            <CurrencyInput 
                                                value={data.remaining_amount}
                                                onValueChange={val => setData('remaining_amount', val)}
                                                placeholder="1.000.000"
                                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl pl-10 sm:pl-12 pr-3.5 py-2 sm:py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#009bd2] focus:ring-1 focus:ring-[#009bd2] font-bold transition-colors" 
                                            />
                                        </div>
                                        {errors.remaining_amount && <p className="text-red-500 text-[11px] mt-1 font-semibold">{errors.remaining_amount}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <div>
                                        <label className="text-xs sm:text-sm font-bold text-slate-700 block mb-1 sm:mb-1.5">Jatuh Tempo (Opsional)</label>
                                        <input 
                                            type="date" 
                                            value={data.due_date}
                                            onChange={e => setData('due_date', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2 sm:py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#009bd2] focus:ring-1 focus:ring-[#009bd2] transition-colors" 
                                        />
                                        {errors.due_date && <p className="text-red-500 text-[11px] mt-1 font-semibold">{errors.due_date}</p>}
                                    </div>
                                    <div>
                                        <label className="text-xs sm:text-sm font-bold text-slate-700 block mb-1 sm:mb-1.5">Status</label>
                                        <select 
                                            value={data.status}
                                            onChange={e => setData('status', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2 sm:py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#009bd2] focus:ring-1 focus:ring-[#009bd2] font-semibold transition-colors cursor-pointer"
                                        >
                                            <option value="belum_lunas">Belum Lunas</option>
                                            <option value="lunas">Lunas</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs sm:text-sm font-bold text-slate-700 block mb-1 sm:mb-1.5">Keterangan (Opsional)</label>
                                    <input 
                                        type="text" 
                                        value={data.description}
                                        onChange={e => setData('description', e.target.value)}
                                        placeholder="Misal: Pinjaman modal usaha"
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2 sm:py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#009bd2] focus:ring-1 focus:ring-[#009bd2] transition-colors" 
                                    />
                                    {errors.description && <p className="text-red-500 text-[11px] mt-1 font-semibold">{errors.description}</p>}
                                </div>
                            </form>
                        </div>
                        
                        {/* Modal Footer */}
                        <div className="p-3.5 sm:p-5 bg-slate-50 border-t border-slate-100 flex gap-2.5 sm:gap-3 shrink-0">
                            <button 
                                type="button" 
                                onClick={() => { setIsModalOpen(false); setEditingDebt(null); reset(); }}
                                className="flex-1 px-4 py-2.5 sm:py-3 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 hover:text-slate-800 transition-colors text-xs sm:text-sm"
                            >
                                Batal
                            </button>
                            <button 
                                type="submit"
                                form="debtForm"
                                disabled={processing}
                                className="flex-[2] px-4 py-2.5 sm:py-3 rounded-xl font-bold text-white bg-[#009bd2] hover:bg-[#0089ba] transition-all disabled:opacity-50 text-xs sm:text-sm shadow-xs hover:shadow-md"
                            >
                                {processing ? 'Menyimpan...' : (editingDebt ? 'Simpan Perubahan' : 'Simpan Data')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

