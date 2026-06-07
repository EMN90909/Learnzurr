create table if not exists public.ledger_holds (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), owner_id uuid, amount_cents bigint not null default 0, currency text not null default 'KES', status learnzur_status not null default 'pending', metadata jsonb not null default '{}'::jsonb);
alter table public.ledger_holds enable row level security;
drop policy if exists ledger_holds_admin_all on public.ledger_holds;
create policy ledger_holds_admin_all on public.ledger_holds for all using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
drop trigger if exists trg_ledger_holds_updated_at on public.ledger_holds;
create trigger trg_ledger_holds_updated_at before update on public.ledger_holds for each row execute function public.learnzur_touch_updated_at();
