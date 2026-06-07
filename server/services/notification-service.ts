import { supabaseAdmin } from "../supabase-admin";
import { sendPushToUser } from "../push-server/pushServer";

type NotificationInput = {
  user_id: string;
  type: string;
  title: string;
  body: string;
  entity_type?: string | null;
  entity_id?: string | null;
  deep_link?: string | null;
  idempotency_key: string;
};

function mapServerPushType(type: string, title: string, body: string) {
  const text = `${title} ${body}`.toLowerCase();

  if (type.startsWith("chat")) return "chat_message";
  if (type.includes("invoice")) return "invoice_sent";
  if (type.startsWith("payment")) {
    return text.includes("received") ? "payment_received" : "payment_done";
  }
  if (text.includes("declined") || text.includes("rejected")) return "request_declined";
  if (text.includes("approved") || text.includes("accepted")) return "request_approved";
  if (text.includes("memorial")) return "memorial_notification";
  if (type.startsWith("planning")) return "planning_changed";

  return "general";
}

function validateNotificationInput(input: NotificationInput) {
  if (!input.user_id?.trim()) {
    throw new Error("Notification user_id is required.");
  }

  if (!input.type?.trim()) {
    throw new Error("Notification type is required.");
  }

  if (!input.title?.trim()) {
    throw new Error("Notification title is required.");
  }

  if (!input.body?.trim()) {
    throw new Error("Notification body is required.");
  }

  if (!input.idempotency_key?.trim()) {
    throw new Error("Notification idempotency_key is required.");
  }
}

export const notificationService = {
  async create(input: NotificationInput) {
    validateNotificationInput(input);

    const { data, error } = await supabaseAdmin
      .from("notifications")
      .upsert(
        {
          user_id: input.user_id,
          type: input.type,
          title: input.title,
          body: input.body,
          entity_type: input.entity_type || null,
          entity_id: input.entity_id || null,
          deep_link: input.deep_link || null,
          idempotency_key: input.idempotency_key,
        },
        {
          onConflict: "idempotency_key",
          ignoreDuplicates: true,
        }
      )
      .select("id")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data?.id) {
      return {
        inserted: false,
        duplicate: true,
      };
    }

    sendPushToUser(input.user_id, {
      type: mapServerPushType(input.type, input.title, input.body),
      title: input.title,
      body: input.body,
      url: input.deep_link || "/",
      receiverId: input.user_id,
    }).catch((err) => {
      console.warn("[Push] server send failed:", err);
    });

    return {
      inserted: true,
      duplicate: false,
      notification_id: data.id,
    };
  },
};
