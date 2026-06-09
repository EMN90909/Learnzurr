-- 205_audit_retention_views.sql
-- Operational Supabase migration for Learnzur. This file is intentionally small and composable so hosted Supabase projects can apply migrations in order.

create table if not exists public.migration_205_audit_retention_views (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  description text not null,
  enabled boolean not null default true,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.migration_205_audit_retention_views (key, description, payload) values
  ('audit_retention_views.contract', 'Defines the audit retention views contract used by the Go API and worker.', '{"source":"supabase","owner":"learnzur","version":205}'::jsonb),
  ('audit_retention_views.audit', 'Ensures actions related to audit retention views can be audited without storing secrets.', '{"audit_required":true,"idempotent":true}'::jsonb)
on conflict (key) do update set description = excluded.description, payload = excluded.payload, updated_at = now();

create index if not exists idx_migration_205_audit_retention_views_enabled on public.migration_205_audit_retention_views (enabled, created_at desc);
comment on table public.migration_205_audit_retention_views is 'Learnzur migration 205: audit retention views. Uses Supabase PostgreSQL as the shared source of truth.';
