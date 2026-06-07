import { supabaseAdmin } from "../supabase-admin";
import { notificationService } from "./notification-service";
import { subscriptionManualPaymentService } from "./subscription-manual-payment-service";

type Actor = {
  id: string;
  email: string | null;
  role: string | null;
};

type RequestPaymentState = {
  custom_notes?: string;
  payment_requested?: boolean;
  payment_amount?: number;
  payment_currency?: string;
  payment_status?: string;
  chat_messages?: unknown[];
  planning_tasks?: unknown[];
  progress_updates?: unknown[];
  planning_board?: Record<string, unknown> | null;
  status?: string;
  archived?: boolean;
};

const ADMIN_ROLES = new Set(["admin"]);
const PROVIDER_ROLES = new Set([
  "operations",
  "marketplace",
  "manager",
  "secretary / admin officer",
  "driver / transport officer",
  "inventory / stores staff",
  "counselor / arranger",
  "owner / manager",
  "sales / bookings officer",
  "delivery / setup team",
  "inventory staff",
  "accountant / cashier",
]);

function normalizeRole(role: string | null | undefined) {
  return (role || "").trim().toLowerCase();
}

function parseRequestNotes(notes: string | null | undefined): RequestPaymentState {
  if (!notes) return {};
  try {
    return JSON.parse(notes) as RequestPaymentState;
  } catch {
    return { custom_notes: notes };
  }
}

async function logPaymentAction(params: {
  paymentId: string;
  action: string;
  oldStatus?: string | null;
  newStatus?: string | null;
  performedBy?: string | null;
  performedByRole?: string | null;
  notes?: string | null;
}) {
  const { error } = await supabaseAdmin.from("payment_audit_logs").insert({
    payment_id: params.paymentId,
    action: params.action,
    old_status: params.oldStatus || null,
    new_status: params.newStatus || null,
    performed_by: params.performedBy || null,
    performed_by_role: params.performedByRole || null,
    notes: params.notes || null,
  });

  if (error) {
    throw new Error(error.message);
  }
}

