import crypto from "node:crypto";
import type express from "express";

const MAX_BODY_BYTES = 5 * 1024 * 1024;
const ALLOWED_FILE_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/csv",
  "application/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);
const ALLOWED_FILE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "pdf", "doc", "docx", "csv", "xls", "xlsx"]);
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const PHONE_RE = /^\+?[0-9\s().-]{7,30}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isPlainObject = (value: unknown): value is Record<string, unknown> => Object.prototype.toString.call(value) === "[object Object]";

export const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const sanitizeScalar = (value: unknown, max = 2000): unknown => {
  if (typeof value !== "string") return value;
  return value.replace(CONTROL_CHARS, "").trim().slice(0, max);
};

export const sanitizePayload = (value: unknown, depth = 0): unknown => {
  if (depth > 8) return null;
  if (typeof value === "string") return sanitizeScalar(value, depth === 0 ? 5000 : 2000);
  if (Array.isArray(value)) return value.slice(0, 100).map((item) => sanitizePayload(item, depth + 1));
  if (isPlainObject(value)) {
    const clean: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value).slice(0, 120)) {
      const safeKey = String(key).replace(/[^a-zA-Z0-9_\-.]/g, "").slice(0, 80);
      if (!safeKey) continue;
      clean[safeKey] = sanitizePayload(item, depth + 1);
    }
    return clean;
  }
  return value;
};

export const isEmail = (value: unknown) => EMAIL_RE.test(String(value || "").trim());
export const isPhone = (value: unknown) => PHONE_RE.test(String(value || "").trim());
export const isUuid = (value: unknown) => UUID_RE.test(String(value || "").trim());
export const safeEnum = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T => allowed.includes(String(value) as T) ? (String(value) as T) : fallback;
export const safeMoney = (value: unknown, fallback = 0, max = 10_000_000) => {
  const n = Number(value ?? fallback);
  if (!Number.isFinite(n) || n < 0 || n > max) return fallback;
  return Number(n.toFixed(2));
};

export const securityHeaders: express.RequestHandler = (_req, res, next) => {
  res.setHeader("Content-Security-Policy", [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "form-action 'self' https://checkout.paystack.com https://api.paystack.co",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "script-src 'self' https://js.paystack.co https://checkout.paystack.com https://hcaptcha.com https://*.hcaptcha.com https://js.stripe.com",
    "connect-src 'self' https: wss:",
    "frame-src https://checkout.paystack.com https://js.paystack.co https://hcaptcha.com https://*.hcaptcha.com https://js.stripe.com https://hooks.stripe.com",
    "upgrade-insecure-requests",
  ].join("; "));
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(self), payment=(self)");
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");
  next();
};

export const rejectOversizedRequests: express.RequestHandler = (req, res, next) => {
  const contentLength = Number(req.headers["content-length"] || 0);
  if (contentLength > MAX_BODY_BYTES) return res.status(413).json({ error: "Request is too large." });
  next();
};

export const sanitizeJsonBody: express.RequestHandler = (req, _res, next) => {
  if (req.body && isPlainObject(req.body)) req.body = sanitizePayload(req.body);
  next();
};

export const csrfCookieName = "struta_csrf";
export const sessionCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "strict" as const,
  path: "/",
  maxAge: 60 * 60 * 1000,
};

export const csrfReadableCookieOptions = {
  httpOnly: false,
  secure: true,
  sameSite: "strict" as const,
  path: "/",
  maxAge: 60 * 60 * 1000,
};

export const issueCsrfToken: express.RequestHandler = (_req, res) => {
  const token = crypto.randomBytes(32).toString("hex");
  res.cookie(csrfCookieName, token, csrfReadableCookieOptions);
  res.json({ csrfToken: token });
};

export const csrfProtection: express.RequestHandler = (req, res, next) => {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return next();
  if (!req.headers.cookie?.includes(`${csrfCookieName}=`)) return next();
  const cookieToken = req.headers.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${csrfCookieName}=`))
    ?.split("=")[1];
  const headerToken = String(req.headers["x-csrf-token"] || "");
  if (!cookieToken || !headerToken || cookieToken !== headerToken) return res.status(403).json({ error: "Request could not be verified." });
  next();
};

export const validateUploadDescriptor = (file: { name?: string; type?: string; size?: number }) => {
  const size = Number(file.size || 0);
  const type = String(file.type || "").toLowerCase();
  const name = String(file.name || "");
  const extension = name.split(".").pop()?.toLowerCase() || "";
  if (!name || name.includes("..") || /[\\/]/.test(name)) return { ok: false, error: "Invalid file name." };
  if (!size || size > MAX_BODY_BYTES) return { ok: false, error: "File must be smaller than 5MB." };
  if (!ALLOWED_FILE_MIME_TYPES.has(type) || !ALLOWED_FILE_EXTENSIONS.has(extension)) return { ok: false, error: "Only PNG, JPEG, PDF, DOC, DOCX, CSV, XLS, and XLSX files are allowed." };
  return { ok: true };
};

export async function verifyBotToken(token: unknown, ip?: string) {
  const secret = process.env.HCAPTCHA_SECRET || process.env.TURNSTILE_SECRET_KEY || process.env.CAPTCHA_SECRET_KEY;
  if (!secret) return { ok: true, skipped: true };
  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", String(token || ""));
  if (ip) body.set("remoteip", ip);
  const verifyUrl = process.env.HCAPTCHA_SECRET
    ? "https://hcaptcha.com/siteverify"
    : "https://challenges.cloudflare.com/turnstile/v0/siteverify";
  const response = await fetch(verifyUrl, { method: "POST", body });
  const data = await response.json().catch(() => ({}));
  return { ok: Boolean(data.success), skipped: false };
}

export const uploadPolicy = {
  maxBytes: MAX_BODY_BYTES,
  allowedMimeTypes: Array.from(ALLOWED_FILE_MIME_TYPES),
  allowedExtensions: Array.from(ALLOWED_FILE_EXTENSIONS),
};
