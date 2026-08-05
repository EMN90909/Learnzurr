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
const signalingUrl = (process.env.SIGNALING_URL ?? "ws://localhost:8090/ws").replace(/\/$/, "");
const signalingSecret = process.env.SIGNALING_SHARED_SECRET ?? serviceKey ?? "";
const admin = supabaseUrl && serviceKey
  ? createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
  : null;
const smtp = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD ?? process.env.SMTP_PASS ?? "" }
        : undefined,
    })
  : null;
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY ?? "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY ?? "";
if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:support@learnzurr.com",
    vapidPublicKey,
    vapidPrivateKey,
  );
}

type AppRole = "teacher" | "learner" | "guardian" | "admin";
interface AuthenticatedRequest extends Request { user?: User; role?: AppRole }

app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_ORIGIN?.split(",") ?? true }));

app.post("/api/payments/webhook", express.raw({ type: "application/json" }), async (request, response, next) => {
  try {
    if (!paystackKey) return response.status(503).json({ error: "Payments are not configured" });
    const signature = request.header("x-paystack-signature") ?? "";
    const body = request.body as Buffer;
    const expected = crypto.createHmac("sha512", paystackKey).update(body).digest("hex");
    if (
      signature.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    ) return response.status(401).json({ error: "Invalid webhook signature" });

    const event = JSON.parse(body.toString("utf8")) as {
      event?: string;
      data?: { reference?: string; paid_at?: string };
    };
    if (admin && event.event === "charge.success" && event.data?.reference) {
      const { data: payment, error } = await admin
        .from("payments")
        .update({ status: "paid", paid_at: event.data.paid_at ?? new Date().toISOString() })
        .eq("paystack_reference", event.data.reference)
        .select("id,class_id,amount_kes")
        .maybeSingle();
      if (error) throw error;
      if (payment?.class_id) await createPaymentSplits(payment.id, payment.class_id, Number(payment.amount_kes));
    }
    return response.sendStatus(200);
  } catch (error) { next(error); }
});

app.use(express.json({ limit: "2mb" }));

const inviteSchema = z.object({
  email: z.string().trim().email(),
  percentage: z.number().finite().min(0).max(100),
  teamId: z.string().uuid(),
  inviterName: z.string().trim().max(120).optional(),
});
const classSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(2000).default(""),
});
const sessionSchema = z.object({
  name: z.string().trim().min(3).max(120),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
});
const assignmentSchema = z.object({
  title: z.string().trim().min(3).max(160),
  body: z.record(z.unknown()),
  kind: z.enum(["task", "question", "quiz", "assessment", "exam"]),
  dueAt: z.string().datetime().nullable().optional(),
});
const paymentSchema = z.object({
  email: z.string().trim().email(),
  amount: z.number().finite().min(10).max(10_000_000),
  currency: z.string().length(3).default("KES"),
  classId: z.string().uuid().optional(),
  studentId: z.string().uuid().optional(),
});
const pushSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }),
});

