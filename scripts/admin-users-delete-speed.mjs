import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const p = (file) => path.join(root, file);
const read = (file) => fs.existsSync(p(file)) ? fs.readFileSync(p(file), "utf8") : "";
const write = (file, content) => fs.writeFileSync(p(file), content);

function patchServer() {
  const file = "server/index.ts";
  let src = read(file);
  if (!src || src.includes('/api/admin/users')) return;
  const route = `
app.get("/api/admin/users", rateLimit("admin-users", 60, 15 * 60_000), async (req, res) => {
  try {
    const [{ getAuthenticatedActor }, { supabaseAdmin }] = await Promise.all([import("./auth"), import("./supabase-admin")]);
    const actor: any = await getAuthenticatedActor(req);
    if (!actor) return res.status(401).json({ error: "Authentication required." });
    if ((actor.role || "").toLowerCase() !== "admin") return res.status(403).json({ error: "Admin access required." });
    const page = Math.max(1, Number(req.query.page || 1));
    const perPage = Math.min(100, Math.max(10, Number(req.query.perPage || 50)));
    const authUsersResult = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (authUsersResult.error) throw authUsersResult.error;
    const authUsers = authUsersResult.data.users || [];
    const ids = authUsers.map((user: any) => user.id).filter(Boolean);
    const emails = authUsers.map((user: any) => String(user.email || "").toLowerCase()).filter(Boolean);
    let profiles: any[] = [];
    if (ids.length) {
      const byId = await supabaseAdmin.from("user_profiles").select("*").in("id", ids);
      if (byId.data) profiles = byId.data;
    }
    const profileById = new Map(profiles.map((profile: any) => [profile.id, profile]));
    const missingEmails = emails.filter((email) => !profiles.some((profile: any) => String(profile.email || "").toLowerCase() === email));
    if (missingEmails.length) {
      const byEmail = await supabaseAdmin.from("user_profiles").select("*").in("email", missingEmails);
      if (byEmail.data) for (const profile of byEmail.data) if (!profileById.has(profile.id)) profileById.set(profile.id, profile);
    }
    const profileByEmail = new Map(Array.from(profileById.values()).map((profile: any) => [String(profile.email || "").toLowerCase(), profile]));
    const users = authUsers.map((user: any) => {
      const profile = profileById.get(user.id) || profileByEmail.get(String(user.email || "").toLowerCase()) || {};
      return {
        id: user.id,
        email: user.email || profile.email || "",
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        email_confirmed_at: user.email_confirmed_at,
        full_name: profile.full_name || user.user_metadata?.full_name || user.user_metadata?.name || "",
        role: profile.role || user.user_metadata?.role || "family",
        phone: profile.phone || "",
        country: profile.country || profile.business_country || "",
        is_banned: Boolean(profile.is_banned || profile.account_flagged || user.banned_until),
        banned_until: profile.banned_until || user.banned_until || null,
        plan_code: profile.plan_code || "free",
        plan_status: profile.plan_status || profile.subscription_status || "free",
        profile,
      };
    });
    res.json({ ok: true, users, page, perPage, total: authUsersResult.data.total || users.length });
  } catch (error: any) {
    console.error("[admin/users]", error);
    res.status(500).json({ error: error.message || "Could not load users." });
  }
});
`;
  src = src.replace('app.post("/api/admin/email-campaigns/send",', route + '\napp.post("/api/admin/email-campaigns/send",');
  write(file, src);
}

function patchAppRoutes() {
  const file = "src/App.tsx";
  let src = read(file);
  if (!src) return;
  if (!src.includes('AdminUsersPage')) {
    src = src.replace('import AdminCustomisePage from "./features/admin/pages/Customise";', 'import AdminCustomisePage from "./features/admin/pages/Customise";\nimport AdminUsersPage from "./features/admin/pages/Users";');
  }
  if (!src.includes('path="/admin/users"')) {
    src = src.replace('<Route path="/admin/requests" element={<ProtectedRoute allowedRoles={["admin"]}><AdminRequests /></ProtectedRoute>} />', '<Route path="/admin/users" element={<ProtectedRoute allowedRoles={["admin"]}><AdminUsersPage /></ProtectedRoute>} /><Route path="/admin/requests" element={<ProtectedRoute allowedRoles={["admin"]}><AdminRequests /></ProtectedRoute>} />');
  }
  write(file, src);
}

function patchPortalNav() {
  const file = "src/components/layout/PortalLayout.tsx";
  let src = read(file);
  if (!src) return;
  if (!src.includes('path: "/admin/users"')) {
    src = src.replace('{ label: "ERP Overview", icon: ShieldCheck, path: "/admin" },', '{ label: "ERP Overview", icon: ShieldCheck, path: "/admin" }, { label: "Users", icon: Users, path: "/admin/users" },');
  }
  write(file, src);
}

function patchAuthProviderSpeed() {
  const file = "src/components/auth/AuthProvider.tsx";
  let src = read(file);
  if (!src) return;
  src = src.replace('const withTimeout = async <T,>(promise: Promise<T>, ms = 5000, label = "Request timeout")', 'const withTimeout = async <T,>(promise: Promise<T>, ms = 2500, label = "Request timeout")');
  src = src.replace('const result = await withTimeout(profilePromise, 5000, "Profile fetch timeout");', 'const result = await withTimeout(profilePromise, 2500, "Profile fetch timeout");');
  src = src.replace('try { const { data: { session: supabaseSession }, error } = await supabase.auth.getSession();', 'try { const { data: { session: supabaseSession }, error } = await withTimeout(supabase.auth.getSession(), 2500, "Session fetch timeout");');
  write(file, src);
}

patchServer();
patchAppRoutes();
patchPortalNav();
patchAuthProviderSpeed();
