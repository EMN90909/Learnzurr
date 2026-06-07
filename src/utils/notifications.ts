"use client";

import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { PushPayload } from "@/push/pushTypes";
import { apiFetch } from "@/lib/api";

export type StrutaNotification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "request" | "planning" | "payment" | "chat";
  read: boolean;
  createdAt: string;
  link?: string;
};

const APP_NAME = "Struta";
const ICON = "/favicon.svg";
const BADGE = "/favicon.svg";
const RECENT_WINDOW_MS = 60_000;
const sentInThisTab = new Map<string, number>();
let pushWarned = false;

const dispatchUpdate = () => window.dispatchEvent(new Event("struta_notifications_updated"));
const getPushApiBaseUrl = () => import.meta.env.VITE_API_BASE_URL || "/api";
const shouldUsePushApi = () => !( ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname) && import.meta.env.VITE_ENABLE_WEB_PUSH !== "true" );
const fingerprint = (userId: string, title: string, message: string, type: string, link?: string) => `${userId}:${type}:${title}:${message}:${link || ""}`.toLowerCase();

function recentlySent(key: string) {
  const now = Date.now();
  const previous = sentInThisTab.get(key) || 0;
  if (now - previous < RECENT_WINDOW_MS) return true;
  sentInThisTab.set(key, now);
  return false;
}

function normalizeLink(type: StrutaNotification["type"], link?: string) {
  if (link && link !== "#") return link;
  if (type === "chat") return "/family/chats";
  if (type === "payment") return "/family/billing";
  if (type === "planning") return "/family/requests";
  return "/family/requests";
}

function mapTypeToPush(type: StrutaNotification["type"], title: string, message: string): PushPayload["type"] {
  const t = `${title} ${message}`.toLowerCase();
  if (type === "chat") return "chat_message";
  if (type === "payment") return t.includes("invoice") ? "invoice_sent" : "payment_received";
  if (t.includes("declined") || t.includes("rejected")) return "request_declined";
  if (t.includes("approved") || t.includes("accepted")) return "request_approved";
  if (t.includes("memorial")) return "memorial_notification";
  if (type === "request") return "request_received";
  return "general";
}

const showBrowserNotification = (title: string, message: string, link?: string) => {
  try {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    const notification = new Notification(title, { body: message, icon: ICON, badge: BADGE, tag: `${title}:${message}`, renotify: false });
    notification.onclick = () => {
      window.focus();
      if (link) window.location.href = link;
    };
  } catch {}
};

const saveLocal = (userId: string, notification: Omit<StrutaNotification, "id" | "read" | "createdAt">, id: string, createdAt: string) => {
  const key = `struta_local_notifications_${userId}`;
  const list: StrutaNotification[] = JSON.parse(localStorage.getItem(key) || "[]");
  const fp = fingerprint(userId, notification.title, notification.message, notification.type, notification.link);
  const exists = list.some((item) => fingerprint(userId, item.title, item.message, item.type, item.link) === fp && Date.now() - new Date(item.createdAt).getTime() < RECENT_WINDOW_MS);
  if (exists) return;
  list.unshift({ id, userId, title: notification.title, message: notification.message, type: notification.type, read: false, createdAt, link: notification.link });
  localStorage.setItem(key, JSON.stringify(list.slice(0, 100)));
};

