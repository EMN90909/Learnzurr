"use client";

import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { showError, showSuccess } from "@/utils/toast";
import { CheckCircle2, ImagePlus, Loader2, Plus, Trash2, UploadCloud, WalletCards } from "lucide-react";

type ServiceRow = { name: string; price: string; description: string };
type ListingImage = { file: File; preview: string; url?: string };

type PendingProviderSetup = { providerType?: "home" | "vendor"; email?: string; businessName?: string; createdAt?: number };

const MAX_DESCRIPTION = 1000;
const homeServices = ["Funeral service", "Body preservation", "Hearse transport", "Chapel viewing"];
const vendorServices = ["Tents and chairs", "Catering", "Flowers", "Transport"];
const steps = ["About", "Services", "Images", "Payment"];

const clay = "bg-white/86 border border-white/70 shadow-[8px_8px_22px_rgba(12,11,8,0.055),-6px_-6px_18px_rgba(255,255,255,0.78)] backdrop-blur-sm";
const claySoft = "bg-[#fffaf0]/72 border border-white/70 shadow-[5px_5px_16px_rgba(12,11,8,0.045),-4px_-4px_14px_rgba(255,255,255,0.72)]";

const paymentLabels: Record<string, string> = {
  mpesa: "M-Pesa phone number",
  till: "Till number",
  paybill: "Paybill number",
  airtel: "Airtel Money number",
};

