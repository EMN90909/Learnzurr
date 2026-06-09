-- 207_certificate_review_queue.sql
-- Operational Supabase migration for Learnzur. This file is intentionally small and composable so hosted Supabase projects can apply migrations in order.

create table if not exists public.migration_207_certificate_review_queue (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  description text not null,
  enabled boolean not null default true,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.migration_207_certificate_review_queue (key, description, payload) values
  ('certificate_review_queue.contract', 'Defines the certificate review queue contract used by the Go API and worker.', '{"source":"supabase","owner":"learnzur","version":207}'::jsonb),
  ('certificate_review_queue.audit', 'Ensures actions related to certificate review queue can be audited without storing secrets.', '{"audit_required":true,"idempotent":true}'::jsonb)
on conflict (key) do update set description = excluded.description, payload = excluded.payload, updated_at = now();

create index if not exists idx_migration_207_certificate_review_queue_enabled on public.migration_207_certificate_review_queue (enabled, created_at desc);
comment on table public.migration_207_certificate_review_queue is 'Learnzur migration 207: certificate review queue. Uses Supabase PostgreSQL as the shared source of truth.';
