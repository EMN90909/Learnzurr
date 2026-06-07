export type LearnzurRole = 'parent' | 'teacher' | 'learner' | 'admin';
export type AuthSession = { accessToken: string; role: LearnzurRole; userId: string; expiresAt: string };
export type DashboardState = { title: string; role: LearnzurRole; emptyMessage: string };
