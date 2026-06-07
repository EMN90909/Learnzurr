import { supabaseAdmin } from "../supabase-admin";
import { activityLogService } from "./activity-log-service";
import { notificationService } from "./notification-service";

export const disputeService = {
  async handle(event: any) {
    const disputeId = event.resource?.dispute_id || event.resource?.id;
    const captureId = event.resource?.disputed_transactions?.[0]?.seller_transaction_id || null;

    const { data: payment } = captureId
      ? await supabaseAdmin.from("payments").select("*").eq("paypal_capture_id", captureId).maybeSingle()
      : { data: null };

    await supabaseAdmin.from("disputes").upsert(
      {
        paypal_dispute_id: disputeId,
        payment_id: payment?.id || null,
        paypal_capture_id: captureId,
        status: event.resource?.status || event.event_type,
        reason: event.resource?.reason || null,
        raw_dispute: event.resource,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "paypal_dispute_id" }
    );

    const notifiedUsers = [payment?.user_id, payment?.provider_id].filter(Boolean) as string[];
    for (const userId of notifiedUsers) {
      await notificationService.create({
        user_id: userId,
        type: "payment.dispute",
        title: "Payment dispute update",
        body: `A dispute event was received: ${event.event_type}.`,
        entity_type: "dispute",
        entity_id: disputeId,
        deep_link: "/family/requests",
        idempotency_key: `${event.id}:${userId}`,
      });
    }

    await activityLogService.record({
      user_id: payment?.user_id,
      entity_type: "dispute",
      entity_id: disputeId,
      action: event.event_type,
      details: { capture_id: captureId },
    });
  },
};