async function requireUser(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  try {
    if (!admin) return response.status(503).json({ error: "Supabase admin credentials are not configured" });
    const token = request.header("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) return response.status(401).json({ error: "Authentication required" });
    const { data, error } = await admin.auth.getUser(token);
    if (error || !data.user) return response.status(401).json({ error: "Invalid or expired session" });
    request.user = data.user;
    request.role = (data.user.user_metadata.role ?? "learner") as AppRole;
    await admin.from("profiles").update({ last_login_at: new Date().toISOString() }).eq("id", data.user.id);
    next();
  } catch (error) { next(error); }
}

function requireRole(...roles: AppRole[]) {
  return (request: AuthenticatedRequest, response: Response, next: NextFunction) => {
    if (!request.role || !roles.includes(request.role)) {
      return response.status(403).json({ error: "You do not have permission for this action" });
    }
    next();
  };
}

async function teacherProfile(userId: string) {
  const { data, error } = await admin!.from("profiles").select("role,full_name").eq("id", userId).single();
  if (error || data?.role !== "teacher") throw Object.assign(new Error("Teacher access required"), { statusCode: 403 });
  return data as { role: string; full_name: string };
}

async function teacherClassIds(userId: string) {
  const [{ data: owned }, { data: mapped }] = await Promise.all([
    admin!.from("classes").select("id").eq("owner_teacher_id", userId),
    admin!.from("class_teachers").select("class_id").eq("teacher_id", userId),
  ]);
  return [...new Set([...(owned ?? []).map((item) => item.id), ...(mapped ?? []).map((item) => item.class_id)])];
}

async function roleClassIds(userId: string, role: AppRole) {
  if (role === "admin") return null;
  if (role === "teacher") return teacherClassIds(userId);
  if (role === "learner") {
    const { data } = await admin!.from("student_enrollments").select("class_id").eq("student_id", userId).eq("active", true);
    return (data ?? []).map((item) => item.class_id);
  }
  const { data: children } = await admin!.from("guardian_students").select("student_id").eq("guardian_id", userId);
  const childIds = (children ?? []).map((item) => item.student_id);
  if (!childIds.length) return [];
  const { data } = await admin!.from("student_enrollments").select("class_id").in("student_id", childIds).eq("active", true);
  return [...new Set((data ?? []).map((item) => item.class_id))];
}

async function classForTeacher(userId: string, classId: string) {
  const ids = await teacherClassIds(userId);
  if (!ids.includes(classId)) throw Object.assign(new Error("You are not assigned to this class"), { statusCode: 403 });
  const { data, error } = await admin!.from("classes").select("id,title,owner_teacher_id,team_id").eq("id", classId).single();
  if (error || !data) throw Object.assign(new Error("Class not found"), { statusCode: 404 });
  return data;
}

async function canJoinClass(classId: string, userId: string, role: AppRole) {
  if (role === "admin") return true;
  if (role === "teacher") return (await teacherClassIds(userId)).includes(classId);
  if (role === "learner") {
    const { data } = await admin!.from("student_enrollments").select("class_id").eq("class_id", classId).eq("student_id", userId).eq("active", true).maybeSingle();
    return Boolean(data);
  }
  return false;
}

function signalingToken(sessionId: string, userId: string, role: "teacher" | "learner") {
  return crypto.createHmac("sha256", signalingSecret).update(`${sessionId}:${userId}:${role}`).digest("base64url");
}

async function createPaymentSplits(paymentId: string, classId: string, amount: number) {
  const { data: classroom } = await admin!.from("classes").select("owner_teacher_id,team_id").eq("id", classId).maybeSingle();
  if (!classroom) return;
  let allocated = 0;
  const rows: { payment_id: string; teacher_id: string; percentage: number; amount_kes: number }[] = [];
  if (classroom.team_id) {
    const { data: members } = await admin!.from("team_members").select("teacher_id,revenue_share").eq("team_id", classroom.team_id);
    for (const member of members ?? []) {
      const percentage = Number(member.revenue_share);
      const splitAmount = Math.round(amount * percentage) / 100;
      allocated += percentage;
      rows.push({ payment_id: paymentId, teacher_id: member.teacher_id, percentage, amount_kes: splitAmount });
    }
  }
  const ownerPercentage = Math.max(0, 100 - allocated);
  rows.push({ payment_id: paymentId, teacher_id: classroom.owner_teacher_id, percentage: ownerPercentage, amount_kes: Math.round(amount * ownerPercentage) / 100 });
  await admin!.from("payment_splits").upsert(rows, { onConflict: "payment_id,teacher_id" });
}

async function notifyLearners(
  session: { id: string; class_id: string; name: string; starts_at: string },
  teacherName: string,
  joinUrl: string,
) {
  const { data: enrollments } = await admin!.from("student_enrollments").select("student_id").eq("class_id", session.class_id).eq("active", true);
  const learnerIds = (enrollments ?? []).map((item) => item.student_id);
  if (!learnerIds.length) return { learners: 0, emailsSent: 0, pushesSent: 0 };

  await admin!.from("notifications").insert(learnerIds.map((userId) => ({
    user_id: userId,
    title: `${session.name} is scheduled`,
    body: `${teacherName} scheduled the class for ${new Date(session.starts_at).toLocaleString()}.`,
    kind: "live_session",
    action_url: joinUrl,
  })));

  let emailsSent = 0;
  if (smtp) {
    const users = await Promise.all(learnerIds.map((id) => admin!.auth.admin.getUserById(id)));
    const emails = users.map((result) => result.data.user?.email).filter((email): email is string => Boolean(email));
    if (emails.length) {
      await smtp.sendMail({
        from: process.env.SMTP_FROM ?? "Learnzurr <no-reply@learnzurr.com>",
        bcc: emails,
        subject: `${session.name} starts ${new Date(session.starts_at).toLocaleString()}`,
        text: `${teacherName} scheduled ${session.name}. Sign in and join: ${joinUrl}`,
        html: `<h2>${session.name}</h2><p>${teacherName} scheduled this class for <strong>${new Date(session.starts_at).toLocaleString()}</strong>.</p><p><a href="${joinUrl}">Sign in and join class</a></p>`,
      });
      emailsSent = emails.length;
    }
  }

  let pushesSent = 0;
  if (vapidPublicKey && vapidPrivateKey) {
    const { data: subscriptions } = await admin!.from("push_subscriptions").select("endpoint,p256dh,auth").in("user_id", learnerIds);
    const payload = JSON.stringify({
      title: session.name,
      body: `Starts at ${new Date(session.starts_at).toLocaleString()} with ${teacherName}`,
      url: joinUrl,
    });
    const results = await Promise.allSettled((subscriptions ?? []).map((subscription) =>
      webpush.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, payload),
    ));
    pushesSent = results.filter((result) => result.status === "fulfilled").length;
  }
  return { learners: learnerIds.length, emailsSent, pushesSent };
}

