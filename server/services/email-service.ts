import nodemailer from "nodemailer";
import { config } from "../config";

type SendEmailParams = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  fromName?: string;
  replyTo?: string;
};

const formatFrom = (email: string, name?: string) => (name ? `${name} <${email}>` : email);

const hasGoSmtpConfig = Boolean(process.env.GO_SMTP_MAILER_URL || process.env.SMTP_GO_URL);
const hasSmtpConfig = Boolean(config.smtpHost && config.smtpUser && config.smtpPass && config.smtpFrom);
const hasResendConfig = Boolean(config.resendApiKey && config.resendFrom);

const transporter = hasSmtpConfig
  ? nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure,
      requireTLS: config.smtpPort === 587,
      pool: true,
      maxConnections: Number(process.env.SMTP_NODE_POOL_CONNECTIONS || 5),
      maxMessages: Number(process.env.SMTP_NODE_POOL_MESSAGES || 100),
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass,
      },
    })
  : null;

async function sendWithGoSmtp(params: SendEmailParams) {
  const endpoint = process.env.GO_SMTP_MAILER_URL || process.env.SMTP_GO_URL;
  if (!endpoint) throw new Error("Go SMTP mailer is not configured.");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Number(process.env.GO_SMTP_TIMEOUT_MS || 15000));
  try {
    const response = await fetch(`${endpoint.replace(/\/$/, "")}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        to: Array.isArray(params.to) ? params.to : [params.to],
        subject: params.subject,
        html: params.html,
        text: params.text || "",
        replyTo: params.replyTo || "",
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.ok === false) throw new Error(data?.error || `Go SMTP mailer failed with status ${response.status}`);
    return { provider: "go-smtp", data };
  } finally {
    clearTimeout(timer);
  }
}

async function sendWithResend(params: SendEmailParams) {
  const fromEmail = params.from || config.resendFrom;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: formatFrom(fromEmail, params.fromName || config.resendFromName),
      to: Array.isArray(params.to) ? params.to : [params.to],
      subject: params.subject,
      html: params.html,
      text: params.text,
      reply_to: params.replyTo,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || data?.error || `Resend failed with status ${response.status}`);
  }
  return { provider: "resend", data };
}

async function sendWithSmtp(params: SendEmailParams) {
  if (!transporter) throw new Error("SMTP is not configured.");
  const info = await transporter.sendMail({
    from: formatFrom(params.from || config.smtpFrom, params.fromName || config.smtpFromName),
    to: Array.isArray(params.to) ? params.to.join(",") : params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
    replyTo: params.replyTo,
  });
  return { provider: "smtp", data: info };
}

export const emailService = {
  isConfigured() {
    return hasGoSmtpConfig || hasResendConfig || hasSmtpConfig;
  },

  async send(toOrParams: string | string[] | SendEmailParams, subject?: string, html?: string, text?: string) {
    const params: SendEmailParams = typeof toOrParams === "object" && !Array.isArray(toOrParams) && "subject" in toOrParams
      ? toOrParams
      : { to: toOrParams as string | string[], subject: subject || "", html: html || "", text };

    if (!params.to || !params.subject || !params.html) {
      throw new Error("Email recipient, subject, and HTML body are required.");
    }

    if (hasGoSmtpConfig) return sendWithGoSmtp(params);
    if (hasSmtpConfig) return sendWithSmtp(params);
    if (hasResendConfig) return sendWithResend(params);

    throw new Error("Email is not configured. Add GO_SMTP_MAILER_URL, SMTP_HOST, SMTP_USER, SMTP_PASS and SMTP_FROM, or RESEND_API_KEY and RESEND_FROM.");
  },

  async sendInvoice(to: string, subject: string, html: string, text?: string) {
    return this.send({ to, subject, html, text });
  },

  async sendCampaign(recipients: string[], subject: string, html: string, text?: string) {
    const cleanRecipients = recipients.map((recipient) => recipient.trim()).filter(Boolean);
    if (!cleanRecipients.length) throw new Error("At least one campaign recipient is required.");
    return this.send({ to: cleanRecipients, subject, html, text });
  },
};
