"use client";

import React from "react";
import PortalLayout from "@/components/layout/PortalLayout";
import { useAuth } from "@/components/auth/AuthProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { UserCircle, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

export default function ManagerSettingsPage() {
  const { profile, signOut } = useAuth();
  const portalType = profile?.staff_business_type === "vendor" || profile?.role === "marketplace" ? "marketplace" : "operations";

  const deleteAccount = async () => {
    if (!profile?.id) return;
    const ok = window.confirm("Delete this staff account? This removes staff access for this account.");
    if (!ok) return;
    try {
      const { error } = await supabase.from("erp_staff").update({ status: "deleted", is_active: false, updated_at: new Date().toISOString() }).or(`id.eq.${profile.id},user_id.eq.${profile.id}`);
      if (error) throw error;
      localStorage.removeItem("struta_staff_session");
      showSuccess("Staff account deleted.");
      await signOut();
      window.location.href = "/login";
    } catch (error: any) {
      showError(error.message || "Could not delete staff account.");
    }
  };

  return (
    <PortalLayout portalType={portalType as "operations" | "marketplace"}>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)] mb-2">Settings</p>
          <h1 className="text-3xl font-black text-[var(--ink)]">Staff profile</h1>
          <p className="text-[var(--muted)] mt-1">Only your staff identity details are shown here.</p>
        </div>
        <Card className="rounded-3xl border-[var(--border)] shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserCircle className="w-5 h-5 text-[var(--gold)]" /> Profile</CardTitle>
            <CardDescription>Name and email shown to your manager and team.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input readOnly value={profile?.full_name || profile?.staff_name || "Staff Member"} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input readOnly value={profile?.email || ""} />
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-red-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700"><Trash2 className="w-5 h-5" /> Delete account</CardTitle>
            <CardDescription>Remove your staff access from this home/vendor account.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={deleteAccount}>Delete account</Button>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}
