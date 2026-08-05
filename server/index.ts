import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";
import { z } from "zod";

const app = express();
const port = Number(process.env.PORT ?? 8081);
const paystackKey = process.env.PAYSTACK_SECRET_KEY ?? "";
const publicUrl = (process.env.APP_URL ?? `http://localhost:${port}`).replace(/\/$/, "");
const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist");
const supabaseUrl = process.env.SUPABASE_URL ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const admin = supabaseUrl && serviceKey ? createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } }) : null;

app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_ORIGIN?.split(",") ?? true }));
app.post("/api/payments/webhook", express.raw({ type: "application/json" }), (req, res) => {
  if (!paystackKey) return res.status(503).json({ error: "Payments are not configured" });
  const signature = req.header("x-paystack-signature") ?? "";
  const body = req.body as Buffer;
  const expected = crypto.createHmac("sha512", paystackKey).update(body).digest("hex");
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return res.status(401).json({ error: "Invalid webhook signature" });
  return res.sendStatus(200);
});
app.use(express.json({ limit: "2mb" }));

const paymentSchema = z.object({ email: z.string().email(), amount: z.number().min(10), currency: z.string().length(3).default("KES") });
const inviteSchema = z.object({ email: z.string().email(), percentage: z.number().min(0).max(100), teamId: z.string().uuid().optional(), inviterName: z.string().max(120).optional() });

app.get("/api/health", (_req, res) => res.json({ ok: true, api: "typescript-express", auth: Boolean(admin), payments: Boolean(paystackKey), signaling: process.env.SIGNALING_URL ?? "http://localhost:8090" }));

app.post("/api/team/invite", async (req, res, next) => {
  try {
    if (!admin) return res.status(503).json({ error: "Supabase admin credentials are not configured" });
    const input = inviteSchema.parse(req.body);
    const { data, error } = await admin.auth.admin.inviteUserByEmail(input.email, {
      redirectTo: `${publicUrl}/signup/teacher?email=${encodeURIComponent(input.email)}`,
      data: { role: "teacher", team_id: input.teamId, revenue_share: input.percentage, invited_by: input.inviterName ?? "a Learnzurr team owner" },
    });
    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json({ invited: true, userId: data.user.id, message: "Supabase sent the invite using the project's configured SMTP provider" });
  } catch (error) { next(error); }
});

app.post("/api/payments/initialize", async (req, res, next) => {
  try {
    if (!paystackKey) return res.status(503).json({ error: "Set PAYSTACK_SECRET_KEY" });
    const input = paymentSchema.parse(req.body);
    const reference = `learnzurr-${Date.now()}-${crypto.randomBytes(5).toString("hex")}`;
    const response = await fetch("https://api.paystack.co/transaction/initialize", { method: "POST", headers: { Authorization: `Bearer ${paystackKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ email: input.email, amount: Math.round(input.amount * 100), currency: input.currency.toUpperCase(), reference, callback_url: `${publicUrl}/payment/callback` }) });
    const payload = await response.json() as { status?: boolean; message?: string; data?: { authorization_url?: string; reference?: string } };
    if (!response.ok || !payload.data?.authorization_url) return res.status(502).json({ error: payload.message ?? "Paystack initialization failed" });
    return res.status(201).json({ authorizationUrl: payload.data.authorization_url, reference: payload.data.reference });
  } catch (error) { next(error); }
});

app.get("/api/payments/verify/:reference", async (req, res, next) => {
  try {
    if (!paystackKey) return res.status(503).json({ error: "Payments are not configured" });
    const reference = z.string().regex(/^[A-Za-z0-9.=-]+$/).parse(req.params.reference);
    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, { headers: { Authorization: `Bearer ${paystackKey}` } });
    return res.status(response.ok ? 200 : 502).json(await response.json());
  } catch (error) { next(error); }
});

app.use("/api", (_req, res) => res.status(404).json({ error: "API route not found" }));
app.use(express.static(webRoot));
app.use((_req, res) => res.sendFile(path.join(webRoot, "index.html")));
app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => { console.error(error); res.status(error instanceof z.ZodError ? 400 : 500).json({ error: error instanceof Error ? error.message : "Internal server error" }); });
app.listen(port, "0.0.0.0", () => console.log(`Learnzurr API listening on ${port}`));
