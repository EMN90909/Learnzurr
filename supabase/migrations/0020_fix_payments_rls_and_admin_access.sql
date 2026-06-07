-- Ensure payments table has RLS enabled
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Drop existing payment policies to recreate with proper admin access
DROP POLICY IF EXISTS "Payments select related" ON public.payments;
DROP POLICY IF EXISTS "Payments insert admin" ON public.payments;
DROP POLICY IF EXISTS "Payments update admin" ON public.payments;
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;

-- Create updated payment policies with admin access
CREATE POLICY "Payments select - users and admin" ON public.payments
  FOR SELECT
  TO authenticated
  USING (
    -- Admin can see all
    EXISTS (
      SELECT 1 FROM public.user_profiles up 
      WHERE up.id = auth.uid() AND up.role = 'admin'
    )
    OR
    -- Users can see their own payments
    user_id = auth.uid()
    OR provider_id = auth.uid()
    OR home_id = auth.uid()
    OR vendor_id = auth.uid()
  );

CREATE POLICY "Payments insert - admin only" ON public.payments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles up 
      WHERE up.id = auth.uid() AND up.role = 'admin'
    )
  );

CREATE POLICY "Payments update - admin only" ON public.payments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up 
      WHERE up.id = auth.uid() AND up.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles up 
      WHERE up.id = auth.uid() AND up.role = 'admin'
    )
  );

-- Ensure subscriptions table also has proper admin access
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop and recreate subscription policies with better admin support
DROP POLICY IF EXISTS "Subscriptions select related" ON public.subscriptions;
DROP POLICY IF EXISTS "Subscriptions insert related" ON public.subscriptions;
DROP POLICY IF EXISTS "Subscriptions update related" ON public.subscriptions;

CREATE POLICY "Subscriptions select - users and admin" ON public.subscriptions
  FOR SELECT
  TO authenticated
  USING (
    -- Admin can see all
    EXISTS (
      SELECT 1 FROM public.user_profiles up 
      WHERE up.id = auth.uid() AND up.role = 'admin'
    )
    OR
    -- Users can see their own subscriptions
    user_id = auth.uid()
    OR provider_id = auth.uid()
    OR home_id = auth.uid()
    OR vendor_id = auth.uid()
  );

CREATE POLICY "Subscriptions insert - users and admin" ON public.subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR provider_id = auth.uid()
    OR home_id = auth.uid()
    OR vendor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_profiles up 
      WHERE up.id = auth.uid() AND up.role = 'admin'
    )
  );

CREATE POLICY "Subscriptions update - users and admin" ON public.subscriptions
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR provider_id = auth.uid()
    OR home_id = auth.uid()
    OR vendor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_profiles up 
      WHERE up.id = auth.uid() AND up.role = 'admin'
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    OR provider_id = auth.uid()
    OR home_id = auth.uid()
    OR vendor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_profiles up 
      WHERE up.id = auth.uid() AND up.role = 'admin'
    )
  );

-- Notify pgrst to reload the schema cache
NOTIFY pgrst, 'reload schema';
