import { writable, derived } from 'svelte/store';
import { clearAccessToken, setAccessToken } from './api';
import type { SessionUser } from './types';

export const user = writable<SessionUser | null>(null);
export const theme = writable<'calm' | 'focus' | 'playful'>('calm');
export const sidebarOpen = writable(false);
export const notifications = writable<string[]>([]);
export const realtimeEvents = writable<unknown[]>([]);
export const isAuthenticated = derived(user, ($user) => Boolean($user?.accessToken));

export function startSession(nextUser: SessionUser) {
  setAccessToken(nextUser.accessToken);
  user.set(nextUser);
}

export function endSession() {
  clearAccessToken();
  user.set(null);
}

export function addNotification(message: string) {
  notifications.update((items) => [message, ...items].slice(0, 20));
}

export function addRealtimeEvent(event: unknown) {
  realtimeEvents.update((items) => [event, ...items].slice(0, 50));
}
