create table if not exists public.teacher_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  account_type text not null default 'teacher' check (account_type in ('teacher','organization')),
  organization_name text,
  organization_type text,
  registration_number text,
  county text not null,
  subjects text[] not null default '{}',
  age_groups age_group[] not null default '{}',
  certificate_url text,
  certificate_hash text,
  approval_status review_status not null default 'pending_review',
  mpesa_phone text,
  bio text,
  rating numeric(3,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.teacher_profiles enable row level security;
create index if not exists idx_teacher_profiles_subjects on public.teacher_profiles using gin(subjects);
