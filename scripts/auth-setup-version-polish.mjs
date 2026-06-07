import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const p = (file) => path.join(root, file);
const read = (file) => fs.existsSync(p(file)) ? fs.readFileSync(p(file), "utf8") : "";
const write = (file, content) => fs.writeFileSync(p(file), content);

function patchLogin() {
  const file = "src/features/auth/pages/Login.tsx";
  let src = read(file);
  if (!src) return;
  src = src.replace(", AlertTriangle", "");
  src = src.replace(/, Chrome/g, "");
  src = src.replace(/\n\s*<div className="flex items-center gap-1\.5 mt-2 px-2\.5 py-1 bg-amber-50 border border-amber-200 rounded-full text-\[10px\] font-bold text-amber-600 uppercase tracking-wider"><AlertTriangle className="w-3\.5 h-3\.5" \/><span>Beta Mode v0\.4<\/span><\/div>/g, "");
  src = src.replace(/\n\s*const \[emailLinkLoading, setEmailLinkLoading\] = useState\(false\);/g, "");
  src = src.replace(/\n\s*const handleGoogleSignIn = async \(\) => \{[\s\S]*?\n\s*\};\n\n\s*const sendSigninLink = async \(\) => \{[\s\S]*?\n\s*\};\n\n\s*const handleLogin =/, "\n\n  const handleLogin =");
  src = src.replace(/<Button type="button" variant="outline" className="w-full h-12 rounded-full font-black" onClick=\{handleGoogleSignIn\} disabled=\{authLoading\}><Chrome className="w-4 h-4 mr-2" \/>Sign in with Google<\/Button>/g, "");
  src = src.replace(/<Button type="button" variant="outline" className="w-full h-12 rounded-full font-black" onClick=\{sendSigninLink\} disabled=\{emailLinkLoading\}>\{emailLinkLoading \? <Loader2 className="w-4 h-4 animate-spin mr-2" \/> : <Send className="w-4 h-4 mr-2" \/>\}Email me a sign-in link<\/Button>/g, '<Button asChild type="button" variant="outline" className="w-full h-12 rounded-full font-black"><Link to="/signin-link">Sign in with email link</Link></Button>');
  if (!src.includes('to="/signin-link"')) {
    src = src.replace('<Button type="submit" className="w-full btn-struta-gold h-12 rounded-full font-black" disabled={authLoading}>{authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}</Button>', '<Button type="submit" className="w-full btn-struta-gold h-12 rounded-full font-black" disabled={authLoading}>{authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}</Button><Button asChild type="button" variant="outline" className="w-full h-12 rounded-full font-black"><Link to="/signin-link">Sign in with email link</Link></Button>');
  }
  write(file, src);
}

function patchForgotPassword() {
  const file = "src/features/auth/pages/ForgotPassword.tsx";
  let src = read(file);
  if (!src || src.includes('isSigninLinkMode')) return;
  src = src.replace('import { Link } from "react-router-dom";', 'import { Link, useLocation } from "react-router-dom";');
  src = src.replace('  const [loading, setLoading] = useState(false);', '  const [loading, setLoading] = useState(false);\n  const location = useLocation();\n  const isSigninLinkMode = location.pathname === "/signin-link";');
  src = src.replace('      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {\n        redirectTo: getResetPasswordUrl(),\n      });\n\n      if (error) {\n        console.error("Password reset error:", error);\n      }', '      if (isSigninLinkMode) {\n        const response = await fetch("/api/auth/send-signin-link", {\n          method: "POST",\n          headers: { "Content-Type": "application/json" },\n          body: JSON.stringify({ email: email.trim().toLowerCase(), redirectTo: window.location.origin + "/auth/callback" }),\n        });\n        const data = await response.json().catch(() => ({}));\n        if (!response.ok) throw new Error(data.error || "Could not send email link.");\n      } else {\n        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: getResetPasswordUrl() });\n        if (error) console.error("Password reset error:", error);\n      }');
  src = src.replace('showSuccess("If this email exists, a password reset link has been sent. Please check your inbox.");', 'showSuccess(isSigninLinkMode ? "If this email exists, an access link has been sent. Please check your inbox." : "If this email exists, a password reset link has been sent. Please check your inbox.");');
  src = src.replace('Forgot password</h1>', '{isSigninLinkMode ? "Sign in with email link" : "Forgot password"}</h1>');
  src = src.replace('Enter your email address and we&apos;ll send you a secure reset link.', '{isSigninLinkMode ? "Enter your email address and we will send you a secure access link." : "Enter your email address and we&apos;ll send you a secure reset link."}');
  src = src.replace('{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send reset link"}', '{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : isSigninLinkMode ? "Send email link" : "Send reset link"}');
  write(file, src);
}

