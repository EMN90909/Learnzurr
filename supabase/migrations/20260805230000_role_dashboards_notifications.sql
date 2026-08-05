alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists updated_at timestamptz not null default now();
update public.profiles p set email = u.email from auth.users u where u.id = p.id and p.email is null;
create unique index if not exists profiles_email_unique_idx on public.profiles(lower(email)) where email is not null;

alter table public.payments add column if not exists created_at timestamptz not null default now();
alter table public.payment_splits add column if not exists created_at timestamptz not null default now();
alter table public.push_subscriptions add column if not exists updated_at timestamptz not null default now();
alter table public.push_subscriptions add column if not exists user_agent text;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null default '',
  kind text not null default 'general',
  action_url text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_created_idx on public.notifications(user_id,created_at desc);
alter table public.notifications enable row level security;

create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

grant execute on function public.current_app_role() to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles(id,role,full_name,phone,email)
  values(
    new.id,
    coalesce((new.raw_user_meta_data->>'role')::public.app_role,'learner'),
    coalesce(new.raw_user_meta_data->>'full_name',''),
    new.raw_user_meta_data->>'phone',
    new.email
  )
  on conflict(id) do update set
    role=excluded.role,
    full_name=excluded.full_name,
    phone=coalesce(excluded.phone,public.profiles.phone),
    email=excluded.email,
    updated_at=now();
  return new;
end;
$$;

create or replace function public.enforce_team_revenue_share_limit()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  allocated numeric(7,2) := 0;
begin
  if tg_table_name = 'team_members' then
    select coalesce(sum(revenue_share),0) into allocated
    from public.team_members
    where team_id = new.team_id
      and teacher_id <> new.teacher_id;

    select allocated + coalesce(sum(revenue_share),0) into allocated
    from public.teacher_invites
    where team_id = new.team_id
      and status = 'pending'
      and invited_user_id is distinct from new.teacher_id;
  else
    if new.status <> 'pending' then
      return new;
    end if;

    select coalesce(sum(revenue_share),0) into allocated
    from public.team_members
    where team_id = new.team_id;

    select allocated + coalesce(sum(revenue_share),0) into allocated
    from public.teacher_invites
    where team_id = new.team_id
      and status = 'pending'
      and id <> new.id;
  end if;

  if allocated + new.revenue_share > 100 then
    raise exception 'Teacher revenue shares cannot exceed 100 percent';
  end if;
  return new;
end;
$$;

drop trigger if exists team_member_revenue_share_limit on public.team_members;
create trigger team_member_revenue_share_limit
before insert or update of team_id,revenue_share on public.team_members
for each row execute procedure public.enforce_team_revenue_share_limit();

drop trigger if exists teacher_invite_revenue_share_limit on public.teacher_invites;
create trigger teacher_invite_revenue_share_limit
before insert or update of team_id,revenue_share,status on public.teacher_invites
for each row execute procedure public.enforce_team_revenue_share_limit();

create policy "profile owner update" on public.profiles for update to authenticated
using(id=auth.uid()) with check(id=auth.uid());
create policy "admins read profiles" on public.profiles for select to authenticated
using(public.current_app_role()='admin');
create policy "teachers read team and enrolled profiles" on public.profiles for select to authenticated
using(
  public.current_app_role()='teacher' and (
    exists(select 1 from public.team_members mine join public.team_members other on other.team_id=mine.team_id where mine.teacher_id=auth.uid() and other.teacher_id=profiles.id)
    or exists(select 1 from public.class_teachers ct join public.student_enrollments se on se.class_id=ct.class_id where ct.teacher_id=auth.uid() and se.student_id=profiles.id and se.active)
    or exists(select 1 from public.classes c join public.student_enrollments se on se.class_id=c.id where c.owner_teacher_id=auth.uid() and se.student_id=profiles.id and se.active)
  )
);
create policy "guardians read linked children" on public.profiles for select to authenticated
using(exists(select 1 from public.guardian_students gs where gs.guardian_id=auth.uid() and gs.student_id=profiles.id));

