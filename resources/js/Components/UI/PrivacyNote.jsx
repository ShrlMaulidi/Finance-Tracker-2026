import React from 'react';

/**
 * PrivacyNote Component
 * Small reassurance shown at the bottom of every member page that each user's financial records are private.
 * Phones get a shorter sentence so it stays on one or two tidy lines above the bottom navigation.
 */
export default function PrivacyNote() {
    return (
        <footer className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 pt-2 pb-4 sm:pb-6">
            <p className="flex items-center justify-center gap-1.5 border-t border-slate-100 pt-3 text-center text-[11px] sm:text-xs font-medium leading-relaxed text-slate-400">
                <svg className="w-3.5 h-3.5 shrink-0 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                <span className="sm:hidden">Data Anda privat, hanya bisa dilihat dari akun Anda sendiri.</span>
                <span className="hidden sm:inline">Data keuangan Anda bersifat privat. Setiap transaksi yang Anda catat hanya dapat dilihat dari akun Anda sendiri, tidak oleh pengguna lain.</span>
            </p>
        </footer>
    );
}
