create table if not exists public.purchase_items (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), seller_id uuid, buyer_id uuid, title text, price_cents int not null default 0, status learnzur_status not null default 'pending', payload jsonb not null default '{}'::jsonb);
alter table public.purchase_items enable row level security;
drop policy if exists purchase_items_admin_all on public.purchase_items;
create policy purchase_items_admin_all on public.purchase_items for all using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
drop trigger if exists trg_purchase_items_updated_at on public.purchase_items;
create trigger trg_purchase_items_updated_at before update on public.purchase_items for each row execute function public.learnzur_touch_updated_at();
