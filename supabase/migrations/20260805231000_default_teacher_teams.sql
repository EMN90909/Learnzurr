create or replace function public.ensure_teacher_has_owned_team()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role = 'teacher' and not exists (
    select 1 from public.teacher_teams where owner_id = new.id
  ) then
    insert into public.teacher_teams(owner_id,name)
    values(new.id,coalesce(nullif(trim(new.full_name),''),'Learnzurr') || '''s team');
  end if;
  return new;
end;
$$;

drop trigger if exists ensure_teacher_owned_team on public.profiles;
create trigger ensure_teacher_owned_team
after insert or update of role,full_name on public.profiles
for each row
when (new.role = 'teacher')
execute procedure public.ensure_teacher_has_owned_team();

insert into public.teacher_teams(owner_id,name)
select p.id,coalesce(nullif(trim(p.full_name),''),'Learnzurr') || '''s team'
from public.profiles p
where p.role='teacher'
  and not exists(select 1 from public.teacher_teams t where t.owner_id=p.id);
