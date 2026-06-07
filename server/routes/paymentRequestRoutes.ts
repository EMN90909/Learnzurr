import type express from "express";
import { supabaseAdmin } from "../supabase-admin";
import type { ServerActor } from "../auth";
import { publishRealtime } from "../realtime/realtimeHub";

const sanitizeText = (value: unknown, max = 160) => String(value || "").trim().slice(0, max);
const money = (value: unknown, fallback = 0) => {
  const n = Number(value || fallback);
  return Number.isFinite(n) ? Number(n.toFixed(2)) : fallback;
};

const PLAN_DEFAULTS: Record<string, { amount: number; currency: string; role: string; link: string }> = {
  family_pro: { amount: 6.95, currency: "USD", role: "family", link: "https://www.paypal.com/ncp/payment/64TYANNPPPJAA" },
  family_premium: { amount: 6.95, currency: "USD", role: "family", link: "https://www.paypal.com/ncp/payment/64TYANNPPPJAA" },
  home_pro: { amount: 12.37, currency: "USD", role: "home", link: "https://www.paypal.com/ncp/payment/8XU4VYB66JVCU" },
  pro: { amount: 12.37, currency: "USD", role: "home", link: "https://www.paypal.com/ncp/payment/8XU4VYB66JVCU" },
  vendor_pro: { amount: 9.27, currency: "USD", role: "vendor", link: "https://www.paypal.com/ncp/payment/ZGWG3NEZ2JLMG" },
};

type Deps = {
  requireActor: (req: express.Request) => Promise<ServerActor>;
  rateLimit: (name: string, max?: number, windowMs?: number) => express.RequestHandler;
};

async function insertPaymentRequest(payload: any) {
  const direct = await supabaseAdmin
    .from("subscription_payment_requests")
    .insert(payload)
    .select("id,user_id,role,amount,currency,plan_code,method,status,created_at")
    .maybeSingle();

  if (!direct.error) return direct;

  console.warn("[subscription-payment-requests] direct insert failed, trying RPC fallback:", direct.error.message);
  const rpc = await supabaseAdmin.rpc("submit_subscription_payment_request", {
    p_user_id: payload.user_id,
    p_role: payload.role,
    p_payer_name: payload.payer_name,
    p_payer_email: payload.payer_email,
    p_payer_phone: payload.payer_phone,
    p_transaction_id: payload.transaction_id,
    p_amount: payload.amount,
    p_currency: payload.currency,
    p_plan_code: payload.plan_code,
    p_method: payload.method,
    p_metadata: payload.metadata,
  });

  if (rpc.error) return { data: null, error: rpc.error };
  const row = Array.isArray(rpc.data) ? rpc.data[0] : rpc.data;
  return { data: row, error: null };
}

export function registerPaymentRequestRoutes(app: express.Express, deps: Deps) {
  app.post("/api/subscription-payment-requests", deps.rateLimit("subscription-payment-request", 60, 15 * 60_000), async (req, res) => {
    try {
      const actor = await deps.requireActor(req);
      const planCode = sanitizeText(req.body?.plan_code || req.body?.planCode || "family_pro", 80);
      const defaults = PLAN_DEFAULTS[planCode] || PLAN_DEFAULTS.family_pro;
      const role = sanitizeText(req.body?.role || defaults.role, 40);
      const payerName = sanitizeText(req.body?.payer_name || req.body?.payerName || actor.email || "Struta user", 160);
      const payerEmail = sanitizeText(req.body?.payer_email || req.body?.payerEmail || actor.email || "", 180) || null;
      const payerPhone = sanitizeText(req.body?.payer_phone || req.body?.payerPhone || "", 60) || null;
      const method = sanitizeText(req.body?.method || "paypal_link", 60);
      const transactionId = sanitizeText(req.body?.transaction_id || req.body?.transactionId || `${method.toUpperCase()}-${Date.now()}`, 120);
      const amount = money(req.body?.amount, defaults.amount);
      const currency = sanitizeText(req.body?.currency || defaults.currency, 10).toUpperCase();
      const metadata = {
        ...(typeof req.body?.metadata === "object" && req.body.metadata ? req.body.metadata : {}),
        account_type: role,
        payment_link: req.body?.metadata?.payment_link || defaults.link,
        source: req.body?.metadata?.source || "server_subscription_payment_request",
        submitted_from: req.headers.origin || req.headers.referer || "unknown",
      };

      const payload = {
        user_id: actor.id,
        role,
        payer_name: payerName,
        payer_email: payerEmail,
        payer_phone: payerPhone,
        transaction_id: transactionId,
        amount,
        currency,
        plan_code: planCode,
        method,
        status: "pending",
        metadata,
      };

      const { data, error } = await insertPaymentRequest(payload);
      if (error) {
        console.error("[subscription-payment-requests] insert failed", error);
        return res.status(500).json({ error: error.message || "Could not submit subscription payment request." });
      }

      try {
        await supabaseAdmin.from("notifications").insert({
          user_id: actor.id,
          title: "Payment request submitted",
          body: `Your ${planCode.replace(/_/g, " ")} payment request was submitted for approval.`,
          message: `Your ${planCode.replace(/_/g, " ")} payment request was submitted for approval.`,
          type: "payment",
          deep_link: `/${role === "vendor" ? "marketplace" : role === "family" ? "family" : "operations"}/billing`,
          is_read: false,
          read: false,
        });
      } catch (notificationError: any) {
        console.warn("[subscription-payment-requests] notification insert skipped", notificationError?.message || notificationError);
      }

      publishRealtime({ type: "subscription_payment_submitted", userId: actor.id, payload: data });
      res.json({ ok: true, paymentRequest: data });
    } catch (error: any) {
      console.error("[subscription-payment-requests]", error);
      res.status(error.message?.includes("Authentication") ? 401 : 500).json({ error: error.message || "Could not submit subscription payment request." });
    }
  });
}