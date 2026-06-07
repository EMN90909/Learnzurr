create table if not exists public.classes (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), teacher_id uuid, title text not null, subject text, min_age int, max_age int, price_cents int not null default 0, status learnzur_status not null default 'draft');
alter table public.classes enable row level security;
drop policy if exists classes_admin_all on public.classes;
create policy classes_admin_all on public.classes for all using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
drop trigger if exists trg_classes_updated_at on public.classes;
create trigger trg_classes_updated_at before update on public.classes for each row execute function public.learnzur_touch_updated_at();
