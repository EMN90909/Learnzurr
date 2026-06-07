import { writable } from 'svelte/store';
import type { AuthSession } from './types';
export const authSession = writable<AuthSession | null>(null);
export const uiState = writable({ theme: 'light', navOpen: false });
export const lastError = writable<string | null>(null);
