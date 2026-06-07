-- Grant usage on public schema to anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Enable RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
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

-- Ensure columns exist on user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS home_name text,
ADD COLUMN IF NOT EXISTS business_name text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS county text,
ADD COLUMN IF NOT EXISTS sub_county text,
ADD COLUMN IF NOT EXISTS town text,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS latitude double precision,
ADD COLUMN IF NOT EXISTS longitude double precision,
ADD COLUMN IF NOT EXISTS role text,
ADD COLUMN IF NOT EXISTS is_home boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_vendor boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS vendor_category text,
ADD COLUMN IF NOT EXISTS active boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Enable RLS on erp_staff
ALTER TABLE public.erp_staff ENABLE ROW LEVEL SECURITY;

-- Ensure user_id column exists on erp_staff
ALTER TABLE public.erp_staff
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- RLS Policies for erp_staff
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

-- Enable RLS on homes
ALTER TABLE public.homes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for homes
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
USING (
  owner_user_id = auth.uid()
);

-- Enable RLS on vendor_items
ALTER TABLE public.vendor_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vendor_items
DROP POLICY IF EXISTS "Vendor owner can read own vendor items" ON public.vendor_items;
CREATE POLICY "Vendor owner can read own vendor items"
ON public.vendor_items
FOR SELECT
TO authenticated
USING (vendor_id = auth.uid());

DROP POLICY IF EXISTS "Vendor owner can insert own vendor items" ON public.vendor_items;
CREATE POLICY "Vendor owner can insert own vendor items"
ON public.vendor_items
FOR INSERT
TO authenticated
WITH CHECK (vendor_id = auth.uid());

DROP POLICY IF EXISTS "Vendor owner can update own vendor items" ON public.vendor_items;
CREATE POLICY "Vendor owner can update own vendor items"
ON public.vendor_items
FOR UPDATE
TO authenticated
USING (vendor_id = auth.uid())
WITH CHECK (vendor_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can read active vendor items" ON public.vendor_items;
CREATE POLICY "Anyone can read active vendor items"
ON public.vendor_items
FOR SELECT
TO anon, authenticated
USING (
  COALESCE(active, true) = true
);