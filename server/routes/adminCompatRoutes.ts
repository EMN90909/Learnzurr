import type express from "express";
import { supabaseAdmin } from "../supabase-admin";
import type { ServerActor } from "../auth";
import { responseCacheMiddleware, clearApiCache } from "../performance/cache";

type Deps = { requireActor: (req: express.Request) => Promise<ServerActor>; rateLimit: (name: string, max?: number, windowMs?: number) => express.RequestHandler; };
const sanitizeText = (value: unknown, max = 160) => String(value || "").trim().slice(0, max);
const getPaypalClientId = () => process.env.PAYPAL_CLIENT_ID || process.env.VITE_PAYPAL_CLIENT_ID || "";
const getPaypalSecret = () => process.env.PAYPAL_CLIENT_SECRET || process.env.PAYPAL_SECRET_KEY || "";
const OWNER_ADMIN_EMAILS = new Set(String(process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "").split(/[\s,;]+/).map((email) => email.trim().toLowerCase()).filter(Boolean));
const PRO_DURATION_MS = (((30 * 24 + 6) * 60 + 5) * 60 + 30) * 1000;
const countBy = (arr: any[], key: string) => arr.reduce((acc: any, item: any) => { const value = item?.[key] || "unknown"; acc[value] = (acc[value] || 0) + 1; return acc; }, {});
const safeData = async (query: any) => { const { data, error, count } = await query; if (error) { console.warn("[admin-compat]", error.message); return { data: [], count: 0 }; } return { data: data || [], count: count || 0 }; };

async function requireAdminLike(actor: ServerActor) {
  const role = String(actor.role || "").toLowerCase();
  const email = String(actor.email || "").toLowerCase();
  const configuredAdmins = String(process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "").split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
  if (role === "admin" || (email && (OWNER_ADMIN_EMAILS.has(email) || configuredAdmins.includes(email)))) return;
  if (email) {
    const { data } = await supabaseAdmin.from("admin_emails").select("id").ilike("email", email).maybeSingle();
    if (data?.id) return;
  }
  const { data: profile } = await supabaseAdmin.from("user_profiles").select("id,email,role,staff_role,is_admin").eq("id", actor.id).maybeSingle();
  const profileRole = String(profile?.role || "").toLowerCase();
  const profileStaffRole = String(profile?.staff_role || "").toLowerCase();
  const profileEmail = String(profile?.email || email || "").toLowerCase();
  if (profileRole === "admin" || profileStaffRole === "admin" || Boolean(profile?.is_admin)) return;
  if (profileEmail && (OWNER_ADMIN_EMAILS.has(profileEmail) || configuredAdmins.includes(profileEmail))) return;
  if (profileEmail) {
    const { data } = await supabaseAdmin.from("admin_emails").select("id").ilike("email", profileEmail).maybeSingle();
    if (data?.id) return;
  }
  throw new Error(`Admin access required. Current account ${profileEmail || email || actor.id} is not marked admin.`);
}

async function activateUserPlan(userId: string, planCode = "pro", actorId?: string | null, durationDays?: number, durationHours = 6, durationMinutes = 5, durationSeconds = 30) {
  const normalizedPlan = String(planCode || "pro").toLowerCase();
  const isFree = normalizedPlan === "free";
  const durationMs = durationDays ? (((durationDays * 24 + durationHours) * 60 + durationMinutes) * 60 + durationSeconds) * 1000 : PRO_DURATION_MS;
  const expiresAt = isFree ? null : new Date(Date.now() + durationMs).toISOString();
  const now = new Date().toISOString();
  const { error: profileError } = await supabaseAdmin.from("user_profiles").update({ is_pro: !isFree, plan_code: normalizedPlan, plan_status: isFree ? "free" : "active", plan_expires_at: expiresAt, updated_at: now }).eq("id", userId);
  if (profileError) throw profileError;
  const { error: subscriptionError } = await supabaseAdmin.from("subscriptions").upsert({ user_id: userId, plan_code: normalizedPlan, plan_name: isFree ? "Free" : normalizedPlan.includes("family") ? "Family Pro" : normalizedPlan.includes("vendor") ? "Vendor Pro" : "Home Pro", status: isFree ? "cancelled" : "active", payment_status: isFree ? "free" : "paid", starts_at: now, expires_at: expiresAt, updated_at: now, metadata: { activated_by: actorId || null, source: "admin_compat_api", duration: isFree ? null : "30d 6h 5m 30s" } }, { onConflict: "user_id" } as any);
  if (subscriptionError) console.warn("[admin-compat] subscription upsert failed", subscriptionError.message);
}

