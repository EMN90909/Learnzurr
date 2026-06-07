alter table public.user_profiles
  add column if not exists is_banned boolean default false,
  add column if not exists ban_reason text,
  add column if not exists banned_until timestamptz,
  add column if not exists ban_count integer default 0,
  add column if not exists account_flagged boolean default false;

create table if not exists public.policy_review_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  source_type text not null,
  source_id text,
  content_excerpt text,
  severity text not null default 'ALLOW',
  action text not null default 'allow',
  reason text,
  status text not null default 'pending',
  reviewer_id uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.policy_violations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  admin_user_id uuid references auth.users(id) on delete set null,
  violation_type text not null default 'policy_review',
  reason text not null,
  action_taken text not null default 'system_restriction',
  duration_days integer,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  resolved_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.policy_review_queue enable row level security;
alter table public.policy_violations enable row level security;

create index if not exists idx_policy_review_queue_user_status on public.policy_review_queue(user_id, status, created_at desc);
create index if not exists idx_policy_violations_user_active on public.policy_violations(user_id, resolved_at, created_at desc);

drop policy if exists "Admins manage policy review queue" on public.policy_review_queue;
create policy "Admins manage policy review queue"
  on public.policy_review_queue
  for all
  using (exists (select 1 from public.admin_emails ae where lower(ae.email) = lower(auth.jwt() ->> 'email')))
  with check (exists (select 1 from public.admin_emails ae where lower(ae.email) = lower(auth.jwt() ->> 'email')));

drop policy if exists "Admins manage policy violations" on public.policy_violations;
create policy "Admins manage policy violations"
  on public.policy_violations
  for all
  using (exists (select 1 from public.admin_emails ae where lower(ae.email) = lower(auth.jwt() ->> 'email')))
  with check (exists (select 1 from public.admin_emails ae where lower(ae.email) = lower(auth.jwt() ->> 'email')));
