create table if not exists public.guardian_link_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  guardian_email text not null,
  created_at timestamptz not null default now(),
  unique(student_id,guardian_email)
);
create index if not exists guardian_link_requests_email_idx on public.guardian_link_requests(lower(guardian_email));
alter table public.guardian_link_requests enable row level security;
create policy "learners read own guardian requests" on public.guardian_link_requests for select to authenticated
using(student_id=auth.uid() or public.current_app_role()='admin');
create policy "admins manage guardian requests" on public.guardian_link_requests for all to authenticated
using(public.current_app_role()='admin') with check(public.current_app_role()='admin');

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  assigned_role public.app_role := coalesce((new.raw_user_meta_data->>'role')::public.app_role,'learner');
  requested_guardian_email text := lower(trim(coalesce(new.raw_user_meta_data->>'guardian_email','')));
  guardian_profile_id uuid;
begin
  insert into public.profiles(id,role,full_name,phone,email)
  values(
    new.id,
    assigned_role,
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

  if assigned_role='learner' and requested_guardian_email<>'' then
    select id into guardian_profile_id
    from public.profiles
    where role='guardian' and lower(email)=requested_guardian_email
    limit 1;

    if guardian_profile_id is not null then
      insert into public.guardian_students(guardian_id,student_id,relationship)
      values(guardian_profile_id,new.id,'guardian')
      on conflict(guardian_id,student_id) do nothing;
    else
      insert into public.guardian_link_requests(student_id,guardian_email)
      values(new.id,requested_guardian_email)
      on conflict(student_id,guardian_email) do nothing;
    end if;
  end if;

  if assigned_role='guardian' and new.email is not null then
    insert into public.guardian_students(guardian_id,student_id,relationship)
    select new.id,request.student_id,'guardian'
    from public.guardian_link_requests request
    where lower(request.guardian_email)=lower(new.email)
    on conflict(guardian_id,student_id) do nothing;

    delete from public.guardian_link_requests
    where lower(guardian_email)=lower(new.email);
  end if;

  return new;
end;
$$;
