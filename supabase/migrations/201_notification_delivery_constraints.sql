-- 201_notification_delivery_constraints.sql
-- Operational Supabase migration for Learnzur. This file is intentionally small and composable so hosted Supabase projects can apply migrations in order.

create table if not exists public.migration_201_notification_delivery_constraints (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  description text not null,
  enabled boolean not null default true,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.migration_201_notification_delivery_constraints (key, description, payload) values
  ('notification_delivery_constraints.contract', 'Defines the notification delivery constraints contract used by the Go API and worker.', '{"source":"supabase","owner":"learnzur","version":201}'::jsonb),
  ('notification_delivery_constraints.audit', 'Ensures actions related to notification delivery constraints can be audited without storing secrets.', '{"audit_required":true,"idempotent":true}'::jsonb)
on conflict (key) do update set description = excluded.description, payload = excluded.payload, updated_at = now();

create index if not exists idx_migration_201_notification_delivery_constraints_enabled on public.migration_201_notification_delivery_constraints (enabled, created_at desc);
comment on table public.migration_201_notification_delivery_constraints is 'Learnzur migration 201: notification delivery constraints. Uses Supabase PostgreSQL as the shared source of truth.';
