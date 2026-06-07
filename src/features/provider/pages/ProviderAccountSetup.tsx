"use client";

import React, { useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { showError, showSuccess } from "@/utils/toast";
import { CheckCircle2, ChevronLeft, Eye, EyeOff, ImagePlus, Loader2, MailCheck, ShieldCheck, Trash2, UploadCloud } from "lucide-react";

type ProviderType = "home" | "vendor";
type UploadedImage = { id: string; file: File; preview: string; progress: number; url?: string };
type FormState = { accountEmail: string; password: string; linkSent: boolean; linkConfirmed: boolean; code: string; code: string; code: string; contactName: string; contactPhone: string; contactEmail: string; about: string; street: string; city: string; state: string; zip: string; services: string[]; listingTitle: string; coverImageId: string };

const MAX_IMAGES = 10;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_ABOUT = 1000;
const MIN_ABOUT = 100;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const funeralHomeServiceOptions = [
  "Mortuary services",
  "Body preservation",
  "Embalming services",
  "Refrigeration storage",
  "Autopsy handling",
  "Chapel viewing",
  "Viewing room",
  "Funeral arrangement",
  "Burial coordination",
  "Cremation coordination",
  "Repatriation of remains",
  "Hearse transport",
  "Body transport",
  "Dressing of the body",
  "Cosmetology services",
  "Grief counseling",
  "Bereavement support",
  "Aftercare support",
  "Death certificate assistance",
  "Funeral program planning",
  "Cemetery liaison",
  "Graveside service",
  "Memorial service setup",
  "Body receiving service",
  "Postmortem coordination",
  "Family waiting room",
  "Live-stream funeral service",
  "Funeral package planning",
  "Body washing and preparation",
  "Funeral home administration",
];

const vendorServiceOptions = [
  "Casket sales",
  "Urn sales",
  "Flowers and wreaths",
  "Tents and chairs",
  "Music and sound system",
  "Catering services",
  "Lowering gear",
  "Coffin handles",
  "Casket lining",
  "Funeral printing and design",
  "Obituary printing",
  "Program printing",
  "Hearse accessories",
  "Burial clothes",
  "Body viewing accessories",
  "Funeral cover packages",
  "Cemetery equipment",
  "Headstone supplies",
  "Grave markers",
  "Banner printing",
  "Tent decoration",
  "Water and refreshments",
  "Transport vans",
  "Chairs and table rental",
  "Canopies and gazebos",
  "Generators",
  "Lighting equipment",
  "Portable toilets",
  "PA systems",
  "Photo and video coverage",
];
const initialForm: FormState = { accountEmail: "", password: "", linkSent: false, linkConfirmed: false, code: "", contactName: "", contactPhone: "", contactEmail: "", about: "", street: "", city: "", state: "", zip: "", services: [], listingTitle: "", coverImageId: "" };

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value.trim());
const isPhone = (value: string) => /^\+?[0-9\s().-]{9,18}$/.test(value.trim());
const slugify = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const addressString = (form: FormState) => [form.street, form.city, form.state, form.zip].filter(Boolean).join(", ");
const adminBypassEmails = new Set(String(import.meta.env.VITE_ADMIN_EMAILS || "").split(/[\s,;]+/).map((item) => item.trim().toLowerCase()).filter(Boolean));

function strength(password: string) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (score >= 4) return "strong";
  if (score >= 2) return "medium";
  return "weak";
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-black text-red-600 dark:text-red-300">{message}</p>;
}

