import { supabase } from "@/integrations/supabase/client";

export async function recordGamificationEvent(params: {
  userId: string;
  eventKey: string;
  eventValue?: number;
  metadata?: Record<string, unknown>;
}) {
  const { data, error } = await supabase.rpc("record_gamification_event", {
    target_user_id: params.userId,
    event_key_input: params.eventKey,
    event_value_input: params.eventValue ?? 1,
    metadata_input: params.metadata ?? {},
  });

  if (error) {
    console.error("Failed to record gamification event:", error);
    throw error;
  }

  return data;
}
