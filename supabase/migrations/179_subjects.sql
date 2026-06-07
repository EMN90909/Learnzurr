create table if not exists public.subjects (id serial primary key, name text unique not null, level text not null default 'junior_secondary');
insert into public.subjects(name, level) values ('Mathematics','all'),('English','all'),('Kiswahili','all'),('Integrated Science','junior_secondary'),('Social Studies','primary'),('Pre-Technical Studies','junior_secondary'),('Computer Science','senior_secondary'),('Creative Arts','all'),('Business Studies','senior_secondary'),('Agriculture','all') on conflict do nothing;
alter table public.subjects enable row level security;
