import type express from "express";
import { supabaseAdmin } from "../supabase-admin";
import type { ServerActor } from "../auth";
import { parsePagination, responseCacheMiddleware, clearApiCache } from "../performance/cache";
import { publishRealtime } from "../realtime/realtimeHub";
import { enqueueJob } from "../jobs/queue";
import { sendPushToUser } from "../push-server/pushServer";

type Deps = {
  requireActor: (req: express.Request) => Promise<ServerActor>;
  rateLimit: (name: string, max?: number, windowMs?: number) => express.RequestHandler;
  insertNotificationSafe: (notification: any) => Promise<any>;
};

const text = (value: unknown, max = 180) => String(value || "").trim().slice(0, max);
const jsonArray = (value: unknown) => Array.isArray(value) ? value : [];
const vendorStaffRoles = new Set(["secretary", "driver", "coordinator", "setup_crew", "staff"]);

function isPaidVendor(actor: ServerActor) {
  const role = String(actor.role || "").toLowerCase();
  return role === "admin" || (role === "marketplace" && (actor.is_pro || actor.plan_code === "pro" || actor.plan_status === "active"));
}

function isVendorOwner(actor: ServerActor) {
  return String(actor.role || "").toLowerCase() === "marketplace" || String(actor.role || "").toLowerCase() === "admin";
}

function isCoordinator(actor: ServerActor) {
  return String(actor.staff_role || "").toLowerCase() === "coordinator";
}

function isVendorStaff(actor: ServerActor) {
  return vendorStaffRoles.has(String(actor.staff_role || "").toLowerCase());
}

function vendorIdFor(actor: ServerActor) {
  return actor.organization_id || actor.manager_id || actor.id;
}

function assertPaidVendorAccess(actor: ServerActor) {
  if (!isPaidVendor(actor) && !isVendorStaff(actor)) {
    throw new Error("Vendor ERP is available only to paid vendor accounts and their assigned staff.");
  }
  if (String(actor.role || "").toLowerCase() === "marketplace" && !isPaidVendor(actor)) {
    throw new Error("Upgrade vendor account to Pro to unlock Vendor ERP.");
  }
}

async function notifyStaff(deps: Deps, userId: string, title: string, body: string, link: string) {
  await deps.insertNotificationSafe({
    user_id: userId,
    title,
    body,
    type: "vendor_erp",
    deep_link: link,
    idempotency_key: `${userId}:${title}:${body}:${link}`.slice(0, 500),
  }).catch(() => null);
  publishRealtime({ type: "notification", userId, payload: { title, body, link } });
  enqueueJob("vendor-erp-push", () => sendPushToUser(userId, { type: "general", title, body, url: link }));
}

