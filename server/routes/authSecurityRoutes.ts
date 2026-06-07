import express from "express";
import { supabaseAdmin } from "../supabase-admin";
import { getAuthenticatedActor } from "../auth";
import { emailOtpService } from "../services/email-otp-service";

const router = express.Router();
const cleanEmail = (value: unknown) => String(value || "").trim().toLowerCase().slice(0, 180);
const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value);

router.post("/send-reset-otp", async (req, res) => {
  try {
    const email = cleanEmail(req.body?.email);
    if (!isEmail(email)) return res.status(400).json({ error: "Enter a valid email address." });
    const { data: profile } = await supabaseAdmin.from("user_profiles").select("id,full_name,home_name,business_name").eq("email", email).maybeSingle();
    if (profile?.id) {
      await emailOtpService.send({ email, purpose: "reset", userId: profile.id, fullName: profile.home_name || profile.business_name || profile.full_name || null });
      await supabaseAdmin.from("user_profiles").update({ password_reset_required: true, password_reset_requested_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("email", email);
    }
    return res.json({ ok: true, sent: true });
  } catch (error: any) {
    console.error("[auth-security/send-reset-otp]", error);
    return res.status(500).json({ error: error.message || "Could not send reset code." });
  }
});

router.post("/password-reset-requested", async (req, res) => {
  try {
    const email = cleanEmail(req.body?.email);
    if (!isEmail(email)) return res.status(400).json({ error: "Enter a valid email address." });
    await supabaseAdmin
      .from("user_profiles")
      .update({ password_reset_required: true, password_reset_requested_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("email", email);
    return res.json({ ok: true });
  } catch (error: any) {
    console.error("[auth-security/password-reset-requested]", error);
    return res.status(500).json({ error: error.message || "Could not mark password reset." });
  }
});

router.post("/password-reset-completed", async (req, res) => {
  try {
    const actor = await getAuthenticatedActor(req).catch(() => null);
    const email = cleanEmail(req.body?.email || actor?.email);
    if (!actor?.id && !isEmail(email)) return res.status(401).json({ error: "Reset session required." });
    const patch = { password_reset_required: false, password_reset_completed_at: new Date().toISOString(), password_reset_requested_at: null, updated_at: new Date().toISOString() } as any;
    let query = supabaseAdmin.from("user_profiles").update(patch);
    if (actor?.id) query = query.eq("id", actor.id);
    else query = query.eq("email", email);
    const { error } = await query;
    if (error) throw error;
    return res.json({ ok: true });
  } catch (error: any) {
    console.error("[auth-security/password-reset-completed]", error);
    return res.status(500).json({ error: error.message || "Could not complete password reset gate." });
  }
});

router.post("/accept-terms", async (req, res) => {
  try {
    const actor = await getAuthenticatedActor(req);
    const { error } = await supabaseAdmin
      .from("user_profiles")
      .update({ terms_accepted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", actor.id);
    if (error) throw error;
    return res.json({ ok: true });
  } catch (error: any) {
    return res.status(401).json({ error: error.message || "Could not accept terms." });
  }
});

export default router;
