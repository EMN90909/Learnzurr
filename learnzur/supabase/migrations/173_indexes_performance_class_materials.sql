create index if not exists idx_class_materials_created_at_173 on public.class_materials(created_at desc);
create index if not exists idx_class_materials_metadata_gin_173 on public.class_materials using gin(metadata);
