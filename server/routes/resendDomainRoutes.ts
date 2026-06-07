import type express from "express";
import { resendDomainService } from "../services/resend-domain-service";
import type { ServerActor } from "../auth";

const clean = (value: unknown, max = 200) => String(value || "").trim().slice(0, max);

type Deps = {
  requireAdmin: (req: express.Request) => Promise<ServerActor>;
  rateLimit: (name: string, max?: number, windowMs?: number) => express.RequestHandler;
};

export function registerResendDomainRoutes(app: express.Express, deps: Deps) {
  app.post("/api/admin/resend/domains", deps.rateLimit("admin-resend-domain-create", 20, 60 * 60_000), async (req, res) => {
    try { await deps.requireAdmin(req); res.json(await resendDomainService.create(clean(req.body?.name || "struta.top", 120))); }
    catch (error: any) { res.status(error.message?.includes("Admin") ? 403 : 500).json({ error: error.message || "Could not create Resend domain." }); }
  });

  app.get("/api/admin/resend/domains", deps.rateLimit("admin-resend-domain-list", 60, 60 * 60_000), async (req, res) => {
    try { await deps.requireAdmin(req); res.json(await resendDomainService.list()); }
    catch (error: any) { res.status(error.message?.includes("Admin") ? 403 : 500).json({ error: error.message || "Could not list Resend domains." }); }
  });

  app.get("/api/admin/resend/domains/:id", deps.rateLimit("admin-resend-domain-get", 60, 60 * 60_000), async (req, res) => {
    try { await deps.requireAdmin(req); res.json(await resendDomainService.get(clean(req.params.id, 120))); }
    catch (error: any) { res.status(error.message?.includes("Admin") ? 403 : 500).json({ error: error.message || "Could not retrieve Resend domain." }); }
  });

  app.post("/api/admin/resend/domains/:id/verify", deps.rateLimit("admin-resend-domain-verify", 20, 60 * 60_000), async (req, res) => {
    try { await deps.requireAdmin(req); res.json(await resendDomainService.verify(clean(req.params.id, 120))); }
    catch (error: any) { res.status(error.message?.includes("Admin") ? 403 : 500).json({ error: error.message || "Could not verify Resend domain." }); }
  });

  app.patch("/api/admin/resend/domains/:id", deps.rateLimit("admin-resend-domain-update", 30, 60 * 60_000), async (req, res) => {
    try { await deps.requireAdmin(req); res.json(await resendDomainService.update({ ...(req.body || {}), id: clean(req.params.id, 120) })); }
    catch (error: any) { res.status(error.message?.includes("Admin") ? 403 : 500).json({ error: error.message || "Could not update Resend domain." }); }
  });

  app.delete("/api/admin/resend/domains/:id", deps.rateLimit("admin-resend-domain-delete", 10, 60 * 60_000), async (req, res) => {
    try { await deps.requireAdmin(req); res.json(await resendDomainService.remove(clean(req.params.id, 120))); }
    catch (error: any) { res.status(error.message?.includes("Admin") ? 403 : 500).json({ error: error.message || "Could not delete Resend domain." }); }
  });
}
