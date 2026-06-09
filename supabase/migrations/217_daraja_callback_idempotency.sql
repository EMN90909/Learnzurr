-- 217_daraja_callback_idempotency.sql
-- Operational Supabase migration for Learnzur. This file is intentionally small and composable so hosted Supabase projects can apply migrations in order.

create table if not exists public.migration_217_daraja_callback_idempotency (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  description text not null,
  enabled boolean not null default true,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.migration_217_daraja_callback_idempotency (key, description, payload) values
  ('daraja_callback_idempotency.contract', 'Defines the daraja callback idempotency contract used by the Go API and worker.', '{"source":"supabase","owner":"learnzur","version":217}'::jsonb),
  ('daraja_callback_idempotency.audit', 'Ensures actions related to daraja callback idempotency can be audited without storing secrets.', '{"audit_required":true,"idempotent":true}'::jsonb)
on conflict (key) do update set description = excluded.description, payload = excluded.payload, updated_at = now();

create index if not exists idx_migration_217_daraja_callback_idempotency_enabled on public.migration_217_daraja_callback_idempotency (enabled, created_at desc);
comment on table public.migration_217_daraja_callback_idempotency is 'Learnzur migration 217: daraja callback idempotency. Uses Supabase PostgreSQL as the shared source of truth.';
