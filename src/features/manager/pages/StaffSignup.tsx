"use client";

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showError, showSuccess } from "@/utils/toast";
import { Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const StaffSignup = () => {
  const navigate = useNavigate();
  const [joining, setJoining] = useState(false);
  const [form, setForm] = useState({ email: "", code: "" });

  const continueToPortal = async () => {
    if (!form.email.trim() || !form.code.trim()) {
      showError("Enter your staff email/name and the 6 digit organisation code.");
      return;
    }

    setJoining(true);
    try {
      const { data, error } = await supabase.rpc("staff_login_by_code", {
        staff_name_input: form.email.trim().toLowerCase(),
        general_code_input: form.code.trim(),
      });

      if (error) throw error;
      const result = data as any;
      if (!result?.success) throw new Error(result?.error || "Could not verify those staff details.");

      const portalPath = result.portal_path || (result.staff_business_type === "vendor" ? "/marketplace" : "/manager");
      const staffRole = result.staff_role || result.role || "staff";
      const staffProfile = {
        id: result.staff_id,
        user_id: result.staff_id,
        full_name: result.staff_name || result.email || "Staff Member",
        email: result.email || form.email.trim().toLowerCase(),
        role: staffRole,
        staff_role: staffRole,
        staff_business_type: result.staff_business_type || (portalPath.startsWith("/marketplace") ? "vendor" : "operations"),
        organization_id: result.organization_id || result.business_id,
        manager_id: result.manager_id || result.organization_id || result.business_id,
        business_id: result.business_id || result.organization_id,
        business_name: result.business_name,
        is_staff_session: true,
        isPro: true,
        is_pro: true,
        freeTier: false,
        hasAccess: true,
        plan_code: "staff-pro",
        plan_status: "active",
        subscription_status: "active",
      };

      localStorage.setItem("struta_staff_session", JSON.stringify({ profile: staffProfile, created_at: new Date().toISOString() }));
      localStorage.setItem(`struta_profile_cache_${staffProfile.id}`, JSON.stringify(staffProfile));
      showSuccess("Staff access verified.");
      window.dispatchEvent(new Event("struta_staff_session_updated"));
      window.location.assign(portalPath);
    } catch (error: any) {
      showError(error.message || "Could not verify staff details.");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--paper)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md rounded-3xl border-[var(--border)] shadow-sm">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-[var(--gold-bg)] flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-[var(--gold)]" />
          </div>
          <CardTitle className="font-head text-2xl">Staff Login</CardTitle>
          <CardDescription>
            Enter your staff email/name and the 6 digit organisation code shared by your home or vendor manager.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email or Staff Name</Label>
            <Input
              autoFocus
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="staff@example.com or Staff Name"
              onKeyDown={(e) => { if (e.key === "Enter") void continueToPortal(); }}
            />
          </div>
          <div className="space-y-2">
            <Label>6 Digit Access Code</Label>
            <Input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.replace(/\D/g, "").slice(0, 6) })}
              placeholder="123456"
              inputMode="numeric"
              maxLength={6}
              onKeyDown={(e) => { if (e.key === "Enter") void continueToPortal(); }}
            />
          </div>
          <Button className="w-full btn-struta-gold font-bold h-11" disabled={joining} onClick={continueToPortal}>
            {joining ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Continue to Staff Portal
          </Button>
          <div className="text-center">
            <Button variant="link" asChild className="text-xs">
              <Link to="/login">Back to main login</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffSignup;
