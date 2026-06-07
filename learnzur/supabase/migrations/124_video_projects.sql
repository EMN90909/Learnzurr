create table if not exists public.video_projects (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), owner_id uuid, title text, source_url text, output_url text, status learnzur_status not null default 'pending', payload jsonb not null default '{}'::jsonb);
alter table public.video_projects enable row level security;
drop policy if exists video_projects_admin_all on public.video_projects;
create policy video_projects_admin_all on public.video_projects for all using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
drop trigger if exists trg_video_projects_updated_at on public.video_projects;
create trigger trg_video_projects_updated_at before update on public.video_projects for each row execute function public.learnzur_touch_updated_at();
