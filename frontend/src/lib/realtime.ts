import { createClient, type RealtimeChannel } from '@supabase/supabase-js';
import { browser } from '$app/environment';

const url = import.meta.env.PUBLIC_SUPABASE_URL || '';
const anon = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || '';

export const supabaseRealtime = browser && url && anon ? createClient(url, anon, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { params: { eventsPerSecond: 8 } }
}) : null;

export type RealtimeTable = 'studio_projects' | 'project_comments' | 'room_chat' | 'board_events' | 'notification_queue' | 'flag_chat_sandbox';

export function subscribeToTable(table: RealtimeTable, onChange: (payload: unknown) => void): RealtimeChannel | null {
  if (!supabaseRealtime) return null;
  return supabaseRealtime.channel(`learnzur:${table}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, onChange)
    .subscribe();
}

export function unsubscribe(channel: RealtimeChannel | null) {
  if (channel && supabaseRealtime) supabaseRealtime.removeChannel(channel);
}
