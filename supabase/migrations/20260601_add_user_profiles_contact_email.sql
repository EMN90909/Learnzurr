alter table public.user_profiles
add column if not exists contact_email text;

create index if not exists user_profiles_contact_email_idx
on public.user_profiles (lower(contact_email))
where contact_email is not null;
