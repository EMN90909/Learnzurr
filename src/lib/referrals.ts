import { apiFetch } from "@/lib/api";

const REF_KEY = "struta_referral_code";
const VISITOR_KEY = "struta_visitor_id";

export const getVisitorId = () => {
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
};

export const getStoredReferralCode = () => localStorage.getItem(REF_KEY) || "";

export const captureReferralFromUrl = async () => {
  const url = new URL(window.location.href);
  const code = url.searchParams.get("ref") || url.searchParams.get("referral") || url.searchParams.get("r");
  if (!code) return;
  localStorage.setItem(REF_KEY, code);
  try {
    await fetch("/api/referrals/landing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ref: code, visitorId: getVisitorId(), landingPath: `${url.pathname}${url.search}` }),
    });
  } catch {
    // Referral capture should never block the app.
  }
};

export const convertStoredReferral = async (signupRole: string) => {
  const code = getStoredReferralCode();
  if (!code) return;
  try {
    await apiFetch("/api/referrals/convert", {
      method: "POST",
      body: JSON.stringify({ ref: code, visitorId: getVisitorId(), signupRole, landingPath: window.location.pathname }),
    });
  } catch {
    // Conversion tracking should not block signup success.
  }
};
