import { apiFetch } from "@/lib/api";

type CreateOrderPayload = {
  amount: number;
  currency: string;
  description: string;
  userId?: string | null;
  providerId?: string | null;
  providerType?: "home" | "vendor" | "family" | null;
  requestId?: string | null;
  invoiceId?: string | null;
  subscriptionId?: string | null;
  payerEmail?: string | null;
  planName?: string | null;
  planCode?: string | null;
  planPeriod?: "monthly" | "yearly" | "lifetime" | null;
  settlementCurrency?: string | null;
  providerPaypalEmail?: string | null;
  scaMethod?: "SCA_WHEN_REQUIRED" | "SCA_ALWAYS";
};

let paypalWarned = false;
let cachedPaypalClientId: string | null = null;

const PAYPAL_SUPPORTED_CURRENCIES = new Set([
  "AUD", "BRL", "CAD", "CNY", "CZK", "DKK", "EUR", "HKD", "HUF", "ILS", "JPY", "MYR", "MXN", "TWD", "NZD", "NOK", "PHP", "PLN", "GBP", "RUB", "SGD", "SEK", "CHF", "THB", "USD",
]);

export const normalizeCurrencyCode = (currency?: string | null) => {
  const normalized = String(currency || "USD").trim().toUpperCase();
  if (normalized === "KSH" || normalized === "KES") return "KES";
  if (normalized === "$") return "USD";
  return normalized;
};

export const isPaypalSupportedCurrency = (currency?: string | null) =>
  PAYPAL_SUPPORTED_CURRENCIES.has(normalizeCurrencyCode(currency));

export const getPaypalSettlementCurrency = (invoiceCurrency?: string | null, preferredSettlementCurrency?: string | null) => {
  const preferred = normalizeCurrencyCode(preferredSettlementCurrency);
  const invoice = normalizeCurrencyCode(invoiceCurrency);
  if (isPaypalSupportedCurrency(preferred)) return preferred;
  if (isPaypalSupportedCurrency(invoice)) return invoice;
  return "USD";
};

export const getPaypalClientId = () => {
  const clientId = cachedPaypalClientId || import.meta.env.VITE_PAYPAL_CLIENT_ID;
  if (!clientId || clientId.includes("your-") || clientId.includes("placeholder")) {
    if (!paypalWarned) {
      console.warn("PayPal client ID is not configured in the frontend environment. Trying the server fallback endpoint.");
      paypalWarned = true;
    }
    return "";
  }
  return clientId;
};

export const resolvePaypalClientId = async () => {
  const current = getPaypalClientId();
  if (current) return current;

  try {
    const response = await fetch("/api/paypal/client-id");
    const result = await response.json().catch(() => ({}));
    if (response.ok && result.clientId) {
      cachedPaypalClientId = result.clientId;
      return result.clientId as string;
    }
  } catch {
    // Keep returning empty string. UI should show direct mobile money/manual alternatives.
  }

  return "";
};

export const createPaypalOrder = async (payload: CreateOrderPayload) => {
  const currency = normalizeCurrencyCode(payload.currency);
  const settlementCurrency = getPaypalSettlementCurrency(currency, payload.settlementCurrency);

  const response = await apiFetch("/api/paypal/orders", {
    method: "POST",
    body: JSON.stringify({
      ...payload,
      currency,
      originalCurrency: currency,
      originalAmount: payload.amount,
      settlementCurrency,
    }),
  });

  const result = await response.json().catch(async () => ({ error: await response.text().catch(() => "") }));
  if (!response.ok) {
    const errorMsg = result.error || result.message || "Could not create the PayPal order.";
    const errorCode = result.code || "";
    // Check for authentication-related errors or configuration issues and provide a clearer message
    if (response.status === 401 || response.status === 503 || errorCode === "PAYPAL_NOT_CONFIGURED" || errorMsg.toLowerCase().includes("authentication") || errorMsg.toLowerCase().includes("not configured")) {
      throw new Error("PayPal payment is temporarily unavailable. Please try mobile money payment or contact support.");
    }
    throw new Error(errorMsg);
  }
  return result as { id: string; order?: any; currency?: string; amount?: number; originalCurrency?: string; originalAmount?: number };
};

export const capturePaypalOrder = async (orderId: string, payload: Partial<CreateOrderPayload> = {}) => {
  const originalCurrency = normalizeCurrencyCode(payload.currency);
  const settlementCurrency = getPaypalSettlementCurrency(originalCurrency, payload.settlementCurrency);

  const response = await apiFetch(`/api/paypal/orders/${encodeURIComponent(orderId)}/capture`, {
    method: "POST",
    body: JSON.stringify({
      ...payload,
      currency: originalCurrency,
      originalCurrency,
      originalAmount: payload.amount,
      settlementCurrency,
    }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "Could not capture PayPal order.");
  return result;
};
