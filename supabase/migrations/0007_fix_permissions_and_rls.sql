-- 1. Grant schema permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- 2. Add missing columns to user_profiles
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS sub_county TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS home_name TEXT;

-- 3. Add missing user_id column to memorial_pages
ALTER TABLE public.memorial_pages ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 4. Enable RLS and set up policies for user_profiles
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

-- 5. Enable RLS and set up policies for erp_staff
ALTER TABLE public.erp_staff ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can read own staff record" ON public.erp_staff;
CREATE POLICY "Staff can read own staff record"
ON public.erp_staff
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Staff can update own staff record" ON public.erp_staff;
CREATE POLICY "Staff can update own staff record"
ON public.erp_staff
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Home managers can read staff in their home" ON public.erp_staff;
CREATE POLICY "Home managers can read staff in their home"
ON public.erp_staff
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.erp_staff manager
    WHERE manager.user_id = auth.uid()
      AND manager.home_id = erp_staff.home_id
      AND manager.role IN ('manager', 'owner', 'admin')
  )
);

-- 6. Enable RLS and set up policies for homes
ALTER TABLE public.homes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can read own home" ON public.homes;
CREATE POLICY "Staff can read own home"
ON public.homes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.erp_staff s
    WHERE s.user_id = auth.uid()
      AND s.home_id = homes.id
  )
);

DROP POLICY IF EXISTS "Home owner can read own home" ON public.homes;
CREATE POLICY "Home owner can read own home"
ON public.homes
FOR SELECT
TO authenticated
USING (owner_user_id = auth.uid());