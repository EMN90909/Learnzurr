"use client";

import React, { useMemo, useState } from "react";
import PortalLayout from "@/components/layout/PortalLayout";
import { useAuth } from "@/components/auth/AuthProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Cable, CheckCircle2, Lock, Search, Settings, ShieldCheck, Truck, Users, WalletCards } from "lucide-react";

const homeIntegrations = [
  { name: "M-Pesa STK Push", category: "Payments", roles: ["Manager", "Secretary / Admin officer", "Accountant / Cashier", "operations"], status: "Ready", icon: WalletCards },
  { name: "PayPal Billing", category: "Payments", roles: ["Manager", "Secretary / Admin officer", "operations"], status: "Ready", icon: WalletCards },
  { name: "WhatsApp Family Updates", category: "Messaging", roles: ["Manager", "Secretary / Admin officer", "Coordinator", "Counselor / Arranger", "operations"], status: "Setup", icon: Users },
  { name: "Email Notifications", category: "Messaging", roles: ["Manager", "Secretary / Admin officer", "Coordinator", "operations"], status: "Ready", icon: Users },
  { name: "Google Calendar", category: "Scheduling", roles: ["Manager", "Coordinator", "Secretary / Admin officer", "operations"], status: "Setup", icon: Settings },
  { name: "Fleet / Driver Tracking", category: "Transport", roles: ["Manager", "Driver / Transport officer", "Driver", "Coordinator", "operations"], status: "Setup", icon: Truck },
  { name: "Inventory Supplier Sync", category: "Inventory", roles: ["Manager", "Inventory / Stores staff", "operations"], status: "Setup", icon: Cable },
  { name: "SMS Case Alerts", category: "Messaging", roles: ["Manager", "Secretary / Admin officer", "Coordinator", "operations"], status: "Setup", icon: Users },
];

const vendorIntegrations = [
  { name: "M-Pesa Vendor Payments", category: "Payments", roles: ["Owner / Manager", "Manager", "Accountant / Cashier", "marketplace"], status: "Ready", icon: WalletCards },
  { name: "PayPal Vendor Billing", category: "Payments", roles: ["Owner / Manager", "Manager", "marketplace"], status: "Ready", icon: WalletCards },
  { name: "WhatsApp Order Updates", category: "Messaging", roles: ["Owner / Manager", "Manager", "Sales / Bookings officer", "Delivery / Setup team", "marketplace"], status: "Setup", icon: Users },
  { name: "Google Calendar Bookings", category: "Scheduling", roles: ["Owner / Manager", "Manager", "Sales / Bookings officer", "Delivery / Setup team", "marketplace"], status: "Setup", icon: Settings },
  { name: "Delivery Route Tracking", category: "Transport", roles: ["Owner / Manager", "Manager", "Driver", "Delivery / Setup team", "marketplace"], status: "Setup", icon: Truck },
  { name: "Inventory Stock Sync", category: "Inventory", roles: ["Owner / Manager", "Manager", "Inventory staff", "marketplace"], status: "Setup", icon: Cable },
  { name: "Supplier Catalogue Import", category: "Inventory", roles: ["Owner / Manager", "Manager", "Inventory staff", "marketplace"], status: "Setup", icon: Cable },
  { name: "SMS Customer Alerts", category: "Messaging", roles: ["Owner / Manager", "Manager", "Sales / Bookings officer", "marketplace"], status: "Setup", icon: Users },
];

const normalise = (value?: string | null) => String(value || "").trim().toLowerCase();

export default function ErpIntegrationsPage() {
  const { profile } = useAuth();
  const role = profile?.staff_role || profile?.role || "Manager";
  const portalType = profile?.role === "marketplace" || profile?.staff_business_type === "vendor" ? "marketplace" : "operations";
  const [query, setQuery] = useState("");
  const integrations = portalType === "marketplace" ? vendorIntegrations : homeIntegrations;
  const visible = useMemo(() => integrations.filter((item) => {
    const allowed = item.roles.some((r) => normalise(r) === normalise(role) || normalise(r) === normalise(profile?.role));
    const matches = `${item.name} ${item.category} ${item.roles.join(" ")}`.toLowerCase().includes(query.toLowerCase());
    return matches && (allowed || normalise(profile?.role) === "admin" || normalise(profile?.role) === "operations" || normalise(profile?.role) === "marketplace");
  }), [integrations, profile?.role, query, role]);

  return (
    <PortalLayout portalType={portalType as "operations" | "marketplace"}>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--gold-bg)] text-[var(--gold)] text-xs font-black uppercase tracking-widest mb-3"><Cable className="w-3.5 h-3.5" /> ERP Integrations</div>
            <h2 className="text-3xl font-black text-[var(--ink)]">{portalType === "marketplace" ? "Vendor" : "Funeral Home"} integrations</h2>
            <p className="text-[var(--muted)] max-w-2xl">Integrations are separated by staff responsibility so each staff member only sees the tools relevant to their ERP work.</p>
          </div>
          <div className="relative w-full md:w-80"><Search className="absolute left-3 top-3 w-4 h-4 text-[var(--muted)]" /><Input className="pl-10" placeholder="Search integrations..." value={query} onChange={(e) => setQuery(e.target.value)} /></div>
        </div>

        <Card className="rounded-3xl border-[var(--border)] shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-[var(--gold)]" /> Staff access view</CardTitle>
            <CardDescription>Signed in role: <strong>{role}</strong>. Portal: <strong>{portalType === "marketplace" ? "Vendor" : "Home"}</strong>.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visible.map((item) => {
                const Icon = item.icon;
                const isReady = item.status === "Ready";
                return (
                  <div key={item.name} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[var(--gold-bg)] flex items-center justify-center"><Icon className="w-5 h-5 text-[var(--gold)]" /></div>
                      <Badge variant="outline" className={isReady ? "text-emerald-700 border-emerald-200" : "text-amber-700 border-amber-200"}>{item.status}</Badge>
                    </div>
                    <div>
                      <h3 className="font-black text-[var(--ink)]">{item.name}</h3>
                      <p className="text-xs text-[var(--muted)] mt-1">{item.category}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">Allowed staff</p>
                      <div className="flex flex-wrap gap-1.5">{item.roles.slice(0, 4).map((r) => <Badge key={r} variant="secondary" className="text-[10px]">{r}</Badge>)}</div>
                    </div>
                    <Button className="w-full" variant={isReady ? "default" : "outline"}>{isReady ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}{isReady ? "Manage" : "Configure"}</Button>
                  </div>
                );
              })}
            </div>
            {visible.length === 0 && <div className="p-8 text-center text-sm text-[var(--muted)]">No integrations match this staff role or search.</div>}
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}
