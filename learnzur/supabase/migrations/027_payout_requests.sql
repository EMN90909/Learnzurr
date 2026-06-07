create table if not exists public.payout_requests (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), owner_id uuid, amount_cents bigint not null default 0, currency text not null default 'KES', status learnzur_status not null default 'pending', metadata jsonb not null default '{}'::jsonb);
alter table public.payout_requests enable row level security;
drop policy if exists payout_requests_admin_all on public.payout_requests;
create policy payout_requests_admin_all on public.payout_requests for all using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
drop trigger if exists trg_payout_requests_updated_at on public.payout_requests;
create trigger trg_payout_requests_updated_at before update on public.payout_requests for each row execute function public.learnzur_touch_updated_at();
