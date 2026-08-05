create table if not exists public.teacher_invites (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references public.teacher_teams(id) on delete cascade,
  email text not null,
  revenue_share numeric(5,2) not null default 0 check (revenue_share between 0 and 100),
  invited_by uuid not null references public.profiles(id),
  invited_user_id uuid references public.profiles(id),
  status text not null default 'pending' check (status in ('pending','accepted','expired','revoked')),
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  unique(team_id,email)
);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.live_session_participants (
  session_id uuid references public.live_sessions(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role public.app_role not null,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  primary key(session_id,user_id)
);

create table if not exists public.live_session_messages (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.live_sessions(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null default 'chat' check(kind in ('chat','question','answer','whiteboard')),
  body jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists live_sessions_class_start_idx on public.live_sessions(class_id,starts_at);
create index if not exists teacher_invites_email_idx on public.teacher_invites(lower(email));
create index if not exists live_session_messages_session_idx on public.live_session_messages(session_id,created_at);

alter table public.teacher_teams enable row level security;
alter table public.team_members enable row level security;
alter table public.class_teachers enable row level security;
alter table public.teacher_invites enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.live_session_participants enable row level security;
alter table public.live_session_messages enable row level security;

create policy "team members read their team" on public.teacher_teams for select to authenticated
using(owner_id=auth.uid() or exists(select 1 from public.team_members tm where tm.team_id=id and tm.teacher_id=auth.uid()));
create policy "team owner manages team" on public.teacher_teams for all to authenticated
using(owner_id=auth.uid()) with check(owner_id=auth.uid());
create policy "team members read members" on public.team_members for select to authenticated
using(teacher_id=auth.uid() or exists(select 1 from public.teacher_teams t where t.id=team_id and t.owner_id=auth.uid()));
create policy "team owner manages members" on public.team_members for all to authenticated
using(exists(select 1 from public.teacher_teams t where t.id=team_id and t.owner_id=auth.uid()))
with check(exists(select 1 from public.teacher_teams t where t.id=team_id and t.owner_id=auth.uid()));
create policy "teachers manage class teachers" on public.class_teachers for all to authenticated
using(exists(select 1 from public.classes c where c.id=class_id and c.owner_teacher_id=auth.uid()))
with check(exists(select 1 from public.classes c where c.id=class_id and c.owner_teacher_id=auth.uid()));
create policy "invite owners read invites" on public.teacher_invites for select to authenticated
using(invited_by=auth.uid() or lower(email)=lower(coalesce(auth.jwt()->>'email','')));
create policy "push owner manages subscriptions" on public.push_subscriptions for all to authenticated
using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "session participants read" on public.live_session_participants for select to authenticated
using(user_id=auth.uid() or exists(select 1 from public.live_sessions ls where ls.id=session_id and ls.created_by=auth.uid()));
create policy "session participants write self" on public.live_session_participants for insert to authenticated
with check(user_id=auth.uid());
create policy "session messages read participants" on public.live_session_messages for select to authenticated
using(exists(select 1 from public.live_session_participants p where p.session_id=live_session_messages.session_id and p.user_id=auth.uid()));
create policy "session messages write participants" on public.live_session_messages for insert to authenticated
with check(author_id=auth.uid() and exists(select 1 from public.live_session_participants p where p.session_id=live_session_messages.session_id and p.user_id=auth.uid()));

create or replace function public.enforce_class_teacher_limit() returns trigger language plpgsql as $$
begin
  if (select count(*) from public.class_teachers where class_id=new.class_id) >= 2 then
    raise exception 'A class can have at most two teachers';
  end if;
  return new;
end; $$;
drop trigger if exists class_teacher_limit on public.class_teachers;
create trigger class_teacher_limit before insert on public.class_teachers for each row execute procedure public.enforce_class_teacher_limit();

create or replace function public.enforce_class_capacity() returns trigger language plpgsql as $$
declare max_capacity int;
begin
  select capacity into max_capacity from public.classes where id=new.class_id;
  if (select count(*) from public.student_enrollments where class_id=new.class_id and active) >= max_capacity then
    raise exception 'Class capacity reached';
  end if;
  return new;
end; $$;
drop trigger if exists class_capacity_limit on public.student_enrollments;
create trigger class_capacity_limit before insert on public.student_enrollments for each row execute procedure public.enforce_class_capacity();
