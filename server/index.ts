import "./load-env.js";
import express from "express";
import path from "node:path";
import http from "node:http";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { supabaseAdmin } from "./supabase-admin";
import { emailOtpService } from "./services/email-otp-service";
import authSecurityRoutes from "./routes/authSecurityRoutes";
import { getAuthenticatedActor, type ServerActor } from "./auth";
import { emailService } from "./services/email-service";
import { notificationService } from "./services/notification-service";
import { csrfProtection, issueCsrfToken, rejectOversizedRequests, sanitizeJsonBody, securityHeaders } from "./security/requestSecurity";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, "..", "dist");
const app = express();
const server = http.createServer(app);

const rateBuckets = new Map<string, { count: number; resetAt: number }>();
const loginBuckets = new Map<string, { count: number; resetAt: number }>();
const allowedOrigins = new Set([
  ...String(process.env.ALLOWED_ORIGINS || "").split(/[\s,;]+/).map((origin) => origin.trim()).filter(Boolean),
  "http://localhost:8080",
  "http://localhost:5173",
  "http://localhost:58181",
  "https://struta.onrender.com",
  "https://stuta.onrender.com",
  "https://struta.emtra.top",
  "https://struta.top",
  "https://struta.com",
  "https://strut-gules.vercel.app",
]);

const rateLimit = (name: string, max = 20, windowMs = 60_000) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const key = `${name}:${req.ip}:${req.headers.authorization || "anon"}`;
  const now = Date.now();
  const current = rateBuckets.get(key);
  if (!current || current.resetAt < now) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return next();
  }
  if (current.count >= max) return res.status(429).json({ error: "Too many requests. Try again shortly." });
  current.count += 1;
  return next();
};

const sanitizeText = (value: unknown, max = 500) => String(value || "").trim().replace(/[\u0000-\u001f\u007f]/g, "").slice(0, max);
const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value);
const getAdminBypassEmails = () => new Set(String(process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "").split(/[\s,;]+/).map((email) => email.trim().toLowerCase()).filter(Boolean));
const htmlToText = (html: string) => String(html || "").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

async function requireActor(req: express.Request): Promise<ServerActor> {
  const actor = await getAuthenticatedActor(req);
  if (!actor) throw new Error("Authentication required.");
  return actor;
}

async function requireAdmin(req: express.Request): Promise<ServerActor> {
  const actor = await requireActor(req);
  if (String(actor.role || "").toLowerCase() !== "admin") throw new Error("Admin access required.");
  return actor;
}

async function insertNotificationSafe(notification: any) {
  const result = await notificationService.create({
    user_id: sanitizeText(notification?.user_id || notification?.userId, 100),
    type: sanitizeText(notification?.type || "general", 60),
    title: sanitizeText(notification?.title, 180),
    body: sanitizeText(notification?.body || notification?.message, 1000),
    entity_type: sanitizeText(notification?.entity_type || notification?.entityType, 80) || null,
    entity_id: sanitizeText(notification?.entity_id || notification?.entityId, 120) || null,
    deep_link: sanitizeText(notification?.deep_link || notification?.deepLink || notification?.link, 500) || null,
    idempotency_key: sanitizeText(notification?.idempotency_key || notification?.idempotencyKey || crypto.randomUUID(), 500),
  });
  return { id: (result as any).notification_id, ...result };
}

async function sendInvoiceEmail(to: string, subject: string, body: string) {
  return emailService.send({ to, subject, html: body, text: htmlToText(body) });
}

let realtimeReady = false;

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use((req, res, next) => {
  if (process.env.NODE_ENV === "production" && req.headers["x-forwarded-proto"] === "http") {
    return res.redirect(308, `https://${req.headers.host}${req.originalUrl}`);
  }
  next();
});
app.use(securityHeaders);
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, X-CSRF-Token");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});
app.use("/api", rejectOversizedRequests);
app.use("/api", rateLimit("global", 300, 60_000));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use("/api", sanitizeJsonBody);
app.get("/api/security/csrf", issueCsrfToken);
app.use("/api", csrfProtection);
app.use("/api/auth/security", authSecurityRoutes);

