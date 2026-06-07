import { supabaseAdmin } from "../supabase-admin";
import { activityLogService } from "./activity-log-service";
import { notificationService } from "./notification-service";
import { emailService } from "./email-service";
import { sendPushToUser } from "../push-server/pushServer";

function subscriptionExpiry(planPeriod?: string | null) {
  const started = new Date();
  const expires = new Date(started);
  const period = (planPeriod || "monthly").toLowerCase();

  if (period === "lifetime") {
    expires.setFullYear(expires.getFullYear() + 99);
  } else if (period === "yearly") {
    expires.setFullYear(expires.getFullYear() + 1);
  } else {
    expires.setMonth(expires.getMonth() + 1);
  }

  return { started_at: started.toISOString(), expires_at: expires.toISOString() };
}

const statusMap: Record<string, string> = {
  "PAYMENT.CAPTURE.PENDING": "pending",
  "PAYMENT.CAPTURE.COMPLETED": "completed",
  "PAYMENT.CAPTURE.DENIED": "denied",
  "PAYMENT.CAPTURE.REFUNDED": "refunded",
  "PAYMENT.CAPTURE.REVERSED": "reversed",
};

const resolveEmail = async (userId?: string | null, fallback?: string | null) => {
  if (!userId) {
    return fallback || null;
  }

  const { data } = await supabaseAdmin
    .from("user_profiles")
    .select("email")
    .eq("id", userId)
    .maybeSingle();

  return data?.email || fallback || null;
};

const parseRequestNotes = (notes: string | null | undefined) => {
  if (!notes) return {};
  try {
    return JSON.parse(notes) as Record<string, unknown>;
  } catch {
    return { custom_notes: notes };
  }
};

export const paymentCaptureService = {
  async handle(event: any) {
    const captureId = event.resource?.id;
    const orderId = event.resource?.supplementary_data?.related_ids?.order_id || null;
    const nextStatus = statusMap[event.event_type] || "pending";

    let query = supabaseAdmin.from("payments").select("*");
    if (captureId && orderId) {
      query = query.or(`paypal_capture_id.eq.${captureId},paypal_order_id.eq.${orderId}`);
    } else if (captureId) {
      query = query.eq("paypal_capture_id", captureId);
    } else if (orderId) {
      query = query.eq("paypal_order_id", orderId);
    } else {
      return;
    }

    const { data: payment } = await query
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!payment?.id) {
      return;
    }

    await supabaseAdmin
      .from("payments")
      .update({
        status: nextStatus,
        paypal_capture_id: captureId,
        paypal_order_id: orderId,
        paid_at: nextStatus === "completed" ? new Date().toISOString() : payment.paid_at,
        raw_capture: event.resource,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.id);

    if (payment.invoice_id) {
      await supabaseAdmin
        .from("invoices")
        .update({
          status: nextStatus === "completed" ? "paid" : nextStatus,
          paid_at: nextStatus === "completed" ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", payment.invoice_id);
    }

    if (payment.request_id) {
      const { data: request } = await supabaseAdmin
        .from("service_requests")
        .select("id, notes, status")
        .eq("id", payment.request_id)
        .maybeSingle();

      if (request) {
        const parsed = parseRequestNotes(request.notes);
        const paymentAmount = Number(payment.amount_expected || payment.amount || 0);
        const nextRequestNotes = {
          ...parsed,
          payment_requested: true,
          payment_amount: paymentAmount,
          payment_currency: payment.currency || "USD",
          payment_status: nextStatus === "completed" ? "paid" : nextStatus,
          status: nextStatus === "completed" ? "paid" : parsed.status || request.status,
        };

        await supabaseAdmin
          .from("service_requests")
          .update({
            notes: JSON.stringify(nextRequestNotes),
            status: request.status === "pending" ? request.status : "accepted",
            updated_at: new Date().toISOString(),
          })
          .eq("id", request.id);
      }
    }

    if (payment.subscription_id && nextStatus === "completed") {
      const planPeriod =
        (payment.metadata as { plan_period?: string } | null)?.plan_period || "monthly";
      const dates = subscriptionExpiry(planPeriod);

      await supabaseAdmin
        .from("subscriptions")
        .update({
          status: "active",
          payment_status: "paid",
          started_at: dates.started_at,
          expires_at: dates.expires_at,
          updated_at: new Date().toISOString(),
        })
        .eq("id", payment.subscription_id);

      const planName = (payment.metadata as { plan_name?: string } | null)?.plan_name || "";
      if (planName.includes("Memorial Pro") && payment.user_id) {
        await sendPushToUser(payment.user_id, {
          type: "payment_done",
          title: "Struta Memorial Pro activated",
          body: "Your memorial Pro plan is now active. Enjoy unlimited tributes and family privacy.",
          url: "/family/billing",
          receiverId: payment.user_id,
        });
      }
    }

    await activityLogService.record({
      user_id: payment.user_id,
      entity_type: "payment",
      entity_id: payment.id,
      action: event.event_type,
      details: { capture_id: captureId, order_id: orderId },
    });

    if (payment.user_id) {
      await notificationService.create({
        user_id: payment.user_id,
        type: nextStatus === "completed" ? "payment.invoice_paid" : "payment.status_changed",
        title: nextStatus === "completed" ? "Payment received" : "Payment update",
        body: `Payment ${payment.reference || payment.id} is now ${nextStatus}.`,
        entity_type: "payment",
        entity_id: payment.id,
        deep_link: payment.request_id ? "/family/requests" : "/family/billing",
        idempotency_key: `${event.id}:${payment.user_id}`,
      });
    }

    if (payment.provider_id && payment.provider_id !== payment.user_id) {
      await notificationService.create({
        user_id: payment.provider_id,
        type: "payment.provider_update",
        title: "Customer payment updated",
        body: `Payment ${payment.reference || payment.id} is now ${nextStatus}.`,
        entity_type: "payment",
        entity_id: payment.id,
        deep_link: "/operations/billing",
        idempotency_key: `${event.id}:${payment.provider_id}`,
      });
    }

    const payerEmail = await resolveEmail(payment.user_id, payment.payer_email);
    if (payerEmail && (nextStatus === "completed" || nextStatus === "refunded")) {
      await emailService.send(
        payerEmail,
        nextStatus === "completed" ? "Struta payment receipt" : "Struta refund update",
        `<p>Your payment <strong>${payment.reference || payment.id}</strong> is now ${nextStatus}.</p>`
      );
    }
  },
};
