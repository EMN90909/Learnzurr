create index if not exists idx_teachers_created_at_166 on public.teachers(created_at desc);
create index if not exists idx_teachers_metadata_gin_166 on public.teachers using gin(metadata);
