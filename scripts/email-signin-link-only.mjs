import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const p = (file) => path.join(root, file);
const read = (file) => fs.existsSync(p(file)) ? fs.readFileSync(p(file), "utf8") : "";
const write = (file, content) => fs.writeFileSync(p(file), content);

function patchServer() {
  const file = "server/index.ts";
  let src = read(file);
  if (!src || src.includes('/api/auth/send-signin-link')) return;
  const route = `
app.post("/api/auth/send-signin-link", rateLimit("send-signin-link", 5, 15 * 60_000), async (req, res) => {
  try {
    const email = sanitizeText(req.body?.email, 180).toLowerCase();
    const fallbackOrigin = process.env.PUBLIC_APP_URL || process.env.APP_URL || "https://www.struta.top";
    const redirectTo = sanitizeText(req.body?.redirectTo, 500) || fallbackOrigin + "/auth/callback";
    if (!isEmail(email)) return res.status(400).json({ error: "Enter a valid email address." });
    const { supabaseAdmin } = await import("./supabase-admin");
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo },
    } as any);
    if (error) throw error;
    const actionLink = (data as any)?.properties?.action_link;
    if (!actionLink) throw new Error("Could not create email link.");
    const html = '<div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:560px;margin:0 auto"><h1 style="color:#0c0b08">Sign in to Struta</h1><p>Use this secure link to access your Struta account.</p><p><a href="' + actionLink + '" style="display:inline-block;background:#c8923a;color:#0c0b08;padding:14px 22px;border-radius:999px;font-weight:700;text-decoration:none">Open Struta</a></p><p style="font-size:13px;color:#6b7280">If you did not request this, ignore this email.</p></div>';
    await emailService.send(email, "Your Struta access link", html, "Open Struta: " + actionLink);
    res.json({ ok: true, sent: true });
  } catch (error) {
    console.error("[auth/send-signin-link]", error);
    res.status(500).json({ error: "Could not send email link." });
  }
});
`;
  src = src.replace('app.post("/api/admin/email-campaigns/send",', route + '\napp.post("/api/admin/email-campaigns/send",');
  write(file, src);
}

function patchSigninLinkPage() {
  const file = "src/features/auth/pages/ForgotPassword.tsx";
  let src = read(file);
  if (!src) return;
  if (!src.includes('useLocation')) src = src.replace('import { Link } from "react-router-dom";', 'import { Link, useLocation } from "react-router-dom";');
  if (!src.includes('isSigninLinkMode')) src = src.replace('  const [loading, setLoading] = useState(false);', '  const [loading, setLoading] = useState(false);\n  const location = useLocation();\n  const isSigninLinkMode = location.pathname === "/signin-link";');
  src = src.replace(/\n\s*\/\* Beta Mode Badge \*\/[\s\S]*?<\/div>\n\s*<\/div>/, '\n        </div>');
  src = src.replace('Forgot password</h1>', '{isSigninLinkMode ? "Sign in with email link" : "Forgot password"}</h1>');
  src = src.replace('Enter your email address and we&apos;ll send you a secure reset link.', '{isSigninLinkMode ? "Enter your email address and we will send you a secure access link." : "Enter your email address and we&apos;ll send you a secure reset link."}');
  src = src.replace('const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {\n        redirectTo: getResetPasswordUrl(),\n      });\n\n      if (error) {\n        console.error("Password reset error:", error);\n      }', 'if (isSigninLinkMode) {\n        const response = await fetch("/api/auth/send-signin-link", {\n          method: "POST",\n          headers: { "Content-Type": "application/json" },\n          body: JSON.stringify({ email: email.trim().toLowerCase(), redirectTo: window.location.origin + "/auth/callback" }),\n        });\n        const data = await response.json().catch(() => ({}));\n        if (!response.ok) throw new Error(data.error || "Could not send email link.");\n      } else {\n        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: getResetPasswordUrl() });\n        if (error) console.error("Password reset error:", error);\n      }');
  src = src.replace('showSuccess("If this email exists, a password reset link has been sent. Please check your inbox.");', 'showSuccess(isSigninLinkMode ? "If this email exists, an access link has been sent. Please check your inbox." : "If this email exists, a password reset link has been sent. Please check your inbox.");');
  src = src.replace('{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send reset link"}', '{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : isSigninLinkMode ? "Send email link" : "Send reset link"}');
  src = src.replace('Remembered it?', '{isSigninLinkMode ? "Prefer password?" : "Remembered it?"}');
  write(file, src);
}

function patchLoginLinkButton() {
  const file = "src/features/auth/pages/Login.tsx";
  let src = read(file);
  if (!src || src.includes('to="/signin-link"')) return;
  src = src.replace('<Button type="submit" className="w-full btn-struta-gold h-12 rounded-full font-black" disabled={authLoading}>{authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}</Button>', '<Button type="submit" className="w-full btn-struta-gold h-12 rounded-full font-black" disabled={authLoading}>{authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}</Button><Button asChild type="button" variant="outline" className="w-full h-12 rounded-full font-black"><Link to="/signin-link">Sign in with email link</Link></Button>');
  write(file, src);
}

patchServer();
patchSigninLinkPage();
patchLoginLinkButton();
