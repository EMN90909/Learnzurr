import { supabaseAdmin } from "../supabase-admin";
import { activityLogService } from "./activity-log-service";

export const billingPlanService = {
  async handle(event: any) {
    const planId = event.resource?.id;
    await supabaseAdmin.from("billing_plans").upsert(
      {
        paypal_plan_id: planId,
        name: event.resource?.name || planId,
        description: event.resource?.description || null,
        status: event.resource?.status || event.event_type.split(".").pop()?.toLowerCase() || "updated",
        raw_plan: event.resource,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "paypal_plan_id" }
    );

    await activityLogService.record({
      entity_type: "billing_plan",
      entity_id: planId,
      action: event.event_type,
      details: { plan_id: planId },
    });
  },
};
