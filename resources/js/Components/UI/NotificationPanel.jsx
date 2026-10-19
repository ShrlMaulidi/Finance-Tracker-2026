import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, usePage } from '@inertiajs/react';

function urlBase64ToUint8Array(base64String) {
    if (!base64String) return new Uint8Array(0);
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export default function NotificationPanel({ className = '' }) {
    const { notifications, vapid_public_key } = usePage().props;
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('all'); // 'all' | 'bill' | 'target'
    const panelRef = useRef(null);

    // Push Notification State
    const [pushStatus, setPushStatus] = useState('checking'); // 'checking' | 'unsupported' | 'default' | 'granted' | 'denied'
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isSubscribing, setIsSubscribing] = useState(false);
    const [pushMessage, setPushMessage] = useState(null);

    // Check Push Status on load
    useEffect(() => {
        if (typeof window === 'undefined') return;

        if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
            setPushStatus('unsupported');
            return;
        }

        setPushStatus(Notification.permission);

        navigator.serviceWorker.ready
            .then((registration) => registration.pushManager.getSubscription())
            .then((subscription) => {
                setIsSubscribed(Boolean(subscription));
            })
            .catch(() => {
                setIsSubscribed(false);
            });
    }, []);

    const handleSubscribe = async () => {
        if (!vapid_public_key) {
            alert('VAPID public key belum dikonfigurasi.');
            return;
        }

        setIsSubscribing(true);
        setPushMessage(null);

        try {
            const permission = await Notification.requestPermission();
            setPushStatus(permission);

            if (permission !== 'granted') {
                setIsSubscribing(false);
                return;
            }

            const registration = await navigator.serviceWorker.ready;
            let subscription = await registration.pushManager.getSubscription();

            if (!subscription) {
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(vapid_public_key),
                });
            }

            const subJson = subscription.toJSON ? subscription.toJSON() : {};
            const rawKey = subscription.getKey ? subscription.getKey('p256dh') : null;
            const key = subJson?.keys?.p256dh || (rawKey ? btoa(String.fromCharCode.apply(null, new Uint8Array(rawKey))) : null);
            const rawAuthSecret = subscription.getKey ? subscription.getKey('auth') : null;
            const authSecret = subJson?.keys?.auth || (rawAuthSecret ? btoa(String.fromCharCode.apply(null, new Uint8Array(rawAuthSecret))) : null);

            if (window.axios) {
                await window.axios.post('/push-subscriptions', {
                    endpoint: subscription.endpoint,
                    keys: {
                        p256dh: key,
                        auth: authSecret,
                    },
                });
            }

            setIsSubscribed(true);
            setPushMessage('Notifikasi HP berhasil diaktifkan! 🎉');
            setTimeout(() => setPushMessage(null), 3500);
        } catch (err) {
            console.error('Error subscribing to push notifications:', err);
            const serverMessage = err.response?.data?.message || err.response?.statusText;
            const detail = serverMessage ? `${err.message} (${serverMessage})` : (err.message || 'Error');
            setPushMessage('Gagal mengaktifkan notifikasi: ' + detail);
        } finally {
            setIsSubscribing(false);
        }
    };

    const handleTestPush = async () => {
        setIsSubscribing(true);
        setPushMessage('Mengirim notifikasi ke HP...');

        try {
            if (window.axios) {
                const res = await window.axios.post('/push-subscriptions/test');
                setPushMessage(res.data.message || 'Notifikasi terkirim!');
            }
            setTimeout(() => setPushMessage(null), 4000);
        } catch (err) {
            console.error('Error sending test push:', err);
            const serverMessage = err.response?.data?.message || err.response?.statusText;
            const detail = serverMessage ? `${err.message} (${serverMessage})` : (err.message || 'Error');
            setPushMessage('Gagal mengirim tes notifikasi: ' + detail);
            setTimeout(() => setPushMessage(null), 5000);
        } finally {
            setIsSubscribing(false);
        }
    };

    // Safe fallbacks from props
    const allItems = notifications?.all || [];
    const urgentCount = notifications?.urgent_count || 0;
    const totalCount = notifications?.total_count || 0;
    const billsCount = notifications?.bills_count || 0;
    const targetsCount = notifications?.targets_count || 0;

    // Track read notifications in localStorage so users can dismiss badges
    const [readKeys, setReadKeys] = useState(() => {
        if (typeof window !== 'undefined') {
            try {
                const saved = localStorage.getItem('financetrack_read_notifications');
                return saved ? JSON.parse(saved) : [];
            } catch (e) {
                return [];
            }
        }
        return [];
    });

    // Helper to generate a unique key per item status cycle
    const getItemKey = (item) => `${item.id}_${item.status}_${item.due_date}`;

    // Compute unread items
    const unreadItems = useMemo(() => {
        return allItems.filter(item => !readKeys.includes(getItemKey(item)));
    }, [allItems, readKeys]);

    const unreadCount = unreadItems.length;

    // Close on click outside or Esc key
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    // Mark all as read handler
    const markAllAsRead = (e) => {
        e?.stopPropagation();
        const allKeys = allItems.map(getItemKey);
        setReadKeys(allKeys);
        try {
            localStorage.setItem('financetrack_read_notifications', JSON.stringify(allKeys));
        } catch (err) {
            // fallback
        }
    };

    // Filter items based on activeTab
    const filteredItems = useMemo(() => {
        if (activeTab === 'bill') {
            return allItems.filter(item => item.type === 'bill');
        }
        if (activeTab === 'target') {
            return allItems.filter(item => item.type === 'target');
        }
        return allItems;
    }, [allItems, activeTab]);

    const tabs = [
        { id: 'all', label: 'Semua', count: totalCount },
        { id: 'bill', label: 'Tagihan', count: billsCount },
        { id: 'target', label: 'Target', count: targetsCount },
    ];

    return (
        <div className={`relative ${className}`} ref={panelRef}>
            {/* Bell Trigger */}
            <button
                type="button"
                onClick={() => setIsOpen(prev => !prev)}
                aria-label="Notifikasi"
                aria-expanded={isOpen}
                className={`relative p-2 rounded-xl transition-colors flex items-center justify-center ${
                    isOpen
                        ? 'text-slate-900 bg-slate-100'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.75}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                </svg>

                {unreadCount > 0 ? (
                    <span className="absolute top-1 right-1 min-w-[15px] h-[15px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-semibold flex items-center justify-center ring-2 ring-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                ) : urgentCount > 0 ? (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
                ) : null}
            </button>

            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-slate-900/15 backdrop-blur-[1px] md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Dropdown Panel */}
            {isOpen && (
                <div
                    className={`
                        z-50 bg-white rounded-2xl shadow-[0_12px_36px_-8px_rgba(15,23,42,0.12)] ring-1 ring-slate-900/5 flex flex-col overflow-hidden
                        fixed inset-x-3 top-[64px] max-h-[calc(100dvh-5rem)]
                        md:absolute md:inset-auto md:right-0 md:top-full md:mt-2 md:w-[350px] md:max-h-[490px]
                    `}
                >
                    {/* Header */}
                    <div className="px-4 pt-3.5 pb-2.5 flex items-center justify-between shrink-0">
                        <span className="text-sm font-semibold text-slate-900">Notifikasi</span>

                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    type="button"
                                    onClick={markAllAsRead}
                                    className="text-xs font-medium text-[#009bd2] hover:text-[#0089ba] transition-colors"
                                >
                                    Tandai dibaca
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="md:hidden text-slate-400 hover:text-slate-600 p-0.5"
                                aria-label="Tutup"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Mobile Push Notification Activation / Status Banner */}
                    <div className="px-3 pb-2 shrink-0">
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="text-base shrink-0">
                                    {isSubscribed ? '🔔' : '📲'}
                                </span>
                                <div className="min-w-0">
                                    <p className="text-[11px] font-semibold text-slate-800 truncate leading-tight">
                                        {isSubscribed ? 'Push Notifikasi HP Aktif' : 'Aktifkan Notifikasi HP'}
                                    </p>
                                    <p className="text-[10px] text-slate-400 truncate">
                                        {pushMessage || (isSubscribed ? 'Pengingat otomatis saat tempo tiba' : 'Kirim pengingat saat aplikasi ditutup')}
                                    </p>
                                </div>
                            </div>

                            <div className="shrink-0">
                                {!isSubscribed ? (
                                    <button
                                        type="button"
                                        onClick={handleSubscribe}
                                        disabled={isSubscribing || pushStatus === 'denied'}
                                        className="px-2.5 py-1 rounded-lg bg-[#009bd2] hover:bg-sky-600 text-white text-[10px] font-bold shadow-2xs transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {isSubscribing ? 'Memproses...' : 'Aktifkan'}
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleTestPush}
                                        disabled={isSubscribing}
                                        className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-[10px] font-medium shadow-2xs transition-all active:scale-95 disabled:opacity-50"
                                        title="Kirim notifikasi uji coba ke perangkat ini"
                                    >
                                        {isSubscribing ? '...' : 'Tes'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Modern Pill Tabs */}
                    <div className="px-3 pb-2.5 border-b border-slate-100 shrink-0">
                        <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 py-1 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                                        activeTab === tab.id
                                            ? 'bg-white text-slate-900 shadow-2xs'
                                            : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    <span>{tab.label}</span>
                                    {tab.count > 0 && (
                                        <span className={`text-[10px] tabular-nums ${
                                            activeTab === tab.id ? 'text-slate-900 font-semibold' : 'text-slate-400'
                                        }`}>
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Compact Notification List */}
                    <div className="flex-1 overflow-y-auto divide-y divide-slate-100/80">
                        {filteredItems.length === 0 ? (
                            <div className="py-12 px-4 text-center">
                                <p className="text-xs text-slate-400">Tidak ada pengingat aktif</p>
                            </div>
                        ) : (
                            filteredItems.map((item) => {
                                const isUnread = !readKeys.includes(getItemKey(item));

                                const statusColor =
                                    item.status === 'terlambat'
                                        ? 'text-rose-600 bg-rose-50'
                                        : item.status === 'hari_ini'
                                        ? 'text-amber-600 bg-amber-50'
                                        : 'text-sky-600 bg-sky-50';

                                return (
                                    <Link
                                        key={item.id}
                                        href={item.url}
                                        onClick={() => setIsOpen(false)}
                                        className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50/80 transition-colors"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                {isUnread && (
                                                    <span className="w-1.5 h-1.5 rounded-full bg-[#009bd2] shrink-0" />
                                                )}
                                                <p className={`text-xs truncate ${isUnread ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                                                    {item.title}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-1.5 mt-1">
                                                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${statusColor}`}>
                                                    {item.status_label}
                                                </span>
                                                <span className="text-[11px] text-slate-400 truncate">
                                                    {item.category}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="text-right shrink-0">
                                            <p className="text-xs font-semibold text-slate-900 tabular-nums">
                                                {item.type === 'bill' ? item.amount_formatted : `${item.progress}%`}
                                            </p>
                                        </div>
                                    </Link>
                                );
                            })
                        )}
                    </div>

                    {/* Minimal Footer */}
                    <div className="px-4 py-2.5 bg-slate-50/60 border-t border-slate-100 grid grid-cols-2 text-center text-xs font-medium shrink-0 divide-x divide-slate-200/70">
                        <Link
                            href={route('tagihan.index')}
                            onClick={() => setIsOpen(false)}
                            className="text-slate-600 hover:text-slate-900 transition-colors"
                        >
                            Tagihan
                        </Link>
                        <Link
                            href={route('tabungan.target')}
                            onClick={() => setIsOpen(false)}
                            className="text-slate-600 hover:text-slate-900 transition-colors"
                        >
                            Target
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}