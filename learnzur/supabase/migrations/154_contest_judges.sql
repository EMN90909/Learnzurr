create table if not exists public.contest_judges (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), owner_id uuid, title text, starts_at timestamptz, ends_at timestamptz, status learnzur_status not null default 'pending', payload jsonb not null default '{}'::jsonb);
alter table public.contest_judges enable row level security;
drop policy if exists contest_judges_admin_all on public.contest_judges;
create policy contest_judges_admin_all on public.contest_judges for all using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
drop trigger if exists trg_contest_judges_updated_at on public.contest_judges;
create trigger trg_contest_judges_updated_at before update on public.contest_judges for each row execute function public.learnzur_touch_updated_at();
