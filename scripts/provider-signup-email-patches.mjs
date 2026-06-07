import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const write = (file, content) => fs.writeFileSync(path.join(root, file), content);

function patchServerIndex() {
  const file = "server/index.ts";
  let src = read(file);

  if (!src.includes('import { supabaseAdmin } from "./supabase-admin";')) {
    src = src.replace('import { emailService } from "./services/email-service";', 'import { emailService } from "./services/email-service";\nimport { supabaseAdmin } from "./supabase-admin";');
  }

  if (!src.includes('/api/auth/check-email')) {
    const routes = `
app.post("/api/auth/check-email", rateLimit("auth-check-email", 30, 15 * 60_000), async (req, res) => {
  try {
    const email = sanitizeText(req.body?.email, 180).toLowerCase();
    if (!isEmail(email)) return res.status(400).json({ error: "Enter a valid email address." });
    const { data: profile, error: profileError } = await supabaseAdmin.from("user_profiles").select("id,email").eq("email", email).maybeSingle();
    if (profileError && profileError.code !== "PGRST116") throw profileError;
    if (profile) return res.json({ exists: true });
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (usersError) throw usersError;
    const exists = Boolean(users?.users?.some((user) => String(user.email || "").toLowerCase() === email));
    res.json({ exists });
  } catch (error: any) {
    console.error("[auth/check-email]", error);
    res.status(500).json({ error: error.message || "Could not check email." });
  }
});

app.post("/api/auth/provider-account/create", rateLimit("provider-account-create", 8, 15 * 60_000), async (req, res) => {
  try {
    const email = sanitizeText(req.body?.email, 180).toLowerCase();
    const password = String(req.body?.password || "");
    const providerType = sanitizeText(req.body?.providerType || "home", 20) === "vendor" ? "vendor" : "home";
    const role = providerType === "vendor" ? "marketplace" : "operations";
    if (!isEmail(email)) return res.status(400).json({ error: "Enter a valid email address." });
    if (password.length < 8 || !/\\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) return res.status(400).json({ error: "Password must be 8+ characters and include a number and special character." });

    const { data: profile } = await supabaseAdmin.from("user_profiles").select("id").eq("email", email).maybeSingle();
    if (profile) return res.status(409).json({ error: "This email already exists. Please sign in or use another email." });

    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { email, role, is_vendor: providerType === "vendor", is_home: providerType === "home", active: true },
    });
    if (createError) {
      if (String(createError.message || "").toLowerCase().includes("already")) return res.status(409).json({ error: "This email already exists. Please sign in or use another email." });
      throw createError;
    }
    const userId = created.user?.id;
    if (!userId) throw new Error("Account could not be created.");

    const { error: profileError } = await supabaseAdmin.from("user_profiles").upsert({
      id: userId,
      email,
      role,
      is_vendor: providerType === "vendor",
      is_home: providerType === "home",
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" });
    if (profileError) throw profileError;

    if (!req.body?.skipOtp) await emailOtpService.send({ email, purpose: "signup", userId, fullName: providerType === "vendor" ? "Vendor" : "Funeral Home" });
    res.json({ ok: true, userId, email });
  } catch (error: any) {
    console.error("[auth/provider-account/create]", error);
    res.status(500).json({ error: error.message || "Could not create account." });
  }
});
`;
    src = src.replace('app.post("/api/security/validate-upload", (_req, res) => res.json({ ok: true }));', 'app.post("/api/security/validate-upload", (_req, res) => res.json({ ok: true }));' + routes);
  }

  src = src.replace(/\n\s*user_id: userId,/g, "");
  src = src.replace("email_confirm: false,", "email_confirm: true,");
  src = src.replace(
    'await emailOtpService.send({ email, purpose: "signup", userId, fullName: providerType === "vendor" ? "Vendor" : "Funeral Home" });',
    'if (!req.body?.skipOtp) await emailOtpService.send({ email, purpose: "signup", userId, fullName: providerType === "vendor" ? "Vendor" : "Funeral Home" });'
  );

  write(file, src);
}

function patchProviderWizard() {
  const file = "src/features/provider/pages/ProviderAccountSetup.tsx";
  if (!fs.existsSync(path.join(root, file))) return;
  let src = read(file);

  const oldCreate = `const exists = await postJson("/api/auth/check-email", { email: cleanEmail }).catch(() => ({ exists: false }));
      if (exists.exists) {
        setErrors({ accountEmail: "This email already exists. Please sign in or use another email." });
        return;
      }
      const role = isVendor ? "marketplace" : "operations";
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: draft.accountPassword,
        options: { data: { email: cleanEmail, role, is_vendor: isVendor, is_home: !isVendor, active: true } },
      });
      if (error) throw error;
      const userId = data.user?.id || "";
      if (!userId) throw new Error("Account could not be created. Please try again.");
      await supabase.from("user_profiles").upsert({
        id: userId,
        email: cleanEmail,
        role,
        is_vendor: isVendor,
        is_home: !isVendor,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" });
      await postJson("/api/auth/send-email-otp", { email: cleanEmail, purpose: "signup", userId });`;

  const newCreate = `const created = await postJson("/api/auth/provider-account/create", { email: cleanEmail, password: draft.accountPassword, providerType });
      const userId = String(created.userId || "");
      if (!userId) throw new Error("Account could not be created. Please try again.");`;

  src = src.replace(oldCreate, newCreate);

  const oldVerify = `await postJson("/api/auth/verify-email-otp", { email: draft.accountEmail, purpose: "signup", code: draft.code });
      update({ verified: true });`;
  const newVerify = `await postJson("/api/auth/verify-email-otp", { email: draft.accountEmail, purpose: "signup", code: draft.code });
      await supabase.auth.signInWithPassword({ email: draft.accountEmail, password: draft.accountPassword });
      update({ verified: true });`;
  src = src.replace(oldVerify, newVerify);

  write(file, src);
}

patchServerIndex();
patchProviderWizard();
