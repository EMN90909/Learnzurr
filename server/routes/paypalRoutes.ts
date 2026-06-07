import express from "express";
import { supabaseAdmin } from "../supabase-admin";
import { paypalApi } from "../services/paypal-api";
import { paypalWebhookService } from "../services/paypal-webhook-service";
import { PAYPAL_CALLBACK_EVENTS } from "../services/paypal-events";

const router = express.Router();

const PLAN_META = {
  family: { planCode: "family_pro", role: "family", amount: 6.95, label: "Family Premium" },
  home: { planCode: "home_pro", role: "operations", amount: 12.37, label: "Home Pro" },
  vendor: { planCode: "vendor_pro", role: "marketplace", amount: 9.27, label: "Vendor Pro" },
} as const;
const PRO_DURATION_MS = (((30 * 24 + 6) * 60 + 5) * 60 + 30) * 1000;
const baseUrl = (req: express.Request) => `${req.protocol}://${req.get("host")}`;
const clean = (value: unknown, max = 160) => String(value || "").trim().slice(0, max);
const getTypeFromPlan = (plan: string): keyof typeof PLAN_META => { if (plan.includes("vendor")) return "vendor"; if (plan.includes("home")) return "home"; return "family"; };

async function getValidPendingRequest(userId: string, planCode: string, requestId?: string | null, orderId?: string | null) {
  let query = supabaseAdmin.from("subscription_payment_requests").select("*").eq("user_id", userId).eq("plan_code", planCode).eq("status", "pending");
  if (requestId) query = query.eq("id", requestId);
  else if (orderId) query = query.eq("transaction_id", orderId);
  else return null;
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  if (!data) return null;
  if (!["paypal_api", "paypal_checkout", "paypal_link"].includes(String(data.method || "").toLowerCase())) return null;
  const created = new Date(data.created_at || 0).getTime();
  if (!created || Date.now() - created > 6 * 60 * 60 * 1000) return null;
  return data;
}

async function activatePro(userId: string, planCode: string, source: string, requestId: string, paypal?: Record<string, any>) {
  const type = getTypeFromPlan(planCode);
  const meta = PLAN_META[type];
  const expiresAt = new Date(Date.now() + PRO_DURATION_MS).toISOString();
  const now = new Date().toISOString();
  const { error: profileError } = await supabaseAdmin.from("user_profiles").update({ is_pro: true, plan_code: planCode || meta.planCode, plan_status: "active", plan_expires_at: expiresAt, updated_at: now }).eq("id", userId);
  if (profileError) throw profileError;
  await supabaseAdmin.from("subscriptions").upsert({ user_id: userId, plan_code: planCode || meta.planCode, plan_name: meta.label, status: "active", payment_provider: "paypal", payment_status: "paid", amount: meta.amount, currency: "USD", starts_at: now, expires_at: expiresAt, updated_at: now, metadata: { source, paypal_request_id: requestId, paypal, duration: "30d 6h 5m 30s" } }, { onConflict: "user_id" } as any);
  await supabaseAdmin.from("subscription_payment_requests").update({ status: "approved", approved_at: now, updated_at: now, metadata: { activated_via_callback: true, expires_at: expiresAt, source, paypal } }).eq("id", requestId);
  await supabaseAdmin.from("payments").insert({ user_id: userId, provider: "paypal", payment_method: "paypal", amount: meta.amount, amount_expected: meta.amount, amount_submitted: meta.amount, currency: "USD", status: "paid", reference: paypal?.subscriptionID || paypal?.orderId || requestId, paypal_order_id: paypal?.orderId || paypal?.subscriptionID || null, paypal_capture_id: paypal?.captureId || null, payment_gateway_reference: paypal?.subscriptionID || paypal?.captureId || paypal?.orderId || requestId, submitted_at: now, metadata: { plan_code: planCode, source, subscription_id: paypal?.subscriptionID || null } });
  return expiresAt;
}

router.get("/callback-events", (_req, res) => res.json({ ok: true, events: PAYPAL_CALLBACK_EVENTS }));

