import { env as publicEnv } from '$env/dynamic/public';

export type SupabaseRestOptions = {
  table: string;
  select?: string;
  filters?: Record<string, string | number | boolean>;
  limit?: number;
  order?: string;
};

export type SupabaseInsertOptions<T> = {
  table: string;
  values: T | T[];
  returning?: 'minimal' | 'representation';
};

function requirePublicSupabase() {
  const url = publicEnv.PUBLIC_SUPABASE_URL;
  const anonKey = publicEnv.PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('Supabase public configuration is missing. Set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY.');
  }
  return { url: url.replace(/\/$/, ''), anonKey };
}

function headers(extra: HeadersInit = {}): HeadersInit {
  const { anonKey } = requirePublicSupabase();
  return {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
    'Content-Type': 'application/json',
    ...extra
  };
}

export function buildRestUrl(options: SupabaseRestOptions): string {
  const { url } = requirePublicSupabase();
  const params = new URLSearchParams();
  params.set('select', options.select ?? '*');
  if (typeof options.limit === 'number') params.set('limit', String(options.limit));
  if (options.order) params.set('order', options.order);
  for (const [key, value] of Object.entries(options.filters ?? {})) {
    params.set(key, typeof value === 'string' && value.includes('.') ? value : `eq.${value}`);
  }
  return `${url}/rest/v1/${options.table}?${params.toString()}`;
}

export async function supabaseSelect<T>(options: SupabaseRestOptions): Promise<T[]> {
  const response = await fetch(buildRestUrl(options), { headers: headers() });
  if (!response.ok) throw new Error(`Supabase select failed: ${response.status} ${await response.text()}`);
  return response.json() as Promise<T[]>;
}

export async function supabaseInsert<T, R = T>(options: SupabaseInsertOptions<T>): Promise<R[]> {
  const { url } = requirePublicSupabase();
  const response = await fetch(`${url}/rest/v1/${options.table}`, {
    method: 'POST',
    headers: headers({ Prefer: `return=${options.returning ?? 'representation'}` }),
    body: JSON.stringify(options.values)
  });
  if (!response.ok) throw new Error(`Supabase insert failed: ${response.status} ${await response.text()}`);
  if (options.returning === 'minimal') return [];
  return response.json() as Promise<R[]>;
}

export const publicSupabaseTables = {
  stats: 'platform_stats',
  subjects: 'subjects',
  classes: 'classes',
  teacherProfiles: 'teacher_profiles'
} as const;