export function registerVendorErpRoutes(app: express.Express, deps: Deps) {
  app.get("/api/vendor-erp/overview", deps.rateLimit("vendor-erp-overview", 80), responseCacheMiddleware(8_000), async (req, res) => {
    try {
      const actor = await deps.requireActor(req);
      assertPaidVendorAccess(actor);
      const vendorId = vendorIdFor(actor);
      const [bookings, tasks, inventory] = await Promise.all([
        supabaseAdmin.from("vendor_bookings").select("status", { count: "exact", head: false }).eq("vendor_id", vendorId).limit(1000),
        supabaseAdmin.from("vendor_booking_tasks").select("status,assigned_to", { count: "exact", head: false }).eq("vendor_id", vendorId).limit(1000),
        supabaseAdmin.from("vendor_inventory_items").select("category,quantity_total,quantity_available,active").eq("vendor_id", vendorId).limit(1000),
      ]);
      if (bookings.error) throw bookings.error;
      if (tasks.error) throw tasks.error;
      if (inventory.error) throw inventory.error;
      const byStatus = (items: any[]) => items.reduce((acc: any, item) => { acc[item.status || "unknown"] = (acc[item.status || "unknown"] || 0) + 1; return acc; }, {});
      res.json({
        paid: true,
        erpType: "vendor",
        permissions: {
          canInviteStaff: isVendorOwner(actor),
          canCreateBooking: isVendorOwner(actor),
          canViewAllBookings: isVendorOwner(actor) || isCoordinator(actor),
          canAssignTasks: isVendorOwner(actor) || isCoordinator(actor),
          canViewReports: isVendorOwner(actor),
          canManageInventory: isVendorOwner(actor),
          canDeleteBookings: isVendorOwner(actor),
        },
        bookings: { total: bookings.data?.length || 0, byStatus: byStatus(bookings.data || []) },
        tasks: { total: tasks.data?.length || 0, byStatus: byStatus(tasks.data || []) },
        inventory: { totalItems: inventory.data?.length || 0, totalAvailable: (inventory.data || []).reduce((sum: number, item: any) => sum + Number(item.quantity_available || 0), 0) },
      });
    } catch (error: any) {
      res.status(error.message?.includes("Upgrade") || error.message?.includes("paid") ? 402 : 500).json({ error: error.message || "Could not load Vendor ERP overview." });
    }
  });

  app.get("/api/vendor-erp/bookings", deps.rateLimit("vendor-erp-bookings", 120), responseCacheMiddleware(8_000), async (req, res) => {
    try {
      const actor = await deps.requireActor(req);
      assertPaidVendorAccess(actor);
      const vendorId = vendorIdFor(actor);
      const { from, to, page, limit } = parsePagination(req, { limit: 50, max: 150 });
      let query = supabaseAdmin.from("vendor_bookings").select("id,vendor_id,family_name,family_phone,event_type,event_date,pickup_location,destination_location,equipment_needed,services_needed,status,total_amount,currency,created_at,updated_at", { count: "exact" }).eq("vendor_id", vendorId).order("event_date", { ascending: false, nullsFirst: false }).range(from, to);
      if (!isVendorOwner(actor) && !isCoordinator(actor)) {
        const { data: assigned } = await supabaseAdmin.from("vendor_booking_tasks").select("booking_id").eq("assigned_to", actor.id);
        const ids = [...new Set((assigned || []).map((t: any) => t.booking_id))];
        if (!ids.length) return res.json({ bookings: [], page, limit, total: 0 });
        query = query.in("id", ids);
      }
      const { data, error, count } = await query;
      if (error) throw error;
      res.json({ bookings: data || [], page, limit, total: count || 0 });
    } catch (error: any) {
      res.status(error.message?.includes("Upgrade") || error.message?.includes("paid") ? 402 : 500).json({ error: error.message || "Could not load vendor bookings." });
    }
  });

  app.post("/api/vendor-erp/bookings", deps.rateLimit("vendor-erp-create-booking", 30), async (req, res) => {
    try {
      const actor = await deps.requireActor(req);
      assertPaidVendorAccess(actor);
      if (!isVendorOwner(actor) && !isCoordinator(actor)) return res.status(403).json({ error: "Only vendor owner or coordinator can create bookings." });
      const vendorId = vendorIdFor(actor);
      const payload = {
        vendor_id: vendorId,
        created_by: actor.id,
        family_name: text(req.body?.family_name || req.body?.familyName, 120),
        family_phone: text(req.body?.family_phone || req.body?.familyPhone, 40),
        family_email: text(req.body?.family_email || req.body?.familyEmail, 160),
        event_type: text(req.body?.event_type || req.body?.eventType || "funeral_service", 80),
        event_date: req.body?.event_date || req.body?.eventDate || null,
        pickup_location: text(req.body?.pickup_location || req.body?.pickupLocation, 240),
        destination_location: text(req.body?.destination_location || req.body?.destinationLocation, 240),
        equipment_needed: jsonArray(req.body?.equipment_needed || req.body?.equipmentNeeded),
        services_needed: jsonArray(req.body?.services_needed || req.body?.servicesNeeded),
        notes: text(req.body?.notes, 2000),
        status: "pending",
        total_amount: Number(req.body?.total_amount || req.body?.totalAmount || 0),
        currency: text(req.body?.currency || "KES", 10),
      };
      if (!payload.family_name) return res.status(400).json({ error: "Family name is required." });
      const { data, error } = await supabaseAdmin.from("vendor_bookings").insert(payload).select("*").single();
      if (error) throw error;
      clearApiCache();
      publishRealtime({ type: "vendor_booking_created", orgId: vendorId, payload: data });
      res.json({ booking: data });
    } catch (error: any) {
      res.status(error.message?.includes("Upgrade") || error.message?.includes("paid") ? 402 : 500).json({ error: error.message || "Could not create booking." });
    }
  });

  app.patch("/api/vendor-erp/bookings/:bookingId", deps.rateLimit("vendor-erp-update-booking", 60), async (req, res) => {
    try {
      const actor = await deps.requireActor(req);
      assertPaidVendorAccess(actor);
      const vendorId = vendorIdFor(actor);
      if (!isVendorOwner(actor) && !isCoordinator(actor)) return res.status(403).json({ error: "Only vendor owner or coordinator can update bookings." });
      const payload: any = { updated_at: new Date().toISOString() };
      ["status", "notes", "event_type", "event_date", "pickup_location", "destination_location", "total_amount", "currency"].forEach((key) => { if (req.body?.[key] !== undefined) payload[key] = req.body[key]; });
      if (req.body?.equipment_needed) payload.equipment_needed = jsonArray(req.body.equipment_needed);
      if (req.body?.services_needed) payload.services_needed = jsonArray(req.body.services_needed);
      const { data, error } = await supabaseAdmin.from("vendor_bookings").update(payload).eq("id", req.params.bookingId).eq("vendor_id", vendorId).select("*").single();
      if (error) throw error;
      clearApiCache();
      publishRealtime({ type: "vendor_booking_updated", orgId: vendorId, payload: data });
      res.json({ booking: data });
    } catch (error: any) {
      res.status(error.message?.includes("Upgrade") || error.message?.includes("paid") ? 402 : 500).json({ error: error.message || "Could not update booking." });
    }
  });

  app.delete("/api/vendor-erp/bookings/:bookingId", deps.rateLimit("vendor-erp-delete-booking", 20), async (req, res) => {
    try {
      const actor = await deps.requireActor(req);
      assertPaidVendorAccess(actor);
      if (!isVendorOwner(actor)) return res.status(403).json({ error: "Only vendor owner can delete bookings." });
      const vendorId = vendorIdFor(actor);
      const { error } = await supabaseAdmin.from("vendor_bookings").delete().eq("id", req.params.bookingId).eq("vendor_id", vendorId);
      if (error) throw error;
      clearApiCache();
      publishRealtime({ type: "vendor_booking_deleted", orgId: vendorId, payload: { id: req.params.bookingId } });
      res.json({ ok: true });
    } catch (error: any) {
      res.status(error.message?.includes("Upgrade") || error.message?.includes("paid") ? 402 : 500).json({ error: error.message || "Could not delete booking." });
    }
  });

  app.get("/api/vendor-erp/inventory", deps.rateLimit("vendor-erp-inventory", 120), responseCacheMiddleware(10_000), async (req, res) => {
    try {
      const actor = await deps.requireActor(req);
      assertPaidVendorAccess(actor);
      const vendorId = vendorIdFor(actor);
      const { data, error } = await supabaseAdmin.from("vendor_inventory_items").select("*").eq("vendor_id", vendorId).order("category").order("item_name");
      if (error) throw error;
      res.json({ inventory: data || [] });
    } catch (error: any) {
      res.status(error.message?.includes("Upgrade") || error.message?.includes("paid") ? 402 : 500).json({ error: error.message || "Could not load inventory." });
    }
  });

  app.post("/api/vendor-erp/inventory", deps.rateLimit("vendor-erp-inventory-save", 40), async (req, res) => {
    try {
      const actor = await deps.requireActor(req);
      assertPaidVendorAccess(actor);
      if (!isVendorOwner(actor)) return res.status(403).json({ error: "Only vendor owner can manage inventory." });
      const vendorId = vendorIdFor(actor);
      const payload = {
        vendor_id: vendorId,
        item_name: text(req.body?.item_name || req.body?.itemName, 120),
        category: text(req.body?.category || "equipment", 80),
        description: text(req.body?.description, 500),
        quantity_total: Number(req.body?.quantity_total || req.body?.quantityTotal || 0),
        quantity_available: Number(req.body?.quantity_available || req.body?.quantityAvailable || req.body?.quantity_total || 0),
        unit_price: Number(req.body?.unit_price || req.body?.unitPrice || 0),
        currency: text(req.body?.currency || "KES", 10),
        condition: text(req.body?.condition || "good", 40),
        active: req.body?.active !== false,
        metadata: req.body?.metadata || {},
      };
      if (!payload.item_name) return res.status(400).json({ error: "Item name is required." });
      const { data, error } = await supabaseAdmin.from("vendor_inventory_items").insert(payload).select("*").single();
      if (error) throw error;
      clearApiCache();
      publishRealtime({ type: "vendor_inventory_updated", orgId: vendorId, payload: data });
      res.json({ item: data });
    } catch (error: any) {
      res.status(error.message?.includes("Upgrade") || error.message?.includes("paid") ? 402 : 500).json({ error: error.message || "Could not save inventory item." });
    }
  });

  app.post("/api/vendor-erp/bookings/:bookingId/tasks", deps.rateLimit("vendor-erp-task-create", 60), async (req, res) => {
    try {
      const actor = await deps.requireActor(req);
      assertPaidVendorAccess(actor);
      if (!isVendorOwner(actor) && !isCoordinator(actor)) return res.status(403).json({ error: "Only vendor owner or coordinator can assign tasks." });
      const vendorId = vendorIdFor(actor);
      const assignedTo = text(req.body?.assigned_to || req.body?.assignedTo, 80);
      const payload = {
        booking_id: req.params.bookingId,
        vendor_id: vendorId,
        assigned_to: assignedTo || null,
        assigned_by: actor.id,
        role: text(req.body?.role || "staff", 40),
        title: text(req.body?.title, 160),
        description: text(req.body?.description, 1000),
        due_at: req.body?.due_at || req.body?.dueAt || null,
        status: "pending",
      };
      if (!payload.title) return res.status(400).json({ error: "Task title is required." });
      const { data, error } = await supabaseAdmin.from("vendor_booking_tasks").insert(payload).select("*").single();
      if (error) throw error;
      clearApiCache();
      publishRealtime({ type: "vendor_task_assigned", orgId: vendorId, userId: assignedTo || undefined, payload: data });
      if (assignedTo) await notifyStaff(deps, assignedTo, "New vendor task assigned", payload.title, `/marketplace/vendor-erp/bookings/${req.params.bookingId}`);
      res.json({ task: data });
    } catch (error: any) {
      res.status(error.message?.includes("Upgrade") || error.message?.includes("paid") ? 402 : 500).json({ error: error.message || "Could not create task." });
    }
  });

  app.patch("/api/vendor-erp/tasks/:taskId", deps.rateLimit("vendor-erp-task-update", 80), async (req, res) => {
    try {
      const actor = await deps.requireActor(req);
      assertPaidVendorAccess(actor);
      const vendorId = vendorIdFor(actor);
      const { data: task, error: taskError } = await supabaseAdmin.from("vendor_booking_tasks").select("*").eq("id", req.params.taskId).eq("vendor_id", vendorId).maybeSingle();
      if (taskError) throw taskError;
      if (!task) return res.status(404).json({ error: "Task not found." });
      const canUpdate = isVendorOwner(actor) || isCoordinator(actor) || task.assigned_to === actor.id;
      if (!canUpdate) return res.status(403).json({ error: "You can only update your assigned tasks." });
      const status = text(req.body?.status || task.status, 40);
      const payload: any = { status, notes: req.body?.notes !== undefined ? text(req.body.notes, 1000) : task.notes, updated_at: new Date().toISOString() };
      if (status === "in_progress" && !task.started_at) payload.started_at = new Date().toISOString();
      if (status === "completed") payload.completed_at = new Date().toISOString();
      const { data, error } = await supabaseAdmin.from("vendor_booking_tasks").update(payload).eq("id", req.params.taskId).select("*").single();
      if (error) throw error;
      clearApiCache();
      publishRealtime({ type: "vendor_task_updated", orgId: vendorId, payload: data });
      if (data.assigned_by && data.assigned_by !== actor.id) await notifyStaff(deps, data.assigned_by, "Vendor task updated", `${data.title} is now ${data.status}.`, `/marketplace/vendor-erp/bookings/${data.booking_id}`);
      res.json({ task: data });
    } catch (error: any) {
      res.status(error.message?.includes("Upgrade") || error.message?.includes("paid") ? 402 : 500).json({ error: error.message || "Could not update task." });
    }
  });

  app.get("/api/vendor-erp/bookings/:bookingId/messages", deps.rateLimit("vendor-erp-chat-read", 120), responseCacheMiddleware(5_000), async (req, res) => {
    try {
      const actor = await deps.requireActor(req);
      assertPaidVendorAccess(actor);
      const vendorId = vendorIdFor(actor);
      const { data, error } = await supabaseAdmin.from("vendor_booking_messages").select("*").eq("booking_id", req.params.bookingId).eq("vendor_id", vendorId).order("created_at", { ascending: true }).limit(200);
      if (error) throw error;
      res.json({ messages: data || [] });
    } catch (error: any) {
      res.status(error.message?.includes("Upgrade") || error.message?.includes("paid") ? 402 : 500).json({ error: error.message || "Could not load booking chat." });
    }
  });

  app.post("/api/vendor-erp/bookings/:bookingId/messages", deps.rateLimit("vendor-erp-chat-send", 80), async (req, res) => {
    try {
      const actor = await deps.requireActor(req);
      assertPaidVendorAccess(actor);
      const vendorId = vendorIdFor(actor);
      const body = text(req.body?.body || req.body?.message, 2000);
      if (!body) return res.status(400).json({ error: "Message is required." });
      const payload = { booking_id: req.params.bookingId, vendor_id: vendorId, sender_id: actor.id, body, attachment_url: text(req.body?.attachment_url || req.body?.attachmentUrl, 500), attachment_name: text(req.body?.attachment_name || req.body?.attachmentName, 200) };
      const { data, error } = await supabaseAdmin.from("vendor_booking_messages").insert(payload).select("*").single();
      if (error) throw error;
      clearApiCache();
      publishRealtime({ type: "vendor_booking_message", orgId: vendorId, payload: data });
      res.json({ message: data });
    } catch (error: any) {
      res.status(error.message?.includes("Upgrade") || error.message?.includes("paid") ? 402 : 500).json({ error: error.message || "Could not send booking message." });
    }
  });
}
