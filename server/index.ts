import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient, type User } from "@supabase/supabase-js";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";
import nodemailer from "nodemailer";
import webpush from "web-push";
import { z } from "zod";

const app = express();
const port = Number(process.env.PORT ?? 8081);
const paystackKey = process.env.PAYSTACK_SECRET_KEY ?? "";
const publicUrl = (process.env.APP_URL ?? `http://localhost:${port}`).replace(/\/$/, "");
const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist");
const supabaseUrl = process.env.SUPABASE_URL ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const signalingUrl = process.env.SIGNALING_URL ?? "ws://localhost:8090/ws";
const admin = supabaseUrl && serviceKey
  ? createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
  : null;

const smtp = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    })
  : null;

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:support@learnzurr.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
}

interface AuthenticatedRequest extends Request { user?: User }

app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_ORIGIN?.split(",") ?? true }));

app.post("/api/payments/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  if (!paystackKey) return res.status(503).json({ error: "Payments are not configured" });
  const signature = req.header("x-paystack-signature") ?? "";
  const body = req.body as Buffer;
  const expected = crypto.createHmac("sha512", paystackKey).update(body).digest("hex");
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return res.status(401).json({ error: "Invalid webhook signature" });
  }
  const event = JSON.parse(body.toString("utf8")) as { event?: string; data?: { reference?: string; paid_at?: string } };
  if (admin && event.event === "charge.success" && event.data?.reference) {
    await admin.from("payments").update({ status: "paid", paid_at: event.data.paid_at ?? new Date().toISOString() }).eq("paystack_reference", event.data.reference);
  }
  return res.sendStatus(200);
});

app.use(express.json({ limit: "2mb" }));

const paymentSchema = z.object({
  email: z.string().email(), amount: z.number().min(10), currency: z.string().length(3).default("KES"),
  classId: z.string().uuid().optional(), studentId: z.string().uuid().optional(),
});
const inviteSchema = z.object({
  email: z.string().email(), percentage: z.number().min(0).max(100), teamId: z.string().uuid(), inviterName: z.string().max(120).optional(),
});
const sessionSchema = z.object({
  classId: z.string().uuid(), name: z.string().trim().min(3).max(120), startsAt: z.string().datetime(), endsAt: z.string().datetime(),
});
const assignmentSchema = z.object({
  classId: z.string().uuid(), title: z.string().trim().min(3).max(160), body: z.record(z.unknown()),
  kind: z.enum(["task", "question", "quiz", "assessment", "exam"]), dueAt: z.string().datetime().nullable().optional(),
});
const pushSchema = z.object({ endpoint: z.string().url(), keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }) });

async function requireUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!admin) return res.status(503).json({ error: "Supabase admin credentials are not configured" });
    const token = req.header("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) return res.status(401).json({ error: "Authentication required" });
    const { data, error } = await admin.auth.getUser(token);
    if (error || !data.user) return res.status(401).json({ error: "Invalid or expired session" });
    req.user = data.user;
    await admin.from("profiles").update({ last_login_at: new Date().toISOString() }).eq("id", data.user.id);
    next();
  } catch (error) { next(error); }
}

async function assertTeacher(userId: string) {
  if (!admin) throw new Error("Supabase is not configured");
  const { data, error } = await admin.from("profiles").select("role,full_name").eq("id", userId).single();
  if (error || !data || data.role !== "teacher") throw Object.assign(new Error("Teacher access required"), { statusCode: 403 });
  return data as { role: string; full_name: string };
}

async function assertClassTeacher(userId: string, classId: string) {
  if (!admin) throw new Error("Supabase is not configured");
  const { data: owned } = await admin.from("classes").select("id,title,owner_teacher_id").eq("id", classId).eq("owner_teacher_id", userId).maybeSingle();
  if (owned) return owned;
  const { data: mapped } = await admin.from("class_teachers").select("class_id").eq("class_id", classId).eq("teacher_id", userId).maybeSingle();
  if (!mapped) throw Object.assign(new Error("You are not assigned to this class"), { statusCode: 403 });
  const { data, error } = await admin.from("classes").select("id,title,owner_teacher_id").eq("id", classId).single();
  if (error || !data) throw Object.assign(new Error("Class not found"), { statusCode: 404 });
  return data;
}

