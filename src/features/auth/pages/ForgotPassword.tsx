"use client";

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Loader2, AlertTriangle } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { showError, showSuccess } from "@/utils/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const autofillEmail = (val: string): string => {
  const parts = val.split('@');
  if (parts.length === 2) {
    const username = parts[0];
    const domain = parts[1].toLowerCase();
    if (domain === 'gm' || domain.startsWith('gm')) return `${username}@gmail.com`;
    if (domain === 'out' || domain.startsWith('out')) return `${username}@outlook.com`;
    if (domain === 'yah' || domain.startsWith('yah')) return `${username}@yahoo.com`;
    if (domain === 'pro' || domain.startsWith('pro')) return `${username}@protonmail.com`;
    if (domain === 'zo' || domain.startsWith('zo')) return `${username}@zoho.com`;
  }
  return val;
};

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(autofillEmail(val));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const response = await apiFetch("/api/auth/security/send-reset-otp", {
        method: "POST",
        body: JSON.stringify({ email: normalizedEmail }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Could not send reset code.");
      showSuccess("If this email exists, a 6-digit reset code has been sent. Please check your inbox.");
      navigate(`/reset-password?email=${encodeURIComponent(normalizedEmail)}`);
    } catch (error: any) {
      showError(error.message || "Could not send reset code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--paper)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[var(--surface)] rounded-2xl shadow-xl p-8 border border-[var(--border)]">
        <div className="flex flex-col items-center mb-6">
          <h1 className="text-2xl font-bold text-[var(--ink)]">Forgot password</h1>
          
          <div className="flex items-center gap-1.5 mt-2 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-full text-[10px] font-bold text-amber-600 uppercase tracking-wider">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Beta Mode v0.4</span>
          </div>
        </div>

        <p className="text-[var(--muted)] text-center text-sm mt-2">
          Enter your email address and we&apos;ll send you a secure 6-digit reset code.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-[var(--muted)]" />
              <Input
                id="email"
                type="email"
                required
                className="pl-10"
                value={email}
                onChange={handleEmailChange}
                placeholder="name@example.com"
              />
            </div>
          </div>

          <Button type="submit" className="w-full btn-struta-gold h-12" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send reset code"}
          </Button>
        </form>

        <p className="mt-6 text-sm text-[var(--muted)] text-center">
          Remembered it? <Link to="/login" className="text-[var(--gold)] font-bold">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
