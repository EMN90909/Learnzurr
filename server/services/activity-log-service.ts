import { supabaseAdmin } from "../supabase-admin";

type ActivityLogInput = {
  user_id?: string | null;
  actor_user_id?: string | null;
  entity_type: string;
  entity_id?: string | null;
  action: string;
  details?: Record<string, unknown> | null;
};

export const activityLogService = {
  async record(input: ActivityLogInput) {
    await supabaseAdmin.from("activity_logs").insert({
      user_id: input.user_id || null,
      actor_user_id: input.actor_user_id || null,
      entity_type: input.entity_type,
      entity_id: input.entity_id || null,
      action: input.action,
      details: input.details || {},
    });
  },
};
