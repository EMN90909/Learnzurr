create table if not exists public.user_profiles (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), auth_user_id uuid unique, role learnzur_role not null, email text, phone text, full_name text not null default '', county text, active boolean not null default true, metadata jsonb not null default '{}'::jsonb);
alter table public.user_profiles enable row level security;
drop policy if exists user_profiles_self_read on public.user_profiles;
create policy user_profiles_self_read on public.user_profiles for select using (id = auth.uid() or auth_user_id = auth.uid());
