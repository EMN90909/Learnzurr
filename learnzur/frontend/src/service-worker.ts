const CACHE = 'learnzur-shell-v1';
const ASSETS = ['/', '/login', '/register'];
self.addEventListener('install', (event) => { event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS))); });
self.addEventListener('fetch', (event) => { const request = event.request; if (request.method !== 'GET') return; event.respondWith(caches.match(request).then((cached) => cached || fetch(request))); });
