-- 196_teacher_verification_functions.sql
-- Operational Supabase migration for Learnzur. This file is intentionally small and composable so hosted Supabase projects can apply migrations in order.

create table if not exists public.migration_196_teacher_verification_functions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  description text not null,
  enabled boolean not null default true,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.migration_196_teacher_verification_functions (key, description, payload) values
  ('teacher_verification_functions.contract', 'Defines the teacher verification functions contract used by the Go API and worker.', '{"source":"supabase","owner":"learnzur","version":196}'::jsonb),
  ('teacher_verification_functions.audit', 'Ensures actions related to teacher verification functions can be audited without storing secrets.', '{"audit_required":true,"idempotent":true}'::jsonb)
on conflict (key) do update set description = excluded.description, payload = excluded.payload, updated_at = now();

create index if not exists idx_migration_196_teacher_verification_functions_enabled on public.migration_196_teacher_verification_functions (enabled, created_at desc);
comment on table public.migration_196_teacher_verification_functions is 'Learnzur migration 196: teacher verification functions. Uses Supabase PostgreSQL as the shared source of truth.';
