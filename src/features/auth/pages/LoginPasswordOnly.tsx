"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { getRoleRedirectPath } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StrutaLogo } from "@/components/StrutaLogo";
import { showError, showSuccess } from "@/utils/toast";

const autofillEmail = (val: string): string => {
  const parts = val.split("@");
  if (parts.length === 2) {
    const username = parts[0];
    const domain = parts[1].toLowerCase();
    if (domain === "gm" || domain.startsWith("gm")) return `${username}@gmail.com`;
    if (domain === "out" || domain.startsWith("out")) return `${username}@outlook.com`;
    if (domain === "yah" || domain.startsWith("yah")) return `${username}@yahoo.com`;
    if (domain === "pro" || domain.startsWith("pro")) return `${username}@protonmail.com`;
    if (domain === "zo" || domain.startsWith("zo")) return `${username}@zoho.com`;
  }
  return val;
};

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value.trim());

const friendlyError = (message: string) => {
  const lower = message.toLowerCase();
  if (lower.includes("too many")) return message;
  if (lower.includes("invalid login") || lower.includes("invalid credentials")) return "Check your email and password, then try again.";
  if (lower.includes("network") || lower.includes("failed to fetch") || lower.includes("service unavailable")) return "The sign-in service is temporarily unavailable. Refresh and try again.";
  return message || "Could not sign in. Please try again.";
};

export default function LoginPasswordOnly() {
  const { profile, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [authLoading, setAuthLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => { localStorage.removeItem("struta_pending_signin_otp"); }, []);
  useEffect(() => { if (!loading && profile) navigate(getRoleRedirectPath(profile.role, profile), { replace: true }); }, [profile, loading, navigate]);

  const callAuthGuard = async (url: string, body: Record<string, unknown>) => {
    try {
      const response = await apiFetch(url, { method: "POST", body: JSON.stringify(body) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok && (response.status === 429 || response.status === 403)) throw new Error(data.error || "Too many attempts. Try again shortly.");
    } catch (error: any) {
      if (String(error?.message || "").includes("Too many")) throw error;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!isEmail(cleanEmail) || password.length < 6) return showError("Check your email and password, then try again.");
    setAuthLoading(true);
    try {
      localStorage.removeItem("struta_pending_signin_otp");
      await callAuthGuard("/api/auth/login-attempt", { email: cleanEmail });
      const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
      if (error) throw error;
      void callAuthGuard("/api/auth/login-success", { email: cleanEmail });
      await refreshProfile();
      showSuccess("Signed in successfully!");
    } catch (error: any) {
      showError(friendlyError(error.message));
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--paper)] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_15%,rgba(200,146,58,0.12),transparent_32%),radial-gradient(circle_at_82%_78%,rgba(12,11,8,0.05),transparent_34%)]" />
      <div className="relative w-full max-w-md bg-[var(--surface)] rounded-[2rem] shadow-[0_22px_70px_rgba(12,11,8,0.12)] p-8 md:p-9 border border-[var(--border)]">
        <div className="flex flex-col items-center mb-7 text-center">
          <div className="mb-5 rounded-[1.5rem] bg-[var(--paper)] border border-[var(--border)] px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_14px_34px_rgba(12,11,8,0.08)]"><StrutaLogo size="big" /></div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--gold)] mb-2">Welcome back</p>
          <h1 className="text-3xl font-black tracking-tight text-[var(--ink)]">Sign in to Struta</h1>
          <p className="mt-2 text-sm font-semibold text-[var(--muted)]">Manage memorials, requests, providers, and operations with one calm workspace.</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="email">Email Address</Label><div className="relative"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" /><Input id="email" type="email" className="pl-11 h-12 rounded-2xl bg-[var(--paper)] border-[var(--border)] font-bold" required value={email} onChange={(e) => setEmail(autofillEmail(e.target.value))} /></div></div>
          <div className="space-y-2"><Label htmlFor="password">Password</Label><div className="relative"><Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" /><Input id="password" type={showPassword ? "text" : "password"} className="pl-11 pr-11 h-12 rounded-2xl bg-[var(--paper)] border-[var(--border)] font-bold" required value={password} onChange={(e) => setPassword(e.target.value)} /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)] transition-colors">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></div>
          <Button type="submit" className="w-full btn-struta-gold h-12 rounded-full font-black" disabled={authLoading}>{authLoading ? <span className="loader-inline"><span className="custom-loader" /></span> : "Sign In"}</Button>
        </form>
        <div className="text-center mt-4"><Link to="/forgot-password" className="text-sm font-bold text-[var(--gold)] hover:underline">Forgot your password?</Link></div>
        <div className="mt-6 pt-6 border-t border-[var(--border)] text-center"><p className="text-sm text-[var(--muted)] mb-3 font-semibold">New to the platform?</p><Link to="/signup" className="text-sm font-black text-[var(--gold)] hover:underline">Create an account</Link></div>
      </div>
    </div>
  );
}
