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
    const [hoveredIcon, setHoveredIcon] = useState(null);

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
        setData('type', activeTab);
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
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-10 space-y-6 sm:space-y-8 relative">
                
                {/* Header Page & Tabs */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-6">
                    <div>
                        <p className="text-xs md:text-sm font-bold text-[#009bd2] uppercase tracking-widest mb-1 md:mb-2">Manajemen Utang</p>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                            Hutang & Piutang
                        </h1>
                    </div>
                    
                    {/* Tab Navigation */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex flex-wrap items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-2xl w-full md:w-auto">
                            <button 
                                onClick={() => setActiveTab('hutang')}
                                className={`flex-1 md:flex-none px-4 md:px-6 py-2 md:py-2.5 rounded-xl font-bold text-[13px] md:text-sm transition-all duration-200 ${activeTab === 'hutang' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                            >
                                Hutang Saya ({activeDebts.length})
                            </button>
                            <button 
                                onClick={() => setActiveTab('piutang')}
                                className={`flex-1 md:flex-none px-4 md:px-6 py-2 md:py-2.5 rounded-xl font-bold text-[13px] md:text-sm transition-all duration-200 ${activeTab === 'piutang' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                            >
                                Piutang Orang ({activeReceivables.length})
                            </button>
                            <button 
                                onClick={() => setActiveTab('riwayat')}
                                className={`flex-1 md:flex-none px-4 md:px-6 py-2 md:py-2.5 rounded-xl font-bold text-[13px] md:text-sm transition-all duration-200 ${activeTab === 'riwayat' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                            >
                                Riwayat ({historyDebts.length})
                            </button>
                        </div>
                        <button 
                            onClick={openAddModal}
                            className="bg-[#009bd2] hover:bg-[#0089ba] text-white px-5 py-3 rounded-xl font-bold transition-colors flex items-center gap-2 text-sm shadow-sm hover:shadow-md hover:-translate-y-0.5"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/></svg>
                            Tambah Baru
                        </button>
                    </div>
                </div>

                {/* Data List */}
                <div className="space-y-6 animate-fade-in">
                    {displayData.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {displayData.map(item => {
                                const paidAmount = item.amount - item.remaining_amount;
                                const percent = Math.min(100, Math.round((paidAmount / item.amount) * 100));
                                
                                return (
                                    <div key={item.id} className="bg-white rounded-3xl border border-slate-200 hover:border-slate-300 transition-colors group relative overflow-hidden flex flex-col">
                                        
                                        <div className="p-6 md:p-8 flex-1 flex flex-col">
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${item.type === 'hutang' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            {item.type === 'hutang' ? (
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            ) : (
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            )}
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-bold text-slate-900 leading-tight">{item.name}</h3>
                                                        <p className="text-sm font-semibold text-slate-500 mt-1">{item.description || 'Tidak ada keterangan'} • {item.due_date ? `Jatuh Tempo: ${new Date(item.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}` : 'Tidak ada jatuh tempo'}</p>
                                                    </div>
                                                </div>
                                                
                                                {/* Action Dropdown */}
                                                <div className="flex items-center shrink-0 -mt-1 -mr-2">
                                                    <Dropdown>
                                                        <Dropdown.Trigger>
                                                            <button className="w-9 h-9 bg-transparent hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg flex items-center justify-center transition-colors focus:outline-none">
                                                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z"/></svg>
                                                            </button>
                                                        </Dropdown.Trigger>
                                                        <Dropdown.Content align="right" width="auto" contentClasses="p-1.5 bg-white border border-slate-100 shadow-xl flex items-center gap-1 rounded-xl">
                                                            <div className="relative">
                                                                <button 
                                                                    onClick={() => openEditModal(item)} 
                                                                    onMouseEnter={() => setHoveredIcon(`edit-${item.id}`)}
                                                                    onMouseLeave={() => setHoveredIcon(null)}
                                                                    className="w-9 h-9 bg-transparent hover:bg-slate-50 text-slate-500 rounded-lg flex items-center justify-center transition-colors focus:outline-none"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                                                                </button>
                                                                <div 
                                                                    className="absolute bottom-full right-1/2 translate-x-1/2 mb-1.5 px-2 py-1 bg-slate-800 text-white text-[11px] font-bold rounded pointer-events-none z-30 transition-all duration-200 shadow-sm whitespace-nowrap"
                                                                    style={{ 
                                                                        opacity: hoveredIcon === `edit-${item.id}` ? 1 : 0,
                                                                        visibility: hoveredIcon === `edit-${item.id}` ? 'visible' : 'hidden',
                                                                        transform: hoveredIcon === `edit-${item.id}` ? 'translate(50%, 0)' : 'translate(50%, 4px)'
                                                                    }}
                                                                >
                                                                    Edit
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="w-px h-5 bg-slate-100 mx-0.5"></div>

                                                            <div className="relative">
                                                                <button 
                                                                    onClick={() => handleDelete(item.id)} 
                                                                    onMouseEnter={() => setHoveredIcon(`hapus-${item.id}`)}
                                                                    onMouseLeave={() => setHoveredIcon(null)}
                                                                    className="w-9 h-9 bg-transparent hover:bg-red-50 text-red-500 rounded-lg flex items-center justify-center transition-colors focus:outline-none"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                                                </button>
                                                                <div 
                                                                    className="absolute bottom-full right-1/2 translate-x-1/2 mb-1.5 px-2 py-1 bg-red-600 text-white text-[11px] font-bold rounded pointer-events-none z-30 transition-all duration-200 shadow-sm whitespace-nowrap"
                                                                    style={{ 
                                                                        opacity: hoveredIcon === `hapus-${item.id}` ? 1 : 0,
                                                                        visibility: hoveredIcon === `hapus-${item.id}` ? 'visible' : 'hidden',
                                                                        transform: hoveredIcon === `hapus-${item.id}` ? 'translate(50%, 0)' : 'translate(50%, 4px)'
                                                                    }}
                                                                >
                                                                    Hapus
                                                                </div>
                                                            </div>
                                                        </Dropdown.Content>
                                                    </Dropdown>
                                                </div>
                                            </div>

                                            {/* Progress Bar Section */}
                                            <div className="space-y-4 mt-auto">
                                                <div className="flex justify-between items-end">
                                                    <div>
                                                        <p className={`text-3xl font-black tracking-tight ${item.type === 'hutang' ? 'text-rose-500' : 'text-emerald-500'}`}>{formatRp(item.amount)}</p>
                                                        <p className="text-sm font-semibold text-slate-500 mt-1">Total {item.type === 'hutang' ? 'Hutang' : 'Piutang'}</p>
                                                    </div>
                                                    <div className="text-right flex flex-col items-end">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider mb-1 ${item.status === 'lunas' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                            {item.status === 'lunas' ? 'Lunas' : 'Belum Lunas'}
                                                        </span>
                                                        <span className="text-xl font-bold text-slate-800">{percent}%</span>
                                                    </div>
                                                </div>
                                                
                                                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full transition-all duration-1000 ease-out ${item.type === 'hutang' ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                                        style={{ width: `${percent}%` }}
                                                    ></div>
                                                </div>
                                                
                                                <div className="flex justify-between items-center text-sm font-bold pt-2">
                                                    <span className="text-slate-500">Telah Dibayar {formatRp(paidAmount)}</span>
                                                    <span className={`text-${item.type === 'hutang' ? 'rose' : 'emerald'}-500`}>
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
                        <div className="text-center py-20 px-4 bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-slate-100">
                                <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Belum ada {activeTab === 'riwayat' ? 'data riwayat' : activeTab === 'hutang' ? 'hutang' : 'piutang'}</h3>
                            <p className="text-slate-500 font-medium max-w-md mx-auto">Klik tombol 'Tambah Baru' di atas untuk mencatat data {activeTab === 'riwayat' ? 'riwayat' : activeTab === 'hutang' ? 'hutang' : 'piutang'} pertama Anda.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Form Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => { setIsModalOpen(false); setEditingDebt(null); reset(); }}></div>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl relative overflow-hidden border border-slate-100 z-10 animate-fade-in flex flex-col max-h-[90vh]">
                        <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">
                                {editingDebt ? 'Edit Data' : 'Tambah Baru'}
                            </h2>
                            <p className="text-sm font-medium text-slate-500 mb-6">
                                Lengkapi form di bawah ini untuk menyimpan data.
                            </p>
                            
                            <form id="debtForm" onSubmit={submit} className="space-y-4">
                                <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                                    <button 
                                        type="button"
                                        onClick={() => setData('type', 'hutang')}
                                        className={`flex-1 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${data.type === 'hutang' ? 'bg-white text-rose-500 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Hutang (Saya Pinjam)
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setData('type', 'piutang')}
                                        className={`flex-1 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${data.type === 'piutang' ? 'bg-white text-emerald-500 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Piutang (Orang Pinjam)
                                    </button>
                                </div>

                                <div>
                                    <label className="text-[13px] font-bold text-slate-700 block mb-1.5">Nama Orang / Instansi</label>
                                    <input 
                                        type="text" 
                                        value={data.name}
                                        onChange={e => setData('name', e.target.value)}
                                        placeholder="Contoh: Budi, Bank BCA"
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:border-[#009bd2] focus:ring-1 focus:ring-[#009bd2] text-sm font-bold" 
                                    />
                                    {errors.name && <p className="text-red-500 text-xs mt-1 font-bold">{errors.name}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[13px] font-bold text-slate-700 block mb-1.5">Total Nominal</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-3 text-slate-500 font-bold text-sm">Rp</span>
                                            <CurrencyInput 
                                                value={data.amount}
                                                onChange={e => setData('amount', e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-[#009bd2] focus:ring-1 focus:ring-[#009bd2] font-bold text-sm" 
                                            />
                                        </div>
                                        {errors.amount && <p className="text-red-500 text-xs mt-1 font-bold">{errors.amount}</p>}
                                    </div>
                                    <div>
                                        <label className="text-[13px] font-bold text-slate-700 block mb-1.5">Sisa Belum Dibayar</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-3 text-slate-500 font-bold text-sm">Rp</span>
                                            <CurrencyInput 
                                                value={data.remaining_amount}
                                                onChange={e => setData('remaining_amount', e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-[#009bd2] focus:ring-1 focus:ring-[#009bd2] font-bold text-sm" 
                                            />
                                        </div>
                                        {errors.remaining_amount && <p className="text-red-500 text-xs mt-1 font-bold">{errors.remaining_amount}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[13px] font-bold text-slate-700 block mb-1.5">Jatuh Tempo (Opsional)</label>
                                        <input 
                                            type="date" 
                                            value={data.due_date}
                                            onChange={e => setData('due_date', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:border-[#009bd2] focus:ring-1 focus:ring-[#009bd2] text-sm font-bold" 
                                        />
                                        {errors.due_date && <p className="text-red-500 text-xs mt-1 font-bold">{errors.due_date}</p>}
                                    </div>
                                    <div>
                                        <label className="text-[13px] font-bold text-slate-700 block mb-1.5">Status</label>
                                        <select 
                                            value={data.status}
                                            onChange={e => setData('status', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:border-[#009bd2] focus:ring-1 focus:ring-[#009bd2] text-sm font-bold"
                                        >
                                            <option value="belum_lunas">Belum Lunas</option>
                                            <option value="lunas">Lunas</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[13px] font-bold text-slate-700 block mb-1.5">Keterangan (Opsional)</label>
                                    <input 
                                        type="text" 
                                        value={data.description}
                                        onChange={e => setData('description', e.target.value)}
                                        placeholder="Misal: Pinjaman modal usaha"
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:border-[#009bd2] focus:ring-1 focus:ring-[#009bd2] text-sm font-bold" 
                                    />
                                    {errors.description && <p className="text-red-500 text-xs mt-1 font-bold">{errors.description}</p>}
                                </div>
                            </form>
                        </div>
                        
                        {/* Modal Footer Fixed at Bottom */}
                        <div className="p-6 md:p-8 bg-slate-50 border-t border-slate-100 flex gap-3 shrink-0">
                            <button 
                                type="button" 
                                onClick={() => { setIsModalOpen(false); setEditingDebt(null); reset(); }}
                                className="flex-1 px-4 py-3.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 hover:text-slate-800 transition-colors text-sm shadow-sm"
                            >
                                Batal
                            </button>
                            <button 
                                type="submit"
                                form="debtForm"
                                disabled={processing}
                                className="flex-[2] px-4 py-3.5 rounded-xl font-bold text-white bg-[#009bd2] hover:bg-[#0089ba] transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 text-sm"
                            >
                                {processing ? 'Menyimpan...' : 'Simpan Data'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
