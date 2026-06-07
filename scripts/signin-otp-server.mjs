import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const file = path.join(root, "server/index.ts");
if (!fs.existsSync(file)) process.exit(0);
let src = fs.readFileSync(file, "utf8");

if (!src.includes('/api/auth/verify-signin-otp')) {
  const route = '\napp.post("/api/auth/verify-signin-otp", rateLimit("verify-signin-otp", 10, 15 * 60_000), async (req, res) => {\n  try {\n    const email = sanitizeText(req.body?.email, 180).toLowerCase();\n    const code = sanitizeText(req.body?.code, 12).replace(/\\D/g, "");\n    const fallbackOrigin = process.env.PUBLIC_APP_URL || process.env.APP_URL || "https://www.struta.top";\n    const redirectTo = sanitizeText(req.body?.redirectTo, 500) || fallbackOrigin + "/auth/callback";\n    if (!isEmail(email)) return res.status(400).json({ error: "Enter a valid email address." });\n    if (!code || code.length < 6) return res.status(400).json({ error: "Enter the 6-digit verification code." });\n    await emailOtpService.verify({ email, purpose: "signin", code });\n    const { supabaseAdmin } = await import("./supabase-admin");\n    const generated = await supabaseAdmin.auth.admin.generateLink({ type: "magiclink", email, options: { redirectTo } } as any);\n    if (generated.error) throw generated.error;\n    const actionLink = (generated.data as any)?.properties?.action_link;\n    if (!actionLink) throw new Error("Could not complete sign-in.");\n    res.json({ ok: true, actionLink });\n  } catch (error: any) {\n    console.error("[auth/verify-signin-otp]", error);\n    res.status(400).json({ error: error.message || "Could not verify sign-in code." });\n  }\n});\n';
  src = src.replace('app.post("/api/auth/admin-signup-bypass",', route + '\napp.post("/api/auth/admin-signup-bypass",');
  fs.writeFileSync(file, src);
}
