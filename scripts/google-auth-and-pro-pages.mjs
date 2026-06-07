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
    if (!actionLink) throw new Error("Could not create sign-in link.");
    const html = '<div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:560px;margin:0 auto"><h1 style="color:#0c0b08">Sign in to Struta</h1><p>Use this secure link to sign in to your Struta account.</p><p><a href="' + actionLink + '" style="display:inline-block;background:#c8923a;color:#0c0b08;padding:14px 22px;border-radius:999px;font-weight:700;text-decoration:none">Sign in securely</a></p><p style="font-size:13px;color:#6b7280">If you did not request this, ignore this email.</p></div>';
    await emailService.send(email, "Your Struta sign-in link", html, "Sign in to Struta: " + actionLink);
    res.json({ ok: true, sent: true });
  } catch (error) {
    console.error("[auth/send-signin-link]", error);
    res.status(500).json({ error: "Could not send sign-in link." });
  }
});
`;
  src = src.replace('app.post("/api/admin/email-campaigns/send",', route + '\napp.post("/api/admin/email-campaigns/send",');
  write(file, src);
}

function patchLogin() {
  const file = "src/features/auth/pages/Login.tsx";
  let src = read(file);
  if (!src || src.includes('handleGoogleSignIn')) return;
  src = src.replace('import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";', 'import { Loader2, Mail, Lock, Eye, EyeOff, Chrome, Send } from "lucide-react";');
  src = src.replace('const [showPassword, setShowPassword] = useState(false);', 'const [showPassword, setShowPassword] = useState(false);\n  const [emailLinkLoading, setEmailLinkLoading] = useState(false);');
  src = src.replace('  const handleLogin = async (e: React.FormEvent) => {', `  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin + "/auth/callback" },
      });
      if (error) throw error;
    } catch (error: any) {
      showError(error.message || "Could not start Google sign-in.");
      setAuthLoading(false);
    }
  };

  const sendSigninLink = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!isEmail(cleanEmail)) return showError("Enter your email first.");
    setEmailLinkLoading(true);
    try {
      const response = await fetch("/api/auth/send-signin-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, redirectTo: window.location.origin + "/auth/callback" }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not send sign-in link.");
      showSuccess("We sent a secure sign-in link to your email.");
    } catch (error: any) {
      showError(error.message || "Could not send sign-in link.");
    } finally {
      setEmailLinkLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {`);
  src = src.replace('<Button type="submit" className="w-full btn-struta-gold h-12 rounded-full font-black" disabled={authLoading}>{authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}</Button>', '<Button type="submit" className="w-full btn-struta-gold h-12 rounded-full font-black" disabled={authLoading}>{authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}</Button><Button type="button" variant="outline" className="w-full h-12 rounded-full font-black" onClick={handleGoogleSignIn} disabled={authLoading}><Chrome className="w-4 h-4 mr-2" />Sign in with Google</Button><Button type="button" variant="outline" className="w-full h-12 rounded-full font-black" onClick={sendSigninLink} disabled={emailLinkLoading}>{emailLinkLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}Email me a sign-in link</Button>');
  write(file, src);
}

function patchProviderSetup() {
  const file = "src/features/provider/pages/ProviderAccountSetup.tsx";
  let src = read(file);
  if (!src) return;
  if (!src.includes('Chrome')) src = src.replace('UploadCloud } from "lucide-react";', 'UploadCloud, Chrome } from "lucide-react";');
  if (!src.includes('handleGoogleSetup')) {
    src = src.replace('  const validate = (target = step) => {', `  const handleGoogleSetup = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin + "/auth/callback?providerSetup=1&type=" + providerType },
      });
      if (error) throw error;
    } catch (error: any) {
      showError(error.message || "Could not start Google sign-in.");
      setLoading(false);
    }
  };

  const validate = (target = step) => {`);
  }
  if (!src.includes('Continue with Google')) {
    src = src.replace('<Link to="/login" className="block text-center text-sm font-black text-[var(--gold)] hover:underline">Already have an account?</Link>', '<Button type="button" variant="outline" className="w-full h-12 rounded-full font-black" onClick={handleGoogleSetup} disabled={loading}><Chrome className="w-4 h-4 mr-2" />Continue with Google</Button><Link to="/login" className="block text-center text-sm font-black text-[var(--gold)] hover:underline">Already have an account?</Link>');
  }
  write(file, src);
}

function patchAuthCallback() {
  const file = "src/features/auth/pages/AuthCallback.tsx";
  const content = `"use client";

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getRoleRedirectPath } from "@/lib/auth";
import { showError, showSuccess } from "@/utils/toast";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const completeAuth = async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        const providerSetup = url.searchParams.get("providerSetup") === "1";
        const providerType = url.searchParams.get("type") === "vendor" ? "vendor" : "home";
        const errorDescription = url.searchParams.get("error_description");
        if (errorDescription) throw new Error(errorDescription);
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!data.session) throw new Error("No active session found. Please try logging in again.");

        const user = data.session.user;
        const email = user.email || "";
        const fullName = user.user_metadata?.full_name || user.user_metadata?.name || email.split("@")[0] || "Struta User";
        const role = providerSetup ? (providerType === "vendor" ? "marketplace" : "operations") : (user.user_metadata?.role || "family");
        const providerPatch = providerSetup ? { is_vendor: providerType === "vendor", is_home: providerType === "home" } : {};

        const { data: existingProfile } = await supabase.from("user_profiles").select("*").eq("id", user.id).maybeSingle();
        let profile = existingProfile;
        if (!profile) {
          const richPayload: any = { id: user.id, email, full_name: fullName, role, active: true, email_verified_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...providerPatch };
          const { data: created, error: richError } = await supabase.from("user_profiles").upsert(richPayload, { onConflict: "id" }).select("*").maybeSingle();
          if (richError) {
            const minimalPayload: any = { id: user.id, email, full_name: fullName, role, updated_at: new Date().toISOString() };
            const { data: fallback, error: fallbackError } = await supabase.from("user_profiles").upsert(minimalPayload, { onConflict: "id" }).select("*").maybeSingle();
            if (fallbackError) throw fallbackError;
            profile = fallback;
          } else {
            profile = created;
          }
        }

        showSuccess(providerSetup ? "Google verified. Continue setup." : "Authentication complete.");
        if (providerSetup) {
          localStorage.setItem("struta_" + providerType + "_setup_clean", JSON.stringify({ accountEmail: email, contactEmail: email, contactName: fullName, linkSent: true, linkConfirmed: true }));
          navigate("/provider/setup?type=" + providerType + "&step=3&email=" + encodeURIComponent(email), { replace: true });
          return;
        }
        navigate(getRoleRedirectPath(profile?.role || role, profile || { role }), { replace: true });
      } catch (error: any) {
        console.error("Auth callback error:", error);
        setErrorMsg(error.message || "Authentication failed.");
        showError(error.message || "Authentication failed.");
        setTimeout(() => navigate("/login", { replace: true }), 3000);
      }
    };
    void completeAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[var(--paper)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[var(--surface)] rounded-2xl shadow-xl p-8 border border-[var(--border)] text-center space-y-4">
        {errorMsg ? <div className="space-y-3"><p className="text-red-600 font-bold">Authentication Failed</p><p className="text-sm text-[var(--muted)]">{errorMsg}</p><p className="text-xs text-[var(--muted)]">Redirecting to login page...</p></div> : <div className="flex flex-col items-center gap-3 text-[var(--ink)]"><Loader2 className="w-8 h-8 animate-spin text-[var(--gold)]" /><span className="font-bold">Completing sign-in...</span></div>}
      </div>
    </div>
  );
}
`;
  write(file, content);
}

function patchAppRoutes() {
  const file = "src/App.tsx";
  let src = read(file);
  if (!src) return;
  if (!src.includes('PriorityMatching from "./features/provider/pages/PriorityMatching"')) {
    src = src.replace('import VendorSettings from "./features/marketplace/pages/Settings";', 'import VendorSettings from "./features/marketplace/pages/Settings";\nimport PriorityMatching from "./features/provider/pages/PriorityMatching";');
  }
  if (!src.includes('path="/operations/priority"')) {
    src = src.replace('<Route path="/operations/billing" element={<ProtectedRoute allowedRoles={["operations"]}><BillingPage /></ProtectedRoute>} />', '<Route path="/operations/priority" element={<ProFeatureRoute redirectTo="/operations/billing"><PriorityMatching /></ProFeatureRoute>} /><Route path="/operations/billing" element={<ProtectedRoute allowedRoles={["operations"]}><BillingPage /></ProtectedRoute>} />');
  }
  if (!src.includes('path="/marketplace/priority"')) {
    src = src.replace('<Route path="/marketplace/billing" element={<ProtectedRoute allowedRoles={["marketplace"]}><BillingPage /></ProtectedRoute>} />', '<Route path="/marketplace/priority" element={<ProFeatureRoute redirectTo="/marketplace/billing"><PriorityMatching /></ProFeatureRoute>} /><Route path="/marketplace/billing" element={<ProtectedRoute allowedRoles={["marketplace"]}><BillingPage /></ProtectedRoute>} />');
  }
  write(file, src);
}

patchServer();
patchLogin();
patchProviderSetup();
patchAuthCallback();
patchAppRoutes();
