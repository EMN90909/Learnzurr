import type { Request, Response, NextFunction } from "express";
import zlib from "node:zlib";
import crypto from "node:crypto";

type CacheEntry = { expiresAt: number; status: number; body: unknown; headers?: Record<string, string> };
const responseCache = new Map<string, CacheEntry>();
const DEFAULT_TTL_MS = 30_000;

export function cacheKey(req: Request) {
  const auth = req.headers.authorization ? crypto.createHash("sha256").update(req.headers.authorization).digest("hex").slice(0, 16) : "anon";
  return `${req.method}:${req.originalUrl}:${auth}`;
}

export function responseCacheMiddleware(ttlMs = DEFAULT_TTL_MS) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET") return next();
    const key = cacheKey(req);
    const cached = responseCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      res.setHeader("X-Cache", "HIT");
      for (const [h, v] of Object.entries(cached.headers || {})) res.setHeader(h, v);
      return res.status(cached.status).json(cached.body);
    }
    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        responseCache.set(key, { expiresAt: Date.now() + ttlMs, status: res.statusCode, body, headers: { "Cache-Control": `private, max-age=${Math.floor(ttlMs / 1000)}` } });
        res.setHeader("X-Cache", "MISS");
        res.setHeader("Cache-Control", `private, max-age=${Math.floor(ttlMs / 1000)}`);
      }
      return originalJson(body);
    };
    next();
  };
}

export function clearApiCache() {
  responseCache.clear();
}

export function compressionMiddleware(req: Request, res: Response, next: NextFunction) {
  const accept = String(req.headers["accept-encoding"] || "");
  const originalSend = res.send.bind(res);
  res.send = (body: any) => {
    if (res.headersSent || !body || req.method === "HEAD") return originalSend(body);
    const buffer = Buffer.isBuffer(body) ? body : Buffer.from(typeof body === "string" ? body : JSON.stringify(body));
    if (buffer.length < 1024) return originalSend(body);
    if (accept.includes("br")) {
      res.setHeader("Content-Encoding", "br");
      res.setHeader("Vary", "Accept-Encoding");
      return originalSend(zlib.brotliCompressSync(buffer));
    }
    if (accept.includes("gzip")) {
      res.setHeader("Content-Encoding", "gzip");
      res.setHeader("Vary", "Accept-Encoding");
      return originalSend(zlib.gzipSync(buffer));
    }
    return originalSend(body);
  };
  next();
}

export function parsePagination(req: Request, defaults = { limit: 50, max: 200 }) {
  const limit = Math.min(defaults.max, Math.max(1, Number(req.query.limit || defaults.limit)));
  const page = Math.max(1, Number(req.query.page || 1));
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  return { page, limit, from, to };
}

export function selectFields(req: Request, allowed: string[], fallback: string) {
  const raw = String(req.query.fields || "").trim();
  if (!raw) return fallback;
  const fields = raw.split(",").map((f) => f.trim()).filter((f) => allowed.includes(f));
  return fields.length ? fields.join(",") : fallback;
}
