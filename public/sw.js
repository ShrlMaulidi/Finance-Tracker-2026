// FinanceTrack Lightweight Service Worker for PWA
const CACHE_NAME = 'financetrack-pwa-v3';
// The page itself is never cached: a stored copy points at build files that the next deploy deletes
const PRECACHE_ASSETS = [
    '/logo.png',
    '/manifest.json'
];

const OFFLINE_PAGE = `<!doctype html>
<html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>FinanceTrack - Offline</title>
<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;background:#f8fafc;color:#0f172a;text-align:center;padding:24px}
button{margin-top:16px;padding:10px 20px;border:0;border-radius:999px;background:#009bd2;color:#fff;font-weight:700;font-size:14px}</style></head>
<body><div><img src="/logo.png" alt="" width="56" height="56"><h1 style="font-size:18px;margin:16px 0 6px">Tidak dapat terhubung</h1>
<p style="margin:0;color:#64748b;font-size:14px">Periksa koneksi internet Anda, lalu coba lagi.</p>
<button onclick="location.reload()">Coba lagi</button></div></body></html>`;

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_ASSETS).catch((err) => {
                console.warn('[SW] Cache addAll warning:', err);
            });
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME && key !== ASSET_CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

const ASSET_CACHE_NAME = 'financetrack-assets-v1';
const MAX_CACHED_ASSETS = 120;

// Serve hashed build files from cache; old hashes from previous deploys are trimmed oldest-first
async function cacheFirstBuildAsset(request) {
    const cache = await caches.open(ASSET_CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;

    const response = await fetch(request);
    if (response.ok) {
        await cache.put(request, response.clone());
        const keys = await cache.keys();
        if (keys.length > MAX_CACHED_ASSETS) {
            await Promise.all(keys.slice(0, keys.length - MAX_CACHED_ASSETS).map((key) => cache.delete(key)));
        }
    }
    return response;
}

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    // Ignore non-http requests (e.g. chrome-extension://)
    if (!event.request.url.startsWith('http')) return;

    // Never intercept Inertia SPA navigation, WebSockets, or API calls to keep navigation instant
    if (event.request.headers.get('X-Inertia')) return;
    if (event.request.url.includes('/broadcasting/') || event.request.url.includes('/api/')) return;

    // Only intercept full-page document requests for offline fallback
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => new Response(OFFLINE_PAGE, {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'text/html; charset=utf-8' }
            }))
        );
        return;
    }

    // Cache-first for precached static assets and content-hashed Vite build files (immutable per deploy)
    try {
        const url = new URL(event.request.url);
        if (url.origin === self.location.origin && url.pathname.startsWith('/build/assets/')) {
            event.respondWith(cacheFirstBuildAsset(event.request));
            return;
        }
        if (PRECACHE_ASSETS.includes(url.pathname)) {
            event.respondWith(
                caches.match(event.request).then((cached) => cached || fetch(event.request))
            );
        }
    } catch (e) {
        // ignore and fallback to native fetch
    }
});

// Web Push Notification Event Listener (Receives push from server even when app is closed)
self.addEventListener('push', (event) => {
    let data = {
        title: 'Pengingat FinanceTrack',
        body: 'Ada pengingat tagihan atau target tabungan yang perlu diperiksa.',
        icon: '/favicon.png',
        badge: '/favicon.png',
        url: '/dashboard',
    };

    if (event.data) {
        try {
            data = { ...data, ...event.data.json() };
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: data.icon || '/favicon.png',
        badge: data.badge || '/favicon.png',
        vibrate: [150, 50, 150],
        data: {
            url: data.url || '/dashboard',
        },
        tag: data.tag || 'financetrack-push-' + Date.now(),
        renotify: true,
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Click on Notification Handler: focus or open the target URL in browser/PWA
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const targetUrl = (event.notification.data && event.notification.data.url) || '/dashboard';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url && 'focus' in client) {
                    client.navigate(targetUrl);
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