app.get("/api/health", (_request, response) => response.json({
  ok: true,
  api: "typescript-express",
  auth: Boolean(admin),
  payments: Boolean(paystackKey),
  smtp: Boolean(smtp),
  webPush: Boolean(vapidPublicKey),
  signaling: signalingUrl,
}));
app.get("/api/push/public-key", (_request, response) => response.json({ publicKey: vapidPublicKey || null }));

app.get("/api/dashboard", requireUser, async (request: AuthenticatedRequest, response, next) => {
  try {
    const userId = request.user!.id;
    const role = request.role!;
    const classIds = await roleClassIds(userId, role);
    const classCount = classIds === null
      ? (await admin!.from("classes").select("id", { count: "exact", head: true })).count ?? 0
      : classIds.length;
    if (role === "admin") {
      const [{ count: users }, { data: payments }] = await Promise.all([
        admin!.from("profiles").select("id", { count: "exact", head: true }),
        admin!.from("payments").select("amount_kes,status"),
      ]);
      const revenue = (payments ?? []).filter((item) => item.status === "paid").reduce((sum, item) => sum + Number(item.amount_kes), 0);
      return response.json({ role, metrics: { users: users ?? 0, classes: classCount, revenue } });
    }
    return response.json({ role, metrics: { classes: classCount } });
  } catch (error) { next(error); }
});

