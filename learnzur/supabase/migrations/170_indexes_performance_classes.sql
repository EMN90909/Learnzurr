create index if not exists idx_classes_created_at_170 on public.classes(created_at desc);
create index if not exists idx_classes_metadata_gin_170 on public.classes using gin(metadata);
