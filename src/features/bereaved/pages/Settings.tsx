"use client";

import React, { useEffect, useState } from "react";
import PortalLayout from "@/components/layout/PortalLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { User, Bell, Shield, Loader2, Palette, Trash2, Save, AlertTriangle } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";

const FamilySettings = () => {
  const { user, profile, refreshProfile, applyPreferences, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    theme_mode: "light",
    accent_color: "gold",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (!profile) return;
    setForm({
      fullName: profile.full_name || "",
      theme_mode: profile.theme_mode || localStorage.getItem("struta_theme_mode") || "light",
      accent_color: profile.accent_color || localStorage.getItem("struta_accent_color") || "gold",
    });
  }, [profile]);

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "personalization", label: "Personalization", icon: Palette },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
  ];

  const handleSave = async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("user_profiles").upsert({
        id: profile.id,
        full_name: form.fullName.trim(),
        email: profile.email || user?.email,
        role: profile.role || "family",
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;

      localStorage.setItem("struta_theme_mode", form.theme_mode);
      localStorage.setItem("struta_accent_color", form.accent_color);
      applyPreferences({ theme_mode: form.theme_mode, accent_color: form.accent_color });
      await refreshProfile();
      showSuccess("Settings updated successfully.");
    } catch (error: any) {
      showError(error.message || "Could not save settings.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = user?.email || profile?.email;
    if (!email) return showError("Email is missing from this account. Please sign out and sign in again.");
    if (!passwordForm.currentPassword) return showError("Please enter your old password.");
    if (!passwordForm.newPassword) return showError("Please enter a new password.");
    if (passwordForm.newPassword.length < 8) return showError("New password must be at least 8 characters.");
    if (passwordForm.currentPassword === passwordForm.newPassword) return showError("New password must be different from your old password.");
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return showError("Passwords do not match.");

    setUpdatingPassword(true);
    try {
      const verified = await supabase.auth.signInWithPassword({ email, password: passwordForm.currentPassword });
      if (verified.error) throw new Error("Old password is incorrect.");
      const { error } = await supabase.auth.updateUser({ password: passwordForm.newPassword });
      if (error) throw error;
      showSuccess("Password updated successfully.");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      showError(error.message || "Failed to update password.");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Delete your Struta account permanently? This removes your profile, requests, notifications, and memorials where allowed.")) return;
    if (!window.confirm("Final confirmation: this cannot be undone.")) return;

    setDeletingAccount(true);
    try {
      const { error } = await supabase.rpc("delete_account", { target_user_id: profile?.id || user?.id });
      if (error) throw error;
      showSuccess("Account deleted successfully.");
      await signOut();
    } catch (error: any) {
      showError(error.message || "Failed to delete account. Make sure the delete_account SQL function has been installed.");
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <PortalLayout portalType="family">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h2 className="text-3xl font-black text-[var(--ink)]">Account Settings</h2>
          <p className="text-[var(--muted)] mt-1">Manage your profile, preferences, notifications, and account security.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <aside className="space-y-2">
            {tabs.map((item) => (
              <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === item.id ? "bg-[var(--gold-bg)] text-[var(--gold)] shadow-sm" : "text-[var(--muted)] hover:bg-[var(--cream)]"}`}>
                <item.icon className="w-4 h-4" />{item.label}
              </button>
            ))}
          </aside>

          <main className="md:col-span-3 space-y-6">
            {activeTab === "profile" && (
              <Card className="rounded-3xl border-[var(--border)] shadow-sm">
                <CardHeader><CardTitle>Personal Information</CardTitle><CardDescription>Update the name shown to providers and support.</CardDescription></CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2"><Label>Full Name</Label><Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Email Address</Label><Input value={profile?.email || user?.email || ""} disabled className="bg-slate-50 text-slate-500" /></div>
                  </div>
                  <Button className="btn-struta-gold font-bold" onClick={handleSave} disabled={loading}>{loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}Save Changes</Button>
                </CardContent>
              </Card>
            )}

            {activeTab === "personalization" && (
              <Card className="rounded-3xl border-[var(--border)] shadow-sm">
                <CardHeader><CardTitle>Personalization</CardTitle><CardDescription>Keep the Struta interface feeling comfortable and clear.</CardDescription></CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2"><Label>Theme Mode</Label><div className="grid grid-cols-2 gap-4">{["light", "dark"].map((mode) => <button key={mode} type="button" onClick={() => setForm({ ...form, theme_mode: mode })} className={`p-4 rounded-xl border text-center font-bold text-sm capitalize transition-all ${form.theme_mode === mode ? "border-[var(--gold)] bg-[var(--gold-bg)] text-[var(--gold)]" : "border-[var(--border)] hover:bg-[var(--cream)]"}`}>{mode} Mode</button>)}</div></div>
                  <div className="space-y-2"><Label>Accent Color</Label><div className="grid grid-cols-2 sm:grid-cols-4 gap-4">{[{ id: "gold", label: "Gold", color: "bg-[#c8923a]" }, { id: "emerald", label: "Emerald", color: "bg-emerald-600" }, { id: "indigo", label: "Indigo", color: "bg-indigo-600" }, { id: "rose", label: "Rose", color: "bg-rose-600" }].map((accent) => <button key={accent.id} type="button" onClick={() => setForm({ ...form, accent_color: accent.id })} className={`p-3 rounded-xl border flex flex-col items-center gap-2 font-bold text-xs transition-all ${form.accent_color === accent.id ? "border-[var(--gold)] bg-[var(--gold-bg)]" : "border-[var(--border)] hover:bg-[var(--cream)]"}`}><div className={`w-6 h-6 rounded-full ${accent.color}`} />{accent.label}</button>)}</div></div>
                  <Button className="btn-struta-gold font-bold" onClick={handleSave} disabled={loading}>{loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Apply Personalization</Button>
                </CardContent>
              </Card>
            )}

            {activeTab === "notifications" && (
              <Card className="rounded-3xl border-[var(--border)] shadow-sm">
                <CardHeader><CardTitle>Notification Preferences</CardTitle><CardDescription>Choose how you receive planning and chat updates.</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  {["Email Notifications", "Push Notifications", "Product Updates"].map((title) => <div key={title} className="flex items-center justify-between p-4 rounded-xl border border-[var(--border)]"><div><p className="font-bold text-[var(--ink)]">{title}</p><p className="text-xs text-[var(--muted)]">Keep this enabled for important Struta updates.</p></div><Switch defaultChecked onCheckedChange={(checked) => showSuccess(`${title} turned ${checked ? "ON" : "OFF"}`)} /></div>)}
                </CardContent>
              </Card>
            )}

            {activeTab === "security" && (
              <Card className="rounded-3xl border-[var(--border)] shadow-sm">
                <CardHeader><CardTitle>Security</CardTitle><CardDescription>Update your password from this signed-in session or permanently delete your account.</CardDescription></CardHeader>
                <CardContent className="space-y-8">
                  <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
                    <div className="space-y-2"><Label>Old Password</Label><Input type="password" autoComplete="current-password" required value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} /></div>
                    <div className="space-y-2"><Label>New Password</Label><Input type="password" autoComplete="new-password" required value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Confirm New Password</Label><Input type="password" autoComplete="new-password" required value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} /></div>
                    <Button type="submit" className="btn-struta-primary font-bold" disabled={updatingPassword}>{updatingPassword && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Update Password</Button>
                  </form>

                  <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                    <div className="flex items-start gap-3"><AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" /><div><h4 className="text-lg font-black text-red-700">Danger Zone</h4><p className="text-sm text-red-700/80 mt-1">This permanently deletes your account and associated records where database permissions allow it.</p></div></div>
                    <Button variant="destructive" className="mt-4 bg-red-600 hover:bg-red-700" onClick={handleDeleteAccount} disabled={deletingAccount}>{deletingAccount ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}Delete Account</Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </main>
        </div>
      </div>
    </PortalLayout>
  );
};

export default FamilySettings;
