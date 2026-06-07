import type { Server } from "node:http";
import { WebSocketServer } from "ws";

type ClientMeta = { userId?: string; role?: string; orgId?: string };
const clients = new Map<any, ClientMeta>();

export function attachRealtimeHub(server: Server) {
  const wss = new WebSocketServer({ server, path: "/api/realtime" });

  wss.on("connection", (socket) => {
    clients.set(socket, {});
    socket.on("message", (raw) => {
      try {
        const msg = JSON.parse(String(raw));
        if (msg.type === "hello") clients.set(socket, { userId: msg.userId, role: msg.role, orgId: msg.orgId });
        if (msg.type === "ping") socket.send(JSON.stringify({ type: "pong", at: Date.now() }));
      } catch {}
    });
    socket.on("close", () => clients.delete(socket));
  });

  const heartbeat = setInterval(() => {
    for (const socket of clients.keys()) {
      try { socket.ping(); } catch { clients.delete(socket); }
    }
  }, 30_000);
  wss.on("close", () => clearInterval(heartbeat));

  return wss;
}

export function publishRealtime(event: { type: string; userId?: string; orgId?: string; payload?: unknown }) {
  const data = JSON.stringify({ ...event, at: new Date().toISOString() });
  for (const [socket, meta] of clients.entries()) {
    const shouldSend = !event.userId && !event.orgId || event.userId === meta.userId || event.orgId === meta.orgId;
    if (!shouldSend) continue;
    try { socket.send(data); } catch { clients.delete(socket); }
  }
}
