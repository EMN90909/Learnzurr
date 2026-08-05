create or replace function public.accept_teacher_invite()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  invite_record public.teacher_invites%rowtype;
  current_email text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  current_email := lower(coalesce(auth.jwt()->>'email', ''));
  select * into invite_record
  from public.teacher_invites
  where lower(email) = current_email
    and status = 'pending'
  order by created_at desc
  limit 1
  for update;

  if invite_record.id is null then
    raise exception 'No pending teacher invitation found';
  end if;

  update public.profiles
  set role = 'teacher'
  where id = auth.uid();

  insert into public.team_members(team_id, teacher_id, revenue_share, invited_by)
  values(invite_record.team_id, auth.uid(), invite_record.revenue_share, invite_record.invited_by)
  on conflict(team_id, teacher_id)
  do update set revenue_share = excluded.revenue_share, invited_by = excluded.invited_by;

  update public.teacher_invites
  set status = 'accepted', invited_user_id = auth.uid(), accepted_at = now()
  where id = invite_record.id;

  return jsonb_build_object(
    'accepted', true,
    'team_id', invite_record.team_id,
    'revenue_share', invite_record.revenue_share
  );
end;
$$;

grant execute on function public.accept_teacher_invite() to authenticated;
