import { writable } from 'svelte/store';
import type { UserSession } from './types';

export const session = writable<UserSession>(null);
export const unreadNotifications = writable(0);
export const activeChildId = writable<string | null>(null);
export const pushPermission = writable<NotificationPermission>('default');
