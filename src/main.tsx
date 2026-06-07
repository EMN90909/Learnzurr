import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import "./pwa-fixes.css";
import "./custom-loader.css";
import "./minimal-ui.css";

createRoot(document.getElementById("root")!).render(<App />);

const ACTIVE_CACHE_NAMES = new Set(["struta-pwa-v10", "struta-runtime-v10", "struta-images-v10"]);
const runWhenIdle = (task: () => void) => {
  const idle = (window as any).requestIdleCallback;
  if (typeof idle === "function") idle(task, { timeout: 3500 });
  else window.setTimeout(task, 1200);
};

const clearOldBuildCaches = async () => {
  if (!("caches" in window)) return;
  const keys = await caches.keys();
  await Promise.all(
    keys
      .filter((key) => (key.startsWith("struta-pwa-") || key.startsWith("struta-runtime-") || key.startsWith("struta-images-")) && !ACTIVE_CACHE_NAMES.has(key))
      .map((key) => caches.delete(key))
  );
};

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    runWhenIdle(async () => {
      try {
        await clearOldBuildCaches();
        const registrations = await navigator.serviceWorker.getRegistrations();

        for (const registration of registrations) {
          const scriptUrl =
            registration.active?.scriptURL ||
            registration.waiting?.scriptURL ||
            registration.installing?.scriptURL ||
            "";

          if (
            scriptUrl &&
            !scriptUrl.includes("push-sw.js") &&
            !scriptUrl.includes("dyad")
          ) {
            console.warn("[ServiceWorker] Unregistering rogue service worker:", scriptUrl);
            try {
              await registration.unregister();
            } catch {
              console.warn("[ServiceWorker] Failed to unregister:", scriptUrl);
            }
          }
        }

        const registration = await navigator.serviceWorker.register("/push-sw.js", { scope: "/", updateViaCache: "none" });
        window.setTimeout(() => void registration.update(), 2500);
        console.log("[ServiceWorker] push-sw.js registered successfully");
      } catch (error) {
        console.warn("[ServiceWorker] Failed:", error instanceof Error ? error.message : error);
      }
    });
  });
}
