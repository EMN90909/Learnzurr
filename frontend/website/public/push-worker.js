self.addEventListener('push', (event) => {
  let payload = { title: 'Learnzurr class reminder', body: 'A class update is available.', url: '/learner/calendar' };
  try { payload = { ...payload, ...event.data.json() }; } catch (_) {}
  event.waitUntil(self.registration.showNotification(payload.title, {
    body: payload.body,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    data: { url: payload.url },
    tag: `learnzurr-${payload.url}`,
    renotify: true,
    actions: [{ action: 'join', title: 'Open class' }],
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url || '/learner/calendar';
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
    const open = windows.find((client) => client.url.includes(target));
    if (open) return open.focus();
    return clients.openWindow(target);
  }));
});
