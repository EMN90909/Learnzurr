import { supabase } from "./supabase";

export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(data.session?.access_token ? { Authorization: `Bearer ${data.session.access_token}` } : {}),
      ...options.headers,
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(payload.error ?? "Request failed", response.status);
  return payload as T;
}

async function joinSession(sessionId: string, token: string) {
  const result = await request<JoinSessionResult>(`/api/live/${sessionId}/join`, { method: "POST", body: JSON.stringify({ token }) });
  const signaling = new URL(result.signalingUrl);
  signaling.searchParams.set("session", result.session.id);
  return { ...result, signalingUrl: signaling.toString() };
}

export const api = {
  health: () => request<{ ok: boolean; signaling: string }>("/api/health"),
  teacherDashboard: () => request<{ students: number; revenue: number; classes: { id: string; title: string }[]; teachers: unknown[] }>("/api/teacher/dashboard"),
  team: (teamId: string) => request<{ team: { id: string; name: string }; members: TeamMember[]; invites: TeamInvite[] }>(`/api/team/${teamId}`),
  inviteTeacher: (body: { teamId: string; email: string; percentage: number; inviterName?: string }) => request<{ message: string }>("/api/team/invite", { method: "POST", body: JSON.stringify(body) }),
  createSession: (classId: string, body: { name: string; startsAt: string; endsAt: string }) => request<CreateSessionResult>(`/api/classes/${classId}/sessions`, { method: "POST", body: JSON.stringify(body) }),
  createAssignment: (classId: string, body: { title: string; body: Record<string, unknown>; kind: string; dueAt?: string | null }) => request<{ assignment: unknown }>(`/api/classes/${classId}/assignments`, { method: "POST", body: JSON.stringify(body) }),
  joinSession,
  subscribePush: (subscription: PushSubscriptionJSON) => request<{ subscribed: boolean }>("/api/push/subscribe", { method: "POST", body: JSON.stringify(subscription) }),
};

export interface TeamMember {
  teacher_id: string;
  revenue_share: number;
  last_report_at?: string | null;
  profiles?: { full_name?: string; avatar_url?: string | null; last_login_at?: string | null } | null;
}
export interface TeamInvite { id: string; email: string; revenue_share: number; status: string; created_at: string }
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
