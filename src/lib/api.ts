import { supabase } from "@/integrations/supabase/client";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type CacheEntry = {
  expiresAt: number;
  status: number;
  statusText: string;
  headers: [string, string][];
  body: string;
};

const apiCache = new Map<string, CacheEntry>();
const DEFAULT_GET_CACHE_MS = 15_000;

const readCookie = (name: string) => {
  if (typeof document === "undefined") return "";
  return document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.split("=")[1] || "";
};

let csrfTokenPromise: Promise<string> | null = null;

async function getCsrfToken() {
  const existing = readCookie("struta_csrf");
  if (existing) return decodeURIComponent(existing);
  if (!csrfTokenPromise) {
    csrfTokenPromise = fetch("/api/security/csrf", { credentials: "same-origin" })
      .then((response) => response.json())
      .then((data) => String(data?.csrfToken || readCookie("struta_csrf") || ""))
      .catch(() => "")
      .finally(() => { csrfTokenPromise = null; });
  }
  return csrfTokenPromise;
}

export function clearApiFetchCache(prefix = "") {
  if (!prefix) return apiCache.clear();
  for (const key of Array.from(apiCache.keys())) {
    if (key.includes(prefix)) apiCache.delete(key);
  }
}

export async function getAccessToken(): Promise<string | null> {
  const initial = await supabase.auth.getSession();
  let token = initial.data.session?.access_token || null;
  if (token) return token;

  const refreshed = await supabase.auth.refreshSession().catch(() => null);
  token = refreshed?.data?.session?.access_token || null;
  if (token) return token;

  await wait(350);
  const retry = await supabase.auth.getSession().catch(() => null);
  return retry?.data?.session?.access_token || null;
}

const getCacheKey = (input: RequestInfo | URL, headers: Headers) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  const auth = headers.get("Authorization") || "anon";
  return `${url}::${auth.slice(0, 48)}`;
};

const cloneCachedResponse = (entry: CacheEntry) =>
  new Response(entry.body, {
    status: entry.status,
    statusText: entry.statusText,
    headers: new Headers([...entry.headers, ["X-Client-Cache", "HIT"]]),
  });

export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const token = await getAccessToken();
  const headers = new Headers(init.headers);
  const method = String(init.method || "GET").toUpperCase();
  const cacheTtl = Number(headers.get("X-Cache-TTL") || DEFAULT_GET_CACHE_MS);
  headers.delete("X-Cache-TTL");

  if (!headers.has("Content-Type") && init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) headers.set("Authorization", `Bearer ${token}`);

  if (!["GET", "HEAD", "OPTIONS"].includes(method) && !headers.has("X-CSRF-Token")) {
    const csrfToken = await getCsrfToken();
    if (csrfToken) headers.set("X-CSRF-Token", csrfToken);
  }

  const shouldCache = method === "GET" && cacheTtl > 0 && !headers.has("Cache-Control");
  const key = shouldCache ? getCacheKey(input, headers) : "";
  const cached = key ? apiCache.get(key) : undefined;
  if (cached && cached.expiresAt > Date.now()) return cloneCachedResponse(cached);

  const response = await fetch(input, {
    ...init,
    method,
    credentials: "same-origin",
    headers,
  });

  if (shouldCache && response.ok) {
    const clone = response.clone();
    const body = await clone.text();
    apiCache.set(key, {
      expiresAt: Date.now() + cacheTtl,
      status: response.status,
      statusText: response.statusText,
      headers: Array.from(response.headers.entries()),
      body,
    });
  }

  if (method !== "GET") clearApiFetchCache();
  return response;
}
