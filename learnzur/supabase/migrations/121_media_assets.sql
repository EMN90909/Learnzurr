create table if not exists public.media_assets (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), owner_id uuid, title text, source_url text, output_url text, status learnzur_status not null default 'pending', payload jsonb not null default '{}'::jsonb);
alter table public.media_assets enable row level security;
drop policy if exists media_assets_admin_all on public.media_assets;
create policy media_assets_admin_all on public.media_assets for all using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
drop trigger if exists trg_media_assets_updated_at on public.media_assets;
create trigger trg_media_assets_updated_at before update on public.media_assets for each row execute function public.learnzur_touch_updated_at();
