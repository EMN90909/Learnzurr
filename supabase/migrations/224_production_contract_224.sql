-- 224_production_contract_224.sql
-- Production contract migration for Learnzur using Supabase PostgreSQL.

create table if not exists public.production_contract_224 (
  id uuid primary key default gen_random_uuid(),
  role user_role not null default 'parent',
  workflow text not null,
  api_path text not null check (api_path like '/api/%'),
  required_tables text[] not null default '{}',
  redis_stream text not null default 'learnzur.default.stream',
  audit_table text not null default 'audit_logs',
  risk_level integer not null default 10 check (risk_level between 0 and 100),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.production_contract_224 (role, workflow, api_path, required_tables, redis_stream, audit_table, risk_level) values
  ('parent','enroll_child','/api/mearn/payment', array['transactions','enrollments','mpesa_pending'], 'learnzur.mearn.stream','mearn_audit', 85),
  ('teacher','publish_learning_content','/api/lms/quizzes', array['quizzes','quiz_questions','lms_audit'], 'learnzur.lms.stream','lms_audit', 45),
  ('learner','submit_task','/api/lms/submissions', array['assignment_submissions','progress_snapshots'], 'learnzur.gamfy.stream','lms_audit', 35),
  ('admin','review_safety_case','/api/flag/appeals', array['flag_records','flag_appeals','user_strikes'], 'learnzur.flag.stream','audit_logs', 95)
on conflict do nothing;

create index if not exists idx_production_contract_224_role_active on public.production_contract_224(role, active, risk_level desc);
comment on table public.production_contract_224 is 'Supabase workflow contract table used to validate Learnzur API, Redis Stream and audit wiring.';
