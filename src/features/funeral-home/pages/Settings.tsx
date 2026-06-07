"use client";

import React, { useEffect, useState } from "react";
import PortalLayout from "@/components/layout/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Palette, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { showError, showSuccess } from "@/utils/toast";

const OperationsSettings = () => {
  const { user, profile, refreshProfile, applyPreferences } = useAuth();
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState({ theme_mode: "light", accent_color: "gold" });

  useEffect(() => {
    setPrefs({
      theme_mode: localStorage.getItem("struta_theme_mode") || profile?.theme_mode || "light",
      accent_color: localStorage.getItem("struta_accent_color") || profile?.accent_color || "gold",
    });
  }, [profile?.theme_mode, profile?.accent_color]);

  const savePersonalization = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      localStorage.setItem("struta_theme_mode", prefs.theme_mode);
      localStorage.setItem("struta_accent_color", prefs.accent_color);
      applyPreferences({ theme_mode: prefs.theme_mode, accent_color: prefs.accent_color });
      await supabase.from("user_settings").upsert({ user_id: user.id, theme_mode: prefs.theme_mode, accent_color: prefs.accent_color, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
      await supabase.from("user_profiles").update({ theme_mode: prefs.theme_mode, accent_color: prefs.accent_color, updated_at: new Date().toISOString() }).eq("id", user.id);
      await refreshProfile();
      showSuccess("Personalization saved.");
    } catch (error: any) {
      showError(error.message || "Could not save personalization.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PortalLayout portalType="operations">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--gold)]">Settings</p>
          <h2 className="text-3xl font-black text-[var(--ink)]">Funeral Home Settings</h2>
          <p className="text-sm font-semibold text-[var(--muted)]">Manage interface preferences.</p>
        </div>

        <div className="p-1 bg-[var(--paper)] rounded-2xl flex flex-wrap gap-1 w-fit border border-[var(--border)]">
          <Button variant="ghost" size="sm" className="rounded-xl px-6 h-10 text-xs font-black bg-[var(--surface)] text-[var(--ink)] shadow-sm"><Palette className="w-4 h-4 mr-2" />Personalization</Button>
        </div>

        <Card className="rounded-[2rem] border-[var(--border)] bg-[var(--surface)] shadow-sm">
          <CardHeader><CardTitle>Personalization</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Theme</Label><Select value={prefs.theme_mode} onValueChange={(theme_mode) => setPrefs((current) => ({ ...current, theme_mode }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="light">Light</SelectItem><SelectItem value="dark">Dark</SelectItem><SelectItem value="system">System</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>Accent color</Label><Select value={prefs.accent_color} onValueChange={(accent_color) => setPrefs((current) => ({ ...current, accent_color }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="gold">Gold</SelectItem><SelectItem value="emerald">Emerald</SelectItem><SelectItem value="indigo">Indigo</SelectItem><SelectItem value="rose">Rose</SelectItem></SelectContent></Select></div>
            </div>
            <Button type="button" className="btn-struta-primary h-12" onClick={savePersonalization} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}Save Personalization</Button>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default OperationsSettings;
