import { supabaseAdmin } from "../supabase-admin";

function requirePaypalEventId(event: Record<string, any>) {
  if (!event.id) {
    throw new Error("PayPal webhook event id is missing.");
  }
  return event.id;
}

function getPaypalResourceId(event: Record<string, any>) {
  return (
    event.resource?.id ||
    event.resource?.billing_agreement_id ||
    event.resource?.supplementary_data?.related_ids?.order_id ||
    event.resource?.supplementary_data?.related_ids?.capture_id ||
    event.resource?.supplementary_data?.related_ids?.subscription_id ||
    null
  );
}

export const paypalDb = {
  async recordWebhookEvent(event: Record<string, any>, transmissionId: string) {
    const paypalEventId = requirePaypalEventId(event);
    const resourceId = getPaypalResourceId(event);

    const { data: existing, error: existingError } = await supabaseAdmin
      .from("paypal_webhook_events")
      .select("*")
      .eq("paypal_event_id", paypalEventId)
      .maybeSingle();

    if (existingError) throw new Error(existingError.message);
    if (existing) return { ...existing, duplicate: true };

    const row = {
      paypal_event_id: paypalEventId,
      transmission_id: transmissionId || null,
      event_type: event.event_type || null,
      resource_id: resourceId,
      status: "received",
      raw_event: event,
      created_time: event.create_time || null,
      processed_at: null,
      processing_error: null,
    };

    const { data, error } = await supabaseAdmin
      .from("paypal_webhook_events")
      .insert(row)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return { ...data, duplicate: false };
  },

  async markWebhookProcessed(paypalEventId: string, status: string, processingError?: string | null) {
    if (!paypalEventId) throw new Error("PayPal webhook event id is required.");

    const updatePayload =
      status === "processing"
        ? { status, processing_error: processingError || null }
        : { status, processing_error: processingError || null, processed_at: new Date().toISOString() };

    const { error } = await supabaseAdmin
      .from("paypal_webhook_events")
      .update(updatePayload)
      .eq("paypal_event_id", paypalEventId);

    if (error) throw new Error(error.message);
  },
};
