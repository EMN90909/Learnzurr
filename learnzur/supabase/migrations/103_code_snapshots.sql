create table if not exists public.code_snapshots (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), owner_id uuid, title text, language text, memory_mb int not null default 10, cpu_limit numeric not null default 0.05, payload jsonb not null default '{}'::jsonb);
alter table public.code_snapshots enable row level security;
drop policy if exists code_snapshots_admin_all on public.code_snapshots;
create policy code_snapshots_admin_all on public.code_snapshots for all using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
drop trigger if exists trg_code_snapshots_updated_at on public.code_snapshots;
create trigger trg_code_snapshots_updated_at before update on public.code_snapshots for each row execute function public.learnzur_touch_updated_at();
