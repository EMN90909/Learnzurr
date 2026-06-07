"use client";

import React, { useState, useEffect } from "react";
import PortalLayout from "@/components/layout/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, FileText, CheckCircle2, Sparkles, Send, ExternalLink, Clock, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { showError, showSuccess } from "@/utils/toast";

const ADMIN_RECIPIENT_NAME = "Emmanuel Nasongo";
const ADMIN_RECIPIENT_PHONE = "+2547787073955";
const FAMILY_PREMIUM_AMOUNT = 6.95;
const FAMILY_PREMIUM_CURRENCY = "USD";
const DEFAULT_PRO_MS = (((30 * 24 + 6) * 60 + 5) * 60 + 30) * 1000;

async function createSubscriptionPaymentRequest(payload: Record<string, any>) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Sign in again before submitting payment.");
  const response = await fetch("/api/subscription-payment-requests", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Could not submit payment request.");
  return data.paymentRequest;
}

const formatCountdown = (target?: string | null) => {
  if (!target) return "30 days, 6 hours, 5 minutes and 30 seconds";
  const diff = Math.max(0, new Date(target).getTime() - Date.now());
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${days} days, ${hours} hours, ${minutes} minutes and ${seconds} seconds`;
};

const getEffectiveExpiry = (profile: any) => profile?.plan_expires_at || profile?.plan_original_expires_at || profile?.subscription?.expires_at || profile?.subscription?.original_expires_at || null;
const isCancelled = (profile: any) => String(profile?.plan_status || profile?.subscription?.status || "").toLowerCase() === "cancelled" || Boolean(profile?.plan_cancels_at_period_end || profile?.subscription?.cancel_at_period_end);
const hasActivePro = (profile: any) => Boolean(profile?.isPro || profile?.is_pro) && (!getEffectiveExpiry(profile) || new Date(getEffectiveExpiry(profile)).getTime() > Date.now());

const FamilyBillingPage = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"paypal" | "mobile_money">("paypal");
  const [payerPhone, setPayerPhone] = useState(profile?.phone || "");
  const [transactionCode, setTransactionCode] = useState("");
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [paypalStarting, setPaypalStarting] = useState(false);
  const [cancelingPlan, setCancelingPlan] = useState(false);
  const [eulogyOpen, setEulogyOpen] = useState(false);
  const [eulogyForm, setEulogyForm] = useState({ name: "", relationship: "Parent", achievements: "", tone: "warm" });
  const [generatedEulogy, setGeneratedEulogy] = useState("");
  const [generating, setGenerating] = useState(false);
  const [now, setNow] = useState(Date.now());

  const expiry = getEffectiveExpiry(profile);
  const isPro = hasActivePro(profile);
  const cancelled = isCancelled(profile);
  const countdown = formatCountdown(expiry || new Date(Date.now() + DEFAULT_PRO_MS).toISOString());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const fetchPayments = async () => {
    if (!profile?.id) return;
    try {
      const { data } = await supabase.from("payments").select("*").eq("user_id", profile.id).order("created_at", { ascending: false }).limit(10);
      setPayments(data || []);
    } catch (error: any) {
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { void fetchPayments(); }, [profile?.id]);

  const openPayPalLink = async () => {
    if (!profile?.id) return showError("Sign in again before upgrading.");
    setPaypalStarting(true);
    const params = new URLSearchParams({ type: "family", userId: profile.id, email: profile.email || "", name: profile.full_name || "Family" });
    window.location.href = `/api/paypal/start?${params.toString()}`;
  };

  const cancelPlan = async () => {
    if (!profile?.id) return showError("Sign in again before cancelling.");
    setCancelingPlan(true);
    try {
      const { error } = await supabase.rpc("cancel_user_plan_at_period_end", { p_user_id: profile.id });
      if (error) throw error;
      showSuccess("Plan cancelled. Premium access remains active until the original expiry date.");
    } catch (error: any) {
      showError(error.message || "Could not cancel plan.");
    } finally {
      setCancelingPlan(false);
    }
  };

  const submitMobileMoney = async () => {
    if (!transactionCode.trim()) return showError("Enter your mobile money transaction ID first.");
    if (!payerPhone.trim()) return showError("Enter the phone number used to pay.");
    setManualSubmitting(true);
    try {
      const payerName = profile?.full_name || profile?.email || "Bereaved family";
      await createSubscriptionPaymentRequest({ role: "family", payer_name: payerName, payer_email: profile?.email || null, payer_phone: payerPhone.trim(), transaction_id: transactionCode.trim().toUpperCase(), amount: FAMILY_PREMIUM_AMOUNT, currency: FAMILY_PREMIUM_CURRENCY, plan_code: "family_pro", method: "mobile_money", metadata: { account_type: "bereaved", recipient_name: ADMIN_RECIPIENT_NAME, recipient_phone: ADMIN_RECIPIENT_PHONE } });
      showSuccess("Mobile payment sent for approval.");
      setUpgradeOpen(false);
      setTransactionCode("");
    } catch (error: any) {
      showError(error.message || "Failed to submit mobile payment.");
    } finally {
      setManualSubmitting(false);
    }
  };

  const handleGenerateEulogy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eulogyForm.name.trim()) return showError("Please enter the name of your loved one.");
    setGenerating(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 900));
      const eulogy = `We gather here today to honor and celebrate the beautiful life of ${eulogyForm.name}. As a beloved ${eulogyForm.relationship.toLowerCase()}, they brought warmth, joy, and wisdom into our lives.\n\n${eulogyForm.name} will be remembered for ${eulogyForm.achievements || "their kindness, strength, and the love they gave to everyone around them"}. Their legacy will forever remain in our hearts. Rest in eternal peace.`;
      setGeneratedEulogy(eulogy);
      showSuccess("Eulogy generated successfully!");
    } catch {
      showError("Failed to generate eulogy.");
    } finally {
      setGenerating(false);
    }
  };

  const freeFeatures = ["Create basic requests", "View invoices", "Access family dashboard", "Basic memorial tools"];
  const premiumFeatures = [
    "Custom memorial pages",
    "AI eulogy and message drafts",
    "Priority family support (faster response)",
    "Advanced sharing tools (social media, private links)",
    "More planning and coordination tools (checklists, reminders)",
    "Unlimited photo uploads",
    "Private memorial (password protection)",
    "Download memorial as PDF",
    "No ads on memorial page",
    "Custom memorial colors/themes",
  ];

  return (
    <PortalLayout portalType="family">
      <div className="max-w-5xl mx-auto space-y-8">
        <div><h2 className="text-3xl font-black text-[var(--ink)]">Family Billing</h2><p className="text-[var(--muted)]">Manage your Free family account and Family Tools plan.</p></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 rounded-3xl border-[var(--border)] shadow-sm">
            <CardHeader><CardTitle>{isPro ? "Family Tools" : "Family Free"}</CardTitle><CardDescription>{isPro ? cancelled ? "Cancelled, but premium remains active until your paid period ends." : "Premium bereaved-family tools are active." : "Memorial and planning tools are available to families."}</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-2xl bg-[var(--gold-bg)] border border-[var(--gold)]/20 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div><p className="text-xs font-black uppercase tracking-widest text-[var(--gold)]">Current Plan</p><h3 className="text-3xl font-black text-[var(--ink)] mt-1">{isPro ? "Family Tools" : "Free"}</h3><Badge variant="outline" className={isPro ? "mt-2 border-emerald-200 text-emerald-700 bg-emerald-50" : "mt-2 border-amber-200 text-amber-700 bg-amber-50"}>{isPro ? cancelled ? "Cancelled — active until expiry" : "Premium Active" : "Free Active"}</Badge>{isPro && <p className="text-xs text-[var(--muted)] mt-3 flex gap-2 items-center"><Clock className="w-3 h-3" />Premium access remaining: {countdown}</p>}</div>
                <div className="flex flex-col gap-2">{!isPro && <Button className="btn-struta-primary font-bold" onClick={() => setUpgradeOpen(true)}></Button>}{isPro && !cancelled && <Button variant="outline" className="font-bold text-red-700 border-red-200" onClick={cancelPlan} disabled={cancelingPlan}>{cancelingPlan ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}Cancel plan</Button>}</div>
              </div>
              <div className="grid md:grid-cols-2 gap-4"><div className="rounded-2xl border p-4 space-y-3"><h4 className="font-bold">Free Includes</h4>{freeFeatures.map((item) => <p key={item} className="text-sm text-[var(--muted)] flex gap-2"><CheckCircle2 className="w-4 h-4 text-amber-500" />{item}</p>)}</div><div className="rounded-2xl border p-4 space-y-3"><h4 className="font-bold flex items-center gap-2"><Sparkles className="w-4 h-4 text-[var(--gold)]" />Family Tools — ${FAMILY_PREMIUM_AMOUNT.toFixed(2)}</h4>{premiumFeatures.map((item) => <p key={item} className="text-sm text-[var(--muted)] flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" />{item}</p>)}</div></div>
            </CardContent>
          </Card>
          <Card className="rounded-3xl border-[var(--border)] shadow-sm"><CardHeader><CardTitle>Premium Tools</CardTitle><CardDescription>Available for families.</CardDescription></CardHeader><CardContent className="space-y-4"><Button className="btn-struta-gold w-full" onClick={() => setEulogyOpen(true)} ><FileText className="w-4 h-4 mr-2" />AI Eulogy Generator</Button>{!isPro && <p className="text-xs text-[var(--muted)] text-center">AI family tools are available from the Create page.</p>}</CardContent></Card>
        </div>
        <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}><DialogContent className="max-w-md" aria-describedby="family-premium-description"><DialogHeader><DialogTitle></DialogTitle><DialogDescription id="family-premium-description">PayPal Checkout opens securely. Mobile payment requires a transaction ID for verification.</DialogDescription></DialogHeader><div className="space-y-4 py-2"><div className="grid grid-cols-2 gap-2"><Button variant={paymentMethod === "paypal" ? "default" : "outline"} onClick={() => setPaymentMethod("paypal")}>PayPal Checkout</Button><Button variant={paymentMethod === "mobile_money" ? "default" : "outline"} onClick={() => setPaymentMethod("mobile_money")}>Mobile Pay</Button></div>{paymentMethod === "paypal" && <div className="space-y-3"><div className="rounded-xl border p-4 text-sm text-[var(--muted)] bg-[var(--surface)]">You will be redirected directly to the official PayPal payment page.</div><Button className="w-full btn-struta-primary" onClick={openPayPalLink} disabled={paypalStarting}>{paypalStarting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ExternalLink className="w-4 h-4 mr-2" />}Pay ${FAMILY_PREMIUM_AMOUNT.toFixed(2)} with PayPal</Button></div>}{paymentMethod === "mobile_money" && <div className="space-y-3"><div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Send payment to <strong>{ADMIN_RECIPIENT_NAME}</strong> at <strong>{ADMIN_RECIPIENT_PHONE}</strong>, then submit your phone number and mobile payment transaction ID.</div><div className="space-y-2"><Label>Your payment phone number</Label><Input value={payerPhone} onChange={(e) => setPayerPhone(e.target.value)} placeholder="+254 712 345 678" /></div><div className="space-y-2"><Label>Mobile payment transaction ID</Label><Input value={transactionCode} onChange={(e) => setTransactionCode(e.target.value.toUpperCase())} placeholder="e.g. TID12345ABC" /></div><Button className="w-full btn-struta-gold" onClick={submitMobileMoney} disabled={manualSubmitting}>{manualSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}Submit payment</Button></div>}</div></DialogContent></Dialog>
        <Dialog open={eulogyOpen} onOpenChange={setEulogyOpen}><DialogContent className="max-w-lg bg-[var(--surface)] border-[var(--border)] text-[var(--ink)] max-h-[90vh] overflow-y-auto" aria-describedby="eulogy-description"><DialogHeader><DialogTitle className="font-head text-xl flex items-center gap-2"><FileText className="w-5 h-5 text-[var(--gold)]" />AI Eulogy Generator</DialogTitle><DialogDescription id="eulogy-description">Draft a beautiful, personalized eulogy to honor your loved one.</DialogDescription></DialogHeader><form onSubmit={handleGenerateEulogy} className="space-y-4 py-3"><div className="grid grid-cols-2 gap-4"><div className="space-y-1.5"><Label>Loved One&apos;s Name</Label><Input required placeholder="e.g. John Doe" value={eulogyForm.name} onChange={(e) => setEulogyForm({ ...eulogyForm, name: e.target.value })} /></div><div className="space-y-1.5"><Label>Relationship</Label><Select value={eulogyForm.relationship} onValueChange={(v) => setEulogyForm({ ...eulogyForm, relationship: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Parent">Parent</SelectItem><SelectItem value="Spouse">Spouse</SelectItem><SelectItem value="Sibling">Sibling</SelectItem><SelectItem value="Child">Child</SelectItem><SelectItem value="Friend">Friend</SelectItem></SelectContent></Select></div></div><div className="space-y-1.5"><Label>Key Achievements / Memories</Label><Textarea placeholder="Loved gardening, served in the community..." value={eulogyForm.achievements} onChange={(e) => setEulogyForm({ ...eulogyForm, achievements: e.target.value })} rows={3} /></div><Button type="submit" className="w-full btn-struta-gold font-bold" disabled={generating}>{generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Generate Eulogy Draft</Button></form>{generatedEulogy && <div className="p-4 bg-[var(--gold-bg)] rounded-xl text-sm whitespace-pre-wrap border border-[var(--gold)]/20">{generatedEulogy}</div>}</DialogContent></Dialog>
      </div>
    </PortalLayout>
  );
};

export default FamilyBillingPage;