app.get("/api/teacher/dashboard", requireUser, requireRole("teacher", "admin"), async (request: AuthenticatedRequest, response, next) => {
  try {
    if (request.role === "teacher") await teacherProfile(request.user!.id);
    const classIds = request.role === "admin" ? null : await teacherClassIds(request.user!.id);
    let classesQuery = admin!.from("classes").select("id,title");
    if (classIds) classesQuery = classesQuery.in("id", classIds);
    const { data: classes } = await classesQuery;
    const ids = (classes ?? []).map((item) => item.id);
    const [studentsResult, paymentsResult, teamsResult] = await Promise.all([
      ids.length ? admin!.from("student_enrollments").select("student_id", { count: "exact", head: true }).in("class_id", ids).eq("active", true) : Promise.resolve({ count: 0 }),
      ids.length ? admin!.from("payments").select("amount_kes,status").in("class_id", ids) : Promise.resolve({ data: [] as { amount_kes: number; status: string }[] }),
      admin!.from("teacher_teams").select("id,name").eq("owner_id", request.user!.id),
    ]);
    const teamIds = (teamsResult.data ?? []).map((team) => team.id);
    const { data: teachers } = teamIds.length ? await admin!.from("team_members").select("teacher_id,revenue_share").in("team_id", teamIds) : { data: [] };
    const revenue = (paymentsResult.data ?? []).filter((payment) => payment.status === "paid").reduce((sum, payment) => sum + Number(payment.amount_kes), 0);
    response.json({ students: studentsResult.count ?? 0, revenue, classes: classes ?? [], teams: teamsResult.data ?? [], teachers: teachers ?? [] });
  } catch (error) { next(error); }
});

app.get("/api/team/:teamId", requireUser, requireRole("teacher", "admin"), async (request: AuthenticatedRequest, response, next) => {
  try {
    const teamId = z.string().uuid().parse(request.params.teamId);
    const { data: team } = await admin!.from("teacher_teams").select("id,name,owner_id").eq("id", teamId).single();
    if (!team) return response.status(404).json({ error: "Team not found" });
    const { data: membership } = await admin!.from("team_members").select("teacher_id").eq("team_id", teamId).eq("teacher_id", request.user!.id).maybeSingle();
    if (request.role !== "admin" && team.owner_id !== request.user!.id && !membership) return response.status(403).json({ error: "Team access denied" });
    const [{ data: members }, { data: invites }] = await Promise.all([
      admin!.from("team_members").select("teacher_id,revenue_share,last_report_at,profiles!team_members_teacher_id_fkey(full_name,avatar_url,last_login_at)").eq("team_id", teamId),
      admin!.from("teacher_invites").select("id,email,revenue_share,status,created_at").eq("team_id", teamId),
    ]);
    response.json({ team, members: members ?? [], invites: invites ?? [] });
  } catch (error) { next(error); }
});

app.post("/api/team/invite", requireUser, requireRole("teacher", "admin"), async (request: AuthenticatedRequest, response, next) => {
  try {
    const input = inviteSchema.parse(request.body);
    const { data: team } = await admin!.from("teacher_teams").select("id,owner_id").eq("id", input.teamId).single();
    if (!team || (request.role !== "admin" && team.owner_id !== request.user!.id)) return response.status(403).json({ error: "Only the team owner can invite teachers" });
    const { data: profile } = await admin!.from("profiles").select("full_name").eq("id", request.user!.id).maybeSingle();
    const inviter = input.inviterName ?? profile?.full_name ?? request.user!.email ?? "a Learnzurr teacher";
    const { data, error } = await admin!.auth.admin.inviteUserByEmail(input.email, {
      redirectTo: `${publicUrl}/signup/teacher?email=${encodeURIComponent(input.email)}&team=${input.teamId}`,
      data: { role: "teacher", team_id: input.teamId, revenue_share: input.percentage, invited_by: inviter },
    });
    if (error) return response.status(400).json({ error: error.message });
    await admin!.from("teacher_invites").upsert({
      team_id: input.teamId,
      email: input.email.toLowerCase(),
      revenue_share: input.percentage,
      invited_by: request.user!.id,
      invited_user_id: data.user.id,
      status: "pending",
    }, { onConflict: "team_id,email" });
    response.status(201).json({ invited: true, message: `A secure signup link was sent to ${input.email} through Supabase SMTP.` });
  } catch (error) { next(error); }
});

