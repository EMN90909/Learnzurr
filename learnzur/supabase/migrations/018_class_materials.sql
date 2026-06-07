create table if not exists public.class_materials (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), class_id uuid, title text not null, url text, metadata jsonb not null default '{}'::jsonb);
alter table public.class_materials enable row level security;
drop policy if exists class_materials_admin_all on public.class_materials;
create policy class_materials_admin_all on public.class_materials for all using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
drop trigger if exists trg_class_materials_updated_at on public.class_materials;
create trigger trg_class_materials_updated_at before update on public.class_materials for each row execute function public.learnzur_touch_updated_at();
