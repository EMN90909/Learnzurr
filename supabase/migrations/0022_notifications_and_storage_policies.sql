-- Enable RLS on notifications table
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;

-- Notifications: authenticated users can select/insert/update/delete their own
DROP POLICY IF EXISTS "notifications_authenticated_select" ON public.notifications;
CREATE POLICY "notifications_authenticated_select"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_authenticated_insert" ON public.notifications;
CREATE POLICY "notifications_authenticated_insert"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_authenticated_update" ON public.notifications;
CREATE POLICY "notifications_authenticated_update"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_authenticated_delete" ON public.notifications;
CREATE POLICY "notifications_authenticated_delete"
  ON public.notifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create request-media bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('request-media', 'request-media', false)
ON CONFLICT (id) DO NOTHING;

-- Storage: Enable RLS on storage.objects
ALTER TABLE IF EXISTS storage.objects ENABLE ROW LEVEL SECURITY;

-- Storage: authenticated users can upload to request-media/
DROP POLICY IF EXISTS "request-media-upload" ON storage.objects;
CREATE POLICY "request-media-upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'request-media');

-- Storage: authenticated users can read request-media/
DROP POLICY IF EXISTS "request-media-read" ON storage.objects;
CREATE POLICY "request-media-read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'request-media');

-- Storage: authenticated users can update their own request-media/
DROP POLICY IF EXISTS "request-media-update" ON storage.objects;
CREATE POLICY "request-media-update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'request-media');

-- Storage: authenticated users can delete their own request-media/
DROP POLICY IF EXISTS "request-media-delete" ON storage.objects;
CREATE POLICY "request-media-delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'request-media');

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
