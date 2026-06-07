import { authSession, lastError } from './stores';
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
let memoryToken = '';
authSession.subscribe((session) => { memoryToken = session?.accessToken || ''; });
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('content-type', headers.get('content-type') || 'application/json');
  if (memoryToken) headers.set('authorization', `Bearer ${memoryToken}`);
  const response = await fetch(`${API_BASE}${path}`, { ...init, headers, credentials: 'include' });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) { const message = payload.error || 'Request failed. Please try again.'; lastError.set(message); throw new Error(message); }
  return payload as T;
}
