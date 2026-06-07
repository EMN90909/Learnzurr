create table if not exists public.teachers (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), profile_id uuid references public.user_profiles(id), certificate_url text, approval_status learnzur_status not null default 'pending');
alter table public.teachers enable row level security;
drop policy if exists teachers_admin_all on public.teachers;
create policy teachers_admin_all on public.teachers for all using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
drop trigger if exists trg_teachers_updated_at on public.teachers;
create trigger trg_teachers_updated_at before update on public.teachers for each row execute function public.learnzur_touch_updated_at();
