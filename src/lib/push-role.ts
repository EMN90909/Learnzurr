export function mapProfileRoleToPushRole(role?: string, staffBusinessType?: string): "bereaved" | "home" | "vendor" | null {
  if (role === "family") return "bereaved";
  if (role === "operations") return "home";
  if (role === "marketplace") return "vendor";
  if (["Secretary", "Driver", "Embalmer", "Coordinator", "Setup Crew", "Manager"].includes(role || "")) {
    return staffBusinessType === "vendor" ? "vendor" : "home";
  }
  return null;
}
