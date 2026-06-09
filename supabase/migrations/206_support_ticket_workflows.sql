-- 206_support_ticket_workflows.sql
-- Operational Supabase migration for Learnzur. This file is intentionally small and composable so hosted Supabase projects can apply migrations in order.

create table if not exists public.migration_206_support_ticket_workflows (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  description text not null,
  enabled boolean not null default true,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.migration_206_support_ticket_workflows (key, description, payload) values
  ('support_ticket_workflows.contract', 'Defines the support ticket workflows contract used by the Go API and worker.', '{"source":"supabase","owner":"learnzur","version":206}'::jsonb),
  ('support_ticket_workflows.audit', 'Ensures actions related to support ticket workflows can be audited without storing secrets.', '{"audit_required":true,"idempotent":true}'::jsonb)
on conflict (key) do update set description = excluded.description, payload = excluded.payload, updated_at = now();

create index if not exists idx_migration_206_support_ticket_workflows_enabled on public.migration_206_support_ticket_workflows (enabled, created_at desc);
comment on table public.migration_206_support_ticket_workflows is 'Learnzur migration 206: support ticket workflows. Uses Supabase PostgreSQL as the shared source of truth.';
