import webpush, { PushSubscription } from "web-push";
import { pushStore, UserRole } from "./pushStore";
import { supabaseAdmin } from "../supabase-admin";
import { config } from "../config";

export interface SendPushPayload {
  type: string;
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

let vapidReady = false;
let activePublicKey = "";
let generatedPublicKey = "";
let generatedPrivateKey = "";
let loggedGeneratedKey = false;

const isValidVapidPublicKey = (value?: string) => {
  if (!value) return false;
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
    const decoded = Buffer.from(`${normalized}${padding}`, "base64");
    return decoded.length === 65;
  } catch {
    return false;
  }
};

const isLikelyVapidPrivateKey = (value?: string) =>
  !!value && !value.includes("BEGIN") && value.length >= 40 && value.length <= 100;

export function setupPushServer() {
  let publicKey = process.env.VAPID_PUBLIC_KEY || config.vapidPublicKey;
  let privateKey = process.env.VAPID_PRIVATE_KEY || config.vapidPrivateKey;
  const subject =
    process.env.VAPID_SUBJECT ||
    process.env.VAPID_EMAIL ||
    config.vapidEmail ||
    "mailto:support@struta.com";

  try {
    if (!isValidVapidPublicKey(publicKey) || !isLikelyVapidPrivateKey(privateKey)) {
      const generated = webpush.generateVAPIDKeys();
      generatedPublicKey = generated.publicKey;
      generatedPrivateKey = generated.privateKey;
      publicKey = generatedPublicKey;
      privateKey = generatedPrivateKey;
      if (!loggedGeneratedKey) {
        console.warn("[Push] VAPID keys were missing/invalid. Generated runtime keys for this process. Add persistent VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in production.");
        loggedGeneratedKey = true;
      }
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);
    vapidReady = true;
    activePublicKey = publicKey;
  } catch (err) {
    console.warn("[Push] VAPID setup failed:", err);
    vapidReady = false;
    activePublicKey = "";
  }

  return { publicKey: activePublicKey || generatedPublicKey };
}

export function getActiveVapidPublicKey() {
  if (!activePublicKey) setupPushServer();
  return activePublicKey || generatedPublicKey;
}

async function loadDbSubscriptions(userId: string): Promise<PushSubscription[]> {
  try {
    const { data } = await supabaseAdmin
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", userId);

    return (data || []).map((row) => ({
      endpoint: row.endpoint,
      keys: { p256dh: row.p256dh, auth: row.auth },
    }));
  } catch {
    return [];
  }
}

async function persistSubscription(input: {
  userId: string;
  role: UserRole;
  subscription: PushSubscription;
}) {
  pushStore.save(input);
  try {
    await supabaseAdmin.from("push_subscriptions").upsert(
      {
        user_id: input.userId,
        role: input.role,
        endpoint: input.subscription.endpoint,
        p256dh: input.subscription.keys.p256dh,
        auth: input.subscription.keys.auth,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" }
    );
  } catch (e) {
    console.warn("[Push] DB persist failed, using memory store:", e);
  }
}

export async function savePushSubscription(input: {
  userId: string;
  role: UserRole;
  subscription: PushSubscription;
}) {
  await persistSubscription(input);
  return { success: true };
}

export async function removePushSubscription(input: { endpoint?: string }) {
  if (input.endpoint) {
    pushStore.removeByEndpoint(input.endpoint);
    try {
      await supabaseAdmin.from("push_subscriptions").delete().eq("endpoint", input.endpoint);
    } catch {
      /* ignore */
    }
  }
  return { success: true };
}

async function getSubscriptionsForUser(userId: string): Promise<PushSubscription[]> {
  const memory = pushStore.findByUserId(userId).map((s) => s.subscription);
  const db = await loadDbSubscriptions(userId);
  const map = new Map<string, PushSubscription>();
  [...memory, ...db].forEach((s) => map.set(s.endpoint, s));
  return Array.from(map.values());
}

export async function sendPushToUser(userId: string, payload: SendPushPayload) {
  if (!vapidReady) setupPushServer();
  if (!vapidReady) {
    return { success: false, sent: 0, failed: 0, message: "VAPID not configured" };
  }

  const subscriptions = await getSubscriptionsForUser(userId);
  const message = JSON.stringify({
    ...payload,
    icon: payload.icon || "/struta-icon.png",
    badge: payload.badge || "/struta-icon.png",
  });

  const results = await Promise.allSettled(
    subscriptions.map((sub) => webpush.sendNotification(sub, message))
  );

  const failedEndpoints: string[] = [];
  results.forEach((result, index) => {
    if (result.status === "rejected") {
      failedEndpoints.push(subscriptions[index].endpoint);
      pushStore.removeByEndpoint(subscriptions[index].endpoint);
      void supabaseAdmin.from("push_subscriptions").delete().eq("endpoint", subscriptions[index].endpoint);
    }
  });

  return {
    success: true,
    receiverId: userId,
    sent: results.filter((r) => r.status === "fulfilled").length,
    failed: results.filter((r) => r.status === "rejected").length,
    failedEndpoints,
  };
}

export async function sendChatPush(input: {
  senderId: string;
  receiverId: string;
  senderName: string;
  message: string;
  chatUrl: string;
}) {
  return sendPushToUser(input.receiverId, {
    type: "chat_message",
    title: `New message from ${input.senderName}`,
    body: input.message,
    url: input.chatUrl,
    senderId: input.senderId,
    receiverId: input.receiverId,
  });
}