app.get("/api/classes", requireUser, async (request: AuthenticatedRequest, response, next) => {
  try {
    const classIds = await roleClassIds(request.user!.id, request.role!);
    if (classIds && !classIds.length) return response.json({ classes: [] });
    let query = admin!.from("classes").select("id,title,description,capacity,owner_teacher_id,team_id,created_at").order("created_at", { ascending: false });
    if (classIds) query = query.in("id", classIds);
    const { data: classes, error } = await query;
    if (error) throw error;
    const ids = (classes ?? []).map((item) => item.id);
    const { data: enrollments } = ids.length ? await admin!.from("student_enrollments").select("class_id").in("class_id", ids).eq("active", true) : { data: [] };
    response.json({ classes: (classes ?? []).map((item) => ({ ...item, learnerCount: (enrollments ?? []).filter((enrollment) => enrollment.class_id === item.id).length })) });
  } catch (error) { next(error); }
});

app.post("/api/classes", requireUser, requireRole("teacher", "admin"), async (request: AuthenticatedRequest, response, next) => {
  try {
    const input = classSchema.parse(request.body);
    const { data: team } = await admin!.from("teacher_teams").select("id").eq("owner_id", request.user!.id).maybeSingle();
    const { data: classroom, error } = await admin!.from("classes").insert({
      owner_teacher_id: request.user!.id,
      team_id: team?.id ?? null,
      title: input.title,
      description: input.description,
      capacity: 50,
    }).select("*").single();
    if (error) throw error;
    await admin!.from("class_teachers").insert({ class_id: classroom.id, teacher_id: request.user!.id });
    response.status(201).json({ classroom });
  } catch (error) { next(error); }
});

app.get("/api/students", requireUser, requireRole("teacher", "admin"), async (request: AuthenticatedRequest, response, next) => {
  try {
    const classIds = request.role === "admin" ? null : await teacherClassIds(request.user!.id);
    let enrollmentsQuery = admin!.from("student_enrollments").select("student_id").eq("active", true);
    if (classIds) {
      if (!classIds.length) return response.json({ students: [] });
      enrollmentsQuery = enrollmentsQuery.in("class_id", classIds);
    }
    const { data: enrollments } = await enrollmentsQuery;
    const ids = [...new Set((enrollments ?? []).map((item) => item.student_id))];
    const { data: profiles } = ids.length ? await admin!.from("profiles").select("id,full_name,email,role,last_login_at").in("id", ids) : { data: [] };
    response.json({ students: profiles ?? [] });
  } catch (error) { next(error); }
});

app.get("/api/live-sessions", requireUser, async (request: AuthenticatedRequest, response, next) => {
  try {
    const classIds = await roleClassIds(request.user!.id, request.role!);
    if (classIds && !classIds.length) return response.json({ sessions: [] });
    let query = admin!.from("live_sessions").select("id,class_id,name,starts_at,ends_at,status,signaling_room").order("starts_at", { ascending: true });
    if (classIds) query = query.in("class_id", classIds);
    const { data, error } = await query;
    if (error) throw error;
    response.json({ sessions: data ?? [] });
  } catch (error) { next(error); }
});

app.get("/api/assignments", requireUser, async (request: AuthenticatedRequest, response, next) => {
  try {
    const classIds = await roleClassIds(request.user!.id, request.role!);
    if (classIds && !classIds.length) return response.json({ assignments: [] });
    let query = admin!.from("assignments").select("id,class_id,title,body,kind,due_at,author_id").order("due_at", { ascending: true, nullsFirst: false });
    if (classIds) query = query.in("class_id", classIds);
    const { data, error } = await query;
    if (error) throw error;
    response.json({ assignments: data ?? [] });
  } catch (error) { next(error); }
});

app.post("/api/push/subscribe", requireUser, async (request: AuthenticatedRequest, response, next) => {
  try {
    const input = pushSchema.parse(request.body);
    const { error } = await admin!.from("push_subscriptions").upsert({
      user_id: request.user!.id,
      endpoint: input.endpoint,
      p256dh: input.keys.p256dh,
      auth: input.keys.auth,
      updated_at: new Date().toISOString(),
    }, { onConflict: "endpoint" });
    if (error) throw error;
    response.status(201).json({ subscribed: true });
  } catch (error) { next(error); }
});

