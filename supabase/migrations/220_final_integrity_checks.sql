-- 220_final_integrity_checks.sql
-- Operational Supabase migration for Learnzur. This file is intentionally small and composable so hosted Supabase projects can apply migrations in order.

create table if not exists public.migration_220_final_integrity_checks (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  description text not null,
  enabled boolean not null default true,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.migration_220_final_integrity_checks (key, description, payload) values
  ('final_integrity_checks.contract', 'Defines the final integrity checks contract used by the Go API and worker.', '{"source":"supabase","owner":"learnzur","version":220}'::jsonb),
  ('final_integrity_checks.audit', 'Ensures actions related to final integrity checks can be audited without storing secrets.', '{"audit_required":true,"idempotent":true}'::jsonb)
on conflict (key) do update set description = excluded.description, payload = excluded.payload, updated_at = now();

create index if not exists idx_migration_220_final_integrity_checks_enabled on public.migration_220_final_integrity_checks (enabled, created_at desc);
comment on table public.migration_220_final_integrity_checks is 'Learnzur migration 220: final integrity checks. Uses Supabase PostgreSQL as the shared source of truth.';
