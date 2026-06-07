
import { derived, type Readable } from 'svelte/store';

export type Timer = ReturnType<typeof setTimeout>;
export type VoidFn = () => void;

export const STUDIO_PROJECT_TYPES = Object.freeze([
  'animation', 'game', 'website-app', 'graphic-design', 'beat'
] as const);

export type StudioProjectType = typeof STUDIO_PROJECT_TYPES[number];

const jsonCache = new Map<string, unknown>();

export function debounce<T extends (...args: unknown[]) => void>(fn: T, delay = 250) {
  let timer: Timer | undefined;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function throttle<T extends (...args: unknown[]) => void>(fn: T, wait = 120) {
  let last = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - last >= wait) {
      last = now;
      fn(...args);
    }
  };
}

export function idle(task: VoidFn) {
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(task);
  }
  return window.setTimeout(task, 1);
}

export function parseNumber(value: string | number, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function cachedJSON<T = unknown>(key: string, raw: string): T {
  if (jsonCache.has(key)) return jsonCache.get(key) as T;
  const parsed = JSON.parse(raw) as T;
  jsonCache.set(key, parsed);
  return parsed;
}

export function computed<T, U>(store: Readable<T>, fn: (value: T) => U): Readable<U> {
  return derived(store, fn);
}

export async function loadStudioPanel(kind: StudioProjectType) {
  switch (kind) {
    case 'animation': return import('../components/CreationStudio.svelte');
    case 'game': return import('../components/CreationStudio.svelte');
    case 'website-app': return import('../components/CreationStudio.svelte');
    case 'graphic-design': return import('../components/CreationStudio.svelte');
    case 'beat': return import('../components/CreationStudio.svelte');
  }
}

export const FRONTEND_OPTIMIZATION_RULES = Object.freeze([
  'Use Svelte stores and derived stores for lightweight state.',
  'Lazy-load heavy Studio panels with async import().',
  'Use svelte:head only on SEO-critical pages.',
  'Keep CSS small with variables and scoped styles.',
  'Minify production JavaScript and CSS through Vite/SvelteKit.',
  'Use dynamic components for conditional Studio tools.',
  'Inline small SVGs for icons instead of extra network requests.',
  'Debounce search and title inputs.',
  'Throttle scroll listeners.',
  'Clean up onMount event listeners.',
  'Use keyed each blocks for public project cards.',
  'Use requestIdleCallback for non-critical sync tasks.',
  'Cache parsed JSON and immutable route metadata.',
  'Use Number() for simple numeric conversion.',
  'Use unknown instead of any for API payloads.'
] as const);
