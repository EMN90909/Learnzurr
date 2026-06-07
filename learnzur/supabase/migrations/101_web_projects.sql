create table if not exists public.web_projects (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), owner_id uuid, title text, language text, memory_mb int not null default 10, cpu_limit numeric not null default 0.05, payload jsonb not null default '{}'::jsonb);
alter table public.web_projects enable row level security;
drop policy if exists web_projects_admin_all on public.web_projects;
create policy web_projects_admin_all on public.web_projects for all using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
drop trigger if exists trg_web_projects_updated_at on public.web_projects;
create trigger trg_web_projects_updated_at before update on public.web_projects for each row execute function public.learnzur_touch_updated_at();
