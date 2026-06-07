import { Router } from "express";
import type { PushSubscription } from "web-push";
import {
  getActiveVapidPublicKey,
  removePushSubscription,
  savePushSubscription,
  sendPushToUser,
  setupPushServer,
} from "./pushServer";
import type { UserRole } from "./pushStore";

const router = Router();
setupPushServer();

router.get("/vapid-public-key", (_req, res) => {
  const publicKey = getActiveVapidPublicKey();
  if (!publicKey) {
    return res.status(503).json({ error: "Push notifications are not configured." });
  }
  res.json({ publicKey });
});

router.post("/subscribe", async (req, res) => {
  const body = req.body as {
    userId: string;
    role: UserRole;
    subscription: PushSubscription;
  };

  if (!body.userId || !body.role || !body.subscription?.endpoint) {
    return res.status(400).json({ success: false, message: "Missing userId, role, or subscription" });
  }

  const result = await savePushSubscription({
    userId: body.userId,
    role: body.role,
    subscription: body.subscription,
  });
  res.json(result);
});

router.post("/unsubscribe", async (req, res) => {
  const body = req.body as { endpoint?: string };
  const result = await removePushSubscription({ endpoint: body.endpoint });
  res.json(result);
});

async function handleSendToUser(req: any, res: any) {
  const body = req.body as {
    receiverId?: string;
    userId?: string;
    payload?: {
      type: string;
      title: string;
      body: string;
      url?: string;
      senderId?: string;
      receiverId?: string;
      metadata?: Record<string, unknown>;
    };
    title?: string;
    body?: string;
    message?: string;
    type?: string;
    url?: string;
  };

  const receiverId = body.receiverId || body.userId;
  const payload = body.payload || {
    type: body.type || "general",
    title: body.title || "Struta notification",
    body: body.body || body.message || "You have a new update.",
    url: body.url || "/",
  };

  if (!receiverId || !payload?.title || !payload?.body) {
    return res.status(400).json({ success: false, message: "Missing receiverId/userId or payload" });
  }

  const result = await sendPushToUser(receiverId, payload);
  res.json(result);
}

router.post("/send-to-user", handleSendToUser);
router.post("/send", handleSendToUser);

export default router;