router.post("/create-order", async (req, res) => {
  try {
    const amount = Number(req.body?.amount || 10).toFixed(2);
    const plan = clean(req.body?.plan || "vendor_pro", 80);
    const userId = clean(req.body?.userId || req.body?.user_id, 120);
    const description = clean(req.body?.description || "Struta Pro payment", 180);
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0 || numericAmount > 500) return res.status(400).json({ error: "Invalid PayPal amount." });
    const order = await paypalApi.createOrder({
      intent: "CAPTURE",
      purchase_units: [{
        custom_id: userId || undefined,
        description,
        amount: { currency_code: "USD", value: amount },
        invoice_id: req.body?.invoiceId ? clean(req.body.invoiceId, 120) : undefined,
      }],
      application_context: {
        brand_name: "Struta",
        user_action: "PAY_NOW",
        shipping_preference: "NO_SHIPPING",
      },
    });
    res.json(order);
  } catch (error: any) {
    console.error("[paypal create-order]", error);
    res.status(500).json({ error: error.message || "Could not create PayPal order." });
  }
});

router.post("/capture-order", async (req, res) => {
  try {
    const orderID = clean(req.body?.orderID || req.body?.orderId, 120);
    if (!orderID) return res.status(400).json({ error: "Missing PayPal order ID." });
    const capture = await paypalApi.captureOrder(orderID);
    const captureRecord = capture?.purchase_units?.flatMap((unit: any) => unit?.payments?.captures || [])?.[0];
    const status = String(capture?.status || captureRecord?.status || "").toUpperCase();
    if (status !== "COMPLETED") return res.status(400).json({ error: "PayPal payment was not completed.", capture });

    const authHeader = String(req.headers.authorization || "");
    const token = authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7) : "";
    const plan = clean(req.body?.plan || "vendor_pro", 80);
    const requestedUserId = clean(req.body?.userId || req.body?.user_id, 120);
    if (token && requestedUserId) {
      const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
      if (userError || !userData.user) return res.status(401).json({ error: "Authentication required." });
      if (requestedUserId !== userData.user.id) return res.status(403).json({ error: "You can only activate your own subscription." });
      const type = getTypeFromPlan(plan);
      const meta = PLAN_META[type];
      const now = new Date().toISOString();
      const { data: requestRow, error: requestError } = await supabaseAdmin.from("subscription_payment_requests").insert({
        user_id: requestedUserId,
        role: meta.role,
        payer_name: userData.user.email || "Struta user",
        payer_email: userData.user.email || null,
        transaction_id: orderID,
        amount: Number(captureRecord?.amount?.value || meta.amount),
        currency: captureRecord?.amount?.currency_code || "USD",
        plan_code: meta.planCode,
        method: "paypal_checkout_button",
        status: "pending",
        metadata: { source: "paypal_create_capture", capture_id: captureRecord?.id || null, order_id: orderID, created_at: now },
      }).select("id").maybeSingle();
      if (requestError) throw requestError;
      await activatePro(requestedUserId, meta.planCode, "paypal_create_capture", requestRow?.id || orderID, { orderId: orderID, captureId: captureRecord?.id, status, raw: capture });
    }

    res.json({ ok: true, status, orderID, captureID: captureRecord?.id || null, capture });
  } catch (error: any) {
    console.error("[paypal capture-order]", error);
    res.status(500).json({ error: error.message || "Could not capture PayPal order." });
  }
});


router.post("/", async (req, res) => {
  try {
    const authHeader = String(req.headers.authorization || "");
    const token = authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7) : "";
    if (!token) return res.status(401).json({ error: "Authentication required." });
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData.user) return res.status(401).json({ error: "Authentication required." });
    const userId = clean(req.body?.userId || userData.user.id, 120);
    if (userId !== userData.user.id) return res.status(403).json({ error: "You can only activate your own subscription." });
    const subscriptionID = clean(req.body?.subscriptionID || req.body?.subscriptionId, 120);
    const planId = clean(req.body?.planId || req.body?.plan_id, 120);
    const plan = clean(req.body?.plan || "vendor_pro", 80);
    if (!subscriptionID) return res.status(400).json({ error: "Missing PayPal subscription ID." });
    if (plan && !plan.includes("vendor")) return res.status(400).json({ error: "This embedded subscription button is for vendors only." });
    const expiresAt = await activatePro(userId, "vendor_pro", "paypal_subscription_button", subscriptionID, { subscriptionID, planId, raw: req.body });
    return res.json({ ok: true, active: true, plan: "vendor_pro", subscriptionID, expiresAt });
  } catch (e: any) {
    console.error("[paypal subscription approval]", e);
    return res.status(500).json({ error: e.message || "Could not activate PayPal subscription." });
  }
});

