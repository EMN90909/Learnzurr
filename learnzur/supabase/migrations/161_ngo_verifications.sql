create table if not exists public.ngo_verifications (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), owner_id uuid, title text, starts_at timestamptz, ends_at timestamptz, status learnzur_status not null default 'pending', payload jsonb not null default '{}'::jsonb);
alter table public.ngo_verifications enable row level security;
drop policy if exists ngo_verifications_admin_all on public.ngo_verifications;
create policy ngo_verifications_admin_all on public.ngo_verifications for all using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
drop trigger if exists trg_ngo_verifications_updated_at on public.ngo_verifications;
create trigger trg_ngo_verifications_updated_at before update on public.ngo_verifications for each row execute function public.learnzur_touch_updated_at();
