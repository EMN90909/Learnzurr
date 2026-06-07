import type { PushClientConfig, PushPayload } from "./pushTypes";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = `${base64String}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }
  return outputArray;
}

function isLikelyValidVapidKey(publicKey: string) {
  try {
    return urlBase64ToUint8Array(publicKey).byteLength === 65;
  } catch {
    return false;
  }
}

export class PushClient {
  private apiBaseUrl: string;
  private serviceWorkerPath: string;

  constructor(config: PushClientConfig) {
    this.apiBaseUrl = config.apiBaseUrl.replace(/\/$/, "");
    this.serviceWorkerPath = config.serviceWorkerPath || "/push-sw.js";
  }

  async isSupported(): Promise<boolean> {
    return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  }

  async getVapidPublicKey(): Promise<string> {
    const envKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || "";
    if (envKey && isLikelyValidVapidKey(envKey)) return envKey;
    const isLocalhost = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
    if (isLocalhost && import.meta.env.VITE_ENABLE_WEB_PUSH !== "true") return "";
    try {
      const response = await fetch(`${this.apiBaseUrl}/push/vapid-public-key`);
      if (!response.ok) return "";
      const data = (await response.json()) as { publicKey?: string };
      return data.publicKey || "";
    } catch {
      return "";
    }
  }

  async requestPermission(): Promise<NotificationPermission | "unsupported"> {
    if (!(await this.isSupported())) return "unsupported";
    if (Notification.permission === "granted") return "granted";
    if (Notification.permission === "denied") return "denied";
    return Notification.requestPermission();
  }

  async subscribeUser(userId: string, role: "bereaved" | "home" | "vendor") {
    const permission = await this.requestPermission();
    if (permission !== "granted") throw new Error("Notification permission was not granted");
    const registration = await navigator.serviceWorker.register(this.serviceWorkerPath);
    await navigator.serviceWorker.ready;
    const publicKey = await this.getVapidPublicKey();
    if (!publicKey || !isLikelyValidVapidKey(publicKey)) return null as unknown as PushSubscription;
    const existing = await registration.pushManager.getSubscription();
    const subscription = existing || await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) });
    const response = await fetch(`${this.apiBaseUrl}/push/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role, subscription }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message || "Failed to save push subscription");
    }
    return subscription;
  }

  async sendToUser(receiverId: string, payload: PushPayload) {
    const response = await fetch(`${this.apiBaseUrl}/push/send-to-user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId, payload }),
    });
    if (!response.ok) throw new Error("Failed to send push notification");
    return response.json();
  }
}
