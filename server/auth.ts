import type { Request } from "express";
import { supabaseAdmin } from "./supabase-admin";

export type ServerActor = {
  id: string;
  email: string | null;
  role: string | null;
  staff_role?: string | null;
  manager_id?: string | null;
  organization_id?: string | null;
  is_pro?: boolean | null;
  plan_code?: string | null;
  plan_status?: string | null;
};

const configuredAdminEmails = () =>
  new Set(
    [process.env.ADMIN_EMAILS || "", process.env.ADMIN_EMAIL || ""]
      .join(",")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );

export async function getAuthenticatedActor(req: Request): Promise<ServerActor | null> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;

  if (process.env.NODE_ENV !== "production" && token === "mock_token") {
    return { id: "mock-user-id", email: "mock@example.com", role: "operations", staff_role: "admin", is_pro: true, plan_code: "pro" };
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;

  const email = (data.user.email || "").toLowerCase() || null;
  const metadataRole = String(data.user.user_metadata?.role || data.user.app_metadata?.role || "").toLowerCase();
  const configuredAdmins = configuredAdminEmails();

  const [{ data: profile }, { data: adminEmail }] = await Promise.all([
    supabaseAdmin
      .from("user_profiles")
      .select("role,email,is_admin,staff_role,manager_id,organization_id,is_pro,plan_code,plan_status")
      .eq("id", data.user.id)
      .maybeSingle(),
    email ? supabaseAdmin.from("admin_emails").select("id").ilike("email", email).maybeSingle() : Promise.resolve({ data: null } as any),
  ]);

  const profileRole = String(profile?.role || "").toLowerCase();
  const profileEmail = String(profile?.email || email || "").toLowerCase();
  const isAdmin =
    profileRole === "admin" ||
    metadataRole === "admin" ||
    Boolean(profile?.is_admin) ||
    Boolean(adminEmail) ||
    configuredAdmins.has(profileEmail) ||
    (email ? configuredAdmins.has(email) : false);

  const role = isAdmin ? "admin" : profile?.role || data.user.user_metadata?.role || data.user.app_metadata?.role || null;
  return {
    id: data.user.id,
    email,
    role,
    staff_role: profile?.staff_role || null,
    manager_id: profile?.manager_id || null,
    organization_id: profile?.organization_id || null,
    is_pro: Boolean(profile?.is_pro) || profile?.plan_code === "pro" || profile?.plan_status === "active",
    plan_code: profile?.plan_code || null,
    plan_status: profile?.plan_status || null,
  };
}
