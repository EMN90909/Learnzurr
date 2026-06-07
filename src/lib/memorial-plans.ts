export const MEMORIAL_PLANS = {
  free: {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    priceYearly: 0,
    priceLifetime: 0,
    tagline: "Basic memorial page for every family.",
    features: [
      "Basic memorial page",
      "Limited photos",
      "Standard guestbook",
      "Public sharing",
      "Basic tribute text",
    ],
  },
} as const;

export type MemorialPlanId = keyof typeof MEMORIAL_PLANS;

export function isMemorialPro(profile: { isPro?: boolean; subscription_status?: string; plan_name?: string } | null) {
  // Memorial Pro has been removed - always returns false
  return false;
}

export type MemorialProPeriod = "monthly" | "yearly" | "lifetime";

export function getMemorialProCheckout(period: MemorialProPeriod) {
  // Memorial Pro has been removed - return null pricing
  return { amount: 0, currency: "KES", description: "Free plan", planPeriod: period };
}