alter table public.guardian_students enable row level security;
create policy "guardians read own links" on public.guardian_students for select to authenticated
using(guardian_id=auth.uid() or student_id=auth.uid() or public.current_app_role()='admin');
create policy "admins manage guardian links" on public.guardian_students for all to authenticated
using(public.current_app_role()='admin') with check(public.current_app_role()='admin');

create policy "guardians read child enrollments" on public.student_enrollments for select to authenticated
using(exists(select 1 from public.guardian_students gs where gs.guardian_id=auth.uid() and gs.student_id=student_enrollments.student_id));
create policy "assigned teachers read enrollments" on public.student_enrollments for select to authenticated
using(exists(select 1 from public.class_teachers ct where ct.class_id=student_enrollments.class_id and ct.teacher_id=auth.uid()));
create policy "admins manage enrollments" on public.student_enrollments for all to authenticated
using(public.current_app_role()='admin') with check(public.current_app_role()='admin');

create policy "guardians read child progress" on public.progress for select to authenticated
using(exists(select 1 from public.guardian_students gs where gs.guardian_id=auth.uid() and gs.student_id=progress.student_id));
create policy "teachers read class progress" on public.progress for select to authenticated
using(exists(select 1 from public.class_teachers ct where ct.class_id=progress.class_id and ct.teacher_id=auth.uid()) or exists(select 1 from public.classes c where c.id=progress.class_id and c.owner_teacher_id=auth.uid()));
create policy "admins manage progress" on public.progress for all to authenticated
using(public.current_app_role()='admin') with check(public.current_app_role()='admin');

create policy "guardians read child payments" on public.payments for select to authenticated
using(payer_id=auth.uid() or exists(select 1 from public.guardian_students gs where gs.guardian_id=auth.uid() and gs.student_id=payments.student_id));
create policy "teachers read class payments" on public.payments for select to authenticated
using(exists(select 1 from public.class_teachers ct where ct.class_id=payments.class_id and ct.teacher_id=auth.uid()) or exists(select 1 from public.classes c where c.id=payments.class_id and c.owner_teacher_id=auth.uid()));
create policy "admins manage payments" on public.payments for all to authenticated
using(public.current_app_role()='admin') with check(public.current_app_role()='admin');

alter table public.payment_splits enable row level security;
create policy "teachers read own splits" on public.payment_splits for select to authenticated
using(teacher_id=auth.uid() or public.current_app_role()='admin');

create policy "admins read all teams" on public.teacher_teams for select to authenticated
using(public.current_app_role()='admin');
create policy "admins read team members" on public.team_members for select to authenticated
using(public.current_app_role()='admin');
create policy "admins read class teachers" on public.class_teachers for select to authenticated
using(public.current_app_role()='admin');
create policy "admins manage classes" on public.classes for all to authenticated
using(public.current_app_role()='admin') with check(public.current_app_role()='admin');
create policy "admins manage lessons" on public.lessons for all to authenticated
using(public.current_app_role()='admin') with check(public.current_app_role()='admin');
create policy "admins manage sessions" on public.live_sessions for all to authenticated
using(public.current_app_role()='admin') with check(public.current_app_role()='admin');
create policy "admins manage assignments" on public.assignments for all to authenticated
using(public.current_app_role()='admin') with check(public.current_app_role()='admin');
create policy "admins manage qa" on public.qa_threads for all to authenticated
using(public.current_app_role()='admin') with check(public.current_app_role()='admin');

create policy "notification owner reads" on public.notifications for select to authenticated
using(user_id=auth.uid() or public.current_app_role()='admin');
create policy "notification owner updates" on public.notifications for update to authenticated
using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "admins manage notifications" on public.notifications for all to authenticated
using(public.current_app_role()='admin') with check(public.current_app_role()='admin');
