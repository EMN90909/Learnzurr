create table if not exists public.render_jobs (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), owner_id uuid, title text, source_url text, output_url text, status learnzur_status not null default 'pending', payload jsonb not null default '{}'::jsonb);
alter table public.render_jobs enable row level security;
drop policy if exists render_jobs_admin_all on public.render_jobs;
create policy render_jobs_admin_all on public.render_jobs for all using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
drop trigger if exists trg_render_jobs_updated_at on public.render_jobs;
create trigger trg_render_jobs_updated_at before update on public.render_jobs for each row execute function public.learnzur_touch_updated_at();
