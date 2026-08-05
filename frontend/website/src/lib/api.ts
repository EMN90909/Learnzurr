import { supabase } from "./supabase";

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = "ApiError";
  }
}

type ApiOptions = Omit<RequestInit, "body"> & { body?: unknown };

export async function request<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body !== undefined) headers.set("Content-Type", "application/json");
  if (data.session?.access_token) headers.set("Authorization", `Bearer ${data.session.access_token}`);

  const response = await fetch(path, {
    ...options,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const payload = (await response.json().catch(() => ({}))) as { error?: string } & T;
  if (!response.ok) throw new ApiError(payload.error ?? "The request could not be completed", response.status);
  return payload;
}

async function joinSession(sessionId: string, token = "") {
  const result = token
    ? await request<JoinSessionResult>(`/api/live/${sessionId}/join`, { method: "POST", body: { token } })
    : await request<JoinSessionResult>(`/api/live-sessions/${sessionId}/token`);
  const signaling = new URL(result.signalingUrl);
  signaling.searchParams.set("session", result.session.id);
  return { ...result, signalingUrl: signaling.toString() };
}

export const api = {
  health: () => request<{ ok: boolean; signaling: string }>("/api/health"),
  dashboard: () => request<{ role: string; metrics: Record<string, number>; recent?: unknown[] }>("/api/dashboard"),
  teacherDashboard: () => request<TeacherDashboardResult>("/api/teacher/dashboard"),
  team: (teamId: string) => request<{ team: { id: string; name: string }; members: TeamMember[]; invites: TeamInvite[] }>(`/api/team/${teamId}`),
  inviteTeacher: (body: { teamId: string; email: string; percentage: number; inviterName?: string }) =>
    request<{ message: string }>("/api/team/invite", { method: "POST", body }),
  classes: () => request<{ classes: ClassroomSummary[] }>("/api/classes"),
  createClass: (body: { title: string; description?: string }) => request<{ classroom: ClassroomSummary }>("/api/classes", { method: "POST", body }),
  liveSessions: () => request<{ sessions: LiveSessionSummary[] }>("/api/live-sessions"),
  assignments: () => request<{ assignments: AssignmentSummary[] }>("/api/assignments"),
  students: () => request<{ students: StudentSummary[] }>("/api/students"),
  createSession: (classId: string, body: { name: string; startsAt: string; endsAt: string }) =>
    request<CreateSessionResult>(`/api/classes/${classId}/sessions`, { method: "POST", body }),
  createAssignment: (classId: string, body: { title: string; body: Record<string, unknown>; kind: string; dueAt?: string | null }) =>
    request<{ assignment: unknown }>(`/api/classes/${classId}/assignments`, { method: "POST", body }),
  initializePayment: (body: { email: string; amount: number; classId?: string; studentId?: string; currency?: string }) =>
    request<{ authorizationUrl: string; reference: string }>("/api/payments/initialize", { method: "POST", body: { currency: "KES", ...body } }),
  verifyPayment: (reference: string) => request<{ data?: { status?: string; reference?: string; amount?: number } }>(`/api/payments/verify/${encodeURIComponent(reference)}`),
  joinSession,
  subscribePush: (subscription: PushSubscriptionJSON) =>
    request<{ subscribed: boolean }>("/api/push/subscribe", { method: "POST", body: subscription }),
  pushPublicKey: () => request<{ publicKey: string | null }>("/api/push/public-key"),
};

export async function enableWebPush() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) throw new Error("Web push is not supported by this browser");
  const { publicKey } = await api.pushPublicKey();
  if (!publicKey) throw new Error("Web push has not been configured on the server");
  if (await Notification.requestPermission() !== "granted") throw new Error("Notification permission was not granted");
  const registration = await navigator.serviceWorker.register("/sw.js");
  const existing = await registration.pushManager.getSubscription();
  const subscription = existing ?? await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });
  await api.subscribePush(subscription.toJSON());
  return subscription;
}

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((character) => character.charCodeAt(0)));
}

export interface TeacherDashboardResult {
  students: number;
  revenue: number;
  classes: { id: string; title: string }[];
  teams?: { id: string; name: string }[];
  teachers: unknown[];
}
export interface TeamMember {
  teacher_id: string;
  revenue_share: number;
  last_report_at?: string | null;
  profiles?: { full_name?: string; avatar_url?: string | null; last_login_at?: string | null } | null;
}
export interface TeamInvite { id: string; email: string; revenue_share: number; status: string; created_at: string }
export interface ClassroomSummary { id: string; title: string; description?: string; capacity?: number; learnerCount?: number }
export interface LiveSessionSummary { id: string; class_id: string; name: string; starts_at: string; ends_at: string; status: string; join_url?: string }
export interface AssignmentSummary { id: string; class_id: string; title: string; body?: { html?: string; format?: string }; kind: string; due_at?: string | null }
export interface StudentSummary { id: string; full_name: string; email?: string; last_login_at?: string | null }
export interface CreateSessionResult {
  session: { id: string; name: string; starts_at: string; ends_at: string; signaling_room: string; joinUrl: string; signalingUrl: string };
  notified: { learners: number; emailsSent: number; pushesSent: number };
}
export interface JoinSessionResult {
  session: { id: string; name: string; room: string; startsAt: string; endsAt: string };
  participant: { id: string; name: string; role: "teacher" | "learner" };
  signalingUrl: string;
  socketToken: string;
  iceServers: RTCIceServer[];
}
