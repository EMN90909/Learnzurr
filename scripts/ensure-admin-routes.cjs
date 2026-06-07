const fs = require("node:fs");
const path = require("node:path");

const indexPath = path.resolve(process.cwd(), "server/index.ts");
let src = fs.readFileSync(indexPath, "utf8");

const hasDynamicAdminRegistration = src.includes('import("./routes/adminCompatRoutes")') && src.includes("registerAdminCompatRoutes(app as any");
const hasRealRouteDeps = src.includes("const routeDeps = { requireActor, requireAdmin, rateLimit, insertNotificationSafe, sendInvoiceEmail, stripe: null }");

if (!hasDynamicAdminRegistration) {
  if (!src.includes('import { registerAdminCompatRoutes } from "./routes/adminCompatRoutes";')) {
    src = src.replace(
      'import authSecurityRoutes from "./routes/authSecurityRoutes";',
      'import authSecurityRoutes from "./routes/authSecurityRoutes";\nimport { registerAdminCompatRoutes } from "./routes/adminCompatRoutes";\nimport { getAuthenticatedActor } from "./auth";',
    );
  }

  if (!src.includes("const requireActor = async")) {
    src = src.replace(
      'const htmlToText = (html: string) => String(html || "").replace(/<style[\\s\\S]*?<\\/style>/gi, " ").replace(/<script[\\s\\S]*?<\\/script>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\\s+/g, " ").trim();',
      'const htmlToText = (html: string) => String(html || "").replace(/<style[\\s\\S]*?<\\/style>/gi, " ").replace(/<script[\\s\\S]*?<\\/script>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\\s+/g, " ").trim();\nconst requireActor = async (req: express.Request) => { const actor = await getAuthenticatedActor(req); if (!actor) throw new Error("Authentication required."); return actor; };',
    );
  }

  if (!src.includes("registerAdminCompatRoutes(app, { requireActor, rateLimit });")) {
    src = src.replace(
      'app.use("/api/auth/security", authSecurityRoutes);',
      'app.use("/api/auth/security", authSecurityRoutes);\nregisterAdminCompatRoutes(app, { requireActor, rateLimit });',
    );
  }
}

if (!hasRealRouteDeps) {
  src = src.replace('requireActor: async () => null, requireAdmin: async () => null', 'requireActor, requireAdmin: requireActor');
}

fs.writeFileSync(indexPath, src);
console.log("[startup] admin and production routes registered");