app.get("/api/health", (_req, res) => res.json({
  ok: true,
  api: "typescript-express",
  auth: Boolean(admin),
  payments: Boolean(paystackKey),
  smtp: Boolean(smtp),
  webPush: Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY),
  signaling: signalingUrl,
}));

app.get("/api/teacher/dashboard", requireUser, async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = req.user!;
    await assertTeacher(user.id);
    const { data: classes } = await admin!.from("classes").select("id,title").eq("owner_teacher_id", user.id);
    const classIds = (classes ?? []).map((item) => item.id);
    const [{ count: students }, { data: payments }, { data: teams }] = await Promise.all([
      classIds.length ? admin!.from("student_enrollments").select("student_id", { count: "exact", head: true }).in("class_id", classIds).eq("active", true) : Promise.resolve({ count: 0 }),
      classIds.length ? admin!.from("payments").select("amount_kes,status").in("class_id", classIds) : Promise.resolve({ data: [] }),
      admin!.from("teacher_teams").select("id,name").eq("owner_id", user.id),
    ]);
    const revenue = (payments ?? []).filter((p) => p.status === "paid").reduce((sum, p) => sum + Number(p.amount_kes), 0);
    const teamIds = (teams ?? []).map((team) => team.id);
    const { data: members } = teamIds.length
      ? await admin!.from("team_members").select("teacher_id,revenue_share,profiles!team_members_teacher_id_fkey(full_name,last_login_at)").in("team_id", teamIds)
      : { data: [] };
    return res.json({ students: students ?? 0, revenue, classes: classes ?? [], teams: teams ?? [], teachers: members ?? [] });
  } catch (error) { next(error); }
});

app.get("/api/team/:teamId", requireUser, async (req: AuthenticatedRequest, res, next) => {
  try {
    await assertTeacher(req.user!.id);
    const teamId = z.string().uuid().parse(req.params.teamId);
    const { data: team } = await admin!.from("teacher_teams").select("id,name,owner_id").eq("id", teamId).single();
    if (!team) return res.status(404).json({ error: "Team not found" });
    const allowed = team.owner_id === req.user!.id || Boolean((await admin!.from("team_members").select("teacher_id").eq("team_id", teamId).eq("teacher_id", req.user!.id).maybeSingle()).data);
    if (!allowed) return res.status(403).json({ error: "Team access denied" });
    const { data: members, error } = await admin!.from("team_members")
      .select("teacher_id,revenue_share,last_report_at,profiles!team_members_teacher_id_fkey(full_name,avatar_url,last_login_at)")
      .eq("team_id", teamId);
    if (error) throw error;
    const { data: invites } = await admin!.from("teacher_invites").select("id,email,revenue_share,status,created_at").eq("team_id", teamId);
    return res.json({ team, members: members ?? [], invites: invites ?? [] });
  } catch (error) { next(error); }
});

app.post("/api/team/invite", requireUser, async (req: AuthenticatedRequest, res, next) => {
  try {
    const teacher = await assertTeacher(req.user!.id);
    const input = inviteSchema.parse(req.body);
    const { data: team } = await admin!.from("teacher_teams").select("id,owner_id,name").eq("id", input.teamId).single();
    if (!team || team.owner_id !== req.user!.id) return res.status(403).json({ error: "Only the team owner can invite teachers" });
    const inviter = input.inviterName ?? teacher.full_name || req.user!.email || "a Learnzurr teacher";
    const { data, error } = await admin!.auth.admin.inviteUserByEmail(input.email, {
      redirectTo: `${publicUrl}/signup/teacher?email=${encodeURIComponent(input.email)}&team=${input.teamId}`,
      data: { role: "teacher", team_id: input.teamId, revenue_share: input.percentage, invited_by: inviter },
    });
    if (error) return res.status(400).json({ error: error.message });
    await admin!.from("teacher_invites").upsert({
      team_id: input.teamId, email: input.email.toLowerCase(), revenue_share: input.percentage,
      invited_by: req.user!.id, invited_user_id: data.user.id, status: "pending",
    }, { onConflict: "team_id,email" });
    return res.status(201).json({ invited: true, userId: data.user.id, message: `A secure signup link was sent to ${input.email} through Supabase SMTP.` });
  } catch (error) { next(error); }
});

