-- Struta Complete Setup: Grants, Tables, and RLS Policies

-- 1. SCHEMA GRANTS
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Ensure schema public grants apply to future tables/sequences
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO anon;

-- 2. CREATE COORDINDATION TABLES IF THEY DO NOT EXIST
CREATE TABLE IF NOT EXISTS public.case_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL, -- references memorial_requests.id
  user_id UUID REFERENCES auth.users(id), -- nullable before user claims it
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  relationship TEXT,
  role TEXT NOT NULL CHECK (role IN ('Primary contact', 'Family member', 'Approver', 'Viewer')),
  permissions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.case_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL, -- references memorial_requests.id
  invited_email TEXT NOT NULL,
  invited_name TEXT NOT NULL,
  relationship TEXT,
  role TEXT NOT NULL CHECK (role IN ('Primary contact', 'Family member', 'Approver', 'Viewer')),
  permissions JSONB DEFAULT '{}'::jsonb,
  token TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Accepted', 'Expired', 'Revoked')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. ENABLE RLS FOR EVERY TABLE
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memorial_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memorial_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funeral_home_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_item_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 4. CONFIGURE ROW LEVEL SECURITY POLICIES

-- User Profiles
DROP POLICY IF EXISTS "Profiles read own" ON public.user_profiles;
CREATE POLICY "Profiles read own" ON public.user_profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Profiles update own" ON public.user_profiles;
CREATE POLICY "Profiles update own" ON public.user_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Profiles insert own" ON public.user_profiles;
CREATE POLICY "Profiles insert own" ON public.user_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Profiles read active homes" ON public.user_profiles;
CREATE POLICY "Profiles read active homes" ON public.user_profiles
  FOR SELECT TO authenticated, anon USING (is_home = true AND role = 'operations' AND coalesce(active, true) = true);

DROP POLICY IF EXISTS "Profiles read active vendors" ON public.user_profiles;
CREATE POLICY "Profiles read active vendors" ON public.user_profiles
  FOR SELECT TO authenticated, anon USING (is_vendor = true AND role = 'marketplace' AND coalesce(active, true) = true);

-- ERP Staff
DROP POLICY IF EXISTS "Staff read own" ON public.erp_staff;
CREATE POLICY "Staff read own" ON public.erp_staff
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Staff update own" ON public.erp_staff;
CREATE POLICY "Staff update own" ON public.erp_staff
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Managers manage business staff" ON public.erp_staff;
CREATE POLICY "Managers manage business staff" ON public.erp_staff
  FOR ALL TO authenticated USING (
    home_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid() AND (up.is_home = true OR up.is_vendor = true) AND up.id = erp_staff.home_id
    )
  );

-- Memorial Requests (Cases)
DROP POLICY IF EXISTS "Bereaved read own requests" ON public.memorial_requests;
CREATE POLICY "Bereaved read own requests" ON public.memorial_requests
  FOR SELECT TO authenticated USING (
    user_id = auth.uid() OR
    home_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.case_members cm
      WHERE cm.case_id = id AND cm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Bereaved insert requests" ON public.memorial_requests;
CREATE POLICY "Bereaved insert requests" ON public.memorial_requests
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Bereaved update requests" ON public.memorial_requests;
CREATE POLICY "Bereaved update requests" ON public.memorial_requests
  FOR UPDATE TO authenticated USING (
    user_id = auth.uid() OR home_id = auth.uid()
  );

-- Memorial Pages
DROP POLICY IF EXISTS "Public read published pages" ON public.memorial_pages;
CREATE POLICY "Public read published pages" ON public.memorial_pages
  FOR SELECT TO anon, authenticated USING (status = 'published');

DROP POLICY IF EXISTS "Bereaved manage own pages" ON public.memorial_pages;
CREATE POLICY "Bereaved manage own pages" ON public.memorial_pages
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Case Members & Invitations
DROP POLICY IF EXISTS "Case members read relevant cases" ON public.case_members;
CREATE POLICY "Case members read relevant cases" ON public.case_members
  FOR SELECT TO authenticated USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.memorial_requests mr
      WHERE mr.id = case_id AND (mr.user_id = auth.uid() OR mr.home_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Manage case members" ON public.case_members;
CREATE POLICY "Manage case members" ON public.case_members
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.memorial_requests mr
      WHERE mr.id = case_id AND (mr.user_id = auth.uid() OR mr.home_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "View invitations" ON public.case_invitations;
CREATE POLICY "View invitations" ON public.case_invitations
  FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Manage invitations" ON public.case_invitations;
CREATE POLICY "Manage invitations" ON public.case_invitations
  FOR ALL TO authenticated USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.memorial_requests mr
      WHERE mr.id = case_id AND (mr.user_id = auth.uid() OR mr.home_id = auth.uid())
    )
  );

-- ERP Requests
DROP POLICY IF EXISTS "ERP requests access" ON public.erp_requests;
CREATE POLICY "ERP requests access" ON public.erp_requests
  FOR ALL TO authenticated USING (
    home_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.erp_staff es
      WHERE es.home_id = erp_requests.home_id AND es.user_id = auth.uid()
    )
  );

-- Funeral Home Inventory
DROP POLICY IF EXISTS "Inventory access" ON public.funeral_home_inventory;
CREATE POLICY "Inventory access" ON public.funeral_home_inventory
  FOR ALL TO authenticated USING (
    home_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.erp_staff es
      WHERE es.home_id = funeral_home_inventory.home_id AND es.user_id = auth.uid()
    )
  );

-- Vendor Items & Bookings
DROP POLICY IF EXISTS "Vendor items access" ON public.vendor_items;
CREATE POLICY "Vendor items access" ON public.vendor_items
  FOR ALL TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Vendor bookings access" ON public.vendor_item_bookings;
CREATE POLICY "Vendor bookings access" ON public.vendor_item_bookings
  FOR ALL TO authenticated USING (
    vendor_id = auth.uid() OR
    customer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.erp_staff es
      WHERE es.home_id = vendor_id AND es.user_id = auth.uid()
    )
  );

-- Subscriptions & Payments
DROP POLICY IF EXISTS "Subscriptions access" ON public.subscriptions;
CREATE POLICY "Subscriptions access" ON public.subscriptions
  FOR ALL TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Payments access" ON public.payments;
CREATE POLICY "Payments access" ON public.payments
  FOR ALL TO authenticated USING (user_id = auth.uid());
