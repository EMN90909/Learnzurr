create table if not exists public.ad_impressions (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), seller_id uuid, buyer_id uuid, title text, price_cents int not null default 0, status learnzur_status not null default 'pending', payload jsonb not null default '{}'::jsonb);
alter table public.ad_impressions enable row level security;
drop policy if exists ad_impressions_admin_all on public.ad_impressions;
create policy ad_impressions_admin_all on public.ad_impressions for all using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
drop trigger if exists trg_ad_impressions_updated_at on public.ad_impressions;
create trigger trg_ad_impressions_updated_at before update on public.ad_impressions for each row execute function public.learnzur_touch_updated_at();
