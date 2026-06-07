import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const p = (file) => path.join(root, file);
const read = (file) => fs.existsSync(p(file)) ? fs.readFileSync(p(file), "utf8") : "";
const write = (file, content) => fs.writeFileSync(p(file), content);

function patchPaypalRoutes() {
  const file = "server/routes/paypalRoutes.ts";
  let src = read(file);
  if (!src || src.includes('router.post("/create-order"')) return;

  const route = `
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
`;
  src = src.replace('router.get("/callback-events", (_req, res) => res.json({ ok: true, events: PAYPAL_CALLBACK_EVENTS }));', 'router.get("/callback-events", (_req, res) => res.json({ ok: true, events: PAYPAL_CALLBACK_EVENTS }));\n' + route);
  write(file, src);
}

function patchBillingPage() {
  const file = "src/features/funeral-home/pages/Billing.tsx";
  let src = read(file);
  if (!src) return;

  src = src.replace(/Load PayPal Subscribe Button/g, "Load PayPal Payment Button");
  src = src.replace(/Subscribe with PayPal to unlock \{accountLabel\} Pro\./g, "Pay with PayPal to unlock {accountLabel} Pro.");
  src = src.replace(/Loading secure PayPal button/g, "Loading secure PayPal payment button");
  src = src.replace(/Activating subscription/g, "Completing payment");
  src = src.replace(/data-struta-paypal-subscription/g, "data-struta-paypal-checkout");
  src = src.replace(/\?client-id=\$\{PAYPAL_CLIENT_ID\}&vault=true&intent=subscription&components=buttons/g, '?client-id=${PAYPAL_CLIENT_ID}&currency=USD&components=buttons');
  src = src.replace(/style: \{ shape: "pill", color: "blue", layout: "vertical", label: "subscribe" \},\n\s*createSubscription: \(_data: any, actions: any\) => actions\.subscription\.create\(\{ plan_id: paypalPlan\.id \}\),\n\s*onApprove: async \(data: any\) => \{/g, 'style: { shape: "pill", color: "blue", layout: "vertical", label: "pay" },\n        createOrder: async () => {\n          const response = await fetch("/api/paypal/create-order", {\n            method: "POST",\n            headers: { "Content-Type": "application/json" },\n            body: JSON.stringify({ amount: subscriptionAmount.toFixed(2), plan: paypalPlan.plan, userId: profile.id, description: `${accountLabel} Pro payment` }),\n          });\n          const result = await response.json().catch(() => ({}));\n          if (!response.ok) throw new Error(result.error || "Could not create PayPal order.");\n          return result.id;\n        },\n        onApprove: async (data: any) => {');
  src = src.replace(/body: JSON\.stringify\(\{ subscriptionID: data\.subscriptionID, planId: paypalPlan\.id, plan: paypalPlan\.plan, userId: profile\.id \}\),/g, 'body: JSON.stringify({ orderID: data.orderID, plan: paypalPlan.plan, userId: profile.id }),');
  src = src.replace(/const response = await fetch\("\/api\/paypal", \{/g, 'const response = await fetch("/api/paypal/capture-order", {');
  src = src.replace(/Could not activate PayPal subscription/g, "Could not complete PayPal payment");
  src = src.replace(/showSuccess\(paypalPlan\.success\);/g, 'showSuccess("Payment completed. Pro is active.");');
  src = src.replace(/PayPal subscription approved\. Vendor Pro is active\./g, "PayPal payment completed. Vendor Pro is active.");
  src = src.replace(/PayPal subscription approved\. Funeral Home Pro is active\./g, "PayPal payment completed. Funeral Home Pro is active.");
  write(file, src);
}

patchPaypalRoutes();
patchBillingPage();
