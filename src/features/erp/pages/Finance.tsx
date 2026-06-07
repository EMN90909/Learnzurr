"use client";

import React, { useEffect, useState } from "react";
import PortalLayout from "@/components/layout/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showError } from "@/utils/toast";
import ManualPaymentVerificationBoard from "@/components/ManualPaymentVerificationBoard";

const AdminFinance = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from("payments").select("*").order("created_at", { ascending: false }).range(0, 24);
        if (error) throw error;
        setPayments(data || []);
      } catch (error: any) {
        showError(error.message || "Could not load finance data.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const total = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const paid = payments.filter((payment) => payment.status === "paid").length;
  const pending = payments.filter((payment) => payment.status !== "paid").length;

  return (
    <PortalLayout portalType="admin">
      <div className="space-y-8">
        <h2 className="text-2xl font-bold text-slate-900">Financial Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card><CardContent className="pt-6"><p className="text-sm font-medium text-slate-500">Recorded Amount</p><h3 className="text-2xl font-bold text-slate-900 mt-1">USD {total.toLocaleString()}</h3></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm font-medium text-slate-500">Paid Records</p><h3 className="text-2xl font-bold text-slate-900 mt-1">{paid}</h3></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm font-medium text-slate-500">Pending Records</p><h3 className="text-2xl font-bold text-slate-900 mt-1">{pending}</h3></CardContent></Card>
        </div>
        <Card>
          <CardHeader><CardTitle>Recent Payments</CardTitle></CardHeader>
          <CardContent>
            {loading ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div> : payments.length ? (
              <Table>
                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Provider</TableHead><TableHead>Reference</TableHead><TableHead>Amount</TableHead><TableHead className="text-right">Status</TableHead></TableRow></TableHeader>
                <TableBody>{payments.map((payment) => <TableRow key={payment.id}><TableCell>{new Date(payment.created_at).toLocaleDateString()}</TableCell><TableCell className="font-bold">{payment.provider}</TableCell><TableCell>{payment.reference || "No reference"}</TableCell><TableCell>{payment.currency} {Number(payment.amount || 0).toLocaleString()}</TableCell><TableCell className="text-right"><Badge variant="outline">{payment.status}</Badge></TableCell></TableRow>)}</TableBody>
              </Table>
            ) : <div className="text-center py-12 border-2 border-dashed rounded-xl text-slate-500">No payment records yet.</div>}
          </CardContent>
        </Card>
        <ManualPaymentVerificationBoard title="Pending Mobile Money Payments" />
      </div>
    </PortalLayout>
  );
};

export default AdminFinance;
