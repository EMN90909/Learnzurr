"use client";

import React, { useEffect, useState } from "react";
import PortalLayout from "@/components/layout/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Building, CreditCard, Loader2, ShieldAlert, Users, Sparkles, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { showError } from "@/utils/toast";

const ERPDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({ homes: 0, vendors: 0, payments: 0, pendingPayments: 0 });
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [homes, vendors, payments, pendingPayments, subs] = await Promise.all([
          supabase.from("user_profiles").select("id", { count: "exact", head: true }).eq("is_home", true).eq("role", "operations"),
          supabase.from("user_profiles").select("id", { count: "exact", head: true }).eq("is_vendor", true).eq("role", "marketplace"),
          supabase.from("payments").select("id", { count: "exact", head: true }),
          supabase.from("payments").select("id", { count: "exact", head: true }).neq("status", "paid"),
          supabase.from("subscriptions").select("*").order("created_at", { ascending: false }).range(0, 49)
        ]);
        const firstError = [homes.error, vendors.error, payments.error, pendingPayments.error, subs.error].find(Boolean);
        if (firstError) throw firstError;
        setSummary({
          homes: homes.count || 0,
          vendors: vendors.count || 0,
          payments: payments.count || 0,
          pendingPayments: pendingPayments.count || 0,
        });
        setSubscriptions(subs.data || []);
      } catch (error: any) {
        showError(error.message || "Could not load ERP dashboard.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const cards = [
    { label: "Funeral Homes", value: summary.homes, icon: Building, to: "/admin/branches" },
    { label: "Vendors", value: summary.vendors, icon: Users, to: "/marketplace" },
    { label: "Payment Records", value: summary.payments, icon: CreditCard, to: "/admin/finance" },
    { label: "Pending Payments", value: summary.pendingPayments, icon: ShieldAlert, to: "/admin/finance" },
  ];

  const filteredSubs = subscriptions.filter(sub => {
    if (filterStatus === "all") return true;
    return sub.status === filterStatus;
  });

  return (
    <PortalLayout portalType="admin">
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">ERP Overview</h2>
          <p className="text-slate-500">Platform-level summaries load from Supabase records only.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card) => (
            <Card key={card.label}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{card.label}</p>
                    <h3 className="text-2xl font-bold text-slate-900 mt-1">{loading ? <Loader2 className="w-5 h-5 animate-spin" /> : card.value}</h3>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg"><card.icon className="w-5 h-5 text-slate-500" /></div>
                </div>
                <Button variant="link" className="px-0 mt-3" asChild><Link to={card.to}>Open</Link></Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trial Tracking & Subscriptions Visibility */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[var(--gold)]" />
                Trial & Subscription Tracking
              </CardTitle>
              <p className="text-xs text-slate-500 mt-1">Monitor active trials, expired trials, and converted paid subscriptions.</p>
            </div>
            <div className="flex gap-2">
              {['all', 'trialing', 'expired', 'active', 'cancelled', 'past_due'].map((status) => (
                <Button
                  key={status}
                  variant={filterStatus === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus(status)}
                  className="capitalize text-xs"
                >
                  {status}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : filteredSubs.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User / Business ID</TableHead>
                    <TableHead>Plan Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Trial Started</TableHead>
                    <TableHead>Trial Ends</TableHead>
                    <TableHead>Payment Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubs.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-mono text-xs">{sub.home_id || sub.provider_id || sub.user_id}</TableCell>
                      <TableCell className="font-bold">{sub.plan_name || "Free Trial"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          sub.status === 'active' ? 'text-emerald-600 border-emerald-200 bg-emerald-50' :
                          sub.status === 'trialing' ? 'text-amber-600 border-amber-200 bg-amber-50' :
                          'text-rose-600 border-rose-200 bg-rose-50'
                        }>
                          {sub.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{sub.trial_started_at ? new Date(sub.trial_started_at).toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell>{sub.trial_ends_at ? new Date(sub.trial_ends_at).toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={sub.payment_status === 'paid' ? 'text-emerald-600' : 'text-slate-400'}>
                          {sub.payment_status || 'unpaid'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12 border-2 border-dashed rounded-xl text-slate-500">
                No subscription records found matching this filter.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Admin Work Queue</CardTitle></CardHeader>
          <CardContent>
            <div className="text-center py-12 border-2 border-dashed rounded-xl text-slate-500">
              No queued admin jobs yet. Email, payment verification, notification, and report jobs will appear here when backend workers enqueue them.
            </div>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default ERPDashboard;