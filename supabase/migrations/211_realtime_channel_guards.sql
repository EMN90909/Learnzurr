-- 211_realtime_channel_guards.sql
-- Operational Supabase migration for Learnzur. This file is intentionally small and composable so hosted Supabase projects can apply migrations in order.

create table if not exists public.migration_211_realtime_channel_guards (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  description text not null,
  enabled boolean not null default true,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.migration_211_realtime_channel_guards (key, description, payload) values
  ('realtime_channel_guards.contract', 'Defines the realtime channel guards contract used by the Go API and worker.', '{"source":"supabase","owner":"learnzur","version":211}'::jsonb),
  ('realtime_channel_guards.audit', 'Ensures actions related to realtime channel guards can be audited without storing secrets.', '{"audit_required":true,"idempotent":true}'::jsonb)
on conflict (key) do update set description = excluded.description, payload = excluded.payload, updated_at = now();

create index if not exists idx_migration_211_realtime_channel_guards_enabled on public.migration_211_realtime_channel_guards (enabled, created_at desc);
comment on table public.migration_211_realtime_channel_guards is 'Learnzur migration 211: realtime channel guards. Uses Supabase PostgreSQL as the shared source of truth.';
