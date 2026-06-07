create table if not exists public.listing_moderation (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), seller_id uuid, buyer_id uuid, title text, price_cents int not null default 0, status learnzur_status not null default 'pending', payload jsonb not null default '{}'::jsonb);
alter table public.listing_moderation enable row level security;
drop policy if exists listing_moderation_admin_all on public.listing_moderation;
create policy listing_moderation_admin_all on public.listing_moderation for all using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
drop trigger if exists trg_listing_moderation_updated_at on public.listing_moderation;
create trigger trg_listing_moderation_updated_at before update on public.listing_moderation for each row execute function public.learnzur_touch_updated_at();
