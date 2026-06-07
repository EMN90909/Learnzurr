create table if not exists public.reconciliation_runs (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), owner_id uuid, amount_cents bigint not null default 0, currency text not null default 'KES', status learnzur_status not null default 'pending', metadata jsonb not null default '{}'::jsonb);
alter table public.reconciliation_runs enable row level security;
drop policy if exists reconciliation_runs_admin_all on public.reconciliation_runs;
create policy reconciliation_runs_admin_all on public.reconciliation_runs for all using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
drop trigger if exists trg_reconciliation_runs_updated_at on public.reconciliation_runs;
create trigger trg_reconciliation_runs_updated_at before update on public.reconciliation_runs for each row execute function public.learnzur_touch_updated_at();
