-- Grant access to the Data API for memorial_pages
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.memorial_pages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.memorial_pages TO service_role;
GRANT SELECT ON TABLE public.memorial_pages TO anon;

-- Ensure RLS is enabled
ALTER TABLE public.memorial_pages ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Public memorial pages are readable" ON public.memorial_pages;

-- Create comprehensive policies
CREATE POLICY "memorial_pages_select_policy" ON public.memorial_pages
FOR SELECT USING (is_public = true OR auth.uid() IS NOT NULL);

CREATE POLICY "memorial_pages_insert_policy" ON public.memorial_pages
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "memorial_pages_update_policy" ON public.memorial_pages
FOR UPDATE TO authenticated USING (true);

-- Also ensure memorial_requests has proper grants for the dashboard to load
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.memorial_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.memorial_requests TO service_role;