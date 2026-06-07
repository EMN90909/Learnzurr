create table if not exists public.parents (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), profile_id uuid references public.user_profiles(id), mpesa_phone text);
alter table public.parents enable row level security;
drop policy if exists parents_admin_all on public.parents;
create policy parents_admin_all on public.parents for all using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
drop trigger if exists trg_parents_updated_at on public.parents;
create trigger trg_parents_updated_at before update on public.parents for each row execute function public.learnzur_touch_updated_at();
