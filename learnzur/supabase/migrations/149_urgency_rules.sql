create table if not exists public.urgency_rules (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), user_id uuid, title text, body text, urgency text not null default 'normal', status learnzur_status not null default 'pending', payload jsonb not null default '{}'::jsonb);
alter table public.urgency_rules enable row level security;
drop policy if exists urgency_rules_admin_all on public.urgency_rules;
create policy urgency_rules_admin_all on public.urgency_rules for all using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
drop trigger if exists trg_urgency_rules_updated_at on public.urgency_rules;
create trigger trg_urgency_rules_updated_at before update on public.urgency_rules for each row execute function public.learnzur_touch_updated_at();