export default function ProviderAccountSetup({ providerType }: { providerType: ProviderType }) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const isVendor = providerType === "vendor";
  const label = isVendor ? "Vendor" : "Funeral Home";
  const serviceOptions = isVendor ? vendorServiceOptions : funeralHomeServiceOptions;
  const dashboardPath = isVendor ? "/marketplace" : "/operations";
  const listingPath = isVendor ? "/marketplace/catalog" : "/operations/profile";
  const editPath = isVendor ? "/marketplace/settings" : "/operations/settings";
  const urlParams = new URLSearchParams(window.location.search);
  const initialStep = Number(urlParams.get("step") || "1");
  const emailFromUrl = urlParams.get("email") || "";

  const [step, setStep] = useState(initialStep >= 2 && initialStep <= 6 ? initialStep : 1);
  const [form, setForm] = useState<FormState>(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(`struta_${providerType}_setup_clean`) || "{}");
      return { ...initialForm, ...parsed, accountEmail: parsed.accountEmail || emailFromUrl, contactEmail: parsed.contactEmail || emailFromUrl, linkSent: Boolean(parsed.linkSent || initialStep >= 2), linkConfirmed: Boolean(parsed.linkConfirmed || initialStep >= 2) };
    } catch {
      return { ...initialForm, accountEmail: emailFromUrl, contactEmail: emailFromUrl, linkSent: initialStep >= 2, linkConfirmed: initialStep >= 2 };
    }
  });
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

  const progressStep = Math.min(step, 6);
  const progressPercent = step >= 7 ? 100 : (progressStep / 6) * 100;
    const pageTitle = useMemo(() => step === 1 ? "Sign up" : step === 2 ? "Verify your email" : step === 3 ? `${label} Contact Info` : step === 4 ? `About ${label}` : step === 5 ? `${label} Services` : step === 6 ? "Listing Images" : "Success", [step, label]);

  const update = (patch: Partial<FormState>) => {
    setForm((current) => {
      const next = { ...current, ...patch };
      localStorage.setItem(`struta_${providerType}_setup_clean`, JSON.stringify({ ...next, password: "" }));
      return next;
    });
    setErrors((current) => {
      const copy = { ...current };
      Object.keys(patch).forEach((key) => delete copy[key]);
      return copy;
    });
  };

  React.useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setInterval(() => setResendSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  
  const validate = (target = step) => {
    const next: Record<string, string> = {};
    if (target === 1) {
      if (!isEmail(form.accountEmail)) next.accountEmail = "Enter a valid email address.";
      if (form.password.length < 8) next.password = "Password must be at least 8 characters.";
      else if (!/\d/.test(form.password)) next.password = "Password must include at least one number.";
    }
    if (target === 2) { if (!/^\d{6}$/.test(form.code || "")) next.code = "Enter the 6-digit verification code sent to your email."; else if (!form.linkConfirmed) next.linkConfirmed = "Verify the code before continuing."; }
    if (target === 3) {
      if (!form.contactName.trim()) next.contactName = `${label} name is required.`;
      if (!isPhone(form.contactPhone)) next.contactPhone = "Enter a valid phone number.";
      if (!isEmail(form.contactEmail)) next.contactEmail = "Enter a valid business email address.";
    }
    if (target === 4 && form.about.trim().length < MIN_ABOUT) next.about = `Write at least ${MIN_ABOUT} characters.`;
    if (target === 5) {
      if (!form.street.trim()) next.street = "Street address is required.";
      if (!form.city.trim()) next.city = "City is required.";
      if (!form.state.trim()) next.state = "State/County is required.";
      if (!form.zip.trim()) next.zip = "ZIP/Postal code is required.";
      if (!form.services.length) next.services = "Select at least one service.";
    }
    if (target === 6) {
      if (!form.listingTitle.trim()) next.listingTitle = "Listing title is required.";
      if (!images.length) next.images = "Upload at least one image.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const sendOtp = async () => {
    if (!validate(1)) return;
    setLoading(true);
    try {
      const email = form.accountEmail.trim().toLowerCase();
      const response = await fetch("/api/auth/provider-account/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: form.password, providerType }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not create account.");
      update({ accountEmail: email, contactEmail: email, linkSent: true, linkConfirmed: false, code: "" });
      setResendSeconds(60);
      setStep(2);
      showSuccess("Account created. We sent a 6-digit verification code to your email.");
    } catch (error: any) {
      const raw = String(error?.message || "Could not create account.").replace(/Auth/gi, "").trim();
      showError(`Error: ${raw}`);
      console.error("[Provider email verification error]", error);
      update({ linkSent: false, linkConfirmed: false });
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!/^\d{6}$/.test(form.code || "")) {
      setErrors({ code: "Enter the 6-digit verification code sent to your email." });
      return;
    }
    setLoading(true);
    try {
      const email = form.accountEmail.trim().toLowerCase();
      const response = await fetch("/api/auth/verify-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "signup", code: form.code }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not verify code.");
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: form.password });
      if (signInError) throw signInError;
      update({ linkConfirmed: true });
      showSuccess("Email verified successfully.");
    } catch (error: any) {
      const raw = String(error?.message || "Could not verify code.").replace(/Auth/gi, "").trim();
      showError(`Error: ${raw}`);
    } finally {
      setLoading(false);
    }
  };

  const goNext = () => { if (validate(step)) setStep((value) => Math.min(7, value + 1)); };
  const goBack = () => setStep((value) => Math.max(1, value - 1));
  const toggleService = (service: string) => update({ services: form.services.includes(service) ? form.services.filter((item) => item !== service) : [...form.services, service] });

  const addImages = (files: FileList | null) => {
    if (!files) return;
    const valid: UploadedImage[] = [];
    for (const file of Array.from(files)) {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return showError(`${file.name} must be JPG, PNG, or WEBP.`);
      if (file.size > MAX_IMAGE_BYTES) return showError(`${file.name} is larger than 5MB.`);
      valid.push({ id: crypto.randomUUID(), file, preview: URL.createObjectURL(file), progress: 0 });
    }
    const merged = [...images, ...valid].slice(0, MAX_IMAGES);
    setImages(merged);
    if (!form.coverImageId && merged[0]) update({ coverImageId: merged[0].id });
  };

  const removeImage = (id: string) => setImages((current) => {
    const remaining = current.filter((image) => image.id !== id);
    if (form.coverImageId === id) update({ coverImageId: remaining[0]?.id || "" });
    return remaining;
  });

  const uploadImages = async (userId: string) => {
    const urls: string[] = [];
    for (const image of images) {
      if (image.url) { urls.push(image.url); continue; }
      setImages((items) => items.map((item) => item.id === image.id ? { ...item, progress: 35 } : item));
      const ext = image.file.name.split(".").pop()?.toLowerCase() || "jpg";
      const filePath = `${userId}/${providerType}/${Date.now()}-${image.id}.${ext}`;
      const { error } = await supabase.storage.from("listing-images").upload(filePath, image.file, { upsert: true, contentType: image.file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("listing-images").getPublicUrl(filePath);
      urls.push(data.publicUrl);
      setImages((items) => items.map((item) => item.id === image.id ? { ...item, progress: 100, url: data.publicUrl } : item));
    }
    return urls;
  };

  const finishSetup = async () => {
    if (!validate(6)) return;
    setLoading(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      const userId = userData.user?.id;
      if (!userId) throw new Error("Verify your email code first so your account session exists.");
      if (form.password) await supabase.auth.updateUser({ password: form.password }).catch(() => null);
      const imageUrls = await uploadImages(userId);
      const coverIndex = Math.max(0, images.findIndex((image) => image.id === form.coverImageId));
      const address = addressString(form);
      const services = form.services.map((name) => ({ name, active: true }));
      const servicesOffered = Object.fromEntries(form.services.map((name) => [slugify(name), { enabled: true, price: 0, label: name }]));
      const providerSetup = { provider_type: providerType, business_name: form.contactName.trim(), contact_phone: form.contactPhone.trim(), contact_email: form.contactEmail.trim().toLowerCase(), description: form.about.trim(), address: { street: form.street, city: form.city, state: form.state, zip: form.zip, formatted: address }, services, listing_title: form.listingTitle.trim(), listing_images: imageUrls, cover_image_url: imageUrls[coverIndex] || imageUrls[0], setup_completed_at: new Date().toISOString() };
      const { error: profileError } = await supabase.from("user_profiles").upsert({ id: userId, email: form.accountEmail.trim().toLowerCase(), full_name: form.contactName.trim(), business_name: form.contactName.trim(), home_name: isVendor ? null : form.contactName.trim(), phone: form.contactPhone.trim(), contact_email: form.contactEmail.trim().toLowerCase(), role: isVendor ? "marketplace" : "operations", is_vendor: isVendor, is_home: !isVendor, active: true, address, listing_images: imageUrls, services_offered: servicesOffered, provider_setup: providerSetup, provider_setup_draft: null, setup_completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: "id" });
      if (profileError) throw profileError;
      const table = isVendor ? "vendors" : "homes";
      await supabase.from(table).upsert({ id: userId, name: form.contactName.trim(), business_name: form.contactName.trim(), home_name: isVendor ? null : form.contactName.trim(), email: form.contactEmail.trim().toLowerCase(), phone: form.contactPhone.trim(), description: form.about.trim(), address, services, listing_title: form.listingTitle.trim(), listing_images: imageUrls, cover_image_url: providerSetup.cover_image_url, active: true, setup_completed_at: new Date().toISOString(), updated_at: new Date().toISOString() } as any, { onConflict: "id" }).then(() => null, () => null);
      localStorage.removeItem(`struta_${providerType}_setup_clean`);
      showSuccess("Setup complete. Your listing is ready.");
      setStep(7);
    } catch (error: any) {
      showError(error.message || "Could not finish setup.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "setup-input h-12 rounded-2xl font-bold text-base";

  return (
    <div className="provider-setup-shell min-h-screen lg:grid lg:grid-cols-[50%_50%] bg-[var(--paper)] text-[var(--ink)] dark:bg-[#0b0a08] dark:text-[#f6efe4]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800;900&display=swap'); .provider-setup-shell .setup-panel{border-radius:0!important}.provider-setup-shell .setup-input,.provider-setup-shell input,.provider-setup-shell textarea{background:rgba(255,252,245,.98)!important;color:#0c0b08!important;border:1px solid rgba(12,11,8,.18)!important;box-shadow:inset 2px 2px 7px rgba(12,11,8,.08),inset -1px -1px 4px rgba(255,255,255,.34)!important}.provider-setup-shell textarea{min-height:220px}@media(max-width:1023px){.provider-setup-shell{display:block!important}.provider-setup-shell aside{display:none!important}}:root[data-theme='dark'] .provider-setup-shell .setup-input,:root[data-theme='dark'] .provider-setup-shell input,:root[data-theme='dark'] .provider-setup-shell textarea{background:#201d18!important;color:#f6efe4!important;border-color:rgba(246,239,228,.16)!important}`}</style>
      <aside className="setup-art hidden lg:flex relative min-h-screen w-full overflow-hidden border-r border-[var(--clay-border)] items-center justify-center p-12 bg-[var(--paper)]">
        <div className="relative z-10 w-full max-w-lg space-y-8">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--gold)]">Struta</p>
          <h2 className="text-5xl font-black tracking-tight text-[var(--ink)] dark:text-[#f6efe4]">Set up your {label.toLowerCase()} presence.</h2>
          <p className="text-lg text-[var(--muted)] dark:text-[#c8bda9]">A calm guided setup for verification, services, listing images, and launch.</p>
          <p className="text-sm font-bold text-[var(--muted)] dark:text-[#c8bda9] max-w-md">Built for East African care providers who need a clean, dignified digital presence.</p>
        </div>
      </aside>

      <main className="min-h-screen w-full flex items-stretch justify-stretch p-0">
        <div className="setup-panel w-full max-w-none min-h-screen lg:rounded-none clay-surface overflow-y-auto">
          <div className="p-6 md:p-10 lg:p-14 w-full max-w-none">
            <div className="mb-8"><p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--gold)]">{label} setup</p><h1 className="mt-2 text-4xl md:text-6xl font-black text-[var(--ink)] dark:text-[#f6efe4]">{pageTitle}</h1>{step < 7 && <div className="mt-6 h-3 rounded-full bg-black/10 dark:bg-white/10 border border-[var(--clay-border)] overflow-hidden"><div className="h-full bg-[var(--gold)]" style={{ width: `${progressPercent}%` }} /></div>}</div>

            {step === 1 && <section className="space-y-6"><div className="rounded-[1.7rem] border border-[var(--clay-border)] bg-[var(--clay-bg-strong)] shadow-[var(--clay-shadow-soft)] p-6"><ShieldCheck className="w-10 h-10 text-[var(--gold)] mb-4" /><h2 className="text-2xl font-black text-[var(--ink)] dark:text-[#f6efe4]">Create your provider account</h2><p className="text-sm font-bold text-[var(--muted)] dark:text-[#c8bda9] mt-2">We send a 6-digit verification code using Struta email.</p></div><div><Label>Email address</Label><Input className={inputClass} type="email" value={form.accountEmail} onChange={(e) => update({ accountEmail: e.target.value.toLowerCase() })} placeholder={isVendor ? "owner@vendor.co.ke" : "registrar@home.co.ke"} /><FieldError message={errors.accountEmail} /></div><div><Label>Password</Label><div className="relative"><Input className={`${inputClass} pr-12`} type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => update({ password: e.target.value })} placeholder="Create a secure password" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-[var(--muted)] dark:text-[#c8bda9]">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div><FieldError message={errors.password} /></div><Button className="btn-struta-primary w-full h-12" type="button" onClick={sendOtp} disabled={loading}>{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send OTP"}</Button><Link to="/login" className="block text-center text-sm font-black text-[var(--gold)] hover:underline">Already have an account?</Link></section>}
            {step === 2 && <section className="max-w-2xl mx-auto text-center space-y-5"><MailCheck className="w-16 h-16 text-[var(--gold)] mx-auto" /><h2 className="text-3xl font-black text-[var(--ink)] dark:text-[#f6efe4]">Verify your email</h2><p className="font-bold text-[var(--muted)] dark:text-[#c8bda9]">Enter the 6-digit code sent to <strong className="text-[var(--ink)] dark:text-[#f6efe4]">{form.accountEmail}</strong>.</p><Input className="setup-input h-16 rounded-2xl text-center text-3xl font-black tracking-[0.35em]" inputMode="numeric" maxLength={6} value={form.code || ""} onChange={(e) => update({ code: e.target.value.replace(/\D/g, '').slice(0, 6), linkConfirmed: false })} placeholder="000000" /><FieldError message={errors.code || errors.linkConfirmed} />{form.linkConfirmed && <div className="flex items-center justify-center gap-2 rounded-2xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 p-3 text-green-700 dark:text-green-300 font-black"><CheckCircle2 className="w-5 h-5" /> Email verified</div>}<div className="grid sm:grid-cols-2 gap-3"><Button className="btn-struta-primary" type="button" onClick={verifyOtp} disabled={loading || form.linkConfirmed}>{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : form.linkConfirmed ? "Verified" : "Verify Code"}</Button><Button type="button" variant="outline" className="rounded-full font-black" onClick={sendOtp} disabled={loading || resendSeconds > 0}>{resendSeconds > 0 ? `Resend in ${resendSeconds}s` : "Resend OTP"}</Button></div><div className="flex justify-between pt-3"><Button type="button" variant="outline" className="rounded-full" disabled><ChevronLeft className="w-4 h-4 mr-2" /> Back</Button><Button type="button" className="btn-struta-gold" onClick={goNext} disabled={!form.linkConfirmed}>Continue</Button></div></section>}
            {step === 3 && <section className="grid md:grid-cols-3 gap-5"><div><Label>{label} Name</Label><Input className={inputClass} value={form.contactName} onChange={(e) => update({ contactName: e.target.value })} /><FieldError message={errors.contactName} /></div><div><Label>{label} Phone</Label><Input className={inputClass} value={form.contactPhone} onChange={(e) => update({ contactPhone: e.target.value })} /><FieldError message={errors.contactPhone} /></div><div><Label>{label} Email</Label><Input className={inputClass} value={form.contactEmail} onChange={(e) => update({ contactEmail: e.target.value })} /><FieldError message={errors.contactEmail} /></div></section>}
            {step === 4 && <section className="space-y-3"><Label>About {label}</Label><Textarea className="setup-input min-h-[220px] rounded-2xl font-bold text-base" maxLength={MAX_ABOUT} value={form.about} onChange={(e) => update({ about: e.target.value.slice(0, MAX_ABOUT) })} placeholder={`Tell families about your ${label.toLowerCase()}.`} /><div className="flex justify-between"><FieldError message={errors.about} /><span className="text-xs font-black text-[var(--muted)] dark:text-[#c8bda9]">{form.about.length}/{MAX_ABOUT}</span></div></section>}
            {step === 5 && <section className="space-y-6"><div className="grid md:grid-cols-4 gap-4"><div><Label>Street</Label><Input className={inputClass} value={form.street} onChange={(e) => update({ street: e.target.value })} /><FieldError message={errors.street} /></div><div><Label>City</Label><Input className={inputClass} value={form.city} onChange={(e) => update({ city: e.target.value })} /><FieldError message={errors.city} /></div><div><Label>State/County</Label><Input className={inputClass} value={form.state} onChange={(e) => update({ state: e.target.value })} /><FieldError message={errors.state} /></div><div><Label>Zip</Label><Input className={inputClass} value={form.zip} onChange={(e) => update({ zip: e.target.value })} /><FieldError message={errors.zip} /></div></div><div><Label>Services</Label><div className="grid sm:grid-cols-2 gap-3 mt-3">{serviceOptions.map((service) => <label key={service} className={`rounded-2xl border p-3 cursor-pointer shadow-[var(--clay-shadow-soft)] font-black ${form.services.includes(service) ? "bg-[var(--gold-bg)] border-[var(--gold)]" : "bg-[var(--clay-bg-strong)] border-[var(--clay-border)]"}`}><input type="checkbox" className="mr-2" checked={form.services.includes(service)} onChange={() => toggleService(service)} />{service}</label>)}</div><FieldError message={errors.services} /></div></section>}
            {step === 6 && <section className="space-y-5"><div><Label>Listing title</Label><Input className={inputClass} value={form.listingTitle} onChange={(e) => update({ listingTitle: e.target.value })} /><FieldError message={errors.listingTitle} /></div><div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); addImages(e.dataTransfer.files); }} onClick={() => inputRef.current?.click()} className="rounded-[1.5rem] border-2 border-dashed border-[var(--gold)] bg-[var(--gold-bg)] shadow-[var(--clay-shadow-soft)] p-8 text-center cursor-pointer"><UploadCloud className="w-10 h-10 text-[var(--gold)] mx-auto mb-3" /><p className="font-black text-[var(--ink)] dark:text-[#f6efe4]">Drag and drop images or click to upload</p><p className="text-xs font-bold text-[var(--muted)] dark:text-[#c8bda9]">JPG, PNG, WEBP. Max 10 images, 5MB each.</p><input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(e) => addImages(e.target.files)} /></div><FieldError message={errors.images} /><div className="grid grid-cols-2 md:grid-cols-4 gap-4">{images.map((image) => <div key={image.id} className="relative rounded-2xl overflow-hidden border border-[var(--clay-border)] bg-[var(--clay-bg-strong)] shadow-[var(--clay-shadow-soft)]"><button type="button" onClick={() => removeImage(image.id)} className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center"><Trash2 className="w-4 h-4" /></button><button type="button" onClick={() => update({ coverImageId: image.id })} className="block w-full"><img src={image.preview} alt="Listing preview" className="w-full aspect-square object-cover" />{form.coverImageId === image.id && <span className="absolute left-2 top-2 rounded-full bg-[var(--gold)] text-[var(--ink)] text-[10px] font-black px-2 py-1">Cover</span>}</button><div className="h-2 bg-black/10 dark:bg-white/10"><div className="h-full bg-[var(--gold)]" style={{ width: `${image.progress}%` }} /></div></div>)}{images.length === 0 && <div className="col-span-full rounded-2xl border border-[var(--clay-border)] bg-[var(--clay-bg-strong)] p-6 text-center font-bold text-[var(--muted)] dark:text-[#c8bda9]"><ImagePlus className="w-8 h-8 mx-auto mb-2" />No images uploaded yet.</div>}</div></section>}
            {step === 7 && <section className="text-center max-w-2xl mx-auto py-10"><CheckCircle2 className="w-24 h-24 text-green-600 dark:text-green-300 mx-auto mb-5" /><h2 className="text-4xl md:text-5xl font-black text-[var(--ink)] dark:text-[#f6efe4]">Welcome aboard! Your setup is complete</h2><p className="text-lg font-bold text-[var(--muted)] dark:text-[#c8bda9] mt-4"><strong>{form.contactName}</strong> is ready on Struta.</p><div className="grid sm:grid-cols-3 gap-3 mt-8"><Button className="btn-struta-primary" onClick={() => navigate(dashboardPath)}>Go to Dashboard</Button><Button className="btn-struta-gold" onClick={() => navigate(listingPath)}>View My Listing</Button><Button variant="outline" className="rounded-full font-black" onClick={() => navigate(editPath)}>Edit Profile</Button></div></section>}
            {step > 2 && step < 7 && <div className="flex flex-col sm:flex-row justify-between gap-3 pt-7"><Button type="button" variant="outline" className="rounded-full font-black" onClick={goBack}><ChevronLeft className="w-4 h-4 mr-2" /> Back</Button>{step < 6 ? <Button type="button" className="btn-struta-gold" onClick={goNext}>Continue</Button> : <Button type="button" className="btn-struta-primary" onClick={finishSetup} disabled={loading}>{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Finish Setup"}</Button>}</div>}
          </div>
        </div>
      </main>
    </div>
  );
}
