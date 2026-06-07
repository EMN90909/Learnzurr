create table if not exists public.sandbox_queue (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), owner_id uuid, title text, language text, memory_mb int not null default 10, cpu_limit numeric not null default 0.05, payload jsonb not null default '{}'::jsonb);
alter table public.sandbox_queue enable row level security;
drop policy if exists sandbox_queue_admin_all on public.sandbox_queue;
create policy sandbox_queue_admin_all on public.sandbox_queue for all using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
drop trigger if exists trg_sandbox_queue_updated_at on public.sandbox_queue;
create trigger trg_sandbox_queue_updated_at before update on public.sandbox_queue for each row execute function public.learnzur_touch_updated_at();
