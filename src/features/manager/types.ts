export const ERP_STAFF_ROLES = ["Secretary", "Driver", "Coordinator", "Setup Crew"] as const;

export type ErpStaffRole = typeof ERP_STAFF_ROLES[number];

export type ErpRole = "Manager" | ErpStaffRole;

export const isErpStaffRole = (role?: string | null): role is ErpStaffRole =>
  !!role && ERP_STAFF_ROLES.includes(role as ErpStaffRole);

export const isManagerRole = (role?: string | null) =>
  role === "operations" || role === "marketplace" || role === "Manager" || role === "Owner / Manager";

export const getOrganizationId = (profile: any) =>
  profile?.organization_id || profile?.manager_id || profile?.home_id || profile?.provider_id || profile?.id;

export const getOrganizationType = (profile: any): "home" | "vendor" =>
  profile?.role === "marketplace" || profile?.staff_business_type === "vendor" || profile?.is_vendor ? "vendor" : "home";

export const getRoleLabel = (role?: string | null) => {
  if (isManagerRole(role)) return "Manager";
  if (role === "Setup Crew") return "Setup Crew";
  return role || "Staff";
};
