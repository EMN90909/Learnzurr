export type UserRole = "bereaved" | "home" | "vendor";

export type PushNotificationType =
  | "chat_message"
  | "request_received"
  | "request_approved"
  | "request_declined"
  | "payment_done"
  | "payment_received"
  | "planning_done"
  | "planning_changed"
  | "invoice_sent"
  | "event_done"
  | "memorial_message"
  | "memorial_notification"
  | "vendor_update"
  | "general";

export interface PushPayload {
  type: PushNotificationType;
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
  role?: UserRole;
  senderId?: string;
  receiverId?: string;
  metadata?: Record<string, unknown>;
}

export interface PushClientConfig {
  apiBaseUrl: string;
  serviceWorkerPath?: string;
}
