"use client";

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getRoleRedirectPath } from "@/lib/auth";
import { showError, showSuccess } from "@/utils/toast";

const safeNextPath = (value: string | null) => {
  if (!value) return "";
  try {
    const decoded = decodeURIComponent(value);
    if (!decoded.startsWith("/") || decoded.startsWith("//")) return "";
    if (["/login", "/signin-link", "/auth/callback"].some((blocked) => decoded.startsWith(blocked))) return "";
    return decoded;
  } catch {
    return "";
  }
};

const inferRole = (user: any, profile: any) => {
  const role = profile?.role || user?.user_metadata?.role || user?.app_metadata?.role;
  if (role) return role;
  if (profile?.is_vendor || profile?.organization_type === "vendor" || profile?.staff_business_type === "vendor") return "marketplace";
  if (profile?.is_home || profile?.organization_type === "home" || profile?.staff_business_type === "home") return "operations";
  return "family";
};

export default function AuthCallback() {
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const completeAuth = async () => {
      try {
        const url = new URL(window.location.href);
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const code = url.searchParams.get("code");
        const hashAccessToken = hashParams.get("access_token");
        const hashRefreshToken = hashParams.get("refresh_token");
        const type = url.searchParams.get("type") || new URLSearchParams(window.location.hash.replace(/^#/, "")).get("type");
        const next = safeNextPath(url.searchParams.get("next"));
        const errorDescription = url.searchParams.get("error_description");
        if (errorDescription) {
          if (url.searchParams.get("error_code") === "otp_expired") throw new Error("Reset link is invalid or expired. Please request a fresh password reset email.");
          throw new Error(errorDescription);
        }
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (hashAccessToken && hashRefreshToken) {
          const { error } = await supabase.auth.setSession({ access_token: hashAccessToken, refresh_token: hashRefreshToken });
          if (error) throw error;
        }

        let sessionResult = await supabase.auth.getSession();
        if (!sessionResult.data.session) {
          await new Promise((resolve) => setTimeout(resolve, 650));
          sessionResult = await supabase.auth.getSession();
        }
        if (sessionResult.error) throw sessionResult.error;
        if (!sessionResult.data.session) throw new Error("No active session found. Please try logging in again.");

        if (type === "recovery" || next.startsWith("/accounts/newpsw") || next.startsWith("/reset-password")) {
          showSuccess("Reset link verified. Create a new password.");
          navigate("/reset-password", { replace: true });
          return;
        }

        const user = sessionResult.data.session.user;
        const { data: profile, error: profileError } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();
        if (profileError) console.warn("Profile fetch error in callback:", profileError.message);

        const role = inferRole(user, profile);
        const redirectPath = next || getRoleRedirectPath(role, profile || user.user_metadata || { role });
        showSuccess("Authentication complete.");
        navigate(redirectPath, { replace: true });
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
        {errorMsg ? (
          <div className="space-y-3"><p className="text-red-600 font-bold">Authentication Failed</p><p className="text-sm text-[var(--muted)]">{errorMsg}</p><p className="text-xs text-[var(--muted)]">Redirecting to login page...</p></div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-[var(--ink)]"><Loader2 className="w-8 h-8 animate-spin text-[var(--gold)]" /><span className="font-bold">Checking secure link...</span></div>
        )}
      </div>
    </div>
  );
}
