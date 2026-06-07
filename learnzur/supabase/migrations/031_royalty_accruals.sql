create table if not exists public.royalty_accruals (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), owner_id uuid, amount_cents bigint not null default 0, currency text not null default 'KES', status learnzur_status not null default 'pending', metadata jsonb not null default '{}'::jsonb);
alter table public.royalty_accruals enable row level security;
drop policy if exists royalty_accruals_admin_all on public.royalty_accruals;
create policy royalty_accruals_admin_all on public.royalty_accruals for all using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
drop trigger if exists trg_royalty_accruals_updated_at on public.royalty_accruals;
create trigger trg_royalty_accruals_updated_at before update on public.royalty_accruals for each row execute function public.learnzur_touch_updated_at();
