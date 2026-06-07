export type AnyFn<T = unknown> = (...args: any[]) => T;

export const PERFORMANCE_CONSTANTS = Object.freeze({
  defaultDebounceMs: 300,
  defaultThrottleMs: 200,
  defaultCacheTtlMs: 5 * 60 * 1000,
  imageFormats: ["avif", "webp", "jpg", "png"],
  preloadAs: ["script", "style", "font", "image", "fetch"],
});

export function debounce<T extends AnyFn>(fn: T, wait = PERFORMANCE_CONSTANTS.defaultDebounceMs) {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  return (...args: Parameters<T>) => {
    window.clearTimeout(timeout);
    timeout = window.setTimeout(() => fn(...args), wait);
  };
}

export function throttle<T extends AnyFn>(fn: T, wait = PERFORMANCE_CONSTANTS.defaultThrottleMs) {
  let lastRun = 0;
  let trailing: ReturnType<typeof setTimeout> | undefined;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = wait - (now - lastRun);
    if (remaining <= 0) {
      window.clearTimeout(trailing);
      trailing = undefined;
      lastRun = now;
      fn(...args);
      return;
    }
    if (!trailing) {
      trailing = window.setTimeout(() => {
        lastRun = Date.now();
        trailing = undefined;
        fn(...args);
      }, remaining);
    }
  };
}

export function rafThrottle<T extends AnyFn>(fn: T) {
  let frame = 0;
  let latestArgs: Parameters<T> | null = null;
  return (...args: Parameters<T>) => {
    latestArgs = args;
    if (frame) return;
    frame = window.requestAnimationFrame(() => {
      frame = 0;
      if (latestArgs) fn(...latestArgs);
      latestArgs = null;
    });
  };
}

export function memoize<T extends AnyFn>(fn: T, ttlMs = PERFORMANCE_CONSTANTS.defaultCacheTtlMs) {
  const cache = new Map<string, { value: ReturnType<T>; expiresAt: number }>();
  return (...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    const now = Date.now();
    const cached = cache.get(key);
    if (cached && cached.expiresAt > now) return cached.value;
    const value = fn(...args) as ReturnType<T>;
    cache.set(key, { value, expiresAt: now + ttlMs });
    return value;
  };
}

export function preloadResource(href: string, as: "script" | "style" | "font" | "image" | "fetch", type?: string) {
  if (!href || document.querySelector(`link[rel="preload"][href="${href}"]`)) return;
  const link = document.createElement("link");
  link.rel = "preload";
  link.href = href;
  link.as = as;
  if (type) link.type = type;
  if (as === "font" || as === "fetch") link.crossOrigin = "anonymous";
  document.head.appendChild(link);
}

export function lazyLoad<T>(loader: () => Promise<{ default: T }>) {
  return loader;
}

export function observeIntersection(target: Element, onVisible: () => void, options: IntersectionObserverInit = { rootMargin: "160px" }) {
  if (!("IntersectionObserver" in window)) {
    onVisible();
    return () => undefined;
  }
  const observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      onVisible();
      observer.disconnect();
    }
  }, options);
  observer.observe(target);
  return () => observer.disconnect();
}

export function createJsonWorker<TInput, TOutput>(handlerBody: string) {
  const source = `self.onmessage = async (event) => { try { const handler = ${handlerBody}; const result = await handler(event.data); self.postMessage({ ok: true, result }); } catch (error) { self.postMessage({ ok: false, error: error && error.message ? error.message : String(error) }); } };`;
  const blob = new Blob([source], { type: "text/javascript" });
  const worker = new Worker(URL.createObjectURL(blob));
  return {
    run(input: TInput) {
      return new Promise<TOutput>((resolve, reject) => {
        worker.onmessage = (event) => event.data?.ok ? resolve(event.data.result) : reject(new Error(event.data?.error || "Worker failed"));
        worker.onerror = reject;
        worker.postMessage(input);
      });
    },
    terminate() {
      worker.terminate();
    },
  };
}

export function getVirtualWindow(total: number, rowHeight: number, viewportHeight: number, scrollTop: number, overscan = 6) {
  const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const visible = Math.ceil(viewportHeight / rowHeight) + overscan * 2;
  const end = Math.min(total, start + visible);
  return { start, end, offsetTop: start * rowHeight, totalHeight: total * rowHeight };
}

export function preferOptimizedImage(src: string) {
  if (!src) return src;
  if (/\.(png|jpe?g)$/i.test(src)) return src.replace(/\.(png|jpe?g)$/i, ".webp");
  return src;
}