const readPendingSetup = (): PendingProviderSetup => {
  try {
    const raw = localStorage.getItem("struta_pending_provider_setup");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export default function ProviderSetup() {
  const navigate = useNavigate();
  const { profile, user, loading, refreshProfile } = useAuth();
  const pending = readPendingSetup();
  const isVendor = profile?.role === "marketplace" || profile?.is_vendor || pending.providerType === "vendor";
  const actorId = profile?.id || user?.id;
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<ListingImage[]>([]);
  const [paymentType, setPaymentType] = useState("mpesa");
  const [paymentNumber, setPaymentNumber] = useState("");
  const [paybillAccount, setPaybillAccount] = useState("");
  const [services, setServices] = useState<ServiceRow[]>((isVendor ? vendorServices : homeServices).map((name) => ({ name, price: "", description: "" })));

  const cleanServices = useMemo(() => services.filter((service) => service.name.trim()).map((service) => ({ name: service.name.trim(), price: Number(service.price || 0), description: service.description.trim(), active: true })), [services]);
  const businessName = String(profile?.business_name || profile?.home_name || profile?.full_name || pending.businessName || (isVendor ? "Vendor" : "Funeral Home"));

  const updateService = (index: number, patch: Partial<ServiceRow>) => setServices((rows) => rows.map((row, i) => i === index ? { ...row, ...patch } : row));
  const addService = () => setServices((rows) => [...rows, { name: "", price: "", description: "" }]);
  const removeService = (index: number) => setServices((rows) => rows.filter((_, i) => i !== index));

  const chooseImages = (files: FileList | null) => {
    if (!files) return;
    const selected = Array.from(files).filter((file) => file.type.startsWith("image/")).slice(0, Math.max(0, 3 - images.length));
    if (!selected.length) return showError("Choose image files only.");
    setImages((current) => [...current, ...selected.map((file) => ({ file, preview: URL.createObjectURL(file) }))].slice(0, 3));
  };

  const removeImage = (index: number) => {
    setImages((current) => {
      const target = current[index];
      if (target?.preview) URL.revokeObjectURL(target.preview);
      return current.filter((_, i) => i !== index);
    });
  };

  const getActorId = async () => {
    if (actorId) return actorId;
    const { data } = await supabase.auth.getUser();
    return data.user?.id || null;
  };

  const uploadImages = async (ownerId: string) => {
    const uploaded: string[] = [];
    for (const item of images) {
      if (item.url) {
        uploaded.push(item.url);
        continue;
      }
      const ext = item.file.name.split(".").pop() || "jpg";
      const filePath = `${ownerId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("listing-images").upload(filePath, item.file, { upsert: true, contentType: item.file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("listing-images").getPublicUrl(filePath);
      uploaded.push(data.publicUrl);
    }
    return uploaded;
  };

  const validateStep = () => {
    if (step === 0 && !description.trim()) return showError("Add the listing description families will see.");
    if (step === 0 && description.trim().length > MAX_DESCRIPTION) return showError("Description must be 1000 characters or fewer.");
    if (step === 1 && !cleanServices.length) return showError("Add at least one service you offer.");
    if (step === 2 && images.length > 3) return showError("Maximum listing images is 3.");
    if (step === 3 && !paymentNumber.trim()) return showError(`Add your ${paymentLabels[paymentType] || "payment number"}.`);
    return true;
  };

  const next = () => { if (validateStep() === true) setStep((value) => Math.min(3, value + 1)); };
  const back = () => setStep((value) => Math.max(0, value - 1));

  const save = async () => {
    if (validateStep() !== true) return;
    setSaving(true);
    try {
      const ownerId = await getActorId();
      if (!ownerId) {
        showError("Your new account is still being prepared. Please refresh once, then continue setup.");
        return;
      }
      const imageUrls = await uploadImages(ownerId);
      const paymentDetails = {
        payment_type: paymentType,
        payment_label: paymentLabels[paymentType] || "Payment number",
        payment_number: paymentNumber.trim(),
        paybill_account: paymentType === "paybill" ? paybillAccount.trim() : "",
        invoice_display: paymentType === "paybill" && paybillAccount.trim()
          ? `${paymentLabels[paymentType]}: ${paymentNumber.trim()} • Account: ${paybillAccount.trim()}`
          : `${paymentLabels[paymentType] || "Payment number"}: ${paymentNumber.trim()}`,
      };
      const setup = {
        business_name: businessName,
        description: description.trim(),
        listing_images: imageUrls,
        services: cleanServices,
        ...paymentDetails,
        setup_completed_at: new Date().toISOString(),
      };
      const table = isVendor ? "vendors" : "homes";
      await supabase.from("user_profiles").update({
        provider_setup: setup,
        payment_type: paymentDetails.payment_type,
        payment_number: paymentDetails.payment_number,
        updated_at: new Date().toISOString(),
      }).eq("id", ownerId);
      await supabase.from(table).update({
        description: description.trim(),
        listing_images: imageUrls,
        services: cleanServices,
        payment_type: paymentDetails.payment_type,
        payment_number: paymentDetails.payment_number,
        paybill_account: paymentDetails.paybill_account,
        invoice_payment_display: paymentDetails.invoice_display,
        setup_completed_at: new Date().toISOString(),
        active: true,
      }).or(`id.eq.${ownerId},owner_user_id.eq.${ownerId},user_id.eq.${ownerId}`);
      await supabase.from("provider_payment_profiles").upsert({
        provider_id: ownerId,
        provider_type: isVendor ? "vendor" : "home",
        payment_type: paymentType,
        phone_number: paymentType === "mpesa" || paymentType === "airtel" ? paymentNumber.trim() : null,
        till_number: paymentType === "till" ? paymentNumber.trim() : null,
        paybill_number: paymentType === "paybill" ? paymentNumber.trim() : null,
        paybill_account: paymentType === "paybill" ? paybillAccount.trim() : null,
        recipient_name: businessName,
        is_active: true,
        is_verified: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: "provider_id" });
      localStorage.setItem(`struta_provider_setup_done_${ownerId}`, "true");
      localStorage.removeItem("struta_pending_provider_setup");
      await refreshProfile();
      showSuccess("Account setup complete. Your listing is ready.");
      navigate(isVendor ? "/marketplace" : "/operations", { replace: true });
    } catch (error: any) {
      showError(error.message || "Could not finish setup.");
    } finally {
      setSaving(false);
    }
  };

  if (loading && !profile && !user) {
    return <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fff8e8,#f4efe5_45%,#ede1cf)] flex items-center justify-center p-6"><div className={`${clay} rounded-[2rem] p-8 text-center`}><Loader2 className="w-8 h-8 animate-spin text-[var(--gold)] mx-auto mb-3" /><p className="font-bold text-[var(--ink)]">Preparing your setup...</p></div></div>;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fff9ec_0%,#f4efe5_42%,#ebdcc7_100%)] p-4 flex items-center justify-center">
      <Card className={`w-full max-w-5xl rounded-[2rem] overflow-hidden ${clay}`}>
        <CardHeader className="bg-white/45 border-b border-white/70 p-7">
          <CardTitle className="text-2xl md:text-3xl font-black flex items-center gap-2 text-[var(--ink)]"><span className="w-11 h-11 rounded-2xl bg-[var(--gold)]/15 border border-white/80 flex items-center justify-center shadow-inner"><CheckCircle2 className="w-6 h-6 text-[var(--gold)]" /></span> Set up your {isVendor ? "vendor" : "home"} account</CardTitle>
          <CardDescription className="text-[var(--muted)]">Complete these 4 steps so families see a polished listing and invoices show your correct payment details.</CardDescription>
          <div className="grid grid-cols-4 gap-2 pt-5">
            {steps.map((label, index) => <div key={label} className={`rounded-2xl px-3 py-2 text-center text-xs font-black border transition-all ${index === step ? "bg-[var(--gold)] text-white border-[var(--gold)] shadow-[4px_4px_14px_rgba(200,146,58,0.24)]" : index < step ? "bg-green-50/90 text-green-700 border-green-200" : "bg-white/62 text-[var(--muted)] border-white/80 shadow-sm"}`}>{index + 1}. {label}</div>)}
          </div>
        </CardHeader>
        <CardContent className="p-5 md:p-7 space-y-6">
          {step === 0 && <section className={`${claySoft} rounded-[1.7rem] p-5 space-y-4`}>
            <div><h3 className="text-xl font-black text-[var(--ink)]">About your {isVendor ? "vendor service" : "funeral home"}</h3><p className="text-sm text-[var(--muted)]">This description appears in the family listing. Keep it warm, clear, and professional.</p></div>
            <Textarea value={description} maxLength={MAX_DESCRIPTION} onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESCRIPTION))} placeholder="Describe your services, coverage area, experience, response time, and what families can expect..." rows={10} className="text-base rounded-2xl bg-white/78 border-white/80 shadow-inner" />
            <div className="flex items-center justify-between text-xs"><span className="text-[var(--muted)]">Maximum 1000 characters</span><span className={description.length > 900 ? "text-amber-600 font-bold" : "text-[var(--muted)]"}>{description.length}/{MAX_DESCRIPTION}</span></div>
            <div className="rounded-2xl border border-white/80 bg-white/74 p-4 shadow-inner"><p className="text-xs font-black uppercase tracking-wider text-[var(--gold)] mb-2">Listing preview</p><p className="text-sm text-[var(--ink)] whitespace-pre-wrap">{description || "Your description preview will appear here as families will read it."}</p></div>
          </section>}

          {step === 1 && <section className={`${claySoft} rounded-[1.7rem] p-5 space-y-4`}>
            <div className="flex items-center justify-between gap-3"><div><h3 className="text-xl font-black text-[var(--ink)]">Services offered</h3><p className="text-sm text-[var(--muted)]">Add the services families can request. Prices are optional starting prices.</p></div><Button type="button" variant="outline" className="rounded-2xl bg-white/70" onClick={addService}><Plus className="w-4 h-4 mr-2" /> Add service</Button></div>
            <div className="space-y-3">{services.map((service, index) => <div key={index} className="grid md:grid-cols-[1fr_0.6fr_1fr_auto] gap-2 rounded-2xl border border-white/80 p-3 bg-white/62 shadow-sm"><Input value={service.name} onChange={(e) => updateService(index, { name: e.target.value })} placeholder="Service name" className="rounded-xl bg-white/80" /><Input value={service.price} onChange={(e) => updateService(index, { price: e.target.value.replace(/[^0-9.]/g, "") })} placeholder="Starting price" className="rounded-xl bg-white/80" /><Input value={service.description} onChange={(e) => updateService(index, { description: e.target.value })} placeholder="Short description" className="rounded-xl bg-white/80" /><Button type="button" variant="ghost" size="icon" onClick={() => removeService(index)}><Trash2 className="w-4 h-4 text-red-600" /></Button></div>)}</div>
          </section>}

          {step === 2 && <section className={`${claySoft} rounded-[1.7rem] p-5 space-y-4`}>
            <div><h3 className="text-xl font-black text-[var(--ink)]">Listing images</h3><p className="text-sm text-[var(--muted)]">Upload up to 3 real images. No URL input required.</p></div>
            <label className={`rounded-[1.7rem] border-2 border-dashed border-white/80 bg-white/54 p-8 flex flex-col items-center justify-center text-center cursor-pointer shadow-inner ${images.length >= 3 ? "opacity-50 pointer-events-none" : ""}`}><UploadCloud className="w-10 h-10 text-[var(--gold)] mb-3" /><span className="font-black text-[var(--ink)]">Upload listing image</span><span className="text-xs text-[var(--muted)]">PNG, JPG, JPEG, WebP. Maximum 3 images.</span><input type="file" accept="image/*" multiple className="hidden" onChange={(e) => chooseImages(e.target.files)} /></label>
            <div className="grid md:grid-cols-3 gap-3">{images.map((item, index) => <div key={item.preview} className="relative rounded-2xl overflow-hidden border border-white/80 bg-white/70 shadow-sm"><img src={item.preview} alt={`Listing ${index + 1}`} className="w-full h-44 object-cover" /><Button type="button" variant="destructive" size="sm" className="absolute top-2 right-2 rounded-xl" onClick={() => removeImage(index)}>Remove</Button></div>)}</div>
            <p className="text-xs text-[var(--muted)] flex items-center gap-2"><ImagePlus className="w-4 h-4" /> {images.length}/3 images selected</p>
          </section>}

          {step === 3 && <section className={`${claySoft} rounded-[1.7rem] p-5 space-y-4`}>
            <div><h3 className="text-xl font-black text-[var(--ink)]">Payment details for invoices</h3><p className="text-sm text-[var(--muted)]">Families will see these payment details on invoices and payment instructions.</p></div>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="flex items-center gap-2"><WalletCards className="w-4 h-4" /> Payment method</Label><Select value={paymentType} onValueChange={setPaymentType}><SelectTrigger className="rounded-2xl bg-white/78 border-white/80"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="mpesa">M-Pesa phone number</SelectItem><SelectItem value="till">Till number</SelectItem><SelectItem value="paybill">Paybill number</SelectItem><SelectItem value="airtel">Airtel Money number</SelectItem></SelectContent></Select></div>
              <div className="space-y-1"><Label>{paymentLabels[paymentType]}</Label><Input value={paymentNumber} onChange={(e) => setPaymentNumber(e.target.value)} placeholder={paymentLabels[paymentType]} className="rounded-2xl bg-white/78 border-white/80" /></div>
              {paymentType === "paybill" && <div className="space-y-1 md:col-span-2"><Label>Paybill account/reference name</Label><Input value={paybillAccount} onChange={(e) => setPaybillAccount(e.target.value)} placeholder="Account number or business reference" className="rounded-2xl bg-white/78 border-white/80" /></div>}
            </div>
            <div className="rounded-2xl border border-white/80 bg-white/74 p-4 shadow-inner"><p className="text-xs font-black uppercase tracking-wider text-[var(--gold)] mb-2">Invoice preview</p><p className="text-sm font-bold text-[var(--ink)]">{paymentLabels[paymentType]}: {paymentNumber || "not added yet"}</p>{paymentType === "paybill" && <p className="text-sm text-[var(--muted)]">Account: {paybillAccount || "not added yet"}</p>}</div>
          </section>}

          <div className="flex items-center justify-between pt-2"><Button variant="outline" className="rounded-2xl bg-white/70" onClick={back} disabled={step === 0 || saving}>Back</Button>{step < 3 ? <Button className="btn-struta-gold rounded-2xl" onClick={next}>Next</Button> : <Button className="btn-struta-gold rounded-2xl" onClick={save} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Finish setup</Button>}</div>
        </CardContent>
      </Card>
    </div>
  );
}
