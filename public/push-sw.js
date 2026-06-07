const CACHE_NAME = "struta-pwa-v10";
const RUNTIME_CACHE = "struta-runtime-v10";
const IMAGE_CACHE = "struta-images-v10";
const OLD_CACHE_PREFIXES = ["struta-pwa-", "struta-runtime-", "struta-images-"];
const APP_SHELL = ["/", "/manifest.webmanifest", "/favicon.svg", "/struta_light_mode.png"];
const shownTags = new Map();
const RECENT_MS = 15000;
const MAX_IMAGE_CACHE_ITEMS = 120;

const emptyAssetResponse = (request) => {
  if (request.destination === "style" || request.url.endsWith(".css")) return new Response("", { status: 200, headers: { "Content-Type": "text/css; charset=utf-8", "Cache-Control": "no-store" } });
  return new Response("export {};", { status: 200, headers: { "Content-Type": "application/javascript; charset=utf-8", "Cache-Control": "no-store" } });
};

async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxItems) return;
  await cache.delete(keys[0]);
  return trimCache(cacheName, maxItems);
}

async function cacheFirst(request, cacheName, maxItems) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.status === 200) {
    const cache = await caches.open(cacheName);
    await cache.put(request, response.clone());
    await trimCache(cacheName, maxItems);
  }
  return response;
}

self.addEventListener("install", function (event) {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => OLD_CACHE_PREFIXES.some((prefix) => key.startsWith(prefix)) && ![CACHE_NAME, RUNTIME_CACHE, IMAGE_CACHE].includes(key)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", function (event) {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request, { cache: "no-store" }).catch(() => caches.match("/").then((cached) => cached || new Response("Offline", { status: 503, statusText: "Service Unavailable" }))));
    return;
  }

  if (request.destination === "script" || request.destination === "style" || /\/assets\/.*\.(js|css)$/i.test(url.pathname)) {
    event.respondWith(fetch(request, { cache: "reload" }).then((response) => {
      if (response.status === 404 || response.status === 410) return emptyAssetResponse(request);
      return response;
    }).catch(() => caches.match(request).then((cached) => cached || emptyAssetResponse(request))));
    return;
  }

  if (request.destination === "image" || /\.(png|jpe?g|webp|avif|svg|gif)$/i.test(url.pathname)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE, MAX_IMAGE_CACHE_ITEMS));
    return;
  }

  if (request.destination === "font" || /\.(woff2?)$/i.test(url.pathname)) {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      if (response && response.status === 200) caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, response.clone()));
      return response;
    })));
    return;
  }

  event.respondWith(fetch(request).catch(() => caches.match(request).then((cached) => cached || new Response("Offline", { status: 503, statusText: "Service Unavailable" }))));
});

self.addEventListener("push", function (event) {
  if (!event.data) return;
  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { body: event.data.text() };
  }
  const title = data.title && String(data.title).startsWith("Struta") ? data.title : `Struta: ${data.title || "Notification"}`;
  const url = data.url || data.deep_link || "/";
  const tag = data.tag || data.idempotencyKey || `${data.receiverId || "user"}:${data.type || "general"}:${title}:${data.body || ""}:${url}`.toLowerCase();
  const now = Date.now();
  const previous = shownTags.get(tag) || 0;
  if (now - previous < RECENT_MS) return;
  shownTags.set(tag, now);

  const options = {
    body: data.body || "",
    icon: data.icon || "/struta_light_mode.png",
    badge: data.badge || "/struta_light_mode.png",
    image: data.image || undefined,
    tag,
    renotify: true,
    vibrate: [80, 40, 80],
    data: { url, type: data.type || "general", senderId: data.senderId, receiverId: data.receiverId, metadata: data.metadata || {} },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      for (const client of clientList) {
        if ("focus" in client) {
          client.focus();
          if ("navigate" in client) return client.navigate(targetUrl);
          return;
        }
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});
