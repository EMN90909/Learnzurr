-- Step 1: Add missing is_banned column to user_profiles if it doesn't exist
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;

-- Step 2: Ensure subscriptions table exists with proper structure
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  plan_period TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'KES',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled', 'expired')),
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ends_at TIMESTAMP WITH TIME ZONE,
  auto_renew BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- Enable RLS on subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing subscriptions policies
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Admin can manage subscriptions" ON public.subscriptions;

-- Create subscriptions RLS policies
CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_profiles up 
      WHERE up.id = auth.uid() AND up.role = 'admin'
    )
  );

CREATE POLICY "Users can update own subscription" ON public.subscriptions
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_profiles up 
      WHERE up.id = auth.uid() AND up.role = 'admin'
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_profiles up 
      WHERE up.id = auth.uid() AND up.role = 'admin'
    )
  );

CREATE POLICY "Service role can insert subscriptions" ON public.subscriptions
  FOR INSERT
  TO service_role
  WITH CHECK (TRUE);

-- Step 3: Create provider_payment_profiles table
CREATE TABLE IF NOT EXISTS public.provider_payment_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL UNIQUE REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  mpesa_phone TEXT,
  mpesa_name TEXT,
  bank_account TEXT,
  bank_name TEXT,
  bank_code TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES public.user_profiles(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create provider_payment_profiles indexes
CREATE INDEX IF NOT EXISTS idx_provider_payment_profiles_provider_id ON public.provider_payment_profiles(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_payment_profiles_verified ON public.provider_payment_profiles(is_verified);

-- Enable RLS on provider_payment_profiles
ALTER TABLE public.provider_payment_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing provider_payment_profiles policies
DROP POLICY IF EXISTS "Providers can view own payment profile" ON public.provider_payment_profiles;
DROP POLICY IF EXISTS "Providers can update own payment profile" ON public.provider_payment_profiles;
DROP POLICY IF EXISTS "Admin can view and manage payment profiles" ON public.provider_payment_profiles;

-- Create provider_payment_profiles RLS policies
CREATE POLICY "Providers can view own payment profile" ON public.provider_payment_profiles
  FOR SELECT
  TO authenticated
  USING (
    provider_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_profiles up 
      WHERE up.id = auth.uid() AND up.role = 'admin'
    )
  );

CREATE POLICY "Providers can update own payment profile" ON public.provider_payment_profiles
  FOR UPDATE
  TO authenticated
  USING (
    provider_id = auth.uid()
  )
  WITH CHECK (
    provider_id = auth.uid()
  );

CREATE POLICY "Providers can insert own payment profile" ON public.provider_payment_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    provider_id = auth.uid()
  );

CREATE POLICY "Admin can manage all payment profiles" ON public.provider_payment_profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up 
      WHERE up.id = auth.uid() AND up.role = 'admin'
    )
  );

-- Step 4: Grant public schema permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Notify PostgREST to reload the schema cache
NOTIFY pgrst, 'reload schema';
