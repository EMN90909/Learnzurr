ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS provider_id uuid,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE public.subscriptions
  ALTER COLUMN created_at SET DEFAULT now();

CREATE TABLE IF NOT EXISTS public.webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text UNIQUE NOT NULL,
  event_type text NOT NULL,
  resource_id text,
  transmission_id text,
  status text NOT NULL DEFAULT 'received',
  raw_event jsonb NOT NULL,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages webhook events" ON public.webhook_events;
CREATE POLICY "Service role manages webhook events" ON public.webhook_events
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Subscriptions access" ON public.subscriptions;
CREATE POLICY "Subscriptions access" ON public.subscriptions
FOR SELECT TO authenticated
USING (auth.uid() = user_id OR auth.uid() = provider_id OR auth.uid() = home_id);

DROP POLICY IF EXISTS "Subscriptions insert self" ON public.subscriptions;
CREATE POLICY "Subscriptions insert self" ON public.subscriptions
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id OR auth.uid() = provider_id OR auth.uid() = home_id);

DROP POLICY IF EXISTS "Subscriptions update self" ON public.subscriptions;
CREATE POLICY "Subscriptions update self" ON public.subscriptions
FOR UPDATE TO authenticated
USING (auth.uid() = user_id OR auth.uid() = provider_id OR auth.uid() = home_id)
WITH CHECK (auth.uid() = user_id OR auth.uid() = provider_id OR auth.uid() = home_id);