app.post("/api/push/subscribe", requireUser, async (req: AuthenticatedRequest, res, next) => {
  try {
    const input = pushSchema.parse(req.body);
    const { error } = await admin!.from("push_subscriptions").upsert({
      user_id: req.user!.id, endpoint: input.endpoint, p256dh: input.keys.p256dh, auth: input.keys.auth,
    }, { onConflict: "endpoint" });
    if (error) throw error;
    return res.status(201).json({ subscribed: true });
  } catch (error) { next(error); }
});

app.post("/api/classes/:classId/sessions", requireUser, async (req: AuthenticatedRequest, res, next) => {
  try {
    await assertTeacher(req.user!.id);
    const input = sessionSchema.parse({ ...req.body, classId: req.params.classId });
    const classRecord = await assertClassTeacher(req.user!.id, input.classId);
    if (new Date(input.endsAt) <= new Date(input.startsAt)) return res.status(400).json({ error: "End time must be after start time" });
    const rawToken = crypto.randomBytes(32).toString("base64url");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const room = `class-${input.classId}-${crypto.randomBytes(8).toString("hex")}`;
    const { data: session, error } = await admin!.from("live_sessions").insert({
      class_id: input.classId, name: input.name, starts_at: input.startsAt, ends_at: input.endsAt,
      join_token_hash: tokenHash, signaling_room: room, created_by: req.user!.id,
    }).select("id,name,starts_at,ends_at,signaling_room").single();
    if (error || !session) throw error ?? new Error("Session could not be created");

    const { data: enrollments } = await admin!.from("student_enrollments").select("student_id").eq("class_id", input.classId).eq("active", true);
    const learnerIds = (enrollments ?? []).map((item) => item.student_id);
    const joinUrl = `${publicUrl}/live/${session.id}?token=${encodeURIComponent(rawToken)}`;
    const teacherName = (await assertTeacher(req.user!.id)).full_name || req.user!.email || "Your teacher";
    let emailsSent = 0;
    if (smtp) {
      const recipients = await Promise.all(learnerIds.map(async (id) => (await admin!.auth.admin.getUserById(id)).data.user?.email));
      const emails = recipients.filter((email): email is string => Boolean(email));
      if (emails.length) {
        await smtp.sendMail({
          from: process.env.SMTP_FROM ?? "Learnzurr <no-reply@learnzurr.com>", bcc: emails,
          subject: `${input.name} starts ${new Date(input.startsAt).toLocaleString()}`,
          text: `${teacherName} scheduled ${input.name} for ${new Date(input.startsAt).toLocaleString()}. Sign in and join: ${joinUrl}`,
          html: `<h2>${input.name}</h2><p>${teacherName} scheduled this class for <strong>${new Date(input.startsAt).toLocaleString()}</strong>.</p><p><a href="${joinUrl}">Sign in and join class</a></p>`,
        });
        emailsSent = emails.length;
      }
    }
    let pushesSent = 0;
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && learnerIds.length) {
      const { data: subscriptions } = await admin!.from("push_subscriptions").select("endpoint,p256dh,auth").in("user_id", learnerIds);
      const payload = JSON.stringify({ title: input.name, body: `Starts at ${new Date(input.startsAt).toLocaleString()} with ${teacherName}`, url: joinUrl });
      const results = await Promise.allSettled((subscriptions ?? []).map((sub) => webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload)));
      pushesSent = results.filter((result) => result.status === "fulfilled").length;
    }
    return res.status(201).json({ session: { ...session, joinUrl, signalingUrl }, notified: { learners: learnerIds.length, emailsSent, pushesSent } });
  } catch (error) { next(error); }
});

app.post("/api/classes/:classId/assignments", requireUser, async (req: AuthenticatedRequest, res, next) => {
  try {
    await assertTeacher(req.user!.id);
    const input = assignmentSchema.parse({ ...req.body, classId: req.params.classId });
    await assertClassTeacher(req.user!.id, input.classId);
    const { data, error } = await admin!.from("assignments").insert({
      class_id: input.classId, author_id: req.user!.id, title: input.title, body: input.body, kind: input.kind, due_at: input.dueAt ?? null,
    }).select("id,title,kind,due_at").single();
    if (error) throw error;
    return res.status(201).json({ assignment: data });
  } catch (error) { next(error); }
});