router.get("/start", async (req, res) => {
  try {
    const rawType = clean(req.query.type || req.query.accountType || "family", 20) as keyof typeof PLAN_META;
    const type: keyof typeof PLAN_META = rawType === "home" || rawType === "vendor" ? rawType : "family";
    const meta = PLAN_META[type];
    const userId = clean(req.query.userId || req.query.user_id, 120);
    const email = clean(req.query.email, 180);
    const name = clean(req.query.name, 180);
    if (!userId) return res.status(400).send("Missing userId for PayPal payment.");

    const returnUrl = `${baseUrl(req)}/api/paypal/callback?plan=${encodeURIComponent(meta.planCode)}&userId=${encodeURIComponent(userId)}&role=${encodeURIComponent(meta.role)}`;
    const cancelUrl = `${baseUrl(req)}/payment-error?reason=paypal_cancelled`;
    const order = await paypalApi.createOrder({
      intent: "CAPTURE",
      purchase_units: [{ custom_id: userId, description: `${meta.label} subscription`, amount: { currency_code: "USD", value: meta.amount.toFixed(2) } }],
      application_context: { brand_name: "Struta", user_action: "PAY_NOW", return_url: returnUrl, cancel_url: cancelUrl },
    });
    const approveUrl = (order?.links || []).find((link: any) => link.rel === "approve")?.href;
    if (!order?.id || !approveUrl) throw new Error("PayPal did not return an approval URL.");

    const { data: requestRow, error } = await supabaseAdmin.from("subscription_payment_requests").insert({ user_id: userId, role: meta.role, payer_name: name || email || "Struta user", payer_email: email || null, transaction_id: order.id, amount: meta.amount, currency: "USD", plan_code: meta.planCode, method: "paypal_api", status: "pending", metadata: { account_type: type, paypal_order_id: order.id, source: "paypal_api_start", callback_events: PAYPAL_CALLBACK_EVENTS } }).select("id").maybeSingle();
    if (error) throw error;
    const separator = approveUrl.includes("?") ? "&" : "?";
    return res.redirect(`${approveUrl}${separator}custom_id=${encodeURIComponent(requestRow?.id || "")}`);
  } catch (e) { console.error("[paypal start]", e); return res.status(500).send("Could not start PayPal payment."); }
});

router.get("/callback", async (req, res) => {
  try {
    const plan = clean(req.query.plan || "family_pro", 80);
    const userId = clean(req.query.userId || req.query.user_id || req.query.custom, 120);
    const requestId = clean(req.query.requestId || req.query.custom_id, 120) || null;
    const orderId = clean(req.query.token || req.query.orderId, 120) || null;
    if (!userId || !plan) return res.redirect("/payment-error?reason=missing_validation");
    const pending = await getValidPendingRequest(userId, plan, requestId, orderId);
    if (!pending) return res.redirect("/payment-error?reason=invalid_or_expired_payment_request");
    const paypalOrderId = orderId || pending.transaction_id;
    const capture = await paypalApi.captureOrder(paypalOrderId);
    const captureRecord = capture?.purchase_units?.flatMap((unit: any) => unit?.payments?.captures || [])?.[0];
    const status = String(capture?.status || captureRecord?.status || "").toUpperCase();
    if (status !== "COMPLETED") return res.redirect(`/payment-error?reason=paypal_${encodeURIComponent(status.toLowerCase() || "not_completed")}`);
    await activatePro(userId, plan, "paypal_checkout_callback", pending.id, { orderId: paypalOrderId, captureId: captureRecord?.id, status, raw: capture });
    return res.redirect(`/payment-success?plan=${encodeURIComponent(plan)}&provider=paypal&orderId=${encodeURIComponent(paypalOrderId)}`);
  } catch (e) { console.error("[paypal callback]", e); return res.redirect("/payment-error?reason=paypal_callback_failed"); }
});

router.post("/webhook", async (req, res) => {
  try {
    const result = await paypalWebhookService.accept(req.headers as Record<string, string>, req.body || {});
    return res.json({ ok: true, ...result });
  } catch (e: any) {
    console.error("[paypal webhook error]", e);
    return res.status(400).json({ error: e.message || "Webhook failed" });
  }
});

export default router;