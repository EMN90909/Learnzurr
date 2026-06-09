-- 193_role_dashboard_views.sql
-- Operational Supabase migration for Learnzur. This file is intentionally small and composable so hosted Supabase projects can apply migrations in order.

create table if not exists public.migration_193_role_dashboard_views (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  description text not null,
  enabled boolean not null default true,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.migration_193_role_dashboard_views (key, description, payload) values
  ('role_dashboard_views.contract', 'Defines the role dashboard views contract used by the Go API and worker.', '{"source":"supabase","owner":"learnzur","version":193}'::jsonb),
  ('role_dashboard_views.audit', 'Ensures actions related to role dashboard views can be audited without storing secrets.', '{"audit_required":true,"idempotent":true}'::jsonb)
on conflict (key) do update set description = excluded.description, payload = excluded.payload, updated_at = now();

create index if not exists idx_migration_193_role_dashboard_views_enabled on public.migration_193_role_dashboard_views (enabled, created_at desc);
comment on table public.migration_193_role_dashboard_views is 'Learnzur migration 193: role dashboard views. Uses Supabase PostgreSQL as the shared source of truth.';
