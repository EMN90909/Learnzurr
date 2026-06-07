import type { StrutaNotification } from "./notifications";

export function routeForNotification(notification: Pick<StrutaNotification, "type" | "title" | "message" | "link">, fallbackRole: "family" | "operations" | "marketplace" | "admin" = "family") {
  if (notification.link && notification.link !== "#") return notification.link;
  const text = `${notification.title} ${notification.message}`.toLowerCase();
  const root = fallbackRole === "admin" ? "/admin" : fallbackRole === "operations" ? "/operations" : fallbackRole === "marketplace" ? "/marketplace" : "/family";
  if (notification.type === "chat" || text.includes("message") || text.includes("chat")) return `${root}/chats`;
  if (notification.type === "payment" || text.includes("invoice") || text.includes("paid") || text.includes("payment")) return `${root}/billing`;
  if (notification.type === "planning" || text.includes("planning") || text.includes("approval")) return fallbackRole === "family" ? "/family/requests" : fallbackRole === "marketplace" ? "/marketplace/orders" : "/operations/cases";
  if (fallbackRole === "marketplace") return "/marketplace/orders";
  if (fallbackRole === "operations") return "/operations/cases";
  if (fallbackRole === "admin") return "/admin/requests";
  return "/family/requests";
}
