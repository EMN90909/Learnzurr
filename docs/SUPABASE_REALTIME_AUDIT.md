# Supabase + Realtime Audit

Learnzur now avoids hardcoded app data for admin and Explore reads. Backend data reads go through `backend/internal/supabase/client.go` using Supabase REST with the service role key. Frontend realtime subscriptions live in `frontend/src/lib/realtime.ts` and listen to public/realtime-safe tables such as `studio_projects`, `project_comments`, `room_chat`, `board_events`, `notification_queue`, and `flag_chat_sandbox`.

If Supabase credentials are not configured, protected reads return empty arrays instead of fake records. This keeps development safe without pretending sample data is real.
