const ACTIVE_PLAN_STATUSES = new Set(["paid", "active", "trialing"]);
const CANCELLED_PLAN_STATUSES = new Set(["cancelled", "canceled"]);

const getPlanExpiry = (profile: any) =>
  profile?.plan_expires_at ||
  profile?.plan_original_expires_at ||
  profile?.subscription?.expires_at ||
  profile?.subscription?.current_period_end ||
  profile?.subscription?.original_expires_at ||
  null;

const isFutureExpiry = (expiresAt?: string | null) =>
  !!expiresAt && new Date(expiresAt).getTime() > Date.now();

export const isRealPaidProvider = (profile: any) => {
  const planCode = String(
    profile?.plan_code ||
      profile?.subscription?.plan_code ||
      profile?.subscription?.plan_name ||
      "free"
  ).toLowerCase();
  const planStatus = String(
    profile?.plan_status || profile?.subscription_status || profile?.subscription?.status || "free"
  ).toLowerCase();
  const expiry = getPlanExpiry(profile);
  const hasPaidPlan = Boolean(profile?.isPro || profile?.is_pro) || planCode !== "free";
  const isActiveNow = ACTIVE_PLAN_STATUSES.has(planStatus);
  const isCancelledButStillInPaidPeriod = CANCELLED_PLAN_STATUSES.has(planStatus) && isFutureExpiry(expiry);

  return Boolean(
    hasPaidPlan &&
      (isActiveNow || isCancelledButStillInPaidPeriod) &&
      (!expiry || isFutureExpiry(expiry))
  );
};
