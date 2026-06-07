create index if not exists idx_attendance_sessions_created_at_174 on public.attendance_sessions(created_at desc);
create index if not exists idx_attendance_sessions_metadata_gin_174 on public.attendance_sessions using gin(metadata);
