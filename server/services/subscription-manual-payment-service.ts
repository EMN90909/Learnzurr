import { config } from "../config";
import { supabaseAdmin } from "../supabase-admin";
import { emailService } from "./email-service";
import { notificationService } from "./notification-service";

type Actor = {
  id: string;
  email: string | null;
  role: string | null;
};

const ALLOWED_SUBSCRIPTION_ROLES = new Set(["operations", "marketplace"]);

function normalizeRole(role: string | null | undefined) {
  return (role || "").trim().toLowerCase();
}

function getPlanDates(planPeriod?: string | null) {
  const startedAt = new Date();
  const expiresAt = new Date(startedAt);
  const period = (planPeriod || "monthly").toLowerCase();

  if (period === "yearly") {
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  } else if (period === "lifetime") {
    expiresAt.setFullYear(expiresAt.getFullYear() + 99);
  } else {
    expiresAt.setMonth(expiresAt.getMonth() + 1);
  }

  return {
    started_at: startedAt.toISOString(),
    expires_at: expiresAt.toISOString(),
  };
}

export const subscriptionManualPaymentService = {
  async getBillingProfile() {
    return {
      recipient_name: config.billingRecipientName,
      phone_number: config.billingMpesaPhone,
      payment_type: "phone",
      approval_email: config.billingApprovalEmail,
    };
  },

  async submitManualSubscriptionPayment(params: {
    actor: Actor;
    amountSubmitted: number;
    currency: string;
    transactionCode: string;
    receiptUrl?: string | null;
    recipientName: string;
    recipientPhoneOrTill: string;
    planName: string;
    planPeriod: string;
  }) {
    const actorRole = normalizeRole(params.actor.role);

    if (!ALLOWED_SUBSCRIPTION_ROLES.has(actorRole)) {
      throw new Error("Only funeral homes and vendors can submit subscription payments.");
    }

    const normalizedCode = params.transactionCode.trim().toUpperCase();

    if (!normalizedCode) {
      throw new Error("Transaction code is required.");
    }

    const expectedAmount = Number(params.amountSubmitted || 0);

    if (!expectedAmount || expectedAmount <= 0) {
      throw new Error("A valid subscription amount is required.");
    }

    if (!params.recipientName.trim()) {
      throw new Error("Recipient name is required.");
    }

    if (!params.recipientPhoneOrTill.trim()) {
      throw new Error("Recipient phone or till number is required.");
    }

    if (!params.planName.trim()) {
      throw new Error("Plan name is required.");
    }

    if (!params.planPeriod.trim()) {
      throw new Error("Plan period is required.");
    }

    const { data: duplicateCode, error: duplicateError } = await supabaseAdmin
      .from("payments")
      .select("id")
      .eq("transaction_code", normalizedCode)
      .neq("status", "rejected")
      .maybeSingle();

    if (duplicateError) {
      throw new Error(duplicateError.message);
    }

    if (duplicateCode?.id) {
      throw new Error("This M-Pesa transaction code has already been used.");
    }

    const subscriptionQueryField = actorRole === "marketplace" ? "provider_id" : "home_id";

    const { data: existingSubscription, error: subscriptionError } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq(subscriptionQueryField, params.actor.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subscriptionError) {
      throw new Error(subscriptionError.message);
    }

    let subscription = existingSubscription;

    if (!subscription) {
      const now = new Date();
      const trialEndsAt = new Date(now);
      trialEndsAt.setDate(now.getDate() + 3);

      const inserted = await supabaseAdmin
        .from("subscriptions")
        .insert({
          user_id: params.actor.id,
          home_id: actorRole === "operations" ? params.actor.id : null,
          provider_id: actorRole === "marketplace" ? params.actor.id : null,
          status: "trialing",
          payment_status: "unpaid",
          plan_name: params.planName,
          is_trial: true,
          trial_used: true,
          trial_days: 3,
          trial_started_at: now.toISOString(),
          trial_ends_at: trialEndsAt.toISOString(),
          trial_card_skipped: false,
          trial_card_added: false,
        })
        .select("*")
        .single();

      if (inserted.error || !inserted.data) {
        throw new Error(inserted.error?.message || "Could not create subscription record.");
      }

      subscription = inserted.data;
    }

    const billingProfile = await this.getBillingProfile();

    const billingRecipientName = (billingProfile.recipient_name || "").trim();
    const billingPhoneNumber = (billingProfile.phone_number || "").trim();

    if (!billingRecipientName) {
      throw new Error("Billing recipient name is not configured.");
    }

    if (!billingPhoneNumber) {
      throw new Error("Billing M-Pesa phone number is not configured.");
    }

    const riskFlags = {
      duplicate_transaction_code: false,
      amount_mismatch: false,
      recipient_name_mismatch:
        billingRecipientName.toLowerCase() !== params.recipientName.trim().toLowerCase(),
      recipient_destination_mismatch:
        billingPhoneNumber.replace(/\s+/g, "") !== params.recipientPhoneOrTill.replace(/\s+/g, ""),
      provider_profile_verified: true,
    };

    const now = new Date().toISOString();

    const { data: payment, error } = await supabaseAdmin
      .from("payments")
      .insert({
        user_id: params.actor.id,
        provider_id: params.actor.id,
        provider_type: actorRole === "marketplace" ? "vendor" : "home",
        subscription_id: subscription.id,
        payment_method: "mpesa_manual",
        amount_expected: expectedAmount,
        amount_submitted: expectedAmount,
        currency: params.currency || "USD",
        status: "pending_verification",
        transaction_code: normalizedCode,
        receipt_url: params.receiptUrl || null,
        submitted_at: now,
        recipient_name: params.recipientName.trim(),
        recipient_phone_or_till: params.recipientPhoneOrTill.trim(),
        risk_flags: riskFlags,
        reference: normalizedCode,
        metadata: {
          plan_name: params.planName,
          plan_period: params.planPeriod,
          subscription_payment: true,
        },
      })
      .select("*")
      .single();

    if (error || !payment) {
      throw new Error(error?.message || "Could not submit subscription payment.");
    }

    const { error: auditError } = await supabaseAdmin.from("payment_audit_logs").insert({
      payment_id: payment.id,
      action: "manual_subscription_payment_submitted",
      old_status: null,
      new_status: "pending_verification",
      performed_by: params.actor.id,
      performed_by_role: params.actor.role,
      notes: `Subscription payment submitted for ${params.planName}.`,
    });

    if (auditError) {
      throw new Error(auditError.message);
    }

    const { data: admins, error: adminsError } = await supabaseAdmin
      .from("user_profiles")
      .select("id, email, full_name")
      .eq("role", "admin");

    if (adminsError) {
      throw new Error(adminsError.message);
    }

    const approvalBody = `
      <p>A manual subscription payment needs approval.</p>
      <p><strong>User:</strong> ${params.actor.email || params.actor.id}</p>
      <p><strong>Plan:</strong> ${params.planName} (${params.planPeriod})</p>
      <p><strong>Amount:</strong> ${params.currency} ${expectedAmount.toLocaleString()}</p>
      <p><strong>Transaction code:</strong> ${normalizedCode}</p>
      <p><strong>Receipt:</strong> ${params.receiptUrl || "Not provided"}</p>
    `;

    if (config.billingApprovalEmail) {
      await emailService.send(
        config.billingApprovalEmail,
        "Subscription payment approval needed",
        approvalBody
      );
    }

    for (const admin of admins || []) {
      await notificationService.create({
        user_id: admin.id,
        type: "payment.subscription_manual_submitted",
        title: "Subscription payment awaiting approval",
        body: `${params.actor.email || "A provider"} submitted M-Pesa proof for ${params.planName}.`,
        entity_type: "payment",
        entity_id: payment.id,
        deep_link: "/admin/finance",
        idempotency_key: `subscription-manual-submit:${payment.id}:${admin.id}`,
      });
    }

    return payment;
  },

  async activateConfirmedSubscription(payment: any) {
    if (!payment.subscription_id) {
      return;
    }

    const dates = getPlanDates((payment.metadata as { plan_period?: string } | null)?.plan_period || "monthly");

    const { error } = await supabaseAdmin
      .from("subscriptions")
      .update({
        status: "active",
        payment_status: "paid",
        is_trial: false,
        trial_card_added: true,
        started_at: dates.started_at,
        expires_at: dates.expires_at,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.subscription_id);

    if (error) {
      throw new Error(error.message);
    }
  },

  async failRejectedSubscription(payment: any) {
    if (!payment.subscription_id) {
      return;
    }

    const { error } = await supabaseAdmin
      .from("subscriptions")
      .update({
        payment_status: "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.subscription_id);

    if (error) {
      throw new Error(error.message);
    }
  },
};