function patchProviderSetup() {
  const file = "src/features/provider/pages/ProviderAccountSetup.tsx";
  let src = read(file);
  if (!src) return;

  src = src.replace(/, Chrome/g, "");
  src = src.replace(/\n\s*const handleGoogleSetup = async \(\) => \{[\s\S]*?\n\s*\};\n\n\s*const validate =/, "\n\n  const validate =");
  src = src.replace(/<Button type="button" variant="outline" className="w-full h-12 rounded-full font-black" onClick=\{handleGoogleSetup\} disabled=\{loading\}><Chrome className="w-4 h-4 mr-2" \/>Continue with Google<\/Button>/g, "");
  src = src.replace(/\.provider-setup-orb\{animation:setupFloat 7s ease-in-out infinite\}\.provider-setup-orb:nth-child\(2\)\{animation-delay:-2s\}@keyframes setupFloat\{0%,100%\{transform:translateY\(0\) rotate\(0deg\);opacity:\.55\}50%\{transform:translateY\(-18px\) rotate\(8deg\);opacity:\.9\}\}/g, "");
  src = src.replace(/\n\s*<div className="provider-setup-orb[^>]*" \/>/g, "");
  src = src.replace(/\n\s*<div className="provider-setup-building[\s\S]*?<\/div>\n\s*<div className="relative z-10/g, '\n        <div className="relative z-10');
  src = src.replace(/<span className="h-28[\s\S]*?<\/span>\n\s*<\/div>/g, "");

  src = src.replace(/<div className="inline-flex rounded-\[2rem\] bg-\[var\(--clay-bg\)\] border border-\[var\(--clay-border\)\] shadow-\[var\(--clay-shadow\)\] px-8 py-5 text-5xl font-black tracking-tight text-\[var\(--ink\)\] dark:text-\[#f6efe4\]">Struta<\/div>/g, '<p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--gold)]">Struta</p>');
  src = src.replace(/<div className="rounded-\[2rem\] bg-\[var\(--clay-bg\)\] border border-\[var\(--clay-border\)\] shadow-\[var\(--clay-shadow-soft\)\] p-6"><p className="text-sm font-black uppercase tracking-\[0\.16em\] text-\[var\(--gold\)\]">East Africa<\/p><p className="mt-2 text-2xl font-black text-\[var\(--ink\)\] dark:text-\[#f6efe4\]">A dignified digital presence for care providers\.<\/p><\/div>/g, '<p className="text-sm font-bold text-[var(--muted)] dark:text-[#c8bda9] max-w-md">Built for East African care providers who need a clean, dignified digital presence.</p>');
  src = src.replace(/<aside className="setup-art hidden lg:flex relative min-h-screen w-full overflow-hidden border-r border-\[var\(--clay-border\)\] items-center justify-center p-12">/g, '<aside className="setup-art hidden lg:flex relative min-h-screen w-full overflow-hidden border-r border-[var(--clay-border)] items-center justify-center p-12 bg-[var(--paper)]">');
  write(file, src);
}

function patchPortalVersion() {
  const file = "src/components/layout/PortalLayout.tsx";
  let src = read(file);
  if (!src || src.includes("Struta v0.6")) return;

  src = src.replace('<Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleLogout}><LogOut className="w-4 h-4 mr-2" />Logout</Button></div>\n      </aside>', '<Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleLogout}><LogOut className="w-4 h-4 mr-2" />Logout</Button><p className="pt-2 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--muted)] text-center">Struta v0.6</p></div>\n      </aside>');
  src = src.replace('<nav className="flex-1 p-4 space-y-1">{currentNav.map((item) => <NavLink key={item.path} item={item} />)}</nav></aside></div>}', '<nav className="flex-1 p-4 space-y-1">{currentNav.map((item) => <NavLink key={item.path} item={item} />)}</nav><p className="px-4 pb-4 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--muted)] text-center">Struta v0.6</p></aside></div>}');
  write(file, src);
}

patchLogin();
patchForgotPassword();
patchProviderSetup();
patchPortalVersion();