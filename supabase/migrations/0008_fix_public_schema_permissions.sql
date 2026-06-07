-- Grant usage on public schema to anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant standard table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Ensure RLS is enabled and correct policies exist for user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
CREATE POLICY "Users can read own profile"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile"
ON public.user_profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Anyone can read active funeral home listings" ON public.user_profiles;
CREATE POLICY "Anyone can read active funeral home listings"
ON public.user_profiles
FOR SELECT
TO anon, authenticated
USING (
  is_home = true
  AND role = 'operations'
  AND COALESCE(active, true) = true
);

DROP POLICY IF EXISTS "Anyone can read active vendor listings" ON public.user_profiles;
CREATE POLICY "Anyone can read active vendor listings"
ON public.user_profiles
FOR SELECT
TO anon, authenticated
USING (
  is_vendor = true
  AND role = 'marketplace'
  AND COALESCE(active, true) = true
);