self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Learnzurr", body: event.data?.text() ?? "You have a new update." };
  }

  event.waitUntil(
    self.registration.showNotification(data.title ?? "Learnzurr", {
      body: data.body ?? "You have a new learning update.",
      data: { url: data.url ?? "/signin" },
      actions: [{ action: "open", title: "Open Learnzurr" }],
      tag: data.url ?? "learnzurr-notification",
      renotify: true,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/signin";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const expected = new URL(url, self.location.origin).pathname;
      const existing = clients.find((client) => "focus" in client && new URL(client.url).pathname === expected);
      if (existing) return existing.focus();
      return self.clients.openWindow(url);
    }),
  );
});
