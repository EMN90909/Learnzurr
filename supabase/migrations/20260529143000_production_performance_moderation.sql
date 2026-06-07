-- Production performance + moderation hardening. Idempotent for Render migrations.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS public.policy_review_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  source_type TEXT NOT NULL DEFAULT 'unknown',
  source_id TEXT,
  severity TEXT NOT NULL DEFAULT 'LOW',
  action TEXT NOT NULL DEFAULT 'allow_with_tracking',
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID
);

ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS ban_reason TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS banned_until TIMESTAMPTZ;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS ban_count INTEGER DEFAULT 0;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS account_flagged BOOLEAN DEFAULT FALSE;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'clear';
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS plan_status TEXT DEFAULT 'free';
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS plan_code TEXT DEFAULT 'free';
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS is_pro BOOLEAN DEFAULT FALSE;

ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS search_vector tsvector GENERATED ALWAYS AS (
  to_tsvector('english', coalesce(request_title, '') || ' ' || coalesce(request_details, '') || ' ' || coalesce(notes, ''))
) STORED;

CREATE INDEX IF NOT EXISTS idx_service_requests_requester_id ON public.service_requests (requester_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_provider_id ON public.service_requests (provider_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_provider_type ON public.service_requests (provider_type);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON public.service_requests (status);
CREATE INDEX IF NOT EXISTS idx_service_requests_updated_at ON public.service_requests (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_requests_created_at ON public.service_requests (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_requests_search ON public.service_requests USING GIN (search_vector);

CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles (role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email_lower ON public.user_profiles (lower(email));
CREATE INDEX IF NOT EXISTS idx_user_profiles_plan ON public.user_profiles (plan_code, plan_status, plan_expires_at);
CREATE INDEX IF NOT EXISTS idx_user_profiles_banned ON public.user_profiles (is_banned, banned_until);
CREATE INDEX IF NOT EXISTS idx_user_profiles_names_trgm ON public.user_profiles USING GIN ((coalesce(full_name, '') || ' ' || coalesce(home_name, '') || ' ' || coalesce(business_name, '')) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created ON public.notifications (user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sub_payments_status_created ON public.subscription_payment_requests (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sub_payments_user_status ON public.subscription_payment_requests (user_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_request_status ON public.payments (request_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_provider_status ON public.payments (provider_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_request_status ON public.invoices (request_id, status);
CREATE INDEX IF NOT EXISTS idx_policy_review_user_status ON public.policy_review_queue (user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_policy_review_severity_status ON public.policy_review_queue (severity, status, created_at DESC);

CREATE OR REPLACE VIEW public.admin_activity_summary AS
SELECT
  (SELECT count(*) FROM public.user_profiles WHERE role = 'family') AS bereaved_families,
  (SELECT count(*) FROM public.user_profiles WHERE role = 'operations') AS funeral_homes,
  (SELECT count(*) FROM public.user_profiles WHERE role = 'marketplace') AS vendors,
  (SELECT count(*) FROM public.service_requests) AS service_requests,
  (SELECT count(*) FROM public.service_requests WHERE created_at > now() - interval '7 days') AS service_requests_7d,
  (SELECT count(*) FROM public.subscription_payment_requests WHERE status = 'pending') AS pending_subscription_payments,
  (SELECT count(*) FROM public.policy_review_queue WHERE status = 'open') AS open_policy_reviews;

CREATE OR REPLACE FUNCTION public.expire_old_pro_plans()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.user_profiles
  SET is_pro = false,
      plan_status = 'free',
      plan_code = 'free',
      updated_at = now()
  WHERE is_pro = true
    AND plan_expires_at IS NOT NULL
    AND plan_expires_at <= now();

  UPDATE public.subscriptions
  SET status = 'expired',
      payment_status = 'expired',
      updated_at = now()
  WHERE expires_at IS NOT NULL
    AND expires_at <= now()
    AND status = 'active';
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_policy_ban(
  p_user_id UUID,
  p_severity TEXT,
  p_reason TEXT,
  p_source_type TEXT DEFAULT 'unknown',
  p_source_id TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  ban_days INTEGER := 0;
  action_text TEXT := 'allow_with_tracking';
BEGIN
  IF upper(p_severity) = 'MEDIUM' THEN
    ban_days := 3;
    action_text := 'flag_for_review';
  ELSIF upper(p_severity) = 'HIGH' THEN
    ban_days := 5;
    action_text := 'auto_block';
  ELSIF upper(p_severity) = 'HATE_SPEECH' THEN
    ban_days := 14;
    action_text := 'auto_block_and_report';
  ELSIF upper(p_severity) = 'FALSE_INFORMATION' THEN
    ban_days := 14;
    action_text := 'auto_block_and_report';
  END IF;

  INSERT INTO public.policy_review_queue(user_id, source_type, source_id, severity, action, reason, status, metadata)
  VALUES (p_user_id, p_source_type, p_source_id, upper(p_severity), action_text, p_reason, CASE WHEN ban_days > 0 THEN 'actioned' ELSE 'open' END, jsonb_build_object('ban_days', ban_days));

  IF ban_days > 0 THEN
    UPDATE public.user_profiles
    SET is_banned = true,
        ban_reason = p_reason,
        banned_until = now() + make_interval(days => ban_days),
        ban_count = coalesce(ban_count, 0) + 1,
        account_flagged = true,
        moderation_status = upper(p_severity),
        updated_at = now()
    WHERE id = p_user_id;
  END IF;
END;
$$;
