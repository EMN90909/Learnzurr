create index if not exists idx_learners_created_at_169 on public.learners(created_at desc);
create index if not exists idx_learners_metadata_gin_169 on public.learners using gin(metadata);
