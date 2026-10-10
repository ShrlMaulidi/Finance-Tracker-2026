import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Dashboard({ stats, recent_transactions }) {
    const user = usePage().props.auth.user || { name: 'Super Admin', email: 'admin@finance.track' };

    return (
        <AuthenticatedLayout>
            <Head title="Financial Dashboard" />
            
            <div className="max-w-7xl mx-auto p-6 lg:p-10 space-y-8">
                
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-7 rounded-3xl shadow-[0_2px_15px_rgb(0,0,0,0.03)] border border-slate-100">
                        <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Total Saldo</p>
                        <p className="text-[32px] font-extrabold text-slate-800 mt-3">Rp {stats?.balance?.toLocaleString() ?? 0}</p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/40 p-7 rounded-3xl shadow-[0_2px_15px_rgb(0,0,0,0.02)] border border-emerald-100">
                        <p className="text-[11px] font-extrabold text-emerald-600 uppercase tracking-widest">Pemasukan</p>
                        <p className="text-[32px] font-extrabold text-emerald-700 mt-3">+ Rp {stats?.total_income?.toLocaleString() ?? 0}</p>
                    </div>
                    <div className="bg-gradient-to-br from-rose-50 to-rose-100/40 p-7 rounded-3xl shadow-[0_2px_15px_rgb(0,0,0,0.02)] border border-rose-100">
                        <p className="text-[11px] font-extrabold text-rose-600 uppercase tracking-widest">Pengeluaran</p>
                        <p className="text-[32px] font-extrabold text-rose-700 mt-3">- Rp {stats?.total_expense?.toLocaleString() ?? 0}</p>
                    </div>
                </div>

                {/* Transactions List */}
                <div className="bg-white rounded-3xl shadow-[0_2px_15px_rgb(0,0,0,0.03)] border border-slate-100 p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-extrabold text-slate-800">Transaksi Terakhir</h2>
                        <button className="text-sm font-bold text-[#009bd2] hover:underline">Lihat Semua</button>
                    </div>
                    
                    <div className="space-y-2">
                        {recent_transactions?.map(trx => (
                            <div key={trx.id} className="flex justify-between items-center p-4 hover:bg-slate-50 rounded-2xl transition-colors border border-transparent hover:border-slate-100">
                                <div>
                                    <p className="font-bold text-slate-700">{trx.description}</p>
                                    <p className="text-[13px] text-slate-400 mt-1 font-semibold">{trx.date}</p>
                                </div>
                                <span className={`font-extrabold ${trx.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {trx.type === 'income' ? '+' : '-'} Rp {trx.amount.toLocaleString()}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
