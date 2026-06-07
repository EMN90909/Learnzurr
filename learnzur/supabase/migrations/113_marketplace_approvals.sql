create table if not exists public.marketplace_approvals (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), seller_id uuid, buyer_id uuid, title text, price_cents int not null default 0, status learnzur_status not null default 'pending', payload jsonb not null default '{}'::jsonb);
alter table public.marketplace_approvals enable row level security;
drop policy if exists marketplace_approvals_admin_all on public.marketplace_approvals;
create policy marketplace_approvals_admin_all on public.marketplace_approvals for all using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
drop trigger if exists trg_marketplace_approvals_updated_at on public.marketplace_approvals;
create trigger trg_marketplace_approvals_updated_at before update on public.marketplace_approvals for each row execute function public.learnzur_touch_updated_at();
