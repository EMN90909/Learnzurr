CREATE TABLE IF NOT EXISTS public.policy_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  admin_user_id UUID,
  violation_type TEXT NOT NULL,
  reason TEXT NOT NULL,
  action_taken TEXT NOT NULL,
  duration_days INTEGER DEFAULT 0,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.policy_review_queue ADD COLUMN IF NOT EXISTS content_excerpt TEXT;
ALTER TABLE public.policy_review_queue ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE public.policy_review_queue ADD COLUMN IF NOT EXISTS reviewed_by UUID;

CREATE INDEX IF NOT EXISTS idx_policy_violations_user_created ON public.policy_violations (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_policy_violations_type_created ON public.policy_violations (violation_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_policy_queue_source ON public.policy_review_queue (source_type, source_id);
