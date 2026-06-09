-- 210_performance_indexes.sql
-- Operational Supabase migration for Learnzur. This file is intentionally small and composable so hosted Supabase projects can apply migrations in order.

create table if not exists public.migration_210_performance_indexes (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  description text not null,
  enabled boolean not null default true,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.migration_210_performance_indexes (key, description, payload) values
  ('performance_indexes.contract', 'Defines the performance indexes contract used by the Go API and worker.', '{"source":"supabase","owner":"learnzur","version":210}'::jsonb),
  ('performance_indexes.audit', 'Ensures actions related to performance indexes can be audited without storing secrets.', '{"audit_required":true,"idempotent":true}'::jsonb)
on conflict (key) do update set description = excluded.description, payload = excluded.payload, updated_at = now();

create index if not exists idx_migration_210_performance_indexes_enabled on public.migration_210_performance_indexes (enabled, created_at desc);
comment on table public.migration_210_performance_indexes is 'Learnzur migration 210: performance indexes. Uses Supabase PostgreSQL as the shared source of truth.';
