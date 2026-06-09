-- 215_sponsor_reporting_views.sql
-- Operational Supabase migration for Learnzur. This file is intentionally small and composable so hosted Supabase projects can apply migrations in order.

create table if not exists public.migration_215_sponsor_reporting_views (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  description text not null,
  enabled boolean not null default true,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.migration_215_sponsor_reporting_views (key, description, payload) values
  ('sponsor_reporting_views.contract', 'Defines the sponsor reporting views contract used by the Go API and worker.', '{"source":"supabase","owner":"learnzur","version":215}'::jsonb),
  ('sponsor_reporting_views.audit', 'Ensures actions related to sponsor reporting views can be audited without storing secrets.', '{"audit_required":true,"idempotent":true}'::jsonb)
on conflict (key) do update set description = excluded.description, payload = excluded.payload, updated_at = now();

create index if not exists idx_migration_215_sponsor_reporting_views_enabled on public.migration_215_sponsor_reporting_views (enabled, created_at desc);
comment on table public.migration_215_sponsor_reporting_views is 'Learnzur migration 215: sponsor reporting views. Uses Supabase PostgreSQL as the shared source of truth.';
