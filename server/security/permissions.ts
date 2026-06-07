import type { ServerActor } from "../auth";

export type StaffRole = "admin" | "secretary" | "driver" | "embalmer" | "coordinator" | "staff";
export type ErpAction =
  | "invite_staff"
  | "create_case"
  | "view_all_cases"
  | "view_assigned_cases"
  | "assign_tasks"
  | "update_own_tasks"
  | "view_reports"
  | "manage_vehicles"
  | "accept_requests"
  | "change_general_code"
  | "delete_cases"
  | "remove_staff"
  | "case_chat";

const adminActions: ErpAction[] = ["invite_staff", "create_case", "view_all_cases", "assign_tasks", "update_own_tasks", "view_reports", "manage_vehicles", "accept_requests", "change_general_code", "delete_cases", "remove_staff", "case_chat"];
const coordinatorActions: ErpAction[] = ["view_all_cases", "assign_tasks", "update_own_tasks", "case_chat"];
const staffActions: ErpAction[] = ["view_assigned_cases", "update_own_tasks", "case_chat"];

export function getStaffRole(actor: ServerActor | null | undefined): StaffRole {
  const raw = String((actor as any)?.staff_role || actor?.role || "staff").toLowerCase();
  if (["admin", "owner", "operations"].includes(raw)) return "admin";
  if (["secretary", "driver", "embalmer", "coordinator"].includes(raw)) return raw as StaffRole;
  return "staff";
}

export function hasErpAccess(actor: ServerActor | null | undefined) {
  return Boolean((actor as any)?.is_pro || (actor as any)?.plan_code === "pro" || (actor as any)?.role === "admin");
}

export function canErp(actor: ServerActor | null | undefined, action: ErpAction) {
  if (!actor) return false;
  if (!hasErpAccess(actor)) return false;
  const role = getStaffRole(actor);
  if (role === "admin") return adminActions.includes(action);
  if (role === "coordinator") return coordinatorActions.includes(action) || staffActions.includes(action);
  return staffActions.includes(action);
}

export function requireErpPermission(actor: ServerActor | null | undefined, action: ErpAction) {
  if (!canErp(actor, action)) {
    const role = getStaffRole(actor);
    throw new Error(`ERP permission denied for ${role}: ${action}`);
  }
}
