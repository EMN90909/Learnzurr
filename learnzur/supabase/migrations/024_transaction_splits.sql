create table if not exists public.transaction_splits (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), owner_id uuid, amount_cents bigint not null default 0, currency text not null default 'KES', status learnzur_status not null default 'pending', metadata jsonb not null default '{}'::jsonb);
alter table public.transaction_splits enable row level security;
drop policy if exists transaction_splits_admin_all on public.transaction_splits;
create policy transaction_splits_admin_all on public.transaction_splits for all using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
drop trigger if exists trg_transaction_splits_updated_at on public.transaction_splits;
create trigger trg_transaction_splits_updated_at before update on public.transaction_splits for each row execute function public.learnzur_touch_updated_at();
