"use client";

import React, { useEffect, useState } from "react";
import PortalLayout from "@/components/layout/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, AlertTriangle, ExternalLink, Lock, Clock, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { showError, showSuccess } from "@/utils/toast";
import { getPlanExpiry, hasActiveProAccess } from "@/components/ProFeatureRoute";

const PLAN_AMOUNTS = { family: 6.95, home: 12.37, vendor: 9.27 } as const;
const PAYPAL_PLANS = {
  home: { id: "P-5SM88354NN222484MNIO6GLA", plan: "home_pro", label: "Subscribe with PayPal", success: "Open PayPal to complete your Funeral Home Pro subscription." },
  vendor: { id: "P-4RL100353J171643BNIO6DBQ", plan: "vendor_pro", label: "Subscribe with PayPal", success: "Open PayPal to complete your Vendor Pro subscription." },
} as const;

const formatCountdown = (target?: string | null) => {
  if (!target) return "Active";
  const diff = Math.max(0, new Date(target).getTime() - Date.now());
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${days} days, ${hours} hours, ${minutes} minutes and ${seconds} seconds`;
};

const getPaypalHostedSubscriptionUrl = (planId: string) => `https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=${encodeURIComponent(planId)}`;

const BillingPage = () => {
  const { profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [startingPayment, setStartingPayment] = useState(false);
  const [now, setNow] = useState(Date.now());
  const role = profile?.role || "operations";
  const isFamily = role === "family";
  const isVendor = role === "marketplace";
  const isHome = !isFamily && !isVendor;
  const portalType = isFamily ? "family" : isVendor ? "marketplace" : "operations";
  const providerType = isVendor ? "vendor" : isFamily ? "family" : "home";
  const accountLabel = isVendor ? "Vendor" : isFamily ? "Family" : "Funeral Home";
  const subscriptionAmount = PLAN_AMOUNTS[providerType];
  const expiry = getPlanExpiry({ ...profile, subscription });
  const isPro = hasActiveProAccess({ ...profile, subscription });
  const isCancelled = String(profile?.plan_status || subscription?.status || "").toLowerCase() === "cancelled" || Boolean(profile?.plan_cancels_at_period_end || subscription?.cancel_at_period_end);
  const paypalPlan = isHome ? PAYPAL_PLANS.home : isVendor ? PAYPAL_PLANS.vendor : null;

  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);

  const fetchSubscription = async () => {
    if (!profile?.id) return;
    try {
      const { data } = await supabase.from("subscriptions").select("*").eq("user_id", profile.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
      setSubscription(data);
    } catch (error: any) {
      console.warn(error.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { void fetchSubscription(); }, [profile?.id]);

  const handleCancelSubscription = async () => {
    setProcessing(true);
    try {
      const { error } = await supabase.rpc("cancel_user_plan_at_period_end", { p_user_id: profile.id });
      if (error) throw error;
      showSuccess("Plan cancelled. Your Pro tools remain active until the paid period ends. Saved ERP data stays in your account.");
      await refreshProfile();
      await fetchSubscription();
    } catch (error: any) {
      showError(error.message || "Failed to cancel subscription.");
    } finally {
      setProcessing(false);
    }
  };

  const openHostedPaypalSubscription = () => {
    if (!paypalPlan) return;
    setStartingPayment(true);
    showSuccess("Payment completed. Pro is active.");
    window.location.href = getPaypalHostedSubscriptionUrl(paypalPlan.id);
  };

  const startPaypalLinkPayment = async () => {
    if (!profile?.id) return showError("Sign in again before upgrading.");
    setStartingPayment(true);
    const params = new URLSearchParams({ type: providerType, userId: profile.id, email: profile.email || "", name: profile.full_name || profile.business_name || accountLabel });
    window.location.href = `/api/paypal/start?${params.toString()}`;
  };

  const freeFeatures = isFamily ? ["Basic memorial tools", "Request funeral services", "View invoices", "Family support dashboard"] : ["Limited active cases", "Basic request chat", "Basic provider profile", "Saved data remains in your account"];
  const proFeatures = isFamily ? ["Custom memorial pages", "Priority support", "Advanced sharing tools", "More family planning features"] : isVendor ? ["Unlimited bookings", "Staff dashboards", "Inventory management", "Reports & analytics", "Priority matching"] : ["Unlimited active cases", "Full ERP access", "Staff dashboards", "Verified provider badge", "Inventory management", "Vehicle tracking", "Reports & analytics", "Priority matching"];

  const PayPalArea = () => paypalPlan ? (
    <div className="space-y-3">
      <Button className="w-full h-12 btn-struta-primary font-bold" onClick={openHostedPaypalSubscription} disabled={startingPayment}>
        {startingPayment ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CreditCard className="w-4 h-4 mr-2" />}
        {paypalPlan.label}
      </Button>
      <p className="text-[11px] leading-5 text-[var(--muted)] text-center">No PayPal SDK is loaded on this page, so ad blockers will not trigger the PayPal logger console error here. You will finish checkout on PayPal.</p>
    </div>
  ) : null;

  return (
    <PortalLayout portalType={portalType as "family" | "operations" | "marketplace"}>
      <div className="max-w-5xl mx-auto space-y-8">
        <div><h2 className="text-3xl font-black text-[var(--ink)]">Billing</h2><p className="text-[var(--muted)]">Manage your {accountLabel} Free Tier and Pro subscription. Free plans keep saved data but deactivate Pro tools.</p></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 rounded-3xl border-[var(--border)] shadow-sm">
            <CardHeader><CardTitle>Current Plan</CardTitle><CardDescription>{isPro ? isCancelled ? `Cancelled, but Pro remains active until your paid period ends.` : `Professional plan for your ${accountLabel.toLowerCase()} account.` : `Basic Free Tier for your ${accountLabel.toLowerCase()} account.`}</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <div className="p-6 rounded-2xl bg-[var(--gold-bg)] border border-[var(--gold)]/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div><h3 className="text-2xl font-black text-[var(--ink)]">{isPro ? `$${subscriptionAmount.toFixed(2)}` : "Free"}<span className="text-sm font-normal text-[var(--muted)]">{isPro ? "/period" : " tier"}</span></h3><div className="text-sm text-[var(--muted)] mt-1">Status: <Badge variant="outline" className={isPro ? "text-emerald-600 border-emerald-200" : "text-amber-700 border-amber-200"}>{isPro ? isCancelled ? "Cancelled — active until expiry" : "Pro Active" : "Free Tier Active"}</Badge></div>{isPro && <p className="text-xs text-[var(--muted)] mt-2 flex items-center gap-2"><Clock className="w-3 h-3" />Remaining: {formatCountdown(expiry)}</p>}</div>
                {!isPro && paypalPlan ? <div className="min-w-[260px] hidden md:block"><PayPalArea /></div> : !isPro ? <Button className="btn-struta-primary font-bold" onClick={startPaypalLinkPayment} disabled={startingPayment}>{startingPayment ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ExternalLink className="w-4 h-4 mr-2" />}Upgrade with PayPal Checkout</Button> : !isCancelled ? <Button variant="outline" className="font-bold text-red-700 border-red-200" onClick={handleCancelSubscription} disabled={processing}>{processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <AlertTriangle className="w-4 h-4 mr-2" />}Cancel Pro</Button> : null}
              </div>
              <div className="p-4 rounded-xl border bg-[var(--surface)] space-y-3 text-xs"><h4 className="font-bold text-[var(--ink)] flex items-center gap-1.5"><Lock className="w-4 h-4 text-amber-500" />Free Tier Includes</h4><div className="grid sm:grid-cols-2 gap-2">{freeFeatures.map((feature) => <div key={feature} className="flex items-center gap-2 text-[var(--muted)]"><CheckCircle2 className="w-4 h-4 text-amber-500" /> {feature}</div>)}</div></div>
              <div className="space-y-4"><h4 className="font-bold text-[var(--ink)]">Pro Features — ${subscriptionAmount.toFixed(2)}</h4><ul className="space-y-2">{proFeatures.map((feature) => <li key={feature} className={`flex items-center gap-2 text-sm ${isPro ? "text-[var(--muted)]" : "text-slate-400"}`}><CheckCircle2 className={`w-4 h-4 ${isPro ? "text-emerald-500" : "text-slate-300"}`} /> {feature}{!isPro && <Badge variant="outline" className="ml-auto text-[10px]">Pro</Badge>}</li>)}</ul></div>
            </CardContent>
          </Card>
          <Card className="rounded-3xl border-[var(--border)] shadow-sm"><CardHeader><CardTitle>Billing Actions</CardTitle></CardHeader><CardContent className="space-y-4">{isPro ? <div className="space-y-4"><div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 text-center text-sm text-emerald-800">{isCancelled ? "Your plan is cancelled, but Pro access remains until expiry. After expiry, your account returns to Free and your saved ERP data remains stored." : "Your Professional Plan is active. Pro tools are available now."}</div>{!isCancelled && <Button variant="destructive" className="w-full h-12 font-bold bg-red-600 hover:bg-red-700" onClick={handleCancelSubscription} disabled={processing}>{processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <AlertTriangle className="w-4 h-4 mr-2" />}Cancel Pro</Button>}</div> : paypalPlan ? <div className="space-y-4"><div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 text-center text-sm text-amber-800">Pay with PayPal to unlock {accountLabel} Pro. Mobile payment options remain available where enabled.</div><div className="md:hidden"><PayPalArea /></div><div className="hidden md:block text-xs text-center text-[var(--muted)]">Use the PayPal subscription button shown in the plan card.</div></div> : <div className="space-y-4"><div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 text-center text-sm text-amber-800">Free Tier is active. Pro tools are locked, but your cases, inventory, vehicles, staff and reports data stay saved for when you upgrade again.</div><Button className="w-full h-12 btn-struta-primary font-bold" onClick={startPaypalLinkPayment} disabled={startingPayment}>{startingPayment ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ExternalLink className="w-4 h-4 mr-2" />}Pay ${subscriptionAmount.toFixed(2)}</Button></div>}</CardContent></Card>
        </div>
      </div>
    </PortalLayout>
  );
};

export default BillingPage;
