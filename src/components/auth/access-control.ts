export type AccessBlock = {
  reason: string;
  title: string;
  message: string;
  actionLabel: string;
  actionPath: string;
};

const openPaths = ["/login", "/forgot-password", "/reset-password", "/auth/callback", "/security-check", "/account-banned"];
const providerRoles = new Set(["operations", "marketplace", "Manager", "Owner / Manager"]);
const staffRoles = new Set(["Secretary", "Driver", "Embalmer", "Coordinator", "Setup Crew", "Secretary / Admin officer", "Driver / Transport officer", "Inventory / Stores staff", "Counselor / Arranger", "Sales / Bookings officer", "Delivery / Setup team", "Inventory staff", "Accountant / Cashier"]);
const businessInfoComplete = (profile: any) => Boolean(
  (profile?.business_name || profile?.home_name || profile?.full_name) &&
  profile?.phone &&
  (profile?.address || (profile?.town && profile?.county)) &&
  (profile?.kra_pin || profile?.pin_number || profile?.tax_pin || profile?.provider_setup?.kra_pin || profile?.provider_setup?.pin_number || profile?.provider_setup?.tax_pin)
);
const paymentSetupComplete = (profile: any) => Boolean(
  profile?.payment_number ||
  profile?.mpesa_phone ||
  profile?.provider_setup?.payment_number ||
  profile?.provider_setup?.payment_type ||
  profile?.provider_payment_setup_completed_at
);
const emailVerified = (profile: any) => Boolean(profile?.email_verified_at || profile?.email_confirmed_at || profile?.confirmed_at || profile?.is_email_verified || profile?.email_verified || profile?.role === "admin");
const termsAccepted = (profile: any) => Boolean(profile?.terms_accepted_at || profile?.accepted_terms_at || profile?.tos_accepted_at || profile?.terms_version_accepted || profile?.role === "admin");
const setupComplete = (profile: any) => Boolean(profile?.setup_completed_at || profile?.onboarding_completed_at || profile?.provider_setup?.setup_completed_at);

export function getAccessBlock(profile: any, path = window.location.pathname): AccessBlock | null {
  if (!profile || openPaths.some((openPath) => path.startsWith(openPath))) return null;
  const role = String(profile.role || "family");
  const isProvider = providerRoles.has(role) || staffRoles.has(role);
  if (profile.is_banned || profile.account_flagged || profile.active === false || profile.suspended_at || profile.suspended_by) return { reason: "suspended", title: "Account suspended", message: profile.ban_reason || "This account has been suspended by an administrator. Access is blocked until an admin unblocks it.", actionLabel: "Contact support", actionPath: "/contact" };
  if (profile.password_reset_required || profile.password_reset_requested_at) return { reason: "password-reset", title: "Password reset required", message: "A password reset was requested for this account. You cannot access the dashboard until you open the email reset link and choose a new password.", actionLabel: "Open password reset", actionPath: "/forgot-password" };
  if (!emailVerified(profile)) return { reason: "email-verification", title: "Verify your email", message: "Verify your email address before opening the dashboard. Enter the OTP sent to your email, then continue setup.", actionLabel: "Verify email", actionPath: "/signup" };
  if (!termsAccepted(profile)) return { reason: "terms", title: "Accept terms of service", message: "You need to accept Struta's terms of service before accessing the dashboard.", actionLabel: "Review terms", actionPath: "/terms-of-use" };
  if (isProvider && !businessInfoComplete(profile)) return { reason: "business-info", title: "Business profile incomplete", message: "Add your funeral home or vendor name, address, phone number, and PIN before accessing dashboard tools.", actionLabel: "Complete settings", actionPath: role === "marketplace" ? "/marketplace/settings" : "/operations/settings" };
  if (isProvider && !paymentSetupComplete(profile)) return { reason: "payment-setup", title: "Payment setup required", message: "Add your payment details so invoices and family requests can show correct payment instructions.", actionLabel: "Add payment details", actionPath: role === "marketplace" ? "/marketplace/settings" : "/operations/settings" };
  if (isProvider && !setupComplete(profile)) return { reason: "onboarding", title: "Finish onboarding", message: "Finish your setup before opening the dashboard.", actionLabel: "Finish setup", actionPath: role === "marketplace" ? "/marketplace/settings" : "/operations/settings" };
  return null;
}

export function getAccessBlockPath(profile: any, path?: string) {
  const block = getAccessBlock(profile, path);
  if (!block) return "";
  return `/security-check?reason=${encodeURIComponent(block.reason)}&action=${encodeURIComponent(block.actionPath)}`;
}
