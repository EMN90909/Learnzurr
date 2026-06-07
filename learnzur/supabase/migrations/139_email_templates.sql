create table if not exists public.email_templates (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), user_id uuid, title text, body text, urgency text not null default 'normal', status learnzur_status not null default 'pending', payload jsonb not null default '{}'::jsonb);
alter table public.email_templates enable row level security;
drop policy if exists email_templates_admin_all on public.email_templates;
create policy email_templates_admin_all on public.email_templates for all using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
drop trigger if exists trg_email_templates_updated_at on public.email_templates;
create trigger trg_email_templates_updated_at before update on public.email_templates for each row execute function public.learnzur_touch_updated_at();
