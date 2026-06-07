create index if not exists idx_teacher_subjects_created_at_167 on public.teacher_subjects(created_at desc);
create index if not exists idx_teacher_subjects_metadata_gin_167 on public.teacher_subjects using gin(metadata);
