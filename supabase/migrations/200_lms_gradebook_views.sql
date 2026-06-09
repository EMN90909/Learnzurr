-- 200_lms_gradebook_views.sql
-- Operational Supabase migration for Learnzur. This file is intentionally small and composable so hosted Supabase projects can apply migrations in order.

create table if not exists public.migration_200_lms_gradebook_views (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  description text not null,
  enabled boolean not null default true,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.migration_200_lms_gradebook_views (key, description, payload) values
  ('lms_gradebook_views.contract', 'Defines the lms gradebook views contract used by the Go API and worker.', '{"source":"supabase","owner":"learnzur","version":200}'::jsonb),
  ('lms_gradebook_views.audit', 'Ensures actions related to lms gradebook views can be audited without storing secrets.', '{"audit_required":true,"idempotent":true}'::jsonb)
on conflict (key) do update set description = excluded.description, payload = excluded.payload, updated_at = now();

create index if not exists idx_migration_200_lms_gradebook_views_enabled on public.migration_200_lms_gradebook_views (enabled, created_at desc);
comment on table public.migration_200_lms_gradebook_views is 'Learnzur migration 200: lms gradebook views. Uses Supabase PostgreSQL as the shared source of truth.';
