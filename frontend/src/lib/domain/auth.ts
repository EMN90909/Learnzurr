import type { Role } from '../types';
export type LoginIntent = { email: string; password: string; role?: Role; remember?: boolean };
export type AuthDecision = { allowed: boolean; reason: string; next: 'dashboard'|'verify-email'|'reset-password'|'blocked' };
export function normalizeEmail(email: string) { return email.trim().toLowerCase(); }
export function passwordStrength(password: string) { let score = 0; if (password.length >= 8) score++; if(/[A-Z]/.test(password)) score++; if(/[a-z]/.test(password)) score++; if(/[0-9]/.test(password)) score++; if(/[^A-Za-z0-9]/.test(password)) score++; return score; }
export function decideLogin(input: LoginIntent): AuthDecision { if(!input.email.includes('@')) return {allowed:false, reason:'Use a valid email address.', next:'blocked'}; if(input.password.length < 8) return {allowed:false, reason:'Password must be at least 8 characters.', next:'reset-password'}; return {allowed:true, reason:'Login request can be sent to the Go API.', next:'dashboard'}; }
export function roleHome(role: Role) { return role === 'teacher' ? '/teacher/dashboard' : role === 'learner' ? '/learner/dashboard' : role === 'admin' ? '/admin/dashboard' : '/parent/dashboard'; }
