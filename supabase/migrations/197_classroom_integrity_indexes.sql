-- 197_classroom_integrity_indexes.sql
-- Operational Supabase migration for Learnzur. This file is intentionally small and composable so hosted Supabase projects can apply migrations in order.

create table if not exists public.migration_197_classroom_integrity_indexes (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  description text not null,
  enabled boolean not null default true,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.migration_197_classroom_integrity_indexes (key, description, payload) values
  ('classroom_integrity_indexes.contract', 'Defines the classroom integrity indexes contract used by the Go API and worker.', '{"source":"supabase","owner":"learnzur","version":197}'::jsonb),
  ('classroom_integrity_indexes.audit', 'Ensures actions related to classroom integrity indexes can be audited without storing secrets.', '{"audit_required":true,"idempotent":true}'::jsonb)
on conflict (key) do update set description = excluded.description, payload = excluded.payload, updated_at = now();

create index if not exists idx_migration_197_classroom_integrity_indexes_enabled on public.migration_197_classroom_integrity_indexes (enabled, created_at desc);
comment on table public.migration_197_classroom_integrity_indexes is 'Learnzur migration 197: classroom integrity indexes. Uses Supabase PostgreSQL as the shared source of truth.';
