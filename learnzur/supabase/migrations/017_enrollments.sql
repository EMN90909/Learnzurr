create table if not exists public.enrollments (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), class_id uuid, learner_id uuid, parent_id uuid, status learnzur_status not null default 'pending');
alter table public.enrollments enable row level security;
drop policy if exists enrollments_admin_all on public.enrollments;
create policy enrollments_admin_all on public.enrollments for all using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
drop trigger if exists trg_enrollments_updated_at on public.enrollments;
create trigger trg_enrollments_updated_at before update on public.enrollments for each row execute function public.learnzur_touch_updated_at();
