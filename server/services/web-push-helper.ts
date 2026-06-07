import webpush from "web-push";

export type PushSubscription = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export type VapidDetails = {
  publicKey: string;
  privateKey: string;
  subject: string;
};

export function generateVapidKeys() {
  return webpush.generateVAPIDKeys();
}

export function configureWebPush(vapid: VapidDetails) {
  if (!vapid.publicKey || !vapid.privateKey) {
    throw new Error("VAPID public and private keys are required.");
  }
  webpush.setVapidDetails(vapid.subject || "mailto:support@struta.com", vapid.publicKey, vapid.privateKey);
}

export async function sendWebPush(subscription: PushSubscription, payload: Record<string, unknown>) {
  return webpush.sendNotification(subscription as any, JSON.stringify(payload));
}
