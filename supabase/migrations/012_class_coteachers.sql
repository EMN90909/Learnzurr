create table if not exists public.class_coteachers (class_id uuid references public.classes(id) on delete cascade, teacher_id uuid references public.users(id) on delete cascade, permissions jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), primary key(class_id, teacher_id));
alter table public.class_coteachers enable row level security;
