import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const p = (file) => path.join(root, file);
const read = (file) => fs.existsSync(p(file)) ? fs.readFileSync(p(file), "utf8") : "";
const write = (file, content) => fs.writeFileSync(p(file), content);

function patchServer() {
  const file = "server/index.ts";
  let src = read(file);
  if (!src) return;

  const existsCheck = `
    const [{ supabaseAdmin }] = await Promise.all([import("./supabase-admin")]);
    const { data: profile } = await supabaseAdmin.from("user_profiles").select("id,email").eq("email", email).maybeSingle();
    let knownUser = Boolean(profile);
    if (!knownUser) {
      const listed = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (listed.error) throw listed.error;
      knownUser = Boolean(listed.data.users?.some((user: any) => String(user.email || "").toLowerCase() === email));
    }
    if (!knownUser) return res.status(404).json({ error: "No account exists for this email. Create an account first." });`;

  if (!src.includes('No account exists for this email. Create an account first.')) {
    src = src.replace('    if (purpose !== "signup" && purpose !== "signin") return res.status(400).json({ error: "Invalid OTP purpose." });\n    await emailOtpService.send({ email, purpose, userId, fullName });', '    if (purpose !== "signup" && purpose !== "signin") return res.status(400).json({ error: "Invalid OTP purpose." });\n    if (purpose === "signin") {' + existsCheck + '\n    }\n    await emailOtpService.send({ email, purpose, userId, fullName });');
  }

  if (src.includes('/api/auth/send-signin-link') && !src.includes('[auth/send-signin-link-known-check]')) {
    src = src.replace('    if (!isEmail(email)) return res.status(400).json({ error: "Enter a valid email address." });\n    const { supabaseAdmin } = await import("./supabase-admin");', '    if (!isEmail(email)) return res.status(400).json({ error: "Enter a valid email address." });\n    const { supabaseAdmin } = await import("./supabase-admin");\n    console.log("[auth/send-signin-link-known-check]", email);\n    const { data: profile } = await supabaseAdmin.from("user_profiles").select("id,email").eq("email", email).maybeSingle();\n    let knownUser = Boolean(profile);\n    if (!knownUser) {\n      const listed = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });\n      if (listed.error) throw listed.error;\n      knownUser = Boolean(listed.data.users?.some((user: any) => String(user.email || "").toLowerCase() === email));\n    }\n    if (!knownUser) return res.status(404).json({ error: "No account exists for this email. Create an account first." });');
  }

  write(file, src);
}

function patchFamilyPremium() {
  const files = [
    "src/App.tsx",
    "src/components/layout/PortalLayout.tsx",
    "src/features/bereaved/pages/Billing.tsx",
    "src/components/ProFeatureRoute.tsx",
    "src/lib/memorial-plans.ts",
    "scripts/final-family-provider-fixes.mjs"
  ];
  for (const file of files) {
    let src = read(file);
    if (!src) continue;
    src = src.replace(/<Route path="\/family\/billing"[^>]*>.*?<\/Route>/g, '<Route path="/family/billing" element={<Navigate to="/family" replace />} />');
    src = src.replace(/\{ label: "Billing", icon: CreditCard, path: "\/family\/billing"[^}]*\},?/g, "");
    src = src.replace(/Family Premium/g, "Family Tools");
    src = src.replace(/Premium Plan/g, "");
    src = src.replace(/Premium memorial pages \(custom layouts, more photos\)/g, "Custom memorial pages");
    src = src.replace(/Upgrade to Family Tools/g, "");
    src = src.replace(/Upgrade to Family Premium/g, "");
    src = src.replace(/Upgrade when you need premium memorial and planning tools\./g, "Memorial and planning tools are available to families.");
    src = src.replace(/Available for Family Tools\./g, "Available for families.");
    src = src.replace(/Upgrade to unlock AI family tools\./g, "AI family tools are available from the Create page.");
    src = src.replace(/disabled=\{!isPro\}/g, "");
    write(file, src);
  }
}

patchServer();
patchFamilyPremium();
