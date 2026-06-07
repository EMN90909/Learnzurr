import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const p = (file) => path.join(root, file);
const read = (file) => fs.existsSync(p(file)) ? fs.readFileSync(p(file), "utf8") : "";
const write = (file, content) => fs.writeFileSync(p(file), content);

function patchSettingsPassword() {
  const file = "src/features/bereaved/pages/Settings.tsx";
  let src = read(file);
  if (!src) return;

  src = src.replace('  const [passwordForm, setPasswordForm] = useState({\n    newPassword: "",\n    confirmPassword: "",\n  });', '  const [passwordForm, setPasswordForm] = useState({\n    currentPassword: "",\n    newPassword: "",\n    confirmPassword: "",\n  });');

  src = src.replace('    if (!passwordForm.newPassword) return showError("Please enter a new password.");\n    if (passwordForm.newPassword !== passwordForm.confirmPassword) return showError("Passwords do not match.");', '    const email = user?.email || profile?.email;\n    if (!email) return showError("Email is missing from this account. Please sign out and sign in again.");\n    if (!passwordForm.currentPassword) return showError("Enter your old password first.");\n    if (!passwordForm.newPassword) return showError("Please enter a new password.");\n    if (passwordForm.newPassword.length < 8) return showError("New password must be at least 8 characters.");\n    if (passwordForm.newPassword !== passwordForm.confirmPassword) return showError("Passwords do not match.");\n    if (passwordForm.currentPassword === passwordForm.newPassword) return showError("New password must be different from old password.");');

  src = src.replace('    try {\n\n      const { error } = await supabase.auth.updateUser({ password: passwordForm.newPassword });\n      if (error) throw error;\n      showSuccess("Password updated successfully.");\n      setPasswordForm({ newPassword: "", confirmPassword: "" });', '    try {\n      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: passwordForm.currentPassword });\n      if (signInError) throw new Error("Old password is incorrect.");\n      const { error } = await supabase.auth.updateUser({ password: passwordForm.newPassword });\n      if (error) throw error;\n      showSuccess("Password updated successfully.");\n      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });');

  src = src.replace('<CardHeader><CardTitle>Security</CardTitle><CardDescription>Update your password from this signed-in session or permanently delete your account.</CardDescription></CardHeader>', '<CardHeader><CardTitle>Security</CardTitle><CardDescription>Enter your old password, then choose a new password.</CardDescription></CardHeader>');

  if (!src.includes('<Label>Old Password</Label>')) {
    src = src.replace('<form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">\n                    <div className="space-y-2"><Label>New Password</Label>', '<form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">\n                    <div className="space-y-2"><Label>Old Password</Label><Input type="password" autoComplete="current-password" required value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} /></div>\n                    <div className="space-y-2"><Label>New Password</Label>');
  }
  src = src.replace('<Input type="password" required value={passwordForm.newPassword}', '<Input type="password" autoComplete="new-password" required value={passwordForm.newPassword}');
  src = src.replace('<Input type="password" required value={passwordForm.confirmPassword}', '<Input type="password" autoComplete="new-password" required value={passwordForm.confirmPassword}');
  write(file, src);
}

function patchNotFoundRedirect() {
  const file = "src/pages/NotFound.tsx";
  let src = read(file);
  if (!src) return;
  if (!src.includes('useAuth')) src = src.replace('import { Link, useLocation, useNavigate } from "react-router-dom";', 'import { Link, useLocation, useNavigate } from "react-router-dom";\nimport { useEffect } from "react";\nimport { useAuth } from "@/components/auth/AuthProvider";\nimport { getRoleRedirectPath } from "@/lib/auth";');
  if (!src.includes('redirectPath = getRoleRedirectPath')) {
    src = src.replace('  const navigate = useNavigate();', '  const navigate = useNavigate();\n  const { session, profile, loading } = useAuth();\n\n  useEffect(() => {\n    if (loading || !session || !profile) return;\n    const badPath = location.pathname === "/*" || location.pathname === "*" || location.pathname === "/auth/v1/callback";\n    if (badPath) {\n      const redirectPath = getRoleRedirectPath(profile.role, profile);\n      navigate(redirectPath, { replace: true });\n    }\n  }, [loading, session, profile, location.pathname, navigate]);');
  }
  write(file, src);
}

function patchAuthCallbackHash() {
  const file = "src/features/auth/pages/AuthCallback.tsx";
  let src = read(file);
  if (!src || src.includes('hashParams = new URLSearchParams')) return;
  src = src.replace('        const url = new URL(window.location.href);\n        const code = url.searchParams.get("code");', '        const url = new URL(window.location.href);\n        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));\n        const code = url.searchParams.get("code");\n        const hashAccessToken = hashParams.get("access_token");\n        const hashRefreshToken = hashParams.get("refresh_token");');
  src = src.replace('        if (code) {\n          const { error } = await supabase.auth.exchangeCodeForSession(code);\n          if (error) throw error;\n        }', '        if (code) {\n          const { error } = await supabase.auth.exchangeCodeForSession(code);\n          if (error) throw error;\n        } else if (hashAccessToken && hashRefreshToken) {\n          const { error } = await supabase.auth.setSession({ access_token: hashAccessToken, refresh_token: hashRefreshToken });\n          if (error) throw error;\n        }');
  write(file, src);
}

function patchSigninLinkUi() {
  const file = "src/features/auth/pages/ForgotPassword.tsx";
  let src = read(file);
  if (!src) return;
  src = src.replace('showSuccess(isSigninLinkMode ? "If this email exists, an access link has been sent. Please check your inbox." : "If this email exists, a password reset link has been sent. Please check your inbox.");', 'showSuccess(isSigninLinkMode ? "Access link sent. Check your inbox and open the link to continue." : "If this email exists, a password reset link has been sent. Please check your inbox.");');
  src = src.replace('<div className="w-full max-w-md bg-[var(--surface)] rounded-2xl shadow-xl p-8 border border-[var(--border)]">', '<div className="w-full max-w-md bg-[var(--surface)] rounded-[2rem] shadow-[0_22px_70px_rgba(12,11,8,0.12)] p-8 border border-[var(--border)]">');
  src = src.replace('{isSigninLinkMode ? "Enter your email address and we will send you a secure access link." : "Enter your email address and we&apos;ll send you a secure reset link."}', '{isSigninLinkMode ? "Enter your email. We will send a secure link that opens the correct dashboard for your account." : "Enter your email address and we&apos;ll send you a secure reset link."}');
  write(file, src);
}

patchSettingsPassword();
patchNotFoundRedirect();
patchAuthCallbackHash();
patchSigninLinkUi();