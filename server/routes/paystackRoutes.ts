import express from "express";
import crypto from "node:crypto";
import { config } from "../config";
import { supabaseAdmin } from "../supabase-admin";
import { emailService } from "../services/email-service";
import { sanitizePayload } from "../security/requestSecurity";

const router = express.Router();
const PLAN_DURATION_MS = (((30 * 24 + 6) * 60 + 30) * 60 + 30) * 1000;
const REMINDER_BEFORE_MS = 2 * 24 * 60 * 60 * 1000;

type PlanKind = "home" | "vendor";

const clean = (value: unknown, max = 200) => String(value || "").replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max);
const appUrl = () => config.appUrl.replace(/\/$/, "");
const payLinkFor = (kind: PlanKind) => kind === "home" ? process.env.FUNERAL_HOME_PRO_PLAN_LINK || `${appUrl()}/operations/billing` : process.env.FUNERAL_VENDOR_PRO_PLAN_LINK || `${appUrl()}/marketplace/billing`;

async function paystackFetch(path: string, init: RequestInit = {}) {
  if (!config.paystackSecretKey) throw new Error("PAYSTACK_SECRET_KEY is not configured.");
  const response = await fetch(`https://api.paystack.co${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${config.paystackSecretKey}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.status === false) throw new Error(data?.message || `Paystack request failed with ${response.status}`);
  return data;
}

async function upsertProPlan(kind: PlanKind, payment: any, fallbackEmail = "") {
  const reference = clean(payment?.reference || payment?.data?.reference || payment?.metadata?.reference, 120);
  const email = clean(payment?.customer?.email || payment?.data?.customer?.email || fallbackEmail, 180).toLowerCase();
  const amount = Number(payment?.amount || payment?.data?.amount || 0) / 100;
  const paidAt = new Date(payment?.paid_at || payment?.data?.paid_at || Date.now());
  const expiresAt = new Date(paidAt.getTime() + PLAN_DURATION_MS);
  const reminderAt = new Date(expiresAt.getTime() - REMINDER_BEFORE_MS);
  const organizationName = clean(payment?.metadata?.organization_name || payment?.metadata?.custom_fields?.[0]?.value || email || `Struta ${kind}`, 180);

  const activation = {
    kind,
    provider: "paystack",
    reference,
    payer_email: email,
    organization_name: organizationName,
    amount,
    currency: clean(payment?.currency || payment?.data?.currency || "KES", 10),
    paid_at: paidAt.toISOString(),
    expires_at: expiresAt.toISOString(),
    reminder_at: reminderAt.toISOString(),
    status: "active",
    raw_event: sanitizePayload(payment),
    updated_at: new Date().toISOString(),
  };

  await supabaseAdmin.from("pro_plan_activations").upsert(activation, { onConflict: "reference" });
  if (email) {
    await supabaseAdmin.from("user_profiles").update({ plan: "pro", subscription_status: "active", plan_expires_at: expiresAt.toISOString(), updated_at: new Date().toISOString() }).eq("email", email);
  }

  await emailService.send({
    to: email,
    subject: `${organizationName} paid Struta Pro plan`,
    html: `<p>${organizationName} paid the ${kind === "home" ? "Funeral Home" : "Funeral Vendor"} pro plan for one month.</p><p>Starting ${paidAt.toDateString()} to ${expiresAt.toDateString()}.</p><p>Amount paid: ${activation.currency} ${amount.toFixed(2)}</p>`,
    text: `${organizationName} paid the ${kind} pro plan from ${paidAt.toISOString()} to ${expiresAt.toISOString()}. Amount: ${activation.currency} ${amount.toFixed(2)}`,
  }).catch((error) => console.warn("[paystack] payment receipt email skipped", error));

  return activation;
}

router.get("/public-key", (_req, res) => {
  res.json({ publicKey: config.paystackPublicKey, configured: Boolean(config.paystackPublicKey), serverConfigured: Boolean(config.paystackSecretKey) });
});

router.get("/transactions", async (_req, res) => {
  try {
    const transactions = await paystackFetch("/transaction");
    res.json({ ok: true, transactions: transactions.data || [] });
  } catch (error: any) {
    res.status(502).json({ error: error.message || "Could not load Paystack transactions." });
  }
});

router.get("/verify/:reference", async (req, res) => {
  try {
    const reference = encodeURIComponent(clean(req.params.reference, 160));
    const data = await paystackFetch(`/transaction/verify/${reference}`);
    res.json({ ok: true, transaction: data.data });
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Could not verify payment." });
  }
});

async function callback(kind: PlanKind, req: express.Request, res: express.Response) {
  try {
    const reference = clean(req.query.reference || req.query.trxref || req.query.transaction_id, 160);
    if (!reference) return res.redirect(302, `/payment-error?reason=paystack_missing_reference`);
    const verified = await paystackFetch(`/transaction/verify/${encodeURIComponent(reference)}`);
    if (verified?.data?.status !== "success") return res.redirect(302, `/payment-error?reason=paystack_not_successful`);
    await upsertProPlan(kind, verified.data);
    res.redirect(302, `/payment-success?provider=paystack&plan=${kind}_pro&orderId=${encodeURIComponent(reference)}`);
  } catch (error) {
    console.error("[paystack/callback]", error);
    res.redirect(302, `/payment-error?reason=paystack_verification_failed`);
  }
}

router.get("/homes/callback/success", (req, res) => callback("home", req, res));
router.get("/vendor/callback/success", (req, res) => callback("vendor", req, res));

router.post("/webhook", express.raw({ type: "application/json", limit: "1mb" }), async (req, res) => {
  try {
    const secret = config.paystackSecretKey;
    const signature = req.headers["x-paystack-signature"];
    const body = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {}));
    const expected = crypto.createHmac("sha512", secret).update(body).digest("hex");
    if (!secret || signature !== expected) return res.status(401).json({ error: "Invalid Paystack signature." });
    const event = JSON.parse(body.toString("utf8"));
    if (event.event === "charge.success") {
      const kind = clean(event.data?.metadata?.plan_kind, 20) === "home" ? "home" : "vendor";
      await upsertProPlan(kind, event.data);
    }
    res.json({ ok: true });
  } catch (error: any) {
    console.error("[paystack/webhook]", error);
    res.status(500).json({ error: "Webhook could not be processed." });
  }
});

router.post("/plans/expire-due", async (_req, res) => {
  try {
    const now = new Date().toISOString();
    const { data: expired, error } = await supabaseAdmin.from("pro_plan_activations").select("*").eq("status", "active").lte("expires_at", now);
    if (error) throw error;
    for (const plan of expired || []) {
      await supabaseAdmin.from("pro_plan_activations").update({ status: "ended", updated_at: now }).eq("id", plan.id);
      await supabaseAdmin.from("user_profiles").update({ plan: "free", subscription_status: "ended", updated_at: now }).eq("email", plan.payer_email);
      const link = payLinkFor(plan.kind);
      await emailService.send({
        to: plan.payer_email,
        subject: `${plan.organization_name} pro plan has ended`,
        html: `<p>${plan.organization_name} pro plan has ended on ${new Date(plan.expires_at).toDateString()}.</p><p><a href="${link}">Pay to renew Struta Pro</a></p>`,
        text: `${plan.organization_name} pro plan has ended on ${plan.expires_at}. Pay to renew: ${link}`,
      }).catch(() => undefined);
    }
    res.json({ ok: true, expired: expired?.length || 0 });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Could not expire plans." });
  }
});

export default router;
