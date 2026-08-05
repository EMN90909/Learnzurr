create or replace function public.teacher_team_report(target_teacher uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  requester uuid := auth.uid();
  target_profile public.profiles%rowtype;
  class_ids uuid[] := '{}';
  class_rows jsonb := '[]'::jsonb;
  student_count integer := 0;
  assignment_count integer := 0;
  session_count integer := 0;
  earned numeric(14,2) := 0;
  allowed boolean := false;
begin
  if requester is null then
    raise exception 'Authentication required';
  end if;

  select * into target_profile from public.profiles where id=target_teacher and role='teacher';
  if not found then
    raise exception 'Teacher not found';
  end if;

  allowed := requester=target_teacher or public.current_app_role()='admin' or exists(
    select 1
    from public.teacher_teams team
    left join public.team_members mine on mine.team_id=team.id and mine.teacher_id=requester
    left join public.team_members target on target.team_id=team.id and target.teacher_id=target_teacher
    where (team.owner_id=requester or mine.teacher_id is not null)
      and (team.owner_id=target_teacher or target.teacher_id is not null)
  );
  if not allowed then
    raise exception 'Teacher report access denied';
  end if;

  select coalesce(array_agg(distinct id),'{}'::uuid[]) into class_ids
  from (
    select id from public.classes where owner_teacher_id=target_teacher
    union
    select class_id as id from public.class_teachers where teacher_id=target_teacher
  ) teacher_classes;

  select coalesce(jsonb_agg(jsonb_build_object('id',c.id,'title',c.title,'capacity',c.capacity) order by c.created_at desc),'[]'::jsonb)
  into class_rows
  from public.classes c
  where c.id=any(class_ids);

  select count(distinct student_id) into student_count
  from public.student_enrollments
  where class_id=any(class_ids) and active;

  select count(*) into assignment_count
  from public.assignments
  where author_id=target_teacher;

  select count(*) into session_count
  from public.live_sessions
  where created_by=target_teacher;

  select coalesce(sum(amount_kes),0) into earned
  from public.payment_splits
  where teacher_id=target_teacher;

  update public.team_members
  set last_report_at=now()
  where teacher_id=target_teacher
    and exists(
      select 1 from public.teacher_teams team
      left join public.team_members mine on mine.team_id=team.id and mine.teacher_id=requester
      where team.id=team_members.team_id
        and (team.owner_id=requester or mine.teacher_id is not null or public.current_app_role()='admin')
    );

  return jsonb_build_object(
    'teacher',jsonb_build_object(
      'id',target_profile.id,
      'fullName',target_profile.full_name,
      'email',target_profile.email,
      'lastLoginAt',target_profile.last_login_at
    ),
    'metrics',jsonb_build_object(
      'classes',coalesce(array_length(class_ids,1),0),
      'students',student_count,
      'assignments',assignment_count,
      'liveSessions',session_count,
      'earnedKes',earned
    ),
    'classes',class_rows,
    'generatedAt',now()
  );
end;
$$;

grant execute on function public.teacher_team_report(uuid) to authenticated;
