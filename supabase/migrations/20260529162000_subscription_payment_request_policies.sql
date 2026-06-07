-- Ensure direct Supabase inserts do not fail if older frontend code still tries them.
-- Primary production path uses /api/subscription-payment-requests with service role.

ALTER TABLE public.subscription_payment_requests ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'subscription_payment_requests'
      AND policyname = 'Users can create own subscription payment requests'
  ) THEN
    CREATE POLICY "Users can create own subscription payment requests"
      ON public.subscription_payment_requests
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'subscription_payment_requests'
      AND policyname = 'Users can read own subscription payment requests'
  ) THEN
    CREATE POLICY "Users can read own subscription payment requests"
      ON public.subscription_payment_requests
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;
