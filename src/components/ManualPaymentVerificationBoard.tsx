"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import { showError, showSuccess } from "@/utils/toast";
import { useAuth } from "@/components/auth/AuthProvider";

type ManualPaymentVerificationBoardProps = {
  title?: string;
};

export default function ManualPaymentVerificationBoard({
  title = "Manual M-Pesa Verification",
}: ManualPaymentVerificationBoardProps) {
  const { user, profile } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [selectedPlans, setSelectedPlans] = useState<Record<string, string>>({});
  const [planChanging, setPlanChanging] = useState<Record<string, boolean>>({});

  const loadPayments = async () => {
    setLoading(true);
    try {
      const response = await apiFetch("/api/payments/manual-pending");
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "Could not load manual payments.");
      }
      setPayments(result.payments || []);
    } catch (error: any) {
      showError(error.message || "Could not load manual payments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && profile?.role && ["admin", "operations", "marketplace"].includes(profile.role)) {
      void loadPayments();
    }
  }, [user, profile]);

  const handleConfirm = async (paymentId: string) => {
    try {
      const response = await apiFetch(`/api/payments/manual/${paymentId}/confirm`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "Failed to confirm payment.");
      }
      showSuccess("Manual payment confirmed.");
      await loadPayments();
    } catch (error: any) {
      showError(error.message || "Failed to confirm payment.");
    }
  };

  const handleReject = async (paymentId: string) => {
    const reason = reasons[paymentId]?.trim();
    if (!reason) {
      showError("Enter a rejection reason first.");
      return;
    }

    try {
      const response = await apiFetch(`/api/payments/manual/${paymentId}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "Failed to reject payment.");
      }
      showSuccess("Manual payment rejected.");
      await loadPayments();
    } catch (error: any) {
      showError(error.message || "Failed to reject payment.");
    }
  };

  const handleChangePlan = async (paymentId: string, userId: string) => {
    const plan = selectedPlans[paymentId]?.trim();
    if (!plan) {
      showError("Select a plan first.");
      return;
    }

    setPlanChanging((prev) => ({ ...prev, [paymentId]: true }));
    try {
      const response = await apiFetch(`/api/admin/users/${userId}/plan-change`, {
        method: "POST",
        body: JSON.stringify({ plan_name: plan }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "Failed to change plan.");
      }
      showSuccess(`Plan changed to ${plan} successfully.`);
      setSelectedPlans((prev) => ({ ...prev, [paymentId]: "" }));
      await loadPayments();
    } catch (error: any) {
      showError(error.message || "Failed to change plan.");
    } finally {
      setPlanChanging((prev) => ({ ...prev, [paymentId]: false }));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-sm text-slate-500">Loading pending manual payments...</div>
        ) : payments.length ? (
          payments.map((payment) => (
            <div key={payment.id} className="rounded-xl border p-4 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 text-sm">
                  <p><span className="font-bold">Customer:</span> {payment.customer?.full_name || payment.customer?.email || "Unknown"}</p>
                  <p><span className="font-bold">Provider:</span> {payment.provider?.home_name || payment.provider?.business_name || payment.provider?.full_name || "Unknown"}</p>
                  <p><span className="font-bold">Request ID:</span> {payment.request_id || payment.invoice_id || payment.order_id || "N/A"}</p>
                  <p><span className="font-bold">Expected amount:</span> {payment.currency} {Number(payment.amount_expected || 0).toLocaleString()}</p>
                  <p><span className="font-bold">Submitted amount:</span> {payment.currency} {Number(payment.amount_submitted || 0).toLocaleString()}</p>
                  <p><span className="font-bold">Transaction code:</span> {payment.transaction_code}</p>
                  <p><span className="font-bold">Recipient name:</span> {payment.recipient_name}</p>
                  <p><span className="font-bold">Phone/Till:</span> {payment.recipient_phone_or_till}</p>
                  <p><span className="font-bold">Submitted:</span> {payment.submitted_at ? new Date(payment.submitted_at).toLocaleString() : "N/A"}</p>
                </div>
                <div className="space-y-2">
                  <Badge variant="outline">{payment.status}</Badge>
                  {payment.receipt_url ? (
                    <a className="block text-xs text-[var(--gold)] underline" href={payment.receipt_url} target="_blank" rel="noreferrer">
                      View receipt
                    </a>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-2 md:grid-cols-3">
                <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs">
                  <span className="font-bold">Amount mismatch:</span> {payment.risk_flags?.amount_mismatch ? "Yes" : "No"}
                </div>
                <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs">
                  <span className="font-bold">Recipient mismatch:</span>{" "}
                  {payment.risk_flags?.recipient_name_mismatch || payment.risk_flags?.recipient_destination_mismatch ? "Yes" : "No"}
                </div>
                <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs">
                  <span className="font-bold">Duplicate code:</span> {payment.risk_flags?.duplicate_transaction_code ? "Yes" : "No"}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`reject-${payment.id}`}>Reject or request more information</Label>
                <Textarea
                  id={`reject-${payment.id}`}
                  value={reasons[payment.id] || ""}
                  onChange={(event) => setReasons((prev) => ({ ...prev, [payment.id]: event.target.value }))}
                  placeholder="Explain why this payment is rejected or what more information is needed."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`plan-${payment.id}`}>Change User Plan (After Confirmation)</Label>
                <div className="flex gap-2">
                  <select
                    id={`plan-${payment.id}`}
                    value={selectedPlans[payment.id] || ""}
                    onChange={(event) => setSelectedPlans((prev) => ({ ...prev, [payment.id]: event.target.value }))}
                    className="flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm bg-white"
                  >
                    <option value="">Select plan...</option>
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="premium">Premium</option>
                  </select>
                  <Button 
                    variant="outline"
                    disabled={!selectedPlans[payment.id] || planChanging[payment.id]}
                    onClick={() => handleChangePlan(payment.id, payment.user_id || payment.customer?.id)}
                  >
                    {planChanging[payment.id] ? "Changing..." : "Change Plan"}
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => void handleConfirm(payment.id)}>
                  Confirm Payment
                </Button>
                <Button variant="destructive" onClick={() => void handleReject(payment.id)}>
                  Reject Payment
                </Button>
                <Button variant="outline" onClick={() => void handleReject(payment.id)}>
                  Request More Information
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 border-2 border-dashed rounded-xl text-slate-500">
            No pending manual M-Pesa payments.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
