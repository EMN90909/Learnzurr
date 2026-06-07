"use client";

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Lock, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showError, showSuccess } from "@/utils/toast";

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

const resetError = (message?: string) => {
  const lower = String(message || "").toLowerCase();
  if (lower.includes("expired") || lower.includes("invalid") || lower.includes("otp")) return "Reset link is invalid, expired, or already used. Please request a fresh password reset email.";
  return message || "Could not open reset session.";
};

export default function ResetPassword() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    let mounted = true;
    const markReadyFromSession = async () => {
      for (let i = 0; i < 6; i += 1) {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (data.session) {
          if (!mounted) return true;
          setUserEmail(data.session.user.email || null);
          setReady(true);
          window.history.replaceState({}, document.title, "/reset-password");
          return true;
        }
        await wait(250);
      }
      return false;
    };

    const init = async () => {
      try {
        const url = new URL(window.location.href);
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const errorDescription = url.searchParams.get("error_description") || hashParams.get("error_description");
        const errorCode = url.searchParams.get("error_code") || hashParams.get("error_code");
        if (errorCode || errorDescription) throw new Error(errorCode === "otp_expired" ? "expired" : errorDescription || "Authentication failed.");
        if (await markReadyFromSession()) return;
        const code = url.searchParams.get("code") || hashParams.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          if (await markReadyFromSession()) return;
        }
        const accessToken = hashParams.get("access_token") || url.searchParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token") || url.searchParams.get("refresh_token");
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
          if (error) throw error;
          if (await markReadyFromSession()) return;
        }
        throw new Error("No active reset session found. Please request a new link.");
      } catch (error: any) {
        const msg = resetError(error?.message);
        showError(msg);
        navigate("/forgot-password?error=reset_expired", { replace: true });
      }
    };
    void init();
    return () => { mounted = false; };
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password !== confirmPassword) return showError("Passwords do not match.");
    if (password.length < 8) return showError("Password must be at least 8 characters long.");
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) throw new Error("Your reset session expired. Please request a fresh reset link.");
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      showSuccess("Password updated successfully. Please sign in with your new password.");
      await supabase.auth.signOut();
      navigate("/login", { replace: true });
    } catch (error: any) {
      showError(String(error.message || "").toLowerCase().includes("same") || String(error.message || "").toLowerCase().includes("different") ? "You cannot reuse your previous password. Choose a different password." : error.message || "Failed to reset password.");
    } finally { setLoading(false); }
  };

  if (!ready) {
    return <div className="min-h-screen bg-[var(--paper)] flex flex-col items-center justify-center gap-3 p-4 text-center"><Loader2 className="w-6 h-6 animate-spin text-[var(--gold)]" /><p className="text-sm font-semibold text-[var(--muted)]">Checking reset session...</p></div>;
  }

  return (
    <div className="min-h-screen bg-[var(--paper)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[var(--surface)] rounded-2xl shadow-xl p-8 border border-[var(--border)]">
        <div className="flex flex-col items-center mb-6">
          <h1 className="text-2xl font-bold text-[var(--ink)]">Create a new password</h1>
          <p className="text-[var(--muted)] text-center text-sm mt-2">Choose a new password for your Struta account. For security, use a password you have not used before.</p>
          {userEmail && <div className="mt-3 px-3 py-1 bg-[var(--gold-bg)] text-[var(--gold)] rounded-full text-xs font-bold">Resetting for: {userEmail}</div>}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div className="space-y-2"><Label htmlFor="password">New Password</Label><div className="relative"><Lock className="absolute left-3 top-3 w-4 h-4 text-[var(--muted)]" /><Input id="password" type={showPassword ? "text" : "password"} className="pl-10 pr-10" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="********" autoComplete="new-password" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-[var(--muted)] hover:text-[var(--ink)] transition-colors">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></div>
          <div className="space-y-2"><Label htmlFor="confirmPassword">Confirm Password</Label><div className="relative"><Lock className="absolute left-3 top-3 w-4 h-4 text-[var(--muted)]" /><Input id="confirmPassword" type={showPassword ? "text" : "password"} className="pl-10 pr-10" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="********" autoComplete="new-password" /></div></div>
          <Button type="submit" className="w-full btn-struta-gold h-12" disabled={loading}>{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update password"}</Button>
        </form>
      </div>
    </div>
  );
}
