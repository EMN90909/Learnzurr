type JsonPayload = Record<string, any>;

const getPaypalBaseUrl = () => {
  const mode = String(process.env.PAYPAL_MODE || process.env.PAYPAL_ENV || "live").toLowerCase();
  return mode === "sandbox" || mode === "test"
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";
};

const getPaypalCredentials = () => {
  const clientId = process.env.PAYPAL_CLIENT_ID || process.env.VITE_PAYPAL_CLIENT_ID || "";
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET || process.env.PAYPAL_SECRET_KEY || "";
  return { clientId, clientSecret };
};

const validatePaypalCredentials = () => {
  const { clientId, clientSecret } = getPaypalCredentials();
  if (!clientId) {
    throw new Error("PayPal Client ID is not configured. Set PAYPAL_CLIENT_ID in your environment variables.");
  }
  if (!clientSecret) {
    throw new Error("PayPal Client Secret is not configured. Set PAYPAL_CLIENT_SECRET in your environment variables.");
  }
  return { clientId, clientSecret };
};

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

const getAccessToken = async () => {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.accessToken;

  const { clientId, clientSecret } = validatePaypalCredentials();
  const encoded = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch(`${getPaypalBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${encoded}`,
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }).toString(),
  });

  const json: any = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMessage = json?.error_description || json?.error || "Could not authenticate with PayPal.";
    console.error("[PayPal Auth Error]", response.status, errorMessage, { clientIdLength: clientId?.length, hasSecret: !!clientSecret });
    throw new Error(`PayPal authentication failed (${response.status}): ${errorMessage}. Please verify PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET are valid for ${getPaypalBaseUrl().includes("sandbox") ? "sandbox" : "live"} environment.`);
  }

  cachedToken = {
    accessToken: json.access_token,
    expiresAt: Date.now() + Math.max(1, Number(json.expires_in || 300) - 60) * 1000,
  };
  return cachedToken.accessToken;
};

const paypalFetch = async (path: string, options: RequestInit = {}) => {
  const accessToken = await getAccessToken();
  const response = await fetch(`${getPaypalBaseUrl()}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(options.headers || {}),
    },
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error((json as any)?.message || (json as any)?.name || "PayPal request failed.");
  return json;
};

export const paypalApi = {
  createOrder(payload: JsonPayload) {
    return paypalFetch("/v2/checkout/orders", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  captureOrder(orderId: string) {
    if (!orderId) throw new Error("Missing PayPal order ID.");
    return paypalFetch(`/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  },

  refundCapture(captureId: string, payload: JsonPayload) {
    if (!captureId) throw new Error("Missing PayPal capture ID.");
    return paypalFetch(`/v2/payments/captures/${encodeURIComponent(captureId)}/refund`, {
      method: "POST",
      body: JSON.stringify(payload || {}),
    });
  },

  verifyWebhookSignature(payload: JsonPayload) {
    return paypalFetch("/v1/notifications/verify-webhook-signature", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};
