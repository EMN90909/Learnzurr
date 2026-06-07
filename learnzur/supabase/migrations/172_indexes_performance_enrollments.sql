create index if not exists idx_enrollments_created_at_172 on public.enrollments(created_at desc);
create index if not exists idx_enrollments_metadata_gin_172 on public.enrollments using gin(metadata);
