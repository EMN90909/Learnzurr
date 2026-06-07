create table if not exists public.media_exports (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), owner_id uuid, title text, source_url text, output_url text, status learnzur_status not null default 'pending', payload jsonb not null default '{}'::jsonb);
alter table public.media_exports enable row level security;
drop policy if exists media_exports_admin_all on public.media_exports;
create policy media_exports_admin_all on public.media_exports for all using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
drop trigger if exists trg_media_exports_updated_at on public.media_exports;
create trigger trg_media_exports_updated_at before update on public.media_exports for each row execute function public.learnzur_touch_updated_at();
