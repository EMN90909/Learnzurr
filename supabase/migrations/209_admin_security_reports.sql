-- 209_admin_security_reports.sql
-- Operational Supabase migration for Learnzur. This file is intentionally small and composable so hosted Supabase projects can apply migrations in order.

create table if not exists public.migration_209_admin_security_reports (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  description text not null,
  enabled boolean not null default true,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.migration_209_admin_security_reports (key, description, payload) values
  ('admin_security_reports.contract', 'Defines the admin security reports contract used by the Go API and worker.', '{"source":"supabase","owner":"learnzur","version":209}'::jsonb),
  ('admin_security_reports.audit', 'Ensures actions related to admin security reports can be audited without storing secrets.', '{"audit_required":true,"idempotent":true}'::jsonb)
on conflict (key) do update set description = excluded.description, payload = excluded.payload, updated_at = now();

create index if not exists idx_migration_209_admin_security_reports_enabled on public.migration_209_admin_security_reports (enabled, created_at desc);
comment on table public.migration_209_admin_security_reports is 'Learnzur migration 209: admin security reports. Uses Supabase PostgreSQL as the shared source of truth.';
