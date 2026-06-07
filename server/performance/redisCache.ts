import type { Request, Response, NextFunction } from "express";

type CacheClient = {
  get(key: string): Promise<string | null>;
  setEx(key: string, seconds: number, value: string): Promise<unknown>;
  del(key: string): Promise<unknown>;
  isOpen?: boolean;
  connect?: () => Promise<void>;
};

type MemoryEntry = { value: string; expiresAt: number };

const memoryCache = new Map<string, MemoryEntry>();
let redisClient: CacheClient | null = null;
let redisInitPromise: Promise<CacheClient | null> | null = null;

const normalizeKey = (value: string) => value.replace(/[^a-zA-Z0-9:_./?&=-]/g, "_").slice(0, 600);

export const makeCacheKey = (req: Request) => {
  const authScope = req.headers.authorization ? `auth:${Buffer.from(String(req.headers.authorization)).toString("base64url").slice(0, 32)}` : "anon";
  return normalizeKey(`struta:${authScope}:${req.method}:${req.originalUrl || req.url}`);
};

export async function getRedisClient() {
  if (!process.env.REDIS_URL) return null;
  if (redisClient) return redisClient;
  if (redisInitPromise) return redisInitPromise;
  redisInitPromise = (async () => {
    try {
      const redis = await import("redis");
      const client = redis.createClient({ url: process.env.REDIS_URL }) as unknown as CacheClient;
      client.connect?.().catch((error) => console.warn("[Struta] Redis connect failed, using memory cache:", error));
      redisClient = client;
      return client;
    } catch (error) {
      console.warn("[Struta] Redis package/client unavailable, using memory cache:", error);
      return null;
    }
  })();
  return redisInitPromise;
}

export async function cacheGet(key: string) {
  const redis = await getRedisClient();
  if (redis) {
    try { return await redis.get(key); } catch (error) { console.warn("[Struta] Redis get failed:", error); }
  }
  const found = memoryCache.get(key);
  if (!found) return null;
  if (found.expiresAt < Date.now()) {
    memoryCache.delete(key);
    return null;
  }
  return found.value;
}

export async function cacheSet(key: string, value: string, ttlSeconds = 30) {
  const redis = await getRedisClient();
  if (redis) {
    try { await redis.setEx(key, ttlSeconds, value); return; } catch (error) { console.warn("[Struta] Redis set failed:", error); }
  }
  memoryCache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

export async function cacheDel(key: string) {
  const redis = await getRedisClient();
  if (redis) {
    try { await redis.del(key); } catch (error) { console.warn("[Struta] Redis del failed:", error); }
  }
  memoryCache.delete(key);
}

export function redisCacheMiddleware(ttlSeconds = 30) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET") return next();
    if (req.headers["x-skip-cache"] === "1") return next();
    if (req.path.includes("/auth") || req.path.includes("/csrf") || req.path.includes("/health")) return next();

    const key = makeCacheKey(req);
    const cached = await cacheGet(key);
    if (cached) {
      res.setHeader("X-Struta-Cache", "HIT");
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      return res.send(cached);
    }

    const originalJson = res.json.bind(res);
    res.json = ((body: unknown) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        void cacheSet(key, JSON.stringify(body), ttlSeconds);
        res.setHeader("X-Struta-Cache", "MISS");
      }
      return originalJson(body);
    }) as Response["json"];

    next();
  };
}

export function startMemoryCacheJanitor() {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memoryCache.entries()) if (entry.expiresAt < now) memoryCache.delete(key);
  }, 60_000).unref?.();
}
