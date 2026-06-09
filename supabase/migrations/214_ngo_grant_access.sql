-- 214_ngo_grant_access.sql
-- Operational Supabase migration for Learnzur. This file is intentionally small and composable so hosted Supabase projects can apply migrations in order.

create table if not exists public.migration_214_ngo_grant_access (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  description text not null,
  enabled boolean not null default true,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.migration_214_ngo_grant_access (key, description, payload) values
  ('ngo_grant_access.contract', 'Defines the ngo grant access contract used by the Go API and worker.', '{"source":"supabase","owner":"learnzur","version":214}'::jsonb),
  ('ngo_grant_access.audit', 'Ensures actions related to ngo grant access can be audited without storing secrets.', '{"audit_required":true,"idempotent":true}'::jsonb)
on conflict (key) do update set description = excluded.description, payload = excluded.payload, updated_at = now();

create index if not exists idx_migration_214_ngo_grant_access_enabled on public.migration_214_ngo_grant_access (enabled, created_at desc);
comment on table public.migration_214_ngo_grant_access is 'Learnzur migration 214: ngo grant access. Uses Supabase PostgreSQL as the shared source of truth.';
