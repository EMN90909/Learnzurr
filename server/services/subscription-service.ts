import { supabaseAdmin } from "../supabase-admin";
import { activityLogService } from "./activity-log-service";
import { notificationService } from "./notification-service";

const mapStatus = (eventType: string, resourceStatus?: string) => {
  switch (eventType) {
    case "BILLING.SUBSCRIPTION.CREATED":
      return "pending";
    case "BILLING.SUBSCRIPTION.ACTIVATED":
      return "active";
    case "BILLING.SUBSCRIPTION.UPDATED":
      return resourceStatus?.toLowerCase() || "updated";
    case "BILLING.SUBSCRIPTION.EXPIRED":
      return "expired";
    case "BILLING.SUBSCRIPTION.CANCELLED":
      return "cancelled";
    case "BILLING.SUBSCRIPTION.SUSPENDED":
      return "suspended";
    case "BILLING.SUBSCRIPTION.PAYMENT.FAILED":
      return "payment_failed";
    default:
      return resourceStatus?.toLowerCase() || "pending";
  }
};

export const subscriptionService = {
  async handle(event: any) {
    const subscriptionId = event.resource?.id;
    const { data: existing } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("paypal_subscription_id", subscriptionId)
      .maybeSingle();

    const nextStatus = mapStatus(event.event_type, event.resource?.status);

    const values = {
      user_id: existing?.user_id || null,
      home_id: existing?.home_id || null,
      provider_id: existing?.provider_id || null,
      plan_name: existing?.plan_name || event.resource?.plan_id || "Subscription",
      status: nextStatus,
      payment_status: nextStatus === "active" ? "paid" : nextStatus === "payment_failed" ? "failed" : existing?.payment_status || "pending",
      paypal_plan_id: event.resource?.plan_id || existing?.paypal_plan_id || null,
      paypal_subscription_id: subscriptionId,
      current_period_start: event.resource?.start_time || existing?.current_period_start || null,
      current_period_end: event.resource?.billing_info?.next_billing_time || existing?.current_period_end || null,
      raw_subscription: event.resource,
      updated_at: new Date().toISOString(),
    };

    await supabaseAdmin.from("subscriptions").upsert(values, { onConflict: "paypal_subscription_id" });

    const affectedUserId = values.user_id || values.provider_id || values.home_id;
    if (affectedUserId) {
      await notificationService.create({
        user_id: affectedUserId,
        type: "subscription.status_changed",
        title: "Subscription update",
        body: `Subscription status is now ${nextStatus.replaceAll("_", " ")}.`,
        entity_type: "subscription",
        entity_id: subscriptionId,
        deep_link: values.provider_id ? "/operations/billing" : "/family/billing",
        idempotency_key: `${event.id}:${affectedUserId}`,
      });
    }

    await activityLogService.record({
      user_id: affectedUserId,
      entity_type: "subscription",
      entity_id: subscriptionId,
      action: event.event_type,
      details: { subscription_id: subscriptionId },
    });
  },
};
