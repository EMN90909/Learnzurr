import { env as publicEnv } from '$env/dynamic/public';
import type { FeaturedClass, PublicStats, Subject } from './types';

const API_BASE = publicEnv.PUBLIC_API_BASE_URL || '/api';

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {})
    }
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export const api = {
  publicStats: () => request<PublicStats>('/public/stats'),
  publicSubjects: () => request<Subject[]>('/public/subjects'),
  featuredClasses: () => request<FeaturedClass[]>('/public/featured-classes'),
  login: (email: string, password: string) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  subscribePush: (subscription: PushSubscriptionJSON) => request('/notify/subscribe', { method: 'POST', body: JSON.stringify(subscription) }),
  upload: async (path: string, form: FormData, token: string) => {
    const res = await fetch(`${API_BASE}${path}`, { method: 'POST', body: form, headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
};


export const endpoints = {
 auth: { login: '/auth/login', signupParent: '/auth/signup/parent', signupTeacher: '/auth/signup/teacher', refresh: '/auth/refresh', logout: '/auth/logout' },
 parent: { dashboard: '/parent/dashboard', children: '/parent/children', payments: '/parent/payments', messages: '/parent/messages' },
 teacher: { dashboard: '/teacher/dashboard', classes: '/teacher/classes', lms: '/teacher/lms', payouts: '/teacher/payouts' },
 learner: { dashboard: '/learner/dashboard', tasks: '/learner/tasks', gamfy: '/learner/gamfy', projects: '/learner/projects' },
 admin: { dashboard: '/admin/dashboard', moderation: '/admin/flag', treasury: '/admin/mearn', security: '/admin/security' }
} as const;

export async function authed<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
 return request<T>(path, { ...init, headers: { ...(init.headers || {}), Authorization: `Bearer ${token}` } });
}

export function multipart(path: string, form: FormData, token: string) { return api.upload(path, form, token); }
