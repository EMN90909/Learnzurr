create table if not exists public.class_coteachers (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), class_id uuid, teacher_id uuid);
alter table public.class_coteachers enable row level security;
drop policy if exists class_coteachers_admin_all on public.class_coteachers;
create policy class_coteachers_admin_all on public.class_coteachers for all using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
drop trigger if exists trg_class_coteachers_updated_at on public.class_coteachers;
create trigger trg_class_coteachers_updated_at before update on public.class_coteachers for each row execute function public.learnzur_touch_updated_at();
