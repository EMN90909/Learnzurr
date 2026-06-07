create index if not exists idx_class_coteachers_created_at_171 on public.class_coteachers(created_at desc);
create index if not exists idx_class_coteachers_metadata_gin_171 on public.class_coteachers using gin(metadata);
