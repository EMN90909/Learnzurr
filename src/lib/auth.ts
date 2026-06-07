export const getBaseUrl = () => {
  if (typeof window !== "undefined" && window.location) {
    return window.location.origin;
  }
  return import.meta.env.VITE_APP_URL || "https://struta.onrender.com";
};

export const getAuthCallbackUrl = () => `${getBaseUrl()}/auth/callback`;

export const getResetPasswordUrl = () => `${getBaseUrl()}/reset-password`;

export const getRoleRedirectPath = (role?: string | null, profile?: any) => {
  const staffBusinessType = profile?.staff_business_type || profile?.organization_type;
  const basePath = staffBusinessType === "vendor" ? "/marketplace" : "/operations";

  switch (role) {
    case "operations":
    case "Manager":
      return basePath;
    case "Secretary":
      return `${basePath}/secretary`;
    case "Driver":
      return `${basePath}/driver`;
    case "Setup Crew":
      return staffBusinessType === "vendor" ? "/marketplace/setup-crew" : `${basePath}/coordinator`;
    case "Embalmer":
      return staffBusinessType === "vendor" ? "/marketplace/setup-crew" : `${basePath}/embalmer`;
    case "Coordinator":
      return `${basePath}/coordinator`;
    case "Secretary / Admin officer":
    case "Driver / Transport officer":
    case "Inventory / Stores staff":
    case "Counselor / Arranger":
      return basePath;
    case "marketplace":
    case "Owner / Manager":
    case "Sales / Bookings officer":
    case "Delivery / Setup team":
    case "Inventory staff":
    case "Accountant / Cashier":
      return "/marketplace";
    case "admin":
      return "/admin";
    case "family":
    default:
      return "/family";
  }
};
