const CACHE_NAME = 'icci-v5';
const STATIC_CACHE = 'icci-static-v1';
const DYNAMIC_CACHE = 'icci-dynamic-v1';
const DATA_CACHE = 'icci-data-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/logo.png',
    '/manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) =>
                            name !== STATIC_CACHE &&
                            name !== DYNAMIC_CACHE &&
                            name !== DATA_CACHE
                        )
                        .map((name) => caches.delete(name))
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip chrome extensions and non-http requests
    if (!url.protocol.startsWith('http')) {
        return;
    }

    // For navigation requests (HTML pages)
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const responseClone = response.clone();
                    caches.open(DYNAMIC_CACHE).then((cache) => {
                        cache.put(request, responseClone);
                    });
                    return response;
                })
                .catch(() => {
                    return caches.match(request)
                        .then((cachedResponse) => {
                            if (cachedResponse) {
                                return cachedResponse;
                            }
                            return caches.match('/index.html');
                        });
                })
        );
        return;
    }

    // For API calls to Turso
    if (url.hostname.includes('turso.io')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response.ok) {
                        const responseClone = response.clone();
                        caches.open(DATA_CACHE).then((cache) => {
                            cache.put(request, responseClone);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    return caches.match(request)
                        .then((cachedResponse) => {
                            if (cachedResponse) {
                                return cachedResponse;
                            }
                            return new Response(
                                JSON.stringify({ rows: [], error: 'offline' }),
                                { headers: { 'Content-Type': 'application/json' } }
                            );
                        });
                })
        );
        return;
    }

    // For all other requests
    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    fetch(request)
                        .then((response) => {
                            if (response.ok) {
                                caches.open(DYNAMIC_CACHE).then((cache) => {
                                    cache.put(request, response);
                                });
                            }
                        })
                        .catch(() => { });
                    return cachedResponse;
                }

                return fetch(request)
                    .then((response) => {
                        if (!response || response.status !== 200 || response.type === 'error') {
                            return response;
                        }
                        const responseClone = response.clone();
                        caches.open(DYNAMIC_CACHE).then((cache) => {
                            cache.put(request, responseClone);
                        });
                        return response;
                    })
                    .catch(() => {
                        if (request.destination === 'image') {
                            return new Response('', { status: 404 });
                        }
                        return new Response('Offline', { status: 503 });
                    });
            })
    );
});

// Push notification event
self.addEventListener('push', (event) => {
    console.log('[SW] Push Received');
    let data = { title: 'ICCi', body: 'Nueva notificación' };

    try {
        data = event.data.json();
    } catch (e) {
        data = { title: 'ICCi', body: event.data.text() };
    }

    const options = {
        body: data.body,
        icon: '/logo.png',
        badge: '/logo.png', // O un icono pequeño
        data: {
            url: data.url || '/'
        },
        vibrate: [100, 50, 100],
        actions: [
            { action: 'open', title: 'Ver ahora' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification Clicked');
    event.notification.close();

    const targetUrl = event.notification.data.url;

    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            for (const client of clientList) {
                if (client.url === targetUrl && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});

// Message event
self.addEventListener('message', (event) => {
    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    if (event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((name) => caches.delete(name))
                );
            })
        );
    }
});