app.post("/api/classes/:classId/sessions", requireUser, requireRole("teacher", "admin"), async (request: AuthenticatedRequest, response, next) => {
  try {
    const classId = z.string().uuid().parse(request.params.classId);
    const input = sessionSchema.parse(request.body);
    const classroom = request.role === "admin"
      ? (await admin!.from("classes").select("id,title").eq("id", classId).single()).data
      : await classForTeacher(request.user!.id, classId);
    if (!classroom) return response.status(404).json({ error: "Class not found" });
    if (new Date(input.endsAt) <= new Date(input.startsAt)) return response.status(400).json({ error: "End time must be after start time" });
    const rawToken = crypto.randomBytes(32).toString("base64url");
    const { data: session, error } = await admin!.from("live_sessions").insert({
      class_id: classId,
      name: input.name,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      join_token_hash: crypto.createHash("sha256").update(rawToken).digest("hex"),
      signaling_room: `class-${classId}-${crypto.randomBytes(8).toString("hex")}`,
      created_by: request.user!.id,
    }).select("id,class_id,name,starts_at,ends_at,signaling_room").single();
    if (error || !session) throw error ?? new Error("Session could not be created");
    const joinUrl = `${publicUrl}/live/${session.id}?token=${encodeURIComponent(rawToken)}`;
    const { data: profile } = await admin!.from("profiles").select("full_name").eq("id", request.user!.id).maybeSingle();
    const notified = await notifyLearners(session, profile?.full_name ?? request.user!.email ?? "Your teacher", joinUrl);
    response.status(201).json({ session: { ...session, joinUrl, signalingUrl, classTitle: classroom.title }, notified });
  } catch (error) { next(error); }
});

app.post("/api/classes/:classId/assignments", requireUser, requireRole("teacher", "admin"), async (request: AuthenticatedRequest, response, next) => {
  try {
    const classId = z.string().uuid().parse(request.params.classId);
    const input = assignmentSchema.parse(request.body);
    if (request.role !== "admin") await classForTeacher(request.user!.id, classId);
    const { data, error } = await admin!.from("assignments").insert({
      class_id: classId,
      author_id: request.user!.id,
      title: input.title,
      body: input.body,
      kind: input.kind,
      due_at: input.dueAt ?? null,
    }).select("id,title,kind,due_at").single();
    if (error) throw error;
    response.status(201).json({ assignment: data });
  } catch (error) { next(error); }
});

async function classroomJoin(request: AuthenticatedRequest, response: Response, sessionId: string, rawToken?: string) {
  const { data: session } = await admin!.from("live_sessions").select("id,class_id,name,starts_at,ends_at,join_token_hash,signaling_room").eq("id", sessionId).single();
  if (!session) return response.status(404).json({ error: "Live session not found" });
  if (rawToken) {
    const hash = crypto.createHash("sha256").update(rawToken).digest("hex");
    if (session.join_token_hash !== hash) return response.status(403).json({ error: "Invalid classroom link" });
  }
  const appRole = request.role!;
  if (!(await canJoinClass(session.class_id, request.user!.id, appRole))) return response.status(403).json({ error: "You are not enrolled or assigned to this class" });
  const role: "teacher" | "learner" = appRole === "teacher" || appRole === "admin" ? "teacher" : "learner";
  const { data: profile } = await admin!.from("profiles").select("full_name").eq("id", request.user!.id).maybeSingle();
  await admin!.from("live_session_participants").upsert({ session_id: session.id, user_id: request.user!.id, role: appRole }, { onConflict: "session_id,user_id" });
  const socketToken = signalingToken(session.id, request.user!.id, role);
  const iceServers: { urls: string[]; username?: string; credential?: string }[] = [{ urls: [process.env.STUN_URL ?? "stun:stun.l.google.com:19302"] }];
  if (process.env.TURN_URL && process.env.TURN_USERNAME && process.env.TURN_PASSWORD) {
    iceServers.push({ urls: [process.env.TURN_URL], username: process.env.TURN_USERNAME, credential: process.env.TURN_PASSWORD });
  }
  return response.json({
    session: { id: session.id, name: session.name, room: session.signaling_room, startsAt: session.starts_at, endsAt: session.ends_at },
    participant: { id: request.user!.id, name: profile?.full_name ?? request.user!.email ?? role, role },
    signalingUrl,
    socketToken,
    iceServers,
  });
}

