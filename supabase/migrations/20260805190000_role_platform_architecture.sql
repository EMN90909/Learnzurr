create type public.app_role as enum ('teacher','learner','guardian','admin');
create type public.session_status as enum ('scheduled','live','ended','cancelled');
create type public.payment_status as enum ('pending','paid','failed','refunded');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'learner',
  full_name text not null default '',
  phone text,
  avatar_url text,
  last_login_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.teacher_teams (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id), name text not null,
  created_at timestamptz not null default now()
);
create table public.team_members (
  team_id uuid references public.teacher_teams(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  revenue_share numeric(5,2) not null default 0 check (revenue_share between 0 and 100),
  invited_by uuid references public.profiles(id), last_report_at timestamptz,
  primary key(team_id,teacher_id)
);
create table public.classes (
  id uuid primary key default gen_random_uuid(), team_id uuid references public.teacher_teams(id), owner_teacher_id uuid not null references public.profiles(id),
  title text not null, description text not null default '', capacity int not null default 50 check(capacity between 1 and 50), created_at timestamptz not null default now()
);
create table public.class_teachers (
  class_id uuid references public.classes(id) on delete cascade, teacher_id uuid references public.profiles(id) on delete cascade,
  primary key(class_id,teacher_id)
);
create table public.student_enrollments (
  class_id uuid references public.classes(id) on delete cascade, student_id uuid references public.profiles(id) on delete cascade,
  enrolled_at timestamptz not null default now(), active boolean not null default true, primary key(class_id,student_id)
);
create table public.guardian_students (
  guardian_id uuid references public.profiles(id) on delete cascade, student_id uuid references public.profiles(id) on delete cascade,
  relationship text default 'guardian', primary key(guardian_id,student_id)
);
create table public.lessons (
  id uuid primary key default gen_random_uuid(), class_id uuid not null references public.classes(id) on delete cascade,
  title text not null, video_url text, metadata jsonb not null default '{}', published_at timestamptz
);
create table public.live_sessions (
  id uuid primary key default gen_random_uuid(), class_id uuid not null references public.classes(id) on delete cascade,
  name text not null, starts_at timestamptz not null, ends_at timestamptz not null, status public.session_status not null default 'scheduled',
  join_token_hash text not null, signaling_room text not null unique, created_by uuid not null references public.profiles(id), created_at timestamptz not null default now(),
  check(ends_at > starts_at)
);
create table public.assignments (
  id uuid primary key default gen_random_uuid(), class_id uuid not null references public.classes(id) on delete cascade,
  author_id uuid not null references public.profiles(id), title text not null, body jsonb not null default '{}', kind text not null default 'task', due_at timestamptz
);
create table public.qa_threads (
  id uuid primary key default gen_random_uuid(), class_id uuid not null references public.classes(id) on delete cascade,
  author_id uuid not null references public.profiles(id), question text not null, teacher_response text, answered_by uuid references public.profiles(id), created_at timestamptz not null default now()
);
create table public.progress (
  student_id uuid references public.profiles(id) on delete cascade, class_id uuid references public.classes(id) on delete cascade,
  completion_percent numeric(5,2) not null default 0 check(completion_percent between 0 and 100), quiz_average numeric(5,2), updated_at timestamptz not null default now(),
  primary key(student_id,class_id)
);
create table public.payments (
  id uuid primary key default gen_random_uuid(), payer_id uuid references public.profiles(id), student_id uuid references public.profiles(id), class_id uuid references public.classes(id),
  paystack_reference text not null unique, amount_kes numeric(12,2) not null, status public.payment_status not null default 'pending', paid_at timestamptz, metadata jsonb not null default '{}'
);
create table public.payment_splits (
  payment_id uuid references public.payments(id) on delete cascade, teacher_id uuid references public.profiles(id), percentage numeric(5,2) not null, amount_kes numeric(12,2) not null,
  primary key(payment_id,teacher_id)
);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into public.profiles(id,role,full_name,phone) values(new.id,coalesce((new.raw_user_meta_data->>'role')::public.app_role,'learner'),coalesce(new.raw_user_meta_data->>'full_name',''),new.raw_user_meta_data->>'phone'); return new; end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.student_enrollments enable row level security;
alter table public.live_sessions enable row level security;
alter table public.lessons enable row level security;
alter table public.assignments enable row level security;
alter table public.qa_threads enable row level security;
alter table public.progress enable row level security;
alter table public.payments enable row level security;
create policy "profile self read" on public.profiles for select using (id=auth.uid());
create policy "authenticated classes read" on public.classes for select to authenticated using (true);
create policy "teacher manages own classes" on public.classes for all to authenticated using(owner_teacher_id=auth.uid()) with check(owner_teacher_id=auth.uid());
create policy "enrollment participants read" on public.student_enrollments for select to authenticated using(student_id=auth.uid() or exists(select 1 from public.classes c where c.id=class_id and c.owner_teacher_id=auth.uid()));
create policy "authenticated lessons read" on public.lessons for select to authenticated using(true);
create policy "authenticated sessions read" on public.live_sessions for select to authenticated using(true);
create policy "authenticated assignments read" on public.assignments for select to authenticated using(true);
create policy "participants qa" on public.qa_threads for all to authenticated using(author_id=auth.uid() or exists(select 1 from public.classes c where c.id=class_id and c.owner_teacher_id=auth.uid())) with check(author_id=auth.uid() or exists(select 1 from public.classes c where c.id=class_id and c.owner_teacher_id=auth.uid()));
create policy "student progress read" on public.progress for select to authenticated using(student_id=auth.uid());
create policy "payer payment read" on public.payments for select to authenticated using(payer_id=auth.uid() or student_id=auth.uid());
