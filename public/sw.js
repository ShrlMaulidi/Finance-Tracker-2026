// FinanceTrack Lightweight Service Worker for PWA
const CACHE_NAME = 'financetrack-pwa-v2';
const PRECACHE_ASSETS = [
    '/',
    '/logo.png',
    '/manifest.json'
];

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
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);

    // Jangan cegat request non-http/https atau beda origin (misal ekstensi browser)
    if (!url.protocol.startsWith('http') || url.origin !== self.location.origin) return;

    // 1. Tangani Navigasi Halaman HTML
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(async () => {
                const cachedResponse = await caches.match(event.request);
                if (cachedResponse) return cachedResponse;

                const fallbackRoot = await caches.match('/');
                if (fallbackRoot) return fallbackRoot;

                return new Response(
                    '<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Offline - FinanceTrack</title><style>body{font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f8fafc;color:#334155;text-align:center;padding:20px;box-sizing:border-box;}.card{background:#fff;border-radius:16px;padding:32px 24px;max-width:380px;box-shadow:0 10px 25px -5px rgba(0,0,0,0.05);border:1px solid #e2e8f0;}h2{margin:0 0 10px;font-size:20px;font-weight:800;color:#0f172a;}p{margin:0 0 20px;font-size:14px;color:#64748b;line-height:1.5;}button{background:#009bd2;color:#fff;border:none;padding:10px 20px;border-radius:10px;font-weight:700;font-size:14px;cursor:pointer;}</style></head><body><div class="card"><h2>Koneksi Terputus</h2><p>Halaman tidak dapat dimuat. Pastikan koneksi internet aktif atau coba muat ulang halaman.</p><button onclick="window.location.reload()">Muat Ulang</button></div></body></html>',
                    {
                        status: 503,
                        statusText: 'Service Unavailable',
                        headers: { 'Content-Type': 'text/html; charset=utf-8' }
                    }
                );
            })
        );
        return;
    }

    // 2. Tangani Aset Statis (Build, Gambar, Font, Manifest)
    const isStaticAsset = url.pathname.startsWith('/build/') || 
                          url.pathname.match(/\.(png|jpg|jpeg|svg|webp|ico|css|js|woff2?|json)$/i);

    if (isStaticAsset) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) {
                    // Update cache di background jika online
                    fetch(event.request).then((networkResponse) => {
                        if (networkResponse && networkResponse.status === 200) {
                            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
                        }
                    }).catch(() => {});
                    return cachedResponse;
                }

                return fetch(event.request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
                    }
                    return networkResponse;
                }).catch(() => {
                    return new Response('', { status: 404, statusText: 'Not Found' });
                });
            })
        );
    }
});