app.get("/api/health", (_req, res) => res.json({ ok: true, service: "struta-api", realtimeReady, frontend: true, optionalRoutes: true, emailConfigured: emailService.isConfigured() }));
app.get("/api/paystack/public-key", (_req, res) => res.json({ publicKey: process.env.PAYSTACK_PUBLIC_KEY || process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || process.env.VITE_PAYSTACK_PUBLIC_KEY || "", configured: Boolean(process.env.PAYSTACK_PUBLIC_KEY || process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || process.env.VITE_PAYSTACK_PUBLIC_KEY), serverConfigured: Boolean(process.env.PAYSTACK_SECRET_KEY) }));
app.get("/api/uploads/policy", (_req, res) => res.json({ ok: true, maxBytes: 5 * 1024 * 1024, allowed: ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"] }));
app.post("/api/auth/login-attempt", (req, res) => {
  const email = sanitizeText(req.body?.email, 160).toLowerCase();
  const key = `${req.ip}:${email || "unknown"}`;
  const now = Date.now();
  const current = loginBuckets.get(key);
  if (!current || current.resetAt < now) {
    loginBuckets.set(key, { count: 1, resetAt: now + 15 * 60_000 });
    return res.json({ ok: true, remaining: 4, captchaRequired: false });
  }
  if (current.count >= 5) return res.status(429).json({ error: "Too many login attempts. Try again after 15 minutes.", retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000), captchaRequired: true });
  current.count += 1;
  return res.json({ ok: true, remaining: Math.max(0, 5 - current.count), captchaRequired: current.count >= 3 });
});
app.get("/homes/api/callback/success", (req, res) => res.redirect(302, `/api/paystack/homes/callback/success${req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : ""}`));
app.get("/vendor/api/callback/success", (req, res) => res.redirect(302, `/api/paystack/vendor/callback/success${req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : ""}`));

app.post("/api/auth/login-success", (req, res) => {
  const email = sanitizeText(req.body?.email, 160).toLowerCase();
  loginBuckets.delete(`${req.ip}:${email || "unknown"}`);
  res.cookie("struta_session_rotated", Date.now().toString(), { httpOnly: true, secure: true, sameSite: "strict", path: "/", maxAge: 60 * 60 * 1000 });
  res.json({ ok: true, sessionRegenerated: true });
});
app.post("/api/auth/send-email-otp", rateLimit("send-email-otp", 5, 15 * 60_000), async (req, res) => {
  try {
    const email = sanitizeText(req.body?.email, 180).toLowerCase();
    const purpose = sanitizeText(req.body?.purpose || "signup", 20) as "signup" | "signin";
    const userId = sanitizeText(req.body?.userId, 80) || null;
    const fullName = sanitizeText(req.body?.fullName || req.body?.name, 160) || null;
    if (!isEmail(email)) return res.status(400).json({ error: "Enter a valid email address." });
    if (purpose !== "signup" && purpose !== "signin") return res.status(400).json({ error: "Invalid OTP purpose." });
    if (purpose === "signin") {
    const [{ supabaseAdmin }] = await Promise.all([import("./supabase-admin")]);
    const { data: profile } = await supabaseAdmin.from("user_profiles").select("id,email").eq("email", email).maybeSingle();
    let knownUser = Boolean(profile);
    if (!knownUser) {
      const listed = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (listed.error) throw listed.error;
      knownUser = Boolean(listed.data.users?.some((user: any) => String(user.email || "").toLowerCase() === email));
    }
    if (!knownUser) return res.status(404).json({ error: "No account exists for this email. Create an account first." });
    }
    await emailOtpService.send({ email, purpose, userId, fullName });
    res.json({ ok: true, sent: true });
  } catch (error: any) {
    console.error("[auth/send-email-otp]", error);
    res.status(500).json({ error: error.message || "Could not send verification code." });
  }
});
app.post("/api/auth/verify-email-otp", rateLimit("verify-email-otp", 10, 15 * 60_000), async (req, res) => {
  try {
    const email = sanitizeText(req.body?.email, 180).toLowerCase();
    const purpose = sanitizeText(req.body?.purpose || "signup", 20) as "signup" | "signin";
    const code = sanitizeText(req.body?.code, 12).replace(/\D/g, "");
    if (!isEmail(email)) return res.status(400).json({ error: "Enter a valid email address." });
    if (!code || code.length < 6) return res.status(400).json({ error: "Enter the 6-digit verification code." });
    const result = await emailOtpService.verify({ email, purpose, code });
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Could not verify code." });
  }
});

app.post("/api/auth/admin-signup-bypass", rateLimit("admin-signup-bypass", 10, 15 * 60_000), async (req, res) => {
  try {
    const email = sanitizeText(req.body?.email, 180).toLowerCase();
    const password = String(req.body?.password || "");
    const fullName = sanitizeText(req.body?.fullName || req.body?.name || "Struta Admin", 160);
    if (!isEmail(email)) return res.status(400).json({ error: "Enter a valid email address." });
    if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters." });
    if (!getAdminBypassEmails().has(email)) return res.status(403).json({ error: "Admin verification bypass is only available for the configured platform admin." });
    const { supabaseAdmin } = await import("./supabase-admin");
    const created = await supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { role: "admin", full_name: fullName } });
    if (created.error && !String(created.error.message || "").toLowerCase().includes("already")) throw created.error;
    const userId = created.data.user?.id || (await supabaseAdmin.auth.admin.listUsers()).data.users.find((user: any) => String(user.email || "").toLowerCase() === email)?.id;
    if (userId) await supabaseAdmin.from("user_profiles").upsert({ id: userId, email, full_name: fullName, role: "admin", is_admin: true, active: true, updated_at: new Date().toISOString() }, { onConflict: "id" });
    res.json({ ok: true, emailConfirmed: true, userId });
  } catch (error: any) {
    console.error("[auth/admin-signup-bypass]", error);
    res.status(500).json({ error: error.message || "Could not create confirmed admin account." });
  }
});

