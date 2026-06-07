-- Struta production safety + free tier support
-- Fixes missing columns, popup 403s, notification RPC errors, push subscriptions, and free/pro defaults.

-- User profile preference + plan columns used by the frontend.
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS theme_mode text DEFAULT 'light',
  ADD COLUMN IF NOT EXISTS accent_color text DEFAULT 'gold',
  ADD COLUMN IF NOT EXISTS plan_code text DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS plan_status text DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS plan_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_pro boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_banned boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS ban_reason text,
  ADD COLUMN IF NOT EXISTS banned_until timestamptz,
  ADD COLUMN IF NOT EXISTS ban_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS account_flagged boolean DEFAULT false;

-- Provider receiving details required for invoice routing.
CREATE TABLE IF NOT EXISTS public.provider_payment_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL UNIQUE,
  recipient_name text NOT NULL,
  payment_type text NOT NULL DEFAULT 'phone' CHECK (payment_type IN ('phone', 'till', 'paybill')),
  phone_number text,
  till_number text,
  paybill_number text,
  account_number text,
  paypal_email text,
  stripe_account_id text,
  settlement_currency text NOT NULL DEFAULT 'KES',
  is_active boolean NOT NULL DEFAULT true,
  is_verified boolean NOT NULL DEFAULT false,
  verification_status text NOT NULL DEFAULT 'needs_review',
  risk_flags jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_submitted_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.provider_payment_profile_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL,
  actor_id uuid,
  action text NOT NULL,
  before_data jsonb,
  after_data jsonb,
  risk_flags jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- In-app notifications. Frontend no longer depends on RPC, but this keeps server/table notifications available.
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'general',
  title text NOT NULL,
  body text NOT NULL,
  entity_type text,
  entity_id uuid,
  deep_link text,
  idempotency_key text UNIQUE,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_created_idx ON public.notifications(user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.create_notification(
  target_user_id uuid,
  notification_type text,
  notification_title text,
  notification_body text,
  notification_link text DEFAULT NULL,
  notification_idempotency_key text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
BEGIN
  INSERT INTO public.notifications(user_id, type, title, body, deep_link, idempotency_key)
  VALUES(target_user_id, notification_type, notification_title, notification_body, notification_link, notification_idempotency_key)
  ON CONFLICT (idempotency_key) DO UPDATE SET idempotency_key = EXCLUDED.idempotency_key
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$;

-- Push subscription storage for persistent web push across Render restarts.
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS push_subscriptions_user_idx ON public.push_subscriptions(user_id);

-- Site update popups and views.
CREATE TABLE IF NOT EXISTS public.site_update_popups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  image_url text,
  cta_label text,
  cta_url text,
  audience text NOT NULL DEFAULT 'all',
  active boolean NOT NULL DEFAULT true,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.site_update_popup_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  popup_id uuid NOT NULL REFERENCES public.site_update_popups(id) ON DELETE CASCADE,
  user_id uuid,
  visitor_key text,
  viewed_at timestamptz NOT NULL DEFAULT now()
);

-- Staff/admin relationship support from current ERP brief.
CREATE TABLE IF NOT EXISTS public.erp_organization_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL UNIQUE,
  organization_type text NOT NULL DEFAULT 'home',
  general_code text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: enable where useful, then allow safe user reads and service-role/admin writes.
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_payment_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_update_popups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_update_popup_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own notifications" ON public.notifications;
CREATE POLICY "Users can read own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;
CREATE POLICY "Users can insert own notifications" ON public.notifications FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Providers can read own receiving profile" ON public.provider_payment_profiles;
CREATE POLICY "Providers can read own receiving profile" ON public.provider_payment_profiles FOR SELECT USING (auth.uid() = provider_id);

DROP POLICY IF EXISTS "Active popups are publicly readable" ON public.site_update_popups;
CREATE POLICY "Active popups are publicly readable" ON public.site_update_popups FOR SELECT USING (active = true);
DROP POLICY IF EXISTS "Anyone can record popup views" ON public.site_update_popup_views;
CREATE POLICY "Anyone can record popup views" ON public.site_update_popup_views FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can read own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can read own push subscriptions" ON public.push_subscriptions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can insert own push subscriptions" ON public.push_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can delete own push subscriptions" ON public.push_subscriptions FOR DELETE USING (auth.uid() = user_id);

-- Free/pro defaults for home/vendor accounts.
UPDATE public.user_profiles
SET plan_code = COALESCE(plan_code, 'free'),
    plan_status = COALESCE(plan_status, 'free'),
    is_pro = COALESCE(is_pro, false)
WHERE role IN ('operations', 'marketplace');
