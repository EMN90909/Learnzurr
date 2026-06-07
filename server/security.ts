import type { NextFunction, Request, Response } from "express";
import { supabaseAdmin } from "./supabase-admin";
import { getAuthenticatedActor, type ServerActor } from "./auth";

export type ApiRequest = Request & { actor?: ServerActor | null };

const production = process.env.NODE_ENV === "production";
const publicApiPaths = new Set([
  "/api/health",
  "/api/paystack/public-key",
  "/api/security/csrf-token",
  "/api/security/upload-policy",
  "/api/security/validate-upload",
  "/api/auth/login-attempt",
  "/api/auth/login-success",
  "/api/auth/send-email-otp",
  "/api/auth/verify-email-otp",
]);

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com https://api.fontshare.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://api.fontshare.com",
  "script-src 'self' https://js.paystack.co https://checkout.paystack.com https://js.hcaptcha.com https://*.hcaptcha.com",
  "frame-src https://checkout.paystack.com https://js.paystack.co https://*.hcaptcha.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.resend.com https://api.stripe.com https://api.paystack.co https://checkout.paystack.com",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  res.setHeader("Content-Security-Policy", csp);
  res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(self)");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");
  res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
  if (!production || req.secure || req.headers["x-forwarded-proto"] === "https") return next();
  return res.redirect(308, `https://${req.headers.host}${req.originalUrl}`);
}

export function genericErrorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  const requestId = crypto.randomUUID();
  console.error(`[${requestId}] Unhandled API error`, error);
  if (res.headersSent) return;
  return res.status(500).json({ error: "Something went wrong. Please try again.", requestId });
}

export function sanitizeString(value: unknown, max = 500) {
  return String(value ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, max);
}

export function allowlistedEmail(value: unknown) {
  const email = sanitizeString(value, 180).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email) ? email : "";
}

export async function auditEvent(req: ApiRequest, action: string, status: "success" | "failure", metadata: Record<string, unknown> = {}) {
  try {
    await supabaseAdmin.from("security_audit_events").insert({
      actor_id: req.actor?.id || null,
      actor_email: req.actor?.email || null,
      actor_role: req.actor?.role || null,
      action,
      status,
      ip_address: req.ip,
      user_agent: sanitizeString(req.headers["user-agent"], 400),
      path: req.originalUrl,
      method: req.method,
      metadata,
    });
  } catch (error) {
    console.warn("[security/audit] write skipped", error);
  }
}

export function requireApiAuthentication() {
  return async (req: ApiRequest, res: Response, next: NextFunction) => {
    if (!req.path.startsWith("/api/")) return next();
    if (publicApiPaths.has(req.path)) return next();
    const actor = await getAuthenticatedActor(req);
    if (!actor) {
      await auditEvent(req, "api.auth.required", "failure", { path: req.path });
      return res.status(401).json({ error: "Authentication required." });
    }
    req.actor = actor;
    return next();
  };
}

export function requireRole(allowedRoles: string[]) {
  const allowed = new Set(allowedRoles.map((role) => role.toLowerCase()));
  return async (req: ApiRequest, res: Response, next: NextFunction) => {
    const actor = req.actor || await getAuthenticatedActor(req);
    if (!actor) return res.status(401).json({ error: "Authentication required." });
    req.actor = actor;
    const role = String(actor.role || "").toLowerCase();
    if (!allowed.has(role)) {
      await auditEvent(req, "api.role.denied", "failure", { allowed: allowedRoles, actual: role });
      return res.status(403).json({ error: "Access denied." });
    }
    return next();
  };
}

export function assertAdmin(actor: ServerActor | null | undefined) {
  return String(actor?.role || "").toLowerCase() === "admin";
}
