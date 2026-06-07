import { supabaseAdmin } from "../supabase-admin";
import { activityLogService } from "./activity-log-service";
import { notificationService } from "./notification-service";

export const refundService = {
  async handleWebhook(event: any) {
    const captureId = event.resource?.id || event.resource?.links?.[0]?.href || null;

    const { data: payment } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("paypal_capture_id", captureId)
      .maybeSingle();

    if (!payment?.id) {
      return;
    }

    await supabaseAdmin
      .from("payments")
      .update({
        status: "refunded",
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.id);

    await supabaseAdmin
      .from("refunds")
      .upsert(
        {
          payment_id: payment.id,
          paypal_capture_id: captureId,
          paypal_refund_id: event.resource?.id,
          status: "completed",
          amount: Number(event.resource?.amount?.value || payment.amount || 0),
          currency: event.resource?.amount?.currency_code || payment.currency,
          raw_refund: event.resource,
          completed_at: new Date().toISOString(),
        },
        { onConflict: "paypal_refund_id" }
      );

    await notificationService.create({
      user_id: payment.user_id,
      type: "payment.refund_completed",
      title: "Refund completed",
      body: `Refund completed for payment ${payment.reference || payment.id}.`,
      entity_type: "refund",
      entity_id: payment.id,
      deep_link: "/family/requests",
      idempotency_key: `${event.id}:${payment.user_id}`,
    });

    await activityLogService.record({
      user_id: payment.user_id,
      entity_type: "refund",
      entity_id: payment.id,
      action: event.event_type,
      details: { capture_id: captureId },
    });
  },
};
