-- Remove the check constraint that was causing the insert to fail
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;

-- Ensure RLS is enabled
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Re-create policies with proper checks
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
CREATE POLICY "Users can view their own profile" ON public.user_profiles
FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
CREATE POLICY "Users can update their own profile" ON public.user_profiles
FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Grant necessary permissions
GRANT SELECT, UPDATE, INSERT ON TABLE public.user_profiles TO authenticated;
GRANT ALL ON TABLE public.user_profiles TO service_role;

-- Sync existing users from auth.users to public.user_profiles
-- We use COALESCE to ensure a role is always present, defaulting to 'family'
INSERT INTO public.user_profiles (id, email, role)
SELECT id, email, COALESCE(raw_user_meta_data ->> 'role', 'family')
FROM auth.users
ON CONFLICT (id) DO UPDATE SET 
  email = EXCLUDED.email,
  role = COALESCE(public.user_profiles.role, EXCLUDED.role);