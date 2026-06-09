-- 191_api_contract_views.sql
-- Operational Supabase migration for Learnzur. This file is intentionally small and composable so hosted Supabase projects can apply migrations in order.

create table if not exists public.migration_191_api_contract_views (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  description text not null,
  enabled boolean not null default true,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.migration_191_api_contract_views (key, description, payload) values
  ('api_contract_views.contract', 'Defines the api contract views contract used by the Go API and worker.', '{"source":"supabase","owner":"learnzur","version":191}'::jsonb),
  ('api_contract_views.audit', 'Ensures actions related to api contract views can be audited without storing secrets.', '{"audit_required":true,"idempotent":true}'::jsonb)
on conflict (key) do update set description = excluded.description, payload = excluded.payload, updated_at = now();

create index if not exists idx_migration_191_api_contract_views_enabled on public.migration_191_api_contract_views (enabled, created_at desc);
comment on table public.migration_191_api_contract_views is 'Learnzur migration 191: api contract views. Uses Supabase PostgreSQL as the shared source of truth.';
