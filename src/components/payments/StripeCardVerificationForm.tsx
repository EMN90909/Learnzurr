"use client";

import React, { useState } from "react";
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { showError, showSuccess } from "@/utils/toast";
import { CreditCard, Loader2, ShieldCheck } from "lucide-react";

interface StripeCardVerificationFormProps {
  amount?: number;
  currency?: string;
  mode?: "free_tier_card_verification" | "subscription";
  onSuccess?: () => void;
}

export default function StripeCardVerificationForm({
  amount = 0.5,
  currency = "USD",
  mode = "free_tier_card_verification",
  onSuccess,
}: StripeCardVerificationFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return showError("Stripe is still loading. Try again in a moment.");

    const card = elements.getElement(CardElement);
    if (!card) return showError("Enter your card details first.");

    setLoading(true);
    try {
      const response = await apiFetch(mode === "free_tier_card_verification" ? "/api/payment/verify-card" : "/api/payment/stripe-intent", {
        method: "POST",
        body: JSON.stringify({ amount, currency, mode }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.clientSecret) throw new Error(result.error || "Could not start card verification.");

      const confirmation = await stripe.confirmCardPayment(
        result.clientSecret,
        {
          payment_method: {
            card,
          },
        },
        { handleActions: true }
      );

      if (confirmation.error) throw new Error(confirmation.error.message || "Card verification failed.");
      if (confirmation.paymentIntent?.status === "succeeded" || confirmation.paymentIntent?.status === "requires_capture") {
        showSuccess("Card verified successfully.");
        onSuccess?.();
        return;
      }
      showSuccess("Card verification submitted securely.");
      onSuccess?.();
    } catch (error: any) {
      showError(error.message || "Card verification failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
        <CardElement
          options={{
            hidePostalCode: false,
            style: {
              base: {
                fontSize: "16px",
                color: "#0c0b08",
                "::placeholder": { color: "#8a8172" },
              },
              invalid: { color: "#dc2626" },
            },
          }}
        />
      </div>
      <div className="flex items-start gap-2 rounded-2xl bg-emerald-50 border border-emerald-100 p-3 text-xs text-emerald-800">
        <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
        Stripe may ask your bank for extra confirmation. Struta never stores your raw card number.
      </div>
      <Button type="submit" className="w-full btn-struta-gold font-bold h-11" disabled={!stripe || loading}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CreditCard className="w-4 h-4 mr-2" />}
        Verify Card Securely
      </Button>
    </form>
  );
}
