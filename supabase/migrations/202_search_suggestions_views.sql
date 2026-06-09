-- 202_search_suggestions_views.sql
-- Operational Supabase migration for Learnzur. This file is intentionally small and composable so hosted Supabase projects can apply migrations in order.

create table if not exists public.migration_202_search_suggestions_views (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  description text not null,
  enabled boolean not null default true,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.migration_202_search_suggestions_views (key, description, payload) values
  ('search_suggestions_views.contract', 'Defines the search suggestions views contract used by the Go API and worker.', '{"source":"supabase","owner":"learnzur","version":202}'::jsonb),
  ('search_suggestions_views.audit', 'Ensures actions related to search suggestions views can be audited without storing secrets.', '{"audit_required":true,"idempotent":true}'::jsonb)
on conflict (key) do update set description = excluded.description, payload = excluded.payload, updated_at = now();

create index if not exists idx_migration_202_search_suggestions_views_enabled on public.migration_202_search_suggestions_views (enabled, created_at desc);
comment on table public.migration_202_search_suggestions_views is 'Learnzur migration 202: search suggestions views. Uses Supabase PostgreSQL as the shared source of truth.';
