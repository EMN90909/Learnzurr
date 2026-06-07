"use client";

import React, { useEffect, useMemo, useState } from "react";
import PortalLayout from "@/components/layout/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Users, Building2, Store, CreditCard, Database, Activity, BarChart3, Share2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { showError } from "@/utils/toast";

const normalizeRole = (role?: string) => {
  const value = String(role || "family").toLowerCase();
  if (["bereaved", "family", "families", "client", "customer"].includes(value)) return "family";
  if (["home", "funeral_home", "funeral-home", "operations", "funeralhome"].includes(value)) return "operations";
  if (["vendor", "vendors", "marketplace", "supplier"].includes(value)) return "marketplace";
  return value;
};

const Bar = ({ label, value, max }: { label: string; value: number; max: number }) => (
  <div className="space-y-1"><div className="flex items-center justify-between text-xs"><span className="font-bold text-slate-600 capitalize">{label}</span><span className="text-slate-500">{value}</span></div><div className="h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full bg-[var(--gold)]" style={{ width: `${max ? Math.max(value > 0 ? 6 : 0, (value / max) * 100) : 0}%` }} /></div></div>
);

const AdminReportsPage = () => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [loadError, setLoadError] = useState("");

  const loadSummary = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const response = await apiFetch("/api/admin/reports-summary");
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Could not load reports summary.");
      setSummary(result);
    } catch (error: any) {
      const message = error.message || "Could not load reports summary.";
      setLoadError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadSummary(); }, []);

  const roleCounts = summary?.users?.byRole || {};
  const rawUsers = summary?.users?.raw || [];
  const fallbackCounts = rawUsers.reduce((acc: any, user: any) => { const role = normalizeRole(user.role); acc[role] = (acc[role] || 0) + 1; return acc; }, {});
  const families = summary?.users?.families ?? roleCounts.family ?? fallbackCounts.family ?? 0;
  const homes = summary?.users?.homes ?? roleCounts.operations ?? fallbackCounts.operations ?? 0;
  const vendors = summary?.users?.vendors ?? roleCounts.marketplace ?? fallbackCounts.marketplace ?? 0;
  const referralVisits = summary?.referrals?.visits || 0;
  const referralJoins = summary?.referrals?.converted || 0;
  const maxRole = Math.max(1, families, homes, vendors);
  const requestStatus = summary?.requests?.byStatus || {};
  const maxRequests = Math.max(1, ...Object.values(requestStatus).map((v: any) => Number(v || 0)));
  const referralRoles = summary?.referrals?.byRole || {};
  const maxReferral = Math.max(1, ...Object.values(referralRoles).map((v: any) => Number(v || 0)), referralJoins);
  const paymentRequestCount = summary?.paymentRequests?.count ?? summary?.mobileMoney?.count ?? 0;
  const pendingPaymentRequests = summary?.paymentRequests?.pending ?? summary?.mobileMoney?.pending ?? 0;

  const cards = useMemo(() => [
    { label: "Bereaved Families", value: families, icon: Users },
    { label: "Funeral Homes", value: homes, icon: Building2 },
    { label: "Vendors", value: vendors, icon: Store },
    { label: "Referral Joins", value: referralJoins, icon: Share2 },
    { label: "Service Requests", value: summary?.requests?.total || 0, icon: Activity },
    { label: "Payment Records", value: summary?.payments?.count || 0, icon: CreditCard },
    { label: "Supabase Rows Loaded", value: summary?.supabase?.sampledRows || 0, icon: Database },
  ], [families, homes, vendors, referralJoins, summary]);

  return (
    <PortalLayout portalType="admin">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div><span className="section-tag">Live Platform Reports</span><h1 className="text-3xl font-black text-[var(--ink)] mt-1">Activity, users, referrals, payments and system usage</h1><p className="text-[var(--muted)] mt-2">Live counts from Supabase across families, funeral homes, vendors, referrals, requests and payments.</p></div>
          <Button variant="outline" onClick={loadSummary} disabled={loading}>{loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}Refresh</Button>
        </div>
        {loadError && <Card className="border-red-200 bg-red-50"><CardContent className="p-4 text-sm text-red-700">{loadError}</CardContent></Card>}
        {loading && !summary ? <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-[var(--gold)]" /></div> : <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">{cards.map((item) => <Card key={item.label} className="rounded-3xl border-[var(--border)] shadow-sm"><CardContent className="p-6 flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-widest text-[var(--muted)]">{item.label}</p><h3 className="text-3xl font-black text-[var(--ink)] mt-2">{Number(item.value || 0).toLocaleString()}</h3></div><div className="w-12 h-12 rounded-2xl bg-[var(--gold-bg)] flex items-center justify-center"><item.icon className="w-6 h-6 text-[var(--gold)]" /></div></CardContent></Card>)}</div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="rounded-3xl border-[var(--border)] shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-[var(--gold)]" />User Activity</CardTitle><CardDescription>Registered platform users by account type.</CardDescription></CardHeader><CardContent className="space-y-4"><Bar label="Bereaved Families" value={families} max={maxRole} /><Bar label="Funeral Homes" value={homes} max={maxRole} /><Bar label="Vendors" value={vendors} max={maxRole} /><div className="pt-3 text-xs text-[var(--muted)]">Paid accounts: <strong>{summary?.users?.paid ?? summary?.users?.pro ?? 0}</strong> · Banned: <strong>{summary?.users?.banned ?? 0}</strong></div></CardContent></Card>
            <Card className="rounded-3xl border-[var(--border)] shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2"><Share2 className="w-5 h-5 text-[var(--gold)]" />Referral Activity</CardTitle><CardDescription>Referral visits and joined accounts.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="grid grid-cols-2 gap-3"><div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-[var(--muted)] font-bold uppercase">Visits</p><p className="text-2xl font-black">{referralVisits}</p></div><div className="rounded-2xl bg-[var(--gold-bg)] p-4"><p className="text-xs text-[var(--muted)] font-bold uppercase">Joined</p><p className="text-2xl font-black">{referralJoins}</p></div></div>{Object.keys(referralRoles).length ? Object.entries(referralRoles).map(([key, value]: any) => <Bar key={key} label={key} value={Number(value || 0)} max={maxReferral} />) : <p className="text-sm text-[var(--muted)]">Referral role breakdown will appear after referred users join.</p>}</CardContent></Card>
            <Card className="rounded-3xl border-[var(--border)] shadow-sm"><CardHeader><CardTitle>Request Activity</CardTitle><CardDescription>Live service request distribution.</CardDescription></CardHeader><CardContent className="space-y-4">{Object.keys(requestStatus).length ? Object.entries(requestStatus).map(([key, value]: any) => <Bar key={key} label={key} value={Number(value || 0)} max={maxRequests} />) : <p className="text-sm text-[var(--muted)]">Request statuses will appear once service requests exist.</p>}</CardContent></Card>
            <Card className="rounded-3xl border-[var(--border)] shadow-sm"><CardHeader><CardTitle>Payment Activity</CardTitle><CardDescription>PayPal and manual payment request activity.</CardDescription></CardHeader><CardContent className="space-y-3"><Badge className={summary?.paypal?.serverConfigured ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}>{summary?.paypal?.serverConfigured ? "PayPal server keys configured" : "PayPal server keys missing"}</Badge><p className="text-sm text-[var(--muted)]">Recorded payment total: <strong>USD {Number(summary?.payments?.totalAmount || 0).toLocaleString()}</strong></p><p className="text-sm text-[var(--muted)]">Payment requests: <strong>{paymentRequestCount}</strong></p><p className="text-sm text-[var(--muted)]">Pending approvals: <strong>{pendingPaymentRequests}</strong></p></CardContent></Card>
            <Card className="lg:col-span-2 rounded-3xl border-[var(--border)] shadow-sm"><CardHeader><CardTitle>Supabase Usage Snapshot</CardTitle><CardDescription>Rows sampled from users, requests, payments, payment requests, referrals and invoices.</CardDescription></CardHeader><CardContent><div className="rounded-2xl border p-5 bg-slate-50"><p className="text-4xl font-black text-[var(--ink)]">{Number(summary?.supabase?.sampledRows || 0).toLocaleString()}</p><p className="text-sm text-[var(--muted)] mt-1">records currently powering this report</p></div></CardContent></Card>
          </div>
        </>}
      </div>
    </PortalLayout>
  );
};
export default AdminReportsPage;