create table if not exists public.learners (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), profile_id uuid references public.user_profiles(id), parent_id uuid, username text not null unique, dob date, pin_hash text not null);
alter table public.learners enable row level security;
drop policy if exists learners_admin_all on public.learners;
create policy learners_admin_all on public.learners for all using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
drop trigger if exists trg_learners_updated_at on public.learners;
create trigger trg_learners_updated_at before update on public.learners for each row execute function public.learnzur_touch_updated_at();
