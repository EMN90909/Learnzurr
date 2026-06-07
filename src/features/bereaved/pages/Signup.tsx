"use client";

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, MapPin, Loader2, Info, Globe, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { showError, showSuccess } from "@/utils/toast";
import { useLocationDetection } from "@/hooks/use-location";
import { getAuthCallbackUrl } from "@/lib/auth";
import { convertStoredReferral, getStoredReferralCode } from "@/lib/referrals";

const autofillEmail = (val: string) => {
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

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());

const formatRegionalPhone = (value: string, country = "Kenya") => {
  const digits = value.replace(/\D/g, "");
  const countryName = country.toLowerCase();
  const code = countryName.includes("uganda") ? "256" : countryName.includes("tanzania") ? "255" : countryName.includes("rwanda") ? "250" : "254";
  let local = digits;
  if (local.startsWith(code)) local = local.slice(code.length);
  if (local.startsWith("0")) local = local.slice(1);
  local = local.slice(0, 9);
  return `+${code}${local ? ` ${local.slice(0, 3)}${local.length > 3 ? ` ${local.slice(3, 6)}` : ""}${local.length > 6 ? ` ${local.slice(6, 9)}` : ""}` : ""}`.trim();
};

const getPhoneHelp = () => "Kenya: +254 xxx xxx xxx\nUganda: +256 xxx xxx xxx\nTanzania: +255 xxx xxx xxx\nRwanda: +250 xxx xxx xxx";

const getUserLocation = () => new Promise<{ latitude: number | null; longitude: number | null; location_enabled: boolean; location_permission_status: string }>((resolve) => {
  if (!navigator.geolocation) return resolve({ latitude: null, longitude: null, location_enabled: false, location_permission_status: "unsupported" });
  navigator.geolocation.getCurrentPosition(
    (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude, location_enabled: true, location_permission_status: "granted" }),
    () => resolve({ latitude: null, longitude: null, location_enabled: false, location_permission_status: "denied" }),
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
});

const Required = () => <span className="text-red-500" title="Required field">*</span>;
const Optional = () => <span className="text-[10px] text-[var(--muted)] font-normal">optional</span>;

