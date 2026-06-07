"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";
import { normalizeCurrencyCode } from "@/lib/payments";
import { Building2, CreditCard, Hash, Phone, ShieldCheck } from "lucide-react";

type RequestPaymentPanelProps = {
  request: {
    id: string;
    provider_id: string;
    provider_type: "home" | "vendor";
    request_title: string;
    payment_amount?: number;
    payment_currency?: string;
    payment_status?: string;
    planning_board?: {
      final_total?: number;
      currency?: string;
    };
  };
  userId?: string | null;
  userEmail?: string | null;
  onPaymentSubmitted: () => Promise<void> | void;
};

type ProviderProfileResponse = {
  providerName: string;
  paymentProfile: {
    recipient_name: string;
    payment_type: string;
    phone_number: string | null;
    till_number: string | null;
    paybill_number?: string | null;
    account_number?: string | null;
    is_verified?: boolean | null;
  };
};

const getPrimaryPaymentLine = (profile: ProviderProfileResponse | null) => {
  const payment = profile?.paymentProfile;
  if (!payment) return null;
  if (payment.payment_type === "paybill" && payment.paybill_number) return { label: "Paybill", value: payment.paybill_number };
  if (payment.payment_type === "till" && payment.till_number) return { label: "Till number", value: payment.till_number };
  if (payment.phone_number) return { label: "Phone number", value: payment.phone_number };
  if (payment.till_number) return { label: "Till number", value: payment.till_number };
  if (payment.paybill_number) return { label: "Paybill", value: payment.paybill_number };
  return null;
};

export default function RequestPaymentPanel({ request }: RequestPaymentPanelProps) {
  const [providerProfile, setProviderProfile] = useState<ProviderProfileResponse | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const amount = useMemo(() => Number(request.planning_board?.final_total || request.payment_amount || 0), [request.payment_amount, request.planning_board?.final_total]);
  const currency = normalizeCurrencyCode(request.planning_board?.currency || request.payment_currency || "KES");
  const paymentLine = getPrimaryPaymentLine(providerProfile);
  const payment = providerProfile?.paymentProfile;

  useEffect(() => {
    const loadProviderProfile = async () => {
      setLoadingProfile(true);
      try {
        const response = await apiFetch(`/api/payments/provider-profile/${encodeURIComponent(request.provider_id)}`);
        if (!response.ok) {
          setProviderProfile(null);
          return;
        }
        const data = (await response.json()) as ProviderProfileResponse;
        setProviderProfile(data);
      } catch {
        setProviderProfile(null);
      } finally {
        setLoadingProfile(false);
      }
    };
    void loadProviderProfile();
  }, [request.provider_id]);

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-indigo-100 bg-indigo-50/50 p-5 dark:bg-indigo-950/10 dark:border-indigo-900/30">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-indigo-800 dark:text-indigo-400 uppercase tracking-wider">Invoice ready</p>
            <p className="mt-1 text-2xl font-black text-slate-900 dark:text-[#f6efe4]">{currency} {amount.toLocaleString()}</p>
            <p className="mt-2 max-w-xl text-xs text-slate-600 dark:text-[#b8ad9a]">Use the provider payment details below to pay directly. The provider will confirm the payment and update your request ledger.</p>
          </div>
          <Badge className="bg-amber-50 text-amber-700 border-amber-200">{request.payment_status || "unpaid"}</Badge>
        </div>
      </div>

      {loadingProfile ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 dark:bg-[#181612] dark:border-[#39342c]">Loading provider payment details...</div>
      ) : providerProfile && paymentLine ? (
        <div className="max-w-xl rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:bg-[#181612] dark:border-[#39342c]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--gold-bg)] text-[var(--gold)]"><Building2 className="h-5 w-5" /></div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Pay to</p>
                <h4 className="text-lg font-black text-slate-900 dark:text-[#f6efe4]">{payment?.recipient_name || providerProfile.providerName}</h4>
              </div>
            </div>
            {payment?.is_verified && <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200"><ShieldCheck className="mr-1 h-3 w-3" />Verified</Badge>}
          </div>

          <div className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm dark:bg-[#1c1a16] dark:border-[#39342c]">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-slate-500"><CreditCard className="h-4 w-4" />Payment type</span>
              <span className="font-bold capitalize text-slate-900 dark:text-[#f6efe4]">{payment?.payment_type?.replace("_", " ") || "Direct payment"}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-slate-500"><Phone className="h-4 w-4" />{paymentLine.label}</span>
              <span className="font-black text-slate-900 dark:text-[#f6efe4]">{paymentLine.value}</span>
            </div>
            {payment?.account_number && (
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-slate-500"><Hash className="h-4 w-4" />Account number</span>
                <span className="font-black text-slate-900 dark:text-[#f6efe4]">{payment.account_number}</span>
              </div>
            )}
            <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-3 dark:border-[#39342c]">
              <span className="text-slate-500">Amount to pay</span>
              <span className="text-lg font-black text-slate-900 dark:text-[#f6efe4]">{currency} {amount.toLocaleString()}</span>
            </div>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-slate-500">After payment, keep your transaction receipt. The provider/home will confirm and mark the invoice as paid from their dashboard.</p>
        </div>
      ) : (
        <div className="max-w-xl rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700 dark:bg-[#181612] dark:border-[#39342c] dark:text-[#b8ad9a]">This provider has not added phone, till, or paybill details yet. Contact the provider before paying this invoice.</div>
      )}
    </div>
  );
}