app.post("/api/live/:sessionId/join", requireUser, async (request: AuthenticatedRequest, response, next) => {
  try {
    const sessionId = z.string().uuid().parse(request.params.sessionId);
    const token = z.string().min(20).parse(request.body.token);
    return await classroomJoin(request, response, sessionId, token);
  } catch (error) { next(error); }
});
app.get("/api/live-sessions/:sessionId/token", requireUser, async (request: AuthenticatedRequest, response, next) => {
  try {
    const sessionId = z.string().uuid().parse(request.params.sessionId);
    return await classroomJoin(request, response, sessionId);
  } catch (error) { next(error); }
});

app.post("/api/payments/initialize", requireUser, async (request: AuthenticatedRequest, response, next) => {
  try {
    if (!paystackKey) return response.status(503).json({ error: "Set PAYSTACK_SECRET_KEY" });
    const input = paymentSchema.parse(request.body);
    const reference = `learnzurr-${Date.now()}-${crypto.randomBytes(5).toString("hex")}`;
    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${paystackKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: input.email,
        amount: Math.round(input.amount * 100),
        currency: input.currency.toUpperCase(),
        reference,
        callback_url: `${publicUrl}/payment/callback`,
        metadata: { payer_id: request.user!.id, class_id: input.classId, student_id: input.studentId ?? request.user!.id },
      }),
    });
    const payload = await paystackResponse.json() as { message?: string; status?: boolean; data?: { authorization_url?: string; reference?: string } };
    if (!paystackResponse.ok || !payload.status || !payload.data?.authorization_url) return response.status(502).json({ error: payload.message ?? "Paystack initialization failed" });
    await admin!.from("payments").insert({
      payer_id: request.user!.id,
      student_id: input.studentId ?? request.user!.id,
      class_id: input.classId ?? null,
      paystack_reference: reference,
      amount_kes: input.amount,
      status: "pending",
      metadata: { currency: input.currency.toUpperCase() },
    });
    response.status(201).json({ authorizationUrl: payload.data.authorization_url, reference: payload.data.reference });
  } catch (error) { next(error); }
});

app.get("/api/payments/verify/:reference", requireUser, async (request, response, next) => {
  try {
    if (!paystackKey) return response.status(503).json({ error: "Payments are not configured" });
    const reference = z.string().regex(/^[A-Za-z0-9.=-]+$/).parse(request.params.reference);
    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, { headers: { Authorization: `Bearer ${paystackKey}` } });
    response.status(paystackResponse.ok ? 200 : 502).json(await paystackResponse.json());
  } catch (error) { next(error); }
});

app.use("/api", (_request, response) => response.status(404).json({ error: "API route not found" }));
app.use(express.static(webRoot));
app.use((_request, response) => response.sendFile(path.join(webRoot, "index.html")));
app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  console.error(error);
  const status = typeof error === "object" && error && "statusCode" in error
    ? Number((error as { statusCode: number }).statusCode)
    : error instanceof z.ZodError ? 400 : 500;
  response.status(status).json({ error: error instanceof z.ZodError ? "Invalid request" : error instanceof Error ? error.message : "Internal server error" });
});

app.listen(port, "0.0.0.0", () => console.log(`Learnzurr API listening on ${port}`));