app.get("/api/admin/users", rateLimit("admin-users", 60, 15 * 60_000), async (req, res) => {
  try {
    const [{ getAuthenticatedActor }, { supabaseAdmin }] = await Promise.all([import("./auth"), import("./supabase-admin")]);
    const actor: any = await getAuthenticatedActor(req);
    if (!actor) return res.status(401).json({ error: "Authentication required." });
    if ((actor.role || "").toLowerCase() !== "admin") return res.status(403).json({ error: "Admin access required." });
    const page = Math.max(1, Number(req.query.page || 1));
    const perPage = Math.min(100, Math.max(10, Number(req.query.perPage || 50)));
    const authUsersResult = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (authUsersResult.error) throw authUsersResult.error;
    const authUsers = authUsersResult.data.users || [];
    const ids = authUsers.map((user: any) => user.id).filter(Boolean);
    const emails = authUsers.map((user: any) => String(user.email || "").toLowerCase()).filter(Boolean);
    let profiles: any[] = [];
    if (ids.length) {
      const byId = await supabaseAdmin.from("user_profiles").select("*").in("id", ids);
      if (byId.data) profiles = byId.data;
    }
    const profileById = new Map(profiles.map((profile: any) => [profile.id, profile]));
    const missingEmails = emails.filter((email) => !profiles.some((profile: any) => String(profile.email || "").toLowerCase() === email));
    if (missingEmails.length) {
      const byEmail = await supabaseAdmin.from("user_profiles").select("*").in("email", missingEmails);
      if (byEmail.data) for (const profile of byEmail.data) if (!profileById.has(profile.id)) profileById.set(profile.id, profile);
    }
    const profileByEmail = new Map(Array.from(profileById.values()).map((profile: any) => [String(profile.email || "").toLowerCase(), profile]));
    const users = authUsers.map((user: any) => {
      const profile = profileById.get(user.id) || profileByEmail.get(String(user.email || "").toLowerCase()) || {};
      return {
        id: user.id,
        email: user.email || profile.email || "",
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        email_confirmed_at: user.email_confirmed_at,
        full_name: profile.full_name || user.user_metadata?.full_name || user.user_metadata?.name || "",
        role: profile.role || user.user_metadata?.role || "family",
        phone: profile.phone || "",
        country: profile.country || profile.business_country || "",
        is_banned: Boolean(profile.is_banned || profile.account_flagged || user.banned_until),
        banned_until: profile.banned_until || user.banned_until || null,
        plan_code: profile.plan_code || "free",
        plan_status: profile.plan_status || profile.subscription_status || "free",
        profile,
      };
    });
    res.json({ ok: true, users, page, perPage, total: authUsersResult.data.total || users.length });
  } catch (error: any) {
    console.error("[admin/users]", error);
    res.status(500).json({ error: error.message || "Could not load users." });
  }
});


app.post("/api/auth/send-signin-link", rateLimit("send-signin-link", 5, 15 * 60_000), async (req, res) => {
  try {
    const email = sanitizeText(req.body?.email, 180).toLowerCase();
    const fallbackOrigin = process.env.PUBLIC_APP_URL || process.env.APP_URL || "https://www.struta.top";
    const redirectTo = sanitizeText(req.body?.redirectTo, 500) || fallbackOrigin + "/auth/callback";
    if (!isEmail(email)) return res.status(400).json({ error: "Enter a valid email address." });
    const { supabaseAdmin } = await import("./supabase-admin");
    console.log("[auth/send-signin-link-known-check]", email);
    const { data: profile } = await supabaseAdmin.from("user_profiles").select("id,email").eq("email", email).maybeSingle();
    let knownUser = Boolean(profile);
    if (!knownUser) {
      const listed = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (listed.error) throw listed.error;
      knownUser = Boolean(listed.data.users?.some((user: any) => String(user.email || "").toLowerCase() === email));
    }
    if (!knownUser) return res.status(404).json({ error: "No account exists for this email. Create an account first." });
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo },
    } as any);
    if (error) throw error;
    const actionLink = (data as any)?.properties?.action_link;
    if (!actionLink) throw new Error("Could not create email link.");
    const html = '<div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:560px;margin:0 auto"><h1 style="color:#0c0b08">Sign in to Struta</h1><p>Use this secure link to access your Struta account.</p><p><a href="' + actionLink + '" style="display:inline-block;background:#c8923a;color:#0c0b08;padding:14px 22px;border-radius:999px;font-weight:700;text-decoration:none">Open Struta</a></p><p style="font-size:13px;color:#6b7280">If you did not request this, ignore this email.</p></div>';
    await emailService.send(email, "Your Struta access link", html, "Open Struta: " + actionLink);
    res.json({ ok: true, sent: true });
  } catch (error) {
    console.error("[auth/send-signin-link]", error);
    res.status(500).json({ error: "Could not send email link." });
  }
});

