create table if not exists public.storage_usage (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), owner_id uuid, title text, source_url text, output_url text, status learnzur_status not null default 'pending', payload jsonb not null default '{}'::jsonb);
alter table public.storage_usage enable row level security;
drop policy if exists storage_usage_admin_all on public.storage_usage;
create policy storage_usage_admin_all on public.storage_usage for all using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
drop trigger if exists trg_storage_usage_updated_at on public.storage_usage;
create trigger trg_storage_usage_updated_at before update on public.storage_usage for each row execute function public.learnzur_touch_updated_at();
