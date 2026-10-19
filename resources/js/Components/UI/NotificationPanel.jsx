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

            {/* Backdrop (mobile) */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-slate-900/25 backdrop-blur-sm md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Glass Panel */}
            {isOpen && (
                <div
                    className={`
                        z-50 flex flex-col overflow-hidden rounded-3xl
                        bg-white/[0.97] backdrop-blur-2xl backdrop-saturate-150
                        border border-white ring-1 ring-slate-900/[0.06]
                        shadow-[0_24px_60px_-16px_rgba(15,23,42,0.35)]
                        fixed inset-x-3 top-[64px] max-h-[calc(100dvh-5rem)]
                        md:absolute md:inset-auto md:right-0 md:top-full md:mt-2 md:w-[360px] md:max-h-[500px]
                    `}
                >
                    {/* Header */}
                    <div className="px-5 pt-4 pb-3 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2">
                            <span className="text-base font-bold text-slate-900 tracking-tight">Notifikasi</span>
                            {unreadCount > 0 && (
                                <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-[#009bd2] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-1">
                            {unreadCount > 0 && (
                                <button
                                    type="button"
                                    onClick={markAllAsRead}
                                    className="h-8 px-2.5 rounded-full text-xs font-semibold text-[#009bd2] hover:bg-[#009bd2]/10 transition-colors"
                                >
                                    Tandai dibaca
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="md:hidden w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-900/5 flex items-center justify-center transition-colors"
                                aria-label="Tutup"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Push notification toggle */}
                    <div className="px-3 pb-2 shrink-0">
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-slate-50 ring-1 ring-slate-900/[0.04]">
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isSubscribed ? 'bg-emerald-50 text-emerald-600' : 'bg-[#009bd2]/10 text-[#009bd2]'}`}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                            </span>
                            <p className="flex-1 min-w-0 text-xs font-semibold text-slate-700 truncate">
                                {pushMessage || (isSubscribed ? 'Notifikasi HP aktif' : 'Notifikasi HP')}
                            </p>
                            {!isSubscribed ? (
                                <button
                                    type="button"
                                    onClick={handleSubscribe}
                                    disabled={isSubscribing || pushStatus === 'denied'}
                                    className="h-7 px-3 rounded-full bg-[#009bd2] hover:bg-[#0086b6] text-white text-[11px] font-bold transition active:scale-95 disabled:opacity-50 shrink-0"
                                >
                                    {isSubscribing ? '...' : 'Aktifkan'}
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleTestPush}
                                    disabled={isSubscribing}
                                    className="h-7 px-3 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-900/5 text-[11px] font-semibold transition active:scale-95 disabled:opacity-50 shrink-0"
                                    title="Kirim notifikasi uji coba ke perangkat ini"
                                >
                                    {isSubscribing ? '...' : 'Tes'}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="px-4 pb-2 flex items-center gap-1 shrink-0">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`h-8 px-3 rounded-full text-xs font-semibold transition flex items-center gap-1 ${
                                    activeTab === tab.id
                                        ? 'bg-slate-900 text-white'
                                        : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                {tab.label}
                                {tab.count > 0 && (
                                    <span className={`tabular-nums ${activeTab === tab.id ? 'text-white/60' : 'text-slate-300'}`}>{tab.count}</span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Notification list */}
                    <div className="flex-1 overflow-y-auto px-2 pb-2">
                        {filteredItems.length === 0 ? (
                            <div className="py-12 flex flex-col items-center gap-2 text-center">
                                <span className="w-12 h-12 rounded-full bg-slate-900/5 text-slate-300 flex items-center justify-center">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                </span>
                                <p className="text-xs font-medium text-slate-400">Belum ada pengingat</p>
                            </div>
                        ) : (
                            filteredItems.map((item) => {
                                const isUnread = !readKeys.includes(getItemKey(item));

                                const statusStyle =
                                    item.status === 'terlambat'
                                        ? { text: 'text-rose-600', icon: 'bg-rose-50 text-rose-500' }
                                        : item.status === 'hari_ini'
                                        ? { text: 'text-amber-600', icon: 'bg-amber-50 text-amber-600' }
                                        : { text: 'text-slate-400', icon: 'bg-sky-50 text-[#009bd2]' };

                                return (
                                    <Link
                                        key={item.id}
                                        href={item.url}
                                        onClick={() => setIsOpen(false)}
                                        className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-slate-50 transition-colors"
                                    >
                                        <span className={`relative w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${statusStyle.icon}`}>
                                            {item.type === 'bill' ? (
                                                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h6m-6 4h4" />
                                                </svg>
                                            ) : (
                                                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <circle cx="12" cy="12" r="9" strokeWidth={2} />
                                                    <circle cx="12" cy="12" r="4.5" strokeWidth={2} />
                                                    <circle cx="12" cy="12" r="1" strokeWidth={2} fill="currentColor" />
                                                </svg>
                                            )}
                                            {isUnread && (
                                                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#009bd2] ring-2 ring-white" />
                                            )}
                                        </span>

                                        <div className="min-w-0 flex-1">
                                            <p className={`text-[13px] truncate ${isUnread ? 'font-bold text-slate-900' : 'font-medium text-slate-600'}`}>
                                                {item.title}
                                            </p>
                                            <p className={`text-[11px] font-medium truncate mt-0.5 ${statusStyle.text}`}>
                                                {item.status_label}
                                            </p>
                                        </div>

                                        <span className="text-xs font-bold text-slate-800 tabular-nums shrink-0">
                                            {item.type === 'bill' ? item.amount_formatted : `${item.progress}%`}
                                        </span>
                                    </Link>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