app.post("/api/admin/email-campaigns/send", rateLimit("admin-email-campaign", 8, 60 * 60_000), async (req, res) => {
  try {
    const [{ getAuthenticatedActor }] = await Promise.all([import("./auth")]);
    const actor: any = await getAuthenticatedActor(req);
    if (!actor) return res.status(401).json({ error: "Authentication required." });
    if ((actor.role || "").toLowerCase() !== "admin") return res.status(403).json({ error: "Admin access required." });
    const recipients = String(req.body?.recipients || req.body?.to || req.body?.emails || "").split(/[\n,;]+/).map((email) => email.trim()).filter(isEmail);
    const subject = sanitizeText(req.body?.subject, 180);
    const html = String(req.body?.html || req.body?.body || "").trim().slice(0, 100_000);
    const text = sanitizeText(req.body?.text || htmlToText(html), 5000);
    if (!recipients.length) return res.status(400).json({ error: "Add at least one valid recipient email." });
    if (!subject || !html) return res.status(400).json({ error: "Subject and email body are required." });
    const result = await emailService.sendCampaign(recipients, subject, html, text);
    res.json({ ok: true, sent: true, recipients: recipients.length, provider: result.provider });
  } catch (error: any) {
    console.error("[admin/email-campaigns/send]", error);
    res.status(500).json({ error: error.message || "Could not send campaign." });
  }
});

async function loadOptionalBackend() {
  try {
    const realtime = await import("./realtime/realtimeHub").catch((error) => {
      console.warn("[Struta] Realtime disabled:", error);
      return null;
    });
    if (realtime?.attachRealtimeHub) {
      realtime.attachRealtimeHub(server);
      realtimeReady = true;
    }

    const push = await import("./push-server/pushRoutes").catch((error) => {
      console.warn("[Struta] Push disabled:", error);
      return null;
    });
    if (push?.default) app.use("/api/push", push.default);

    const paystackRoutes = await import("./routes/paystackRoutes").catch((error) => {
      console.warn("[Struta] Paystack routes disabled:", error);
      return null;
    });
    if (paystackRoutes?.default) app.use("/api/paystack", paystackRoutes.default);

    const productionRoutes = await import("./routes/productionRoutes").catch((error) => {
      console.warn("[Struta] Production routes disabled:", error);
      return null;
    });
    const routeDeps = { requireActor, requireAdmin, rateLimit, insertNotificationSafe, sendInvoiceEmail, stripe: null };
    if (productionRoutes?.registerProductionRoutes) productionRoutes.registerProductionRoutes(app as any, routeDeps);

    const vendorErpRoutes = await import("./routes/vendorErpRoutes").catch((error) => {
      console.warn("[Struta] Vendor ERP routes disabled:", error);
      return null;
    });
    if (vendorErpRoutes?.registerVendorErpRoutes) vendorErpRoutes.registerVendorErpRoutes(app as any, routeDeps);

    const adminCompatRoutes = await import("./routes/adminCompatRoutes").catch((error) => {
      console.warn("[Struta] Admin compatibility routes disabled:", error);
      return null;
    });
    if (adminCompatRoutes?.registerAdminCompatRoutes) adminCompatRoutes.registerAdminCompatRoutes(app as any, { requireActor, rateLimit });
  } catch (error) {
    console.warn("[Struta] Optional backend loading failed:", error);
  }
}
void loadOptionalBackend();

app.use(express.static(distDir, { maxAge: "1y", immutable: true }));
app.get("*", (_req, res) => {
  const indexPath = path.join(distDir, "index.html");
  res.sendFile(indexPath, (error) => {
    if (!error) return;
    res.status(200).type("html").send('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Struta</title></head><body><main style="font-family:system-ui;padding:2rem"><h1>Struta is starting</h1><p>The application shell has not been built yet. Run <code>pnpm build</code> before starting the production server.</p></main></body></html>');
  });
});

const PORT = Number(process.env.PORT || process.env.API_PORT || 10000);
server.listen(PORT, () => console.log(`[Struta] API listening on ${PORT}`));
