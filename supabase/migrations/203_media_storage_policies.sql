-- 203_media_storage_policies.sql
-- Operational Supabase migration for Learnzur. This file is intentionally small and composable so hosted Supabase projects can apply migrations in order.

create table if not exists public.migration_203_media_storage_policies (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  description text not null,
  enabled boolean not null default true,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.migration_203_media_storage_policies (key, description, payload) values
  ('media_storage_policies.contract', 'Defines the media storage policies contract used by the Go API and worker.', '{"source":"supabase","owner":"learnzur","version":203}'::jsonb),
  ('media_storage_policies.audit', 'Ensures actions related to media storage policies can be audited without storing secrets.', '{"audit_required":true,"idempotent":true}'::jsonb)
on conflict (key) do update set description = excluded.description, payload = excluded.payload, updated_at = now();

create index if not exists idx_migration_203_media_storage_policies_enabled on public.migration_203_media_storage_policies (enabled, created_at desc);
comment on table public.migration_203_media_storage_policies is 'Learnzur migration 203: media storage policies. Uses Supabase PostgreSQL as the shared source of truth.';