async function syncRelatedRequestPaymentState(params: {
  requestId?: string | null;
  paymentStatus: string;
  amount?: number | null;
  currency?: string | null;
  finalStatus?: string;
}) {
  if (!params.requestId) {
    return;
  }

  const { data: request, error: requestError } = await supabaseAdmin
    .from("service_requests")
    .select("id, notes, status")
    .eq("id", params.requestId)
    .maybeSingle();

  if (requestError) {
    throw new Error(requestError.message);
  }

  if (!request) {
    return;
  }

  const parsed = parseRequestNotes(request.notes);
  const nextStatus = params.finalStatus || parsed.status || request.status;

  const nextNotes = {
    ...parsed,
    payment_requested: true,
    payment_amount: params.amount ?? parsed.payment_amount ?? 0,
    payment_currency: params.currency ?? parsed.payment_currency ?? "KES",
    payment_status: params.paymentStatus,
    status: nextStatus,
  };

  const requestStatus = nextStatus === "paid" ? "accepted" : request.status;

  const { error: updateError } = await supabaseAdmin
    .from("service_requests")
    .update({
      notes: JSON.stringify(nextNotes),
      status: requestStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", request.id);

  if (updateError) {
    throw new Error(updateError.message);
  }
}

function isAdmin(actor: Actor) {
  return ADMIN_ROLES.has(normalizeRole(actor.role));
}

function isProvider(actor: Actor) {
  return PROVIDER_ROLES.has(normalizeRole(actor.role));
}

export const manualPaymentService = {
  async getVerifiedProviderProfile(providerId: string) {
    const { data, error } = await supabaseAdmin
      .from("provider_payment_profiles")
      .select("*")
      .eq("provider_id", providerId)
      .eq("is_active", true)
      .eq("is_verified", true)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  async submitManualPayment(params: {
    actor: Actor;
    requestId: string;
    providerId: string;
    amountSubmitted: number;
    currency: string;
    transactionCode: string;
    receiptUrl?: string | null;
    recipientName: string;
    recipientPhoneOrTill: string;
  }) {
    const providerProfile = await this.getVerifiedProviderProfile(params.providerId);
    if (!providerProfile) {
      throw new Error("This provider does not have an active verified M-Pesa payment profile.");
    }

    const { data: request, error: requestError } = await supabaseAdmin
      .from("service_requests")
      .select("id, requester_id, provider_id, provider_type, request_title, notes, status")
      .eq("id", params.requestId)
      .maybeSingle();

    if (requestError) {
      throw new Error(requestError.message);
    }

    if (!request) {
      throw new Error("Request not found.");
    }

    if (request.requester_id !== params.actor.id) {
      throw new Error("You can only submit payment proof for your own request.");
    }

    if (request.provider_id !== params.providerId) {
      throw new Error("This payment does not match the selected provider.");
    }

    const parsed = parseRequestNotes(request.notes);
    const expectedAmount = Number(parsed.payment_amount || 0);
    const currency = parsed.payment_currency || params.currency || "KES";

    if (!expectedAmount || expectedAmount <= 0) {
      throw new Error("This request does not have a valid invoice amount yet.");
    }

    if (parsed.payment_status === "paid") {
      throw new Error("This request has already been paid.");
    }

    const normalizedCode = params.transactionCode.trim().toUpperCase();

    if (!normalizedCode) {
      throw new Error("Transaction code is required.");
    }

    const { data: duplicateCode, error: duplicateError } = await supabaseAdmin
      .from("payments")
      .select("id, request_id, status")
      .eq("transaction_code", normalizedCode)
      .neq("status", "rejected")
      .maybeSingle();

    if (duplicateError) {
      throw new Error(duplicateError.message);
    }

    if (duplicateCode?.id) {
      throw new Error("This M-Pesa transaction code has already been used.");
    }

    const submittedAmount = Number(params.amountSubmitted || 0);

    if (!submittedAmount || submittedAmount <= 0) {
      throw new Error("Submitted amount must be greater than zero.");
    }

    const recipientExpected =
      providerProfile.payment_type === "till"
        ? providerProfile.till_number
        : providerProfile.phone_number || providerProfile.till_number || providerProfile.paybill_number;

    const riskFlags = {
      duplicate_transaction_code: false,
      amount_mismatch: submittedAmount !== expectedAmount,
      recipient_name_mismatch:
        (providerProfile.recipient_name || "").trim().toLowerCase() !==
        params.recipientName.trim().toLowerCase(),
      recipient_destination_mismatch:
        (recipientExpected || "").replace(/\s+/g, "") !==
        params.recipientPhoneOrTill.replace(/\s+/g, ""),
      provider_profile_verified: !!providerProfile.is_verified,
    };

    const now = new Date().toISOString();
    const { data: payment, error } = await supabaseAdmin
      .from("payments")
      .insert({
        request_id: request.id,
        user_id: params.actor.id,
        provider_id: params.providerId,
        provider_type: request.provider_type,
        payment_method: "mpesa_manual",
        amount_expected: expectedAmount,
        amount_submitted: submittedAmount,
        currency,
        status: "pending_verification",
        transaction_code: normalizedCode,
        receipt_url: params.receiptUrl || null,
        submitted_at: now,
        recipient_name: params.recipientName.trim(),
        recipient_phone_or_till: params.recipientPhoneOrTill.trim(),
        risk_flags: riskFlags,
        reference: normalizedCode,
      })
      .select("*")
      .single();

    if (error || !payment) {
      throw new Error(error?.message || "Failed to submit manual payment.");
    }

    await logPaymentAction({
      paymentId: payment.id,
      action: "manual_payment_submitted",
      oldStatus: null,
      newStatus: "pending_verification",
      performedBy: params.actor.id,
      performedByRole: params.actor.role,
      notes: "Customer submitted M-Pesa payment proof.",
    });

    await syncRelatedRequestPaymentState({
      requestId: request.id,
      paymentStatus: "pending_verification",
      amount: expectedAmount,
      currency,
    });

    if (request.provider_id) {
      await notificationService.create({
        user_id: request.provider_id,
        type: "payment.manual_submitted",
        title: "Manual M-Pesa payment submitted",
        body: `A customer submitted M-Pesa proof for ${request.request_title}.`,
        entity_type: "payment",
        entity_id: payment.id,
        deep_link:
          request.provider_type === "home" ? "/operations/billing" : "/marketplace/billing",
        idempotency_key: `manual-submit:${payment.id}:${request.provider_id}`,
      });
    }

    return payment;
  },

  async listPendingPayments(actor: Actor) {
    let query = supabaseAdmin
      .from("payments")
      .select("*")
      .eq("payment_method", "mpesa_manual")
      .eq("status", "pending_verification")
      .order("submitted_at", { ascending: false });

    let payments: any[] = [];

    if (isAdmin(actor)) {
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      payments = data || [];
    } else {
      if (!isProvider(actor)) {
        throw new Error("You are not allowed to verify manual payments.");
      }

      const { data, error } = await query.eq("provider_id", actor.id);
      if (error) throw new Error(error.message);
      payments = (data || []).filter((payment) => payment.user_id !== actor.id);
    }

    const relatedUserIds = Array.from(
      new Set(
        payments.flatMap((payment) => [payment.user_id, payment.provider_id]).filter(Boolean)
      )
    );

    if (relatedUserIds.length === 0) {
      return payments;
    }

    const { data: profiles, error: profileError } = await supabaseAdmin
      .from("user_profiles")
      .select("id, full_name, email, home_name, business_name, role")
      .in("id", relatedUserIds);

    if (profileError) {
      throw new Error(profileError.message);
    }

    const profileMap = new Map((profiles || []).map((profile) => [profile.id, profile]));

    return payments.map((payment) => ({
      ...payment,
      customer: payment.user_id ? profileMap.get(payment.user_id) || null : null,
      provider: payment.provider_id ? profileMap.get(payment.provider_id) || null : null,
    }));
  },

  async confirmManualPayment(params: { actor: Actor; paymentId: string; notes?: string | null }) {
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("id", params.paymentId)
      .maybeSingle();

    if (paymentError) {
      throw new Error(paymentError.message);
    }

    if (!payment) {
      throw new Error("Payment not found.");
    }

    if (payment.status !== "pending_verification") {
      throw new Error("Only pending manual payments can be confirmed.");
    }

    if (!isAdmin(params.actor)) {
      if (!isProvider(params.actor) || payment.provider_id !== params.actor.id) {
        throw new Error("You can only confirm payments for your own requests.");
      }
      if (payment.user_id === params.actor.id) {
        throw new Error("You cannot confirm your own payment.");
      }
    }

    if (Number(payment.amount_expected || 0) !== Number(payment.amount_submitted || 0)) {
      throw new Error("Submitted amount does not match the expected invoice amount.");
    }

    const { data: duplicate, error: duplicateError } = await supabaseAdmin
      .from("payments")
      .select("id")
      .eq("transaction_code", payment.transaction_code)
      .neq("id", payment.id)
      .in("status", ["pending_verification", "confirmed"])
      .maybeSingle();

    if (duplicateError) {
      throw new Error(duplicateError.message);
    }

    if (duplicate?.id) {
      throw new Error("This transaction code is already linked to another payment.");
    }

    const now = new Date().toISOString();
    const { error: updateError } = await supabaseAdmin
      .from("payments")
      .update({
        status: "confirmed",
        confirmed_at: now,
        confirmed_by: params.actor.id,
        updated_at: now,
      })
      .eq("id", payment.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    await logPaymentAction({
      paymentId: payment.id,
      action: "manual_payment_confirmed",
      oldStatus: payment.status,
      newStatus: "confirmed",
      performedBy: params.actor.id,
      performedByRole: params.actor.role,
      notes: params.notes || "Manual M-Pesa payment approved.",
    });

    await syncRelatedRequestPaymentState({
      requestId: payment.request_id,
      paymentStatus: "paid",
      amount: Number(payment.amount_expected || payment.amount_submitted || 0),
      currency: payment.currency,
      finalStatus: "paid",
    });

    if (payment.user_id) {
      await notificationService.create({
        user_id: payment.user_id,
        type: "payment.manual_confirmed",
        title: "Manual payment approved",
        body: "Your M-Pesa payment was approved and your request is now confirmed.",
        entity_type: "payment",
        entity_id: payment.id,
        deep_link: "/family/requests",
        idempotency_key: `manual-confirm:${payment.id}:${payment.user_id}`,
      });
    }

    await subscriptionManualPaymentService.activateConfirmedSubscription(payment);
  },

  async rejectManualPayment(params: { actor: Actor; paymentId: string; reason: string }) {
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("id", params.paymentId)
      .maybeSingle();

    if (paymentError) {
      throw new Error(paymentError.message);
    }

    if (!payment) {
      throw new Error("Payment not found.");
    }

    if (payment.status !== "pending_verification") {
      throw new Error("Only pending manual payments can be rejected.");
    }

    if (!params.reason.trim()) {
      throw new Error("Rejection reason is required.");
    }

    if (!isAdmin(params.actor)) {
      if (!isProvider(params.actor) || payment.provider_id !== params.actor.id) {
        throw new Error("You can only reject payments for your own requests.");
      }
      if (payment.user_id === params.actor.id) {
        throw new Error("You cannot reject your own payment.");
      }
    }

    const now = new Date().toISOString();
    const { error: updateError } = await supabaseAdmin
      .from("payments")
      .update({
        status: "rejected",
        rejected_at: now,
        rejected_by: params.actor.id,
        rejection_reason: params.reason,
        updated_at: now,
      })
      .eq("id", payment.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    await logPaymentAction({
      paymentId: payment.id,
      action: "manual_payment_rejected",
      oldStatus: payment.status,
      newStatus: "rejected",
      performedBy: params.actor.id,
      performedByRole: params.actor.role,
      notes: params.reason,
    });

    await syncRelatedRequestPaymentState({
      requestId: payment.request_id,
      paymentStatus: "unpaid",
      amount: Number(payment.amount_expected || payment.amount_submitted || 0),
      currency: payment.currency,
    });

    if (payment.user_id) {
      await notificationService.create({
        user_id: payment.user_id,
        type: "payment.manual_rejected",
        title: "Manual payment rejected",
        body: params.reason,
        entity_type: "payment",
        entity_id: payment.id,
        deep_link: "/family/requests",
        idempotency_key: `manual-reject:${payment.id}:${payment.user_id}`,
      });
    }

    await subscriptionManualPaymentService.failRejectedSubscription(payment);
  },
};
