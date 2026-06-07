import { supabaseAdmin } from "../supabase-admin";
import { activityLogService } from "./activity-log-service";

const getCapture = (resource: any) =>
  resource?.purchase_units?.[0]?.payments?.captures?.[0] ||
  resource?.payments?.captures?.[0] ||
  null;

export const checkoutService = {
  async handleOrderApproved(event: any, captureResponse: any) {
    const orderId = event.resource?.id;
    const capture = getCapture(captureResponse);
    const captureId = capture?.id || null;

    const { data: payment } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("paypal_order_id", orderId)
      .maybeSingle();

    if (payment?.id) {
      await supabaseAdmin
        .from("payments")
        .update({
          paypal_capture_id: captureId,
          raw_capture: captureResponse,
        })
        .eq("id", payment.id);

      await activityLogService.record({
        user_id: payment.user_id,
        entity_type: "payment",
        entity_id: payment.id,
        action: "checkout.order.approved",
        details: { order_id: orderId, capture_id: captureId },
      });
    }
  },
};
