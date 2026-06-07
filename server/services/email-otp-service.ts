import { supabaseAdmin } from "../supabase-admin";
import { emailService } from "./email-service";

type OtpPurpose = "signup" | "signin" | "reset";

function generateOtp() {
  return `${Math.floor(100000 + Math.random() * 900000)}`;
}

function buildOtpEmail(params: { code: string; purpose: OtpPurpose; fullName?: string | null }) {
  const intro =
    params.purpose === "signup"
      ? "Use this code to verify your new Struta account."
      : params.purpose === "reset"
        ? "Use this code to reset your Struta password."
        : "Use this code to finish signing in to Struta.";

  const greeting = params.fullName ? `Hello ${params.fullName},` : "Hello,";
  const subject = params.purpose === "signup" ? "Verify your Struta account" : params.purpose === "reset" ? "Your Struta password reset code" : "Your Struta sign-in code";

  return {
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <p>${greeting}</p>
        <p>${intro}</p>
        <div style="margin: 24px 0; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #c8923a;">
          ${params.code}
        </div>
        <p>This code expires in 10 minutes.</p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `,
    text: `${intro}\n\nCode: ${params.code}\n\nThis code expires in 10 minutes.`,
  };
}

export const emailOtpService = {
  async send(params: {
    email: string;
    purpose: OtpPurpose;
    userId?: string | null;
    fullName?: string | null;
  }) {
    const normalizedEmail = params.email.trim().toLowerCase();
    let resolvedUserId = params.userId || null;
    let resolvedName = params.fullName || null;

    if (!resolvedUserId || !resolvedName) {
      const { data: profile } = await supabaseAdmin
        .from("user_profiles")
        .select("id, full_name, home_name, business_name")
        .eq("email", normalizedEmail)
        .maybeSingle();

      if (!resolvedUserId) resolvedUserId = profile?.id || null;
      if (!resolvedName) resolvedName = profile?.home_name || profile?.business_name || profile?.full_name || null;
    }

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await supabaseAdmin
      .from("email_otp_codes")
      .delete()
      .eq("email", normalizedEmail)
      .eq("purpose", params.purpose)
      .is("consumed_at", null);

    const { error } = await supabaseAdmin.from("email_otp_codes").insert({
      email: normalizedEmail,
      user_id: resolvedUserId,
      purpose: params.purpose,
      code,
      expires_at: expiresAt,
    });

    if (error) throw new Error(error.message || "Could not create OTP code.");

    const emailPayload = buildOtpEmail({ code, purpose: params.purpose, fullName: resolvedName });
    await emailService.send(normalizedEmail, emailPayload.subject, emailPayload.html, emailPayload.text);
  },

  async verify(params: {
    email: string;
    purpose: OtpPurpose;
    code: string;
    consume?: boolean;
  }) {
    const normalizedEmail = params.email.trim().toLowerCase();
    const normalizedCode = params.code.trim();
    const shouldConsume = params.consume !== false;

    const { data: record, error } = await supabaseAdmin
      .from("email_otp_codes")
      .select("*")
      .eq("email", normalizedEmail)
      .eq("purpose", params.purpose)
      .eq("code", normalizedCode)
      .is("consumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message || "Could not verify code.");
    if (!record) throw new Error("The verification code is invalid.");
    if (new Date(record.expires_at).getTime() < Date.now()) throw new Error("The verification code has expired.");

    const consumedAt = new Date().toISOString();
    if (shouldConsume) {
      await supabaseAdmin.from("email_otp_codes").update({ consumed_at: consumedAt }).eq("id", record.id);
    }

    if (shouldConsume && params.purpose === "signup") {
      if (record.user_id) {
        await supabaseAdmin.from("user_profiles").update({ email_verified_at: consumedAt }).eq("id", record.user_id);
        await supabaseAdmin.auth.admin.updateUserById(record.user_id, { email_confirm: true } as any);
      } else {
        await supabaseAdmin.from("user_profiles").update({ email_verified_at: consumedAt }).eq("email", normalizedEmail);
      }
    }

    return { ok: true, userId: record.user_id || null, emailVerifiedAt: shouldConsume ? consumedAt : null };
  },
};