const SignupBereaved = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const { location, message } = useLocationDetection("family");
  const [formData, setFormData] = useState({ name: "", email: "", password: "", phone: "" });
  const isSupported = location.isSupportedCountry !== false;
  const referralCode = getStoredReferralCode();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = autofillEmail(formData.email.trim()).toLowerCase();
    if (!formData.name.trim()) return showError("Full name is required.");
    if (!isValidEmail(email)) return showError("Enter a valid email address, for example name@example.com.");
    if (!formData.phone.trim() || formData.phone.replace(/\D/g, "").length < 9) return showError("Enter a valid phone number using the country format shown.");
    if (formData.password.length < 8) return showError("Password must be at least 8 characters.");
    if (!agreedToTerms) return showError("You must accept the Terms and Conditions and Terms of Use to create an account.");
    if (!isSupported) return showError(`Struta is not available in ${location.country || "your country"} yet.`);
    setLoading(true);
    try {
      const loc = await getUserLocation();
      const formattedPhone = formatRegionalPhone(formData.phone, location.country || "Kenya");
      const baseProfile = {
        email,
        full_name: formData.name.trim(),
        role: "family",
        phone: formattedPhone,
        latitude: loc.latitude,
        longitude: loc.longitude,
        location_enabled: loc.location_enabled,
        location_permission_status: loc.location_permission_status,
        country: location.country || "Kenya",
        county: location.county || "Nairobi",
        sub_county: location.sub_county || "Westlands",
        town: location.town || "Nairobi",
        address: location.address || "Nairobi, Kenya",
        active: true,
      };
      const { data, error } = await supabase.auth.signUp({
        email,
        password: formData.password,
        options: { emailRedirectTo: getAuthCallbackUrl(), data: { ...baseProfile, referral_code_used: referralCode || undefined } },
      });
      if (error) throw error;
      if (data.user) {
        const { error: profileError } = await supabase.from("user_profiles").upsert({ id: data.user.id, ...baseProfile, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
        if (profileError) throw profileError;
        await convertStoredReferral("family");
      }
      showSuccess("Account created successfully! Please sign in.");
      navigate("/login", { replace: true });
    } catch (error: any) {
      showError(error.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--paper)] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-[var(--surface)] rounded-2xl shadow-xl p-8 border border-[var(--border)]">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-[var(--gold)] rounded-xl flex items-center justify-center mb-4"><Heart className="text-[var(--paper)] w-7 h-7" /></div>
          <h1 className="text-2xl font-bold text-[var(--ink)]">Join as a Family</h1>
          <div className="flex items-center gap-1.5 mt-2 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-full text-[10px] font-bold text-amber-600 uppercase tracking-wider"><AlertTriangle className="w-3.5 h-3.5" /><span>Beta Mode v0.4</span></div>
        </div>
        {!isSupported ? <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3 items-start text-xs text-red-800"><AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" /><p><strong>Not available in your country ({location.country || "Unknown"})</strong>. Struta is currently only available in Kenya, Uganda, Tanzania, and Rwanda.</p></div> : <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3 items-start text-xs text-amber-800"><AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" /><p><strong>Please turn on location</strong> to help us get your precise location so we can recommend accurate funeral homes and vendors.</p></div>}
        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="name" className="flex gap-1">Full Name <Required /></Label><Input id="name" placeholder="John Doe" required disabled={!isSupported} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
          <div className="space-y-2"><Label htmlFor="email" className="flex gap-1">Email Address <Required /></Label><Input id="email" type="email" placeholder="john@example.com" required disabled={!isSupported} value={formData.email} onBlur={(e) => setFormData({ ...formData, email: autofillEmail(e.target.value).toLowerCase() })} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
          <div className="space-y-2"><Label htmlFor="phone" className="flex gap-1">Phone Number <Required /></Label><Input id="phone" type="tel" placeholder="+254 712 345 678" required disabled={!isSupported} value={formData.phone} onBlur={(e) => setFormData({ ...formData, phone: formatRegionalPhone(e.target.value, location.country || "Kenya") })} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /><p className="text-[10px] text-[var(--muted)] whitespace-pre-line">{getPhoneHelp()}</p></div>
          <div className="space-y-2"><Label htmlFor="password" className="flex gap-1">Password <Required /></Label><div className="relative"><Input id="password" type={showPassword ? "text" : "password"} required disabled={!isSupported} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="pr-10" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-[var(--muted)] hover:text-[var(--ink)]">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></div>
          <div className="space-y-2"><div className="p-3 bg-[var(--cream)] rounded-lg flex flex-col gap-1 text-sm text-[var(--ink)] font-bold border border-[var(--border)]"><div className="flex items-center gap-2"><Globe className="w-4 h-4 text-[var(--gold)]" /><span>Country: {location.country || "Detecting..."}</span></div><div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[var(--gold)]" /><span>Location: {location.county ? `${location.county}, ${location.town || ""}` : "Detecting..."}</span></div></div><div className="flex items-start gap-2 px-1"><Info className="w-3 h-3 text-[var(--muted)] mt-0.5 shrink-0" /><p className="text-[10px] text-[var(--muted)] leading-tight">{message}</p></div></div>
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200"><input type="checkbox" id="terms" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer mt-1" /><label htmlFor="terms" className="text-xs text-gray-700 cursor-pointer">I have read and accept the <a href="/terms" target="_blank" className="text-blue-600 font-bold hover:underline">Terms and Conditions</a> and <a href="/terms-of-use" target="_blank" className="text-blue-600 font-bold hover:underline">Terms of Use</a> <Required /></label></div>
          <Button type="submit" className="w-full btn-struta-primary" disabled={loading || !isSupported || !agreedToTerms}>{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Account"}</Button>
        </form>
        <p className="mt-3 text-center text-[10px] text-[var(--muted)]"><Required /> required fields. <Optional /> fields appear where available.</p>
        <p className="mt-6 text-center text-sm text-[var(--muted)]">Already have an account? <Link to="/login" className="text-[var(--gold)] font-bold">Sign In</Link></p>
      </div>
    </div>
  );
};

export default SignupBereaved;