export const getNotifications = async (userId: string): Promise<StrutaNotification[]> => {
  if (!userId) return [];
  let dbNotifications: StrutaNotification[] = [];
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("id,user_id,title,body,message,type,deep_link,is_read,read,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (!error && data) {
      dbNotifications = data.map((row) => ({
        id: row.id,
        userId: row.user_id,
        title: row.title,
        message: row.body || row.message || "",
        type: row.type?.startsWith("payment") ? "payment" : row.type?.startsWith("chat") ? "chat" : row.type?.startsWith("planning") || row.type?.startsWith("subscription") ? "planning" : "request",
        read: !!(row.is_read || row.read),
        createdAt: row.created_at,
        link: row.deep_link || undefined,
      }));
    }
  } catch {
    console.warn("Failed to load notifications from Supabase.");
  }
  const key = `struta_local_notifications_${userId}`;
  const localNotifications: StrutaNotification[] = JSON.parse(localStorage.getItem(key) || "[]");
  const byFingerprint = new Map<string, StrutaNotification>();
  [...dbNotifications, ...localNotifications].forEach((item) => {
    const normalized = { ...item, link: normalizeLink(item.type, item.link) };
    const fp = fingerprint(userId, normalized.title, normalized.message, normalized.type, normalized.link);
    const existing = byFingerprint.get(fp);
    if (!existing || new Date(normalized.createdAt).getTime() > new Date(existing.createdAt).getTime()) byFingerprint.set(fp, normalized);
  });
  return Array.from(byFingerprint.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const subscribeDevicePush = async (userId: string, role: "bereaved" | "home" | "vendor") => {
  try {
    const { PushClient } = await import("@/push/pushClient");
    const client = new PushClient({ apiBaseUrl: getPushApiBaseUrl(), serviceWorkerPath: "/push-sw.js" });
    if (!(await client.isSupported())) return false;
    await client.subscribeUser(userId, role);
    return true;
  } catch (error) {
    console.warn("[Web Push] Subscription skipped or not configured:", error);
    return false;
  }
};

export const requestNotificationPermission = async (userId?: string, role?: "bereaved" | "home" | "vendor") => {
  if (!("Notification" in window)) return false;
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;
  if (userId && role) await subscribeDevicePush(userId, role);
  return true;
};

export const addNotification = async (userId: string, notification: Omit<StrutaNotification, "id" | "read" | "createdAt">) => {
  if (!userId) return;

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const title = notification.title.startsWith(APP_NAME) ? notification.title : `${APP_NAME}: ${notification.title}`;
  const link = normalizeLink(notification.type, notification.link);
  const fp = fingerprint(userId, title, notification.message, notification.type, link);
  if (recentlySent(fp)) return;

  let serverSaved = false;
  try {
    const response = await apiFetch("/api/notifications/create", {
      method: "POST",
      body: JSON.stringify({
        userId,
        title,
        message: notification.message,
        type: notification.type,
        link,
        idempotencyKey: fp,
        push: true,
      }),
    });
    serverSaved = response.ok;
    if (!response.ok) throw new Error("Server notification failed");
  } catch (error) {
    saveLocal(userId, { ...notification, title, link }, id, createdAt);
    console.warn("Notification saved locally only:", error);
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (userId === session?.user?.id) {
      showBrowserNotification(title, notification.message, link);
      toast(title, { description: notification.message, action: { label: "Open", onClick: () => { window.location.href = link; } } });
    }
  } catch {}

  if (!serverSaved && shouldUsePushApi()) {
    fetch(`${getPushApiBaseUrl()}/push/send-to-user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        receiverId: userId,
        payload: {
          type: mapTypeToPush(notification.type, title, notification.message),
          title,
          body: notification.message,
          url: link,
          icon: ICON,
          badge: BADGE,
          receiverId: userId,
        } satisfies PushPayload,
      }),
    }).catch((error) => {
      if (!pushWarned) {
        console.warn("[Push] send failed:", error);
        pushWarned = true;
      }
    });
  }

  dispatchUpdate();
};

export const markAllAsRead = async (userId: string) => {
  if (!userId) return;
  try { await supabase.from("notifications").update({ is_read: true, read: true }).eq("user_id", userId); } catch {}
  const key = `struta_local_notifications_${userId}`;
  const updated = JSON.parse(localStorage.getItem(key) || "[]").map((n: StrutaNotification) => ({ ...n, read: true }));
  localStorage.setItem(key, JSON.stringify(updated));
  dispatchUpdate();
};

export const clearNotifications = async (userId: string) => {
  if (!userId) return;
  try { await supabase.from("notifications").delete().eq("user_id", userId); } catch {}
  localStorage.removeItem(`struta_local_notifications_${userId}`);
  dispatchUpdate();
};

export const deleteNotification = async (userId: string, notificationId: string) => {
  if (!userId) return;
  try { await supabase.from("notifications").delete().eq("user_id", userId).eq("id", notificationId); } catch {}
  const key = `struta_local_notifications_${userId}`;
  const filtered = JSON.parse(localStorage.getItem(key) || "[]").filter((n: StrutaNotification) => n.id !== notificationId);
  localStorage.setItem(key, JSON.stringify(filtered));
  dispatchUpdate();
};
