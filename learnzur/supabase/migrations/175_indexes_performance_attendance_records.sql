create index if not exists idx_attendance_records_created_at_175 on public.attendance_records(created_at desc);
create index if not exists idx_attendance_records_metadata_gin_175 on public.attendance_records using gin(metadata);
