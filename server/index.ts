import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";
import { z } from "zod";

const app = express();
const port = Number(process.env.PORT ?? 8081);
const secretKey = process.env.PAYSTACK_SECRET_KEY ?? "";
const publicUrl = (process.env.APP_URL ?? `http://localhost:${port}`).replace(/\/$/, "");
const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist");

app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_ORIGIN?.split(",") ?? true }));

app.post("/api/payments/webhook", express.raw({ type: "application/json" }), (request, response) => {
  if (!secretKey) return response.status(503).json({ error: "Payments are not configured" });
  const signature = request.header("x-paystack-signature") ?? "";
  const body = request.body as Buffer;
  const expected = crypto.createHmac("sha512", secretKey).update(body).digest("hex");
  const valid = signature.length === expected.length && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!valid) return response.status(401).json({ error: "Invalid webhook signature" });
  const event = JSON.parse(body.toString("utf8")) as { event?: string; data?: { reference?: string } };
  console.info("Paystack event", event.event, event.data?.reference);
  return response.sendStatus(200);
});

app.use(express.json({ limit: "1mb" }));
const paymentSchema = z.object({ email: z.string().trim().email(), amount: z.number().finite().min(10).max(10_000_000), currency: z.string().trim().length(3).default("KES") });

app.get("/api/health", (_request, response) => response.json({ ok: true, service: "learnzurr-api", runtime: "node", language: "typescript", payments: Boolean(secretKey) }));

app.post("/api/payments/initialize", async (request, response, next) => {
  try {
    if (!secretKey) return response.status(503).json({ error: "Set PAYSTACK_SECRET_KEY on the server" });
    const parsed = paymentSchema.safeParse(request.body);
    if (!parsed.success) return response.status(400).json({ error: "Invalid payment details", details: parsed.error.flatten().fieldErrors });
    const reference = `learnzurr-${Date.now()}-${crypto.randomBytes(5).toString("hex")}`;
    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email: parsed.data.email, amount: Math.round(parsed.data.amount * 100), currency: parsed.data.currency.toUpperCase(), reference, callback_url: `${publicUrl}/payment/callback`, metadata: { product: "Learnzurr learning access" } }),
    });
    const payload = await paystackResponse.json() as { status?: boolean; message?: string; data?: { authorization_url?: string; reference?: string; access_code?: string } };
    if (!paystackResponse.ok || !payload.status || !payload.data?.authorization_url) return response.status(502).json({ error: payload.message ?? "Paystack initialization failed" });
    return response.status(201).json({ authorizationUrl: payload.data.authorization_url, reference: payload.data.reference, accessCode: payload.data.access_code });
  } catch (error) { return next(error); }
});

app.get("/api/payments/verify/:reference", async (request, response, next) => {
  try {
    if (!secretKey) return response.status(503).json({ error: "Payments are not configured" });
    const reference = z.string().regex(/^[A-Za-z0-9.=-]+$/).parse(request.params.reference);
    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, { headers: { Authorization: `Bearer ${secretKey}` } });
    return response.status(paystackResponse.ok ? 200 : 502).json(await paystackResponse.json());
  } catch (error) { return next(error); }
});

app.use("/api", (_request, response) => response.status(404).json({ error: "API route not found" }));
app.use(express.static(webRoot));
app.use((_request, response) => response.sendFile(path.join(webRoot, "index.html")));
app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  console.error(error);
  response.status(error instanceof z.ZodError ? 400 : 500).json({ error: error instanceof z.ZodError ? "Invalid request" : "Internal server error" });
});

app.listen(port, "0.0.0.0", () => console.log(`Learnzurr listening on http://0.0.0.0:${port}`));
