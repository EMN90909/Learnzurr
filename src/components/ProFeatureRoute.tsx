import { Navigate, useLocation } from "react-router-dom";
import DominoLoader from "@/components/DominoLoader";
import { useAuth } from "@/components/auth/AuthProvider";

const operationRoles = ["operations", "Manager", "Secretary", "Driver", "Embalmer", "Coordinator", "Secretary / Admin officer", "Driver / Transport officer", "Inventory / Stores staff", "Counselor / Arranger"];
const marketplaceRoles = ["marketplace", "Owner / Manager", "Manager", "Secretary", "Driver", "Coordinator", "Setup Crew", "Sales / Bookings officer", "Delivery / Setup team", "Inventory staff", "Accountant / Cashier"];
const ACTIVE_PLAN_STATUSES = new Set(["paid", "active", "trialing"]);
const CANCELLED_PLAN_STATUSES = new Set(["cancelled", "canceled"]);

export const getPlanExpiry = (profile: any) => profile?.plan_expires_at || profile?.plan_original_expires_at || profile?.subscription?.expires_at || profile?.subscription?.current_period_end || profile?.subscription?.original_expires_at || null;

export const hasActiveProAccess = (profile: any) => {
  if (profile?.role === "admin") return true;
  const expiry = getPlanExpiry(profile);
  const planStatus = String(profile?.plan_status || profile?.subscription_status || profile?.subscription?.status || "").toLowerCase();
  const planCode = String(profile?.plan_code || profile?.subscription?.plan_code || profile?.subscription?.plan_name || "free").toLowerCase();
  const hasProFlag = Boolean(profile?.isPro || profile?.is_pro) || planCode !== "free";
  const expiryStillValid = !expiry || new Date(expiry).getTime() > Date.now();
  const statusAllowsAccess = ACTIVE_PLAN_STATUSES.has(planStatus) || (CANCELLED_PLAN_STATUSES.has(planStatus) && expiryStillValid);
  return hasProFlag && statusAllowsAccess && expiryStillValid;
};

const hasRouteRoleAccess = (pathname: string, profile: any) => {
  const role = profile?.role;
  if (role === "admin") return true;
  if (pathname.startsWith("/family")) return role === "family";
  if (pathname.startsWith("/operations")) {
    if (["Secretary", "Driver", "Coordinator", "Setup Crew"].includes(role) && profile?.staff_business_type === "vendor") return false;
    return operationRoles.includes(role);
  }
  if (pathname.startsWith("/marketplace")) {
    if (["Secretary", "Driver", "Coordinator", "Setup Crew"].includes(role) && profile?.staff_business_type !== "vendor") return false;
    return marketplaceRoles.includes(role);
  }
  if (pathname.startsWith("/manager")) return operationRoles.includes(role) || marketplaceRoles.includes(role);
  return true;
};

export default function ProFeatureRoute({ children, redirectTo }: { children: React.ReactNode; redirectTo?: string }) {
  const { profile, loading, session } = useAuth();
  const location = useLocation();
  const fallbackRedirect = redirectTo || (location.pathname.startsWith("/marketplace") ? "/marketplace/billing" : location.pathname.startsWith("/operations") || location.pathname.startsWith("/manager") ? "/operations/billing" : "/family/billing");

  if (loading && !session) return <DominoLoader message="Checking Pro access..." fullscreen />;
  if (!session) return <Navigate to="/login" replace />;
  if (!hasRouteRoleAccess(location.pathname, profile)) return <Navigate to="/" replace />;
  if (!hasActiveProAccess(profile)) return <Navigate to={fallbackRedirect} replace />;
  return <>{children}</>;
}