function statusCode(error: any) { return error.message?.includes("Admin") ? 403 : error.message?.includes("Authentication") ? 401 : 500; }

export function registerAdminCompatRoutes(app: express.Express, deps: Deps) {
  app.get("/api/admin/reports-summary", deps.rateLimit("reports-summary", 80), responseCacheMiddleware(10_000), async (req, res) => {
    try {
      const actor = await deps.requireActor(req); await requireAdminLike(actor);
      const [usersRes, requestsRes, paymentsRes, subPaymentsRes, referralsRes, invoicesRes] = await Promise.all([
        safeData(supabaseAdmin.from("user_profiles").select("role,created_at,is_pro,plan_status,plan_code", { count: "exact" }).limit(10000)),
        safeData(supabaseAdmin.from("service_requests").select("status,provider_type,created_at", { count: "exact" }).limit(10000)),
        safeData(supabaseAdmin.from("payments").select("amount,currency,status,payment_method,created_at", { count: "exact" }).limit(10000)),
        safeData(supabaseAdmin.from("subscription_payment_requests").select("amount,currency,status,role,created_at", { count: "exact" }).limit(10000)),
        safeData(supabaseAdmin.from("referrals").select("referrer_user_id,referred_user_id,signup_role,converted_at,created_at", { count: "exact" }).limit(10000)),
        safeData(supabaseAdmin.from("invoices").select("amount,total_amount,currency,status,created_at", { count: "exact" }).limit(10000)),
      ]);
      const users = usersRes.data || []; const requests = requestsRes.data || []; const payments = paymentsRes.data || []; const mobile = subPaymentsRes.data || []; const referrals = referralsRes.data || []; const invoices = invoicesRes.data || [];
      res.json({ users: { total: usersRes.count || users.length, byRole: countBy(users, "role"), pro: users.filter((u: any) => u.is_pro || ["paid", "active"].includes(String(u.plan_status).toLowerCase())).length }, requests: { total: requestsRes.count || requests.length, byStatus: countBy(requests, "status"), byProviderType: countBy(requests, "provider_type") }, payments: { totalAmount: payments.reduce((s: number, p: any) => s + Number(p.amount || 0), 0), count: paymentsRes.count || payments.length, byStatus: countBy(payments, "status"), byMethod: countBy(payments, "payment_method") }, mobileMoney: { count: subPaymentsRes.count || mobile.length, pending: mobile.filter((m: any) => String(m.status).toLowerCase() === "pending").length, byStatus: countBy(mobile, "status") }, invoices: { count: invoicesRes.count || invoices.length, byStatus: countBy(invoices, "status") }, referrals: { visits: referralsRes.count || referrals.length, converted: referrals.filter((r: any) => r.referred_user_id || r.converted_at).length, byRole: countBy(referrals.filter((r: any) => r.signup_role), "signup_role") }, supabase: { status: "connected", sampledRows: users.length + requests.length + payments.length + mobile.length + referrals.length + invoices.length }, paypal: { configured: Boolean(getPaypalClientId()), serverConfigured: Boolean(getPaypalClientId() && getPaypalSecret()) } });
    } catch (error: any) { res.status(statusCode(error)).json({ error: error.message || "Could not load reports summary." }); }
  });

  app.get("/api/payments/manual-pending", deps.rateLimit("manual-pending", 80), async (req, res) => {
    try {
      const actor = await deps.requireActor(req); await requireAdminLike(actor);
      const [manualRes, subRes] = await Promise.all([
        safeData(supabaseAdmin.from("payments").select("*").in("status", ["pending_verification", "pending", "submitted"]).order("submitted_at", { ascending: false }).limit(300)),
        safeData(supabaseAdmin.from("subscription_payment_requests").select("*").eq("status", "pending").order("created_at", { ascending: false }).limit(300)),
      ]);
      const rows = [ ...(manualRes.data || []), ...(subRes.data || []).map((row: any) => ({ ...row, id: `sub_${row.id}`, source_table: "subscription_payment_requests", user_id: row.user_id, amount_expected: row.amount, amount_submitted: row.amount, transaction_code: row.transaction_id, payment_method: row.method || "paypal_link", submitted_at: row.created_at, recipient_name: row.metadata?.recipient_name || row.payer_name || "Struta PayPal", recipient_phone_or_till: row.metadata?.recipient_phone || row.metadata?.payment_link || "PayPal payment link", risk_flags: {}, customer: { id: row.user_id, full_name: row.payer_name, email: row.payer_email, phone: row.payer_phone }, provider: null })) ];
      const ids = Array.from(new Set(rows.flatMap((p: any) => [p.user_id, p.provider_id]).filter(Boolean)));
      let profiles: any[] = [];
      if (ids.length) { const result = await safeData(supabaseAdmin.from("user_profiles").select("id,full_name,email,home_name,business_name,role,phone").in("id", ids)); profiles = result.data || []; }
      const profileMap = new Map(profiles.map((p) => [p.id, p]));
      res.json({ payments: rows.map((p: any) => ({ ...p, customer: p.customer || (p.user_id ? profileMap.get(p.user_id) || null : null), provider: p.provider || (p.provider_id ? profileMap.get(p.provider_id) || null : null) })) });
    } catch (error: any) { res.status(statusCode(error)).json({ error: error.message || "Could not load manual payments." }); }
  });

  app.post("/api/payments/manual/:paymentId/confirm", deps.rateLimit("manual-confirm", 40), async (req, res) => {
    try {
      const actor = await deps.requireActor(req); await requireAdminLike(actor);
      const rawId = req.params.paymentId; const isSubscription = rawId.startsWith("sub_"); const id = rawId.replace(/^sub_/, "");
      if (isSubscription) {
        const { data: row, error } = await supabaseAdmin.from("subscription_payment_requests").select("*").eq("id", id).maybeSingle(); if (error) throw error; if (!row) return res.status(404).json({ error: "Payment request not found." });
        await supabaseAdmin.from("subscription_payment_requests").update({ status: "approved", approved_at: new Date().toISOString(), approved_by: actor.id, updated_at: new Date().toISOString() }).eq("id", id);
        await activateUserPlan(row.user_id, row.plan_code || "pro", actor.id, Number(req.body?.durationDays || 30), Number(req.body?.durationHours || 6), Number(req.body?.durationMinutes || 5), Number(req.body?.durationSeconds || 30));
        clearApiCache();
        return res.json({ ok: true, source: "subscription_payment_requests" });
      }
      const { data: payment, error } = await supabaseAdmin.from("payments").select("*").eq("id", id).maybeSingle(); if (error) throw error; if (!payment) return res.status(404).json({ error: "Payment not found." });
      await supabaseAdmin.from("payments").update({ status: "confirmed", confirmed_at: new Date().toISOString(), confirmed_by: actor.id, updated_at: new Date().toISOString() }).eq("id", id);
      if (payment.request_id) await supabaseAdmin.from("service_requests").update({ status: "accepted", updated_at: new Date().toISOString() }).eq("id", payment.request_id);
      clearApiCache();
      res.json({ ok: true, source: "payments" });
    } catch (error: any) { res.status(statusCode(error)).json({ error: error.message || "Failed to confirm payment." }); }
  });

  app.post("/api/payments/manual/:paymentId/reject", deps.rateLimit("manual-reject", 40), async (req, res) => {
    try { const actor = await deps.requireActor(req); await requireAdminLike(actor); const rawId = req.params.paymentId; const reason = sanitizeText(req.body?.reason || "Rejected by admin.", 500); const isSubscription = rawId.startsWith("sub_"); const id = rawId.replace(/^sub_/, ""); if (isSubscription) { const { error } = await supabaseAdmin.from("subscription_payment_requests").update({ status: "rejected", rejection_reason: reason, rejected_at: new Date().toISOString(), rejected_by: actor.id, updated_at: new Date().toISOString() }).eq("id", id); if (error) throw error; clearApiCache(); return res.json({ ok: true, source: "subscription_payment_requests" }); } const { error } = await supabaseAdmin.from("payments").update({ status: "rejected", rejection_reason: reason, rejected_at: new Date().toISOString(), rejected_by: actor.id, updated_at: new Date().toISOString() }).eq("id", id); if (error) throw error; clearApiCache(); res.json({ ok: true, source: "payments" }); } catch (error: any) { res.status(statusCode(error)).json({ error: error.message || "Failed to reject payment." }); }
  });

  app.get("/api/admin/users/plans", deps.rateLimit("admin-users", 80), responseCacheMiddleware(10_000), async (req, res) => { try { const actor = await deps.requireActor(req); await requireAdminLike(actor); const { data, error } = await supabaseAdmin.from("user_profiles").select("id,email,full_name,role,home_name,business_name,plan_code,plan_status,plan_expires_at,is_pro,is_banned,ban_reason,banned_until,ban_count,account_flagged").order("created_at", { ascending: false }).limit(1000); if (error) throw error; res.json({ users: data || [] }); } catch (error: any) { res.status(statusCode(error)).json({ error: error.message || "Could not load users." }); } });
  app.post("/api/admin/users/:userId/plan", deps.rateLimit("admin-plan", 40), async (req, res) => { try { const actor = await deps.requireActor(req); await requireAdminLike(actor); await activateUserPlan(req.params.userId, req.body?.planCode || "free", actor.id, Number(req.body?.durationDays || 30), Number(req.body?.durationHours || 6), Number(req.body?.durationMinutes || 5), Number(req.body?.durationSeconds || 30)); clearApiCache(); res.json({ ok: true }); } catch (error: any) { res.status(statusCode(error)).json({ error: error.message || "Could not update user plan." }); } });
  app.post("/api/admin/users/:userId/plan-change", deps.rateLimit("admin-plan-change", 40), async (req, res) => { try { const actor = await deps.requireActor(req); await requireAdminLike(actor); await activateUserPlan(req.params.userId, req.body?.plan_name || req.body?.planCode || "pro", actor.id, Number(req.body?.durationDays || 30), Number(req.body?.durationHours || 6), Number(req.body?.durationMinutes || 5), Number(req.body?.durationSeconds || 30)); clearApiCache(); res.json({ ok: true }); } catch (error: any) { res.status(statusCode(error)).json({ error: error.message || "Could not change plan." }); } });
  app.post("/api/admin/users/:userId/ban", deps.rateLimit("admin-ban", 40), async (req, res) => { try { const actor = await deps.requireActor(req); await requireAdminLike(actor); const reason = sanitizeText(req.body?.reason || "Policy violation.", 600); const days = Math.max(1, Number(req.body?.durationDays || 14)); const bannedUntil = req.body?.permanent ? null : new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(); const { error } = await supabaseAdmin.from("user_profiles").update({ is_banned: true, ban_reason: reason, banned_until: bannedUntil, ban_count: 1, account_flagged: true, updated_at: new Date().toISOString() }).eq("id", req.params.userId); if (error) throw error; await supabaseAdmin.from("policy_violations").insert({ user_id: req.params.userId, admin_user_id: actor.id, violation_type: sanitizeText(req.body?.violationType || "terms_violation", 80), reason, action_taken: "admin_ban", duration_days: req.body?.permanent ? 0 : days, ends_at: bannedUntil }); clearApiCache(); res.json({ ok: true }); } catch (error: any) { res.status(statusCode(error)).json({ error: error.message || "Could not ban user." }); } });
  app.post("/api/admin/users/:userId/unban", deps.rateLimit("admin-unban", 40), async (req, res) => { try { const actor = await deps.requireActor(req); await requireAdminLike(actor); const { error } = await supabaseAdmin.from("user_profiles").update({ is_banned: false, ban_reason: null, banned_until: null, account_flagged: false, updated_at: new Date().toISOString() }).eq("id", req.params.userId); if (error) throw error; await supabaseAdmin.from("policy_violations").insert({ user_id: req.params.userId, admin_user_id: actor.id, violation_type: "admin_unban", reason: sanitizeText(req.body?.reason || "Unbanned by admin.", 500), action_taken: "unban", duration_days: 0 }); clearApiCache(); res.json({ ok: true }); } catch (error: any) { res.status(statusCode(error)).json({ error: error.message || "Could not unban user." }); } });
  app.delete("/api/admin/users/:userId", deps.rateLimit("admin-delete-user", 10), async (req, res) => { try { const actor = await deps.requireActor(req); await requireAdminLike(actor); const userId = req.params.userId; await supabaseAdmin.from("user_profiles").delete().eq("id", userId); await supabaseAdmin.auth.admin.deleteUser(userId).catch((error) => console.warn("[admin-delete-user] auth delete skipped", error.message)); clearApiCache(); res.json({ ok: true }); } catch (error: any) { res.status(statusCode(error)).json({ error: error.message || "Could not delete user." }); } });
  app.post("/api/admin/expire-plans", deps.rateLimit("admin-expire-plans", 10), async (req, res) => { try { const actor = await deps.requireActor(req); await requireAdminLike(actor); const { error } = await supabaseAdmin.rpc("expire_old_pro_plans"); if (error) throw error; clearApiCache(); res.json({ ok: true, expired: 0 }); } catch (error: any) { res.status(statusCode(error)).json({ error: error.message || "Could not expire plans." }); } });

  app.get("/api/admin/customise", deps.rateLimit("admin-customise-read", 80), async (req, res) => { try { const actor = await deps.requireActor(req); await requireAdminLike(actor); const [helpRes, popupRes] = await Promise.all([safeData(supabaseAdmin.from("help_center_articles").select("*").order("order_index", { ascending: true })), safeData(supabaseAdmin.from("site_update_popups").select("*").order("created_at", { ascending: false }))]); res.json({ articles: helpRes.data || [], updates: popupRes.data || [] }); } catch (error: any) { res.status(statusCode(error)).json({ error: error.message || "Could not load customise data." }); } });
  app.post("/api/admin/help-articles", deps.rateLimit("admin-help-save", 40), async (req, res) => { try { const actor = await deps.requireActor(req); await requireAdminLike(actor); const payload = { title: sanitizeText(req.body?.title, 180), slug: sanitizeText(req.body?.slug, 220), category: sanitizeText(req.body?.category || "General", 80), content: String(req.body?.content || "").slice(0, 50000), published: Boolean(req.body?.published), order_index: Number(req.body?.order_index || 100), updated_by: actor.id }; if (!payload.title || !payload.content) return res.status(400).json({ error: "Title and content are required." }); const query = req.body?.id ? supabaseAdmin.from("help_center_articles").update(payload).eq("id", req.body.id).select("*").maybeSingle() : supabaseAdmin.from("help_center_articles").insert({ ...payload, created_by: actor.id }).select("*").maybeSingle(); const { data, error } = await query; if (error) throw error; clearApiCache(); res.json({ ok: true, article: data }); } catch (error: any) { res.status(statusCode(error)).json({ error: error.message || "Could not save help article." }); } });
  app.post("/api/admin/site-updates", deps.rateLimit("admin-update-save", 40), async (req, res) => { try { const actor = await deps.requireActor(req); await requireAdminLike(actor); const payload = { title: sanitizeText(req.body?.title, 180), body: String(req.body?.body || "").slice(0, 12000), image_url: sanitizeText(req.body?.image_url, 1000), cta_label: sanitizeText(req.body?.cta_label, 120), cta_url: sanitizeText(req.body?.cta_url, 1000), audience: sanitizeText(req.body?.audience || "all", 60), active: Boolean(req.body?.active), starts_at: req.body?.starts_at || new Date().toISOString(), ends_at: req.body?.ends_at || null, updated_by: actor.id }; if (!payload.title || !payload.body) return res.status(400).json({ error: "Title and body are required." }); const query = req.body?.id ? supabaseAdmin.from("site_update_popups").update(payload).eq("id", req.body.id).select("*").maybeSingle() : supabaseAdmin.from("site_update_popups").insert({ ...payload, created_by: actor.id }).select("*").maybeSingle(); const { data, error } = await query; if (error) throw error; clearApiCache(); res.json({ ok: true, update: data }); } catch (error: any) { res.status(statusCode(error)).json({ error: error.message || "Could not save site update." }); } });
  app.delete("/api/admin/customise/:table/:id", deps.rateLimit("admin-customise-delete", 30), async (req, res) => { try { const actor = await deps.requireActor(req); await requireAdminLike(actor); const table = req.params.table === "site_update_popups" ? "site_update_popups" : "help_center_articles"; const { error } = await supabaseAdmin.from(table).delete().eq("id", req.params.id); if (error) throw error; clearApiCache(); res.json({ ok: true }); } catch (error: any) { res.status(statusCode(error)).json({ error: error.message || "Could not delete item." }); } });
}