app.post("/api/live/:sessionId/join", requireUser, async (req: AuthenticatedRequest, res, next) => {
  try {
    const sessionId = z.string().uuid().parse(req.params.sessionId);
    const token = z.string().min(20).parse(req.body.token);
    const hash = crypto.createHash("sha256").update(token).digest("hex");
    const { data: session } = await admin!.from("live_sessions").select("id,class_id,name,starts_at,ends_at,status,join_token_hash,signaling_room").eq("id", sessionId).single();
    if (!session || session.join_token_hash !== hash) return res.status(403).json({ error: "Invalid classroom link" });
    const { data: profile } = await admin!.from("profiles").select("role,full_name").eq("id", req.user!.id).single();
    const role = profile?.role;
    let permitted = false;
    if (role === "learner") permitted = Boolean((await admin!.from("student_enrollments").select("student_id").eq("class_id", session.class_id).eq("student_id", req.user!.id).eq("active", true).maybeSingle()).data);
    if (role === "teacher") {
      permitted = Boolean((await admin!.from("classes").select("id").eq("id", session.class_id).eq("owner_teacher_id", req.user!.id).maybeSingle()).data)
        || Boolean((await admin!.from("class_teachers").select("teacher_id").eq("class_id", session.class_id).eq("teacher_id", req.user!.id).maybeSingle()).data);
    }
    if (!permitted) return res.status(403).json({ error: "You are not enrolled or assigned to this class" });
    await admin!.from("live_session_participants").upsert({ session_id: session.id, user_id: req.user!.id, role }, { onConflict: "session_id,user_id" });
    const socketToken = crypto.createHmac("sha256", serviceKey).update(`${session.id}:${req.user!.id}:${role}`).digest("base64url");
    return res.json({ session: { id: session.id, name: session.name, room: session.signaling_room, startsAt: session.starts_at, endsAt: session.ends_at }, participant: { id: req.user!.id, name: profile?.full_name, role }, signalingUrl, socketToken, iceServers: [{ urls: [process.env.STUN_URL ?? "stun:stun.l.google.com:19302"] }, ...(process.env.TURN_URL ? [{ urls: [process.env.TURN_URL], username: process.env.TURN_USERNAME, credential: process.env.TURN_CREDENTIAL }] : [])] });
  } catch (error) { next(error); }
});

app.post("/api/payments/initialize", requireUser, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!paystackKey) return res.status(503).json({ error: "Set PAYSTACK_SECRET_KEY" });
    const input = paymentSchema.parse(req.body);
    const reference = `learnzurr-${Date.now()}-${crypto.randomBytes(5).toString("hex")}`;
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST", headers: { Authorization: `Bearer ${paystackKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email: input.email, amount: Math.round(input.amount * 100), currency: input.currency.toUpperCase(), reference, callback_url: `${publicUrl}/payment/callback`, metadata: { payer_id: req.user!.id, class_id: input.classId, student_id: input.studentId } }),
    });
    const payload = await response.json() as { status?: boolean; message?: string; data?: { authorization_url?: string; reference?: string } };
    if (!response.ok || !payload.data?.authorization_url) return res.status(502).json({ error: payload.message ?? "Paystack initialization failed" });
    await admin!.from("payments").insert({ payer_id: req.user!.id, student_id: input.studentId, class_id: input.classId, paystack_reference: reference, amount_kes: input.amount, status: "pending" });
    return res.status(201).json({ authorizationUrl: payload.data.authorization_url, reference: payload.data.reference });
  } catch (error) { next(error); }
});

app.get("/api/payments/verify/:reference", requireUser, async (req, res, next) => {
  try {
    if (!paystackKey) return res.status(503).json({ error: "Payments are not configured" });
    const reference = z.string().regex(/^[A-Za-z0-9.=-]+$/).parse(req.params.reference);
    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, { headers: { Authorization: `Bearer ${paystackKey}` } });
    const payload = await response.json();
    return res.status(response.ok ? 200 : 502).json(payload);
  } catch (error) { next(error); }
});

app.use("/api", (_req, res) => res.status(404).json({ error: "API route not found" }));
app.use(express.static(webRoot));
app.use((_req, res) => res.sendFile(path.join(webRoot, "index.html")));
app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(error);
  const status = typeof error === "object" && error && "statusCode" in error ? Number((error as { statusCode: number }).statusCode) : error instanceof z.ZodError ? 400 : 500;
  res.status(status).json({ error: error instanceof z.ZodError ? "Invalid request" : error instanceof Error ? error.message : "Internal server error" });
});

app.listen(port, "0.0.0.0", () => console.log(`Learnzurr API listening on ${port}`));
