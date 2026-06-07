import "./load-env.js";

const isProduction = process.env.NODE_ENV === "production";

const getEnv = (name: string, fallback = "") => {
  const value = process.env[name];
  return value || fallback;
};

const normalizeStrutaDomain = (value: string) => value.replace(/struta\.com/gi, "struta.top");
const getDomainEnv = (name: string, fallback = "") => normalizeStrutaDomain(getEnv(name, fallback));

const getDatabaseUrl = (): string | null => {
  return process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || null;
};

const getVapidKeys = () => {
  return {
    publicKey: process.env.VAPID_PUBLIC_KEY || "",
    privateKey: process.env.VAPID_PRIVATE_KEY || "",
  };
};

const vapid = getVapidKeys();
const databaseUrl = getDatabaseUrl();
const paypalEnv = process.env.PAYPAL_ENV || (isProduction ? "live" : "sandbox");

export const config = {
  isProduction,
  port: Number(process.env.API_PORT || (isProduction ? process.env.PORT : "10000") || 10000),
  appUrl: getDomainEnv("APP_URL", isProduction ? "https://www.struta.top" : "http://localhost:8080"),

  supabaseUrl: getEnv("SUPABASE_URL", ""),
  supabaseAnonKey: getEnv("SUPABASE_ANON_KEY", ""),
  supabaseServiceRoleKey: getEnv("SUPABASE_SERVICE_ROLE_KEY", ""),

  databaseUrl,

  paypalEnv,
  paypalClientId: getEnv("PAYPAL_CLIENT_ID", getEnv("VITE_PAYPAL_CLIENT_ID", "")),
  paypalClientSecret: getEnv("PAYPAL_CLIENT_SECRET", getEnv("PAYPAL_SECRET_KEY", "")),
  paypalSecretKey: getEnv("PAYPAL_SECRET_KEY", getEnv("PAYPAL_CLIENT_SECRET", "")),
  paypalApiBase:
    process.env.PAYPAL_API_BASE ||
    (paypalEnv === "sandbox" ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com"),
  paypalWebhookId: getEnv("PAYPAL_WEBHOOK_ID", ""),

  stripePublishableKey: getEnv("STRIPE_PUBLISHABLE_KEY", getEnv("VITE_STRIPE_PUBLISHABLE_KEY", "")),
  stripeSecretKey: getEnv("STRIPE_SECRET_KEY", ""),
  stripeWebhookSecret: getEnv("STRIPE_WEBHOOK_SECRET", ""),

  resendApiKey: getEnv("RESEND_API_KEY", ""),
  resendFrom: getDomainEnv("RESEND_FROM", getDomainEnv("SMTP_FROM", "noreply@struta.top")),
  resendFromName: process.env.RESEND_FROM_NAME || process.env.SMTP_FROM_NAME || "Struta",

  smtpHost: getEnv("SMTP_HOST", ""),
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpUser: getEnv("SMTP_USER", ""),
  smtpPass: getEnv("SMTP_PASS", ""),
  smtpFrom: getDomainEnv("SMTP_FROM", getDomainEnv("RESEND_FROM", "noreply@struta.top")),
  smtpFromName: process.env.SMTP_FROM_NAME || process.env.RESEND_FROM_NAME || "Struta",
  smtpSecure: String(process.env.SMTP_SECURE || "false").toLowerCase() === "true",

  billingApprovalEmail: process.env.BILLING_APPROVAL_EMAIL || "",
  billingRecipientName: process.env.BILLING_RECIPIENT_NAME || "Struta Billing",
  billingMpesaPhone: process.env.BILLING_MPESA_PHONE || "",

  vapidPublicKey: vapid.publicKey,
  vapidPrivateKey: vapid.privateKey,
  vapidEmail: getDomainEnv("VAPID_EMAIL", "mailto:support@struta.top"),

  openRouterApiKey: getEnv("OPENROUTER_API_KEY", ""),
  openRouterModel: getEnv("OPENROUTER_MODEL", "google/gemini-2.5-flash"),
  googleGeminiApiKey: getEnv("GOOGLE_GEMINI_API_KEY", getEnv("GEMINI_API_KEY", "")),
  googleGeminiModel: getEnv("GOOGLE_GEMINI_MODEL", getEnv("GEMINI_MODEL", "gemini-2.5-flash")),

  paystackPublicKey: getEnv("PAYSTACK_PUBLIC_KEY", getEnv("NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY", "")),
  paystackSecretKey: getEnv("PAYSTACK_SECRET_KEY", ""),
  hcaptchaSecret: getEnv("HCAPTCHA_SECRET", ""),
};