alter table public.teacher_profiles
  add column if not exists account_type text not null default 'teacher' check (account_type in ('teacher','organization')),
  add column if not exists organization_name text,
  add column if not exists organization_type text,
  add column if not exists registration_number text;

create index if not exists idx_teacher_profiles_account_type on public.teacher_profiles(account_type);
create index if not exists idx_teacher_profiles_organization_name_trgm on public.teacher_profiles using gin (organization_name gin_trgm_ops);

create table if not exists public.organization_invites (
  id uuid primary key default gen_random_uuid(),
  organization_profile_id uuid not null references public.teacher_profiles(user_id) on delete cascade,
  invited_email citext not null,
  invited_role text not null default 'teacher' check (invited_role in ('teacher','admin','finance','content_reviewer')),
  invite_token_hash text not null,
  status review_status not null default 'pending_review',
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.organization_invites enable row level security;
create index if not exists idx_organization_invites_org_status on public.organization_invites(organization_profile_id, status);

create policy organization_invites_admin_read on public.organization_invites for select using (true);
create policy organization_invites_admin_insert on public.organization_invites for insert with check (true);
