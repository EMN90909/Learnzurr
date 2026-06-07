create table if not exists public.listing_assets (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), seller_id uuid, buyer_id uuid, title text, price_cents int not null default 0, status learnzur_status not null default 'pending', payload jsonb not null default '{}'::jsonb);
alter table public.listing_assets enable row level security;
drop policy if exists listing_assets_admin_all on public.listing_assets;
create policy listing_assets_admin_all on public.listing_assets for all using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
drop trigger if exists trg_listing_assets_updated_at on public.listing_assets;
create trigger trg_listing_assets_updated_at before update on public.listing_assets for each row execute function public.learnzur_touch_updated_at();
