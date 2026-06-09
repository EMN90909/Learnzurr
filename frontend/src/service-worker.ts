const CACHE_NAME = 'learnzur-shell-v1';
const SHELL = ['/', '/explore', '/about', '/contact'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)));
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  event.respondWith(fetch(request).catch(() => caches.match(request).then((res) => res || caches.match('/'))));
});
