import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const p = (file) => path.join(root, file);
const read = (file) => fs.existsSync(p(file)) ? fs.readFileSync(p(file), "utf8") : "";
const write = (file, content) => fs.writeFileSync(p(file), content);

function patchServer() {
  const file = "server/index.ts";
  let src = read(file);
  if (!src) return;

  if (!src.includes('from "./security"')) {
    src = src.replace('import { emailService } from "./services/email-service";', 'import { emailService } from "./services/email-service";\nimport { securityHeaders, requireApiAuthentication, genericErrorHandler, auditEvent } from "./security";');
  }

  src = src.replace('app.disable("x-powered-by");\napp.set("trust proxy", 1);', 'app.disable("x-powered-by");\napp.set("trust proxy", 1);\napp.use(securityHeaders);');

  if (!src.includes('app.use(requireApiAuthentication())')) {
    src = src.replace('app.use("/api", rateLimit("api-global", 240, 15 * 60_000));', 'app.use("/api", rateLimit("api-global", 240, 15 * 60_000));\napp.use(requireApiAuthentication());');
  }

  src = src.replace('res.status(500).json({ error: error.message || "Could not send verification code." });', 'res.status(500).json({ error: "Could not send verification code." });');
  src = src.replace('res.status(500).json({ error: error.message || "Could not send campaign." });', 'res.status(500).json({ error: "Could not send campaign." });');

  src = src.replace('res.json({ ok: true, sent: true });', 'await auditEvent(req as any, "auth.otp.sent", "success", { purpose });\n    res.json({ ok: true, sent: true });');
  src = src.replace('res.json(result);', 'await auditEvent(req as any, "auth.otp.verified", "success", { purpose });\n    res.json(result);');
  src = src.replace('res.status(400).json({ error: error.message || "Could not verify code." });', 'res.status(400).json({ error: "Could not verify code." });');

  if (!src.includes('app.use(genericErrorHandler);')) {
    src = src.replace('loadOptionalBackend();\n\nserver.listen', 'loadOptionalBackend();\napp.use(genericErrorHandler);\n\nserver.listen');
  }

  write(file, src);
}

function patchGitignore() {
  const file = ".gitignore";
  let src = read(file);
  const additions = `\n# Security-sensitive files\n*.pem\n*.key\n*.crt\n*.p12\n*.pfx\n*.jks\nsecrets.*\n**/secrets/**\n.envrc\n.env.production\n.env.staging\n.env.development.local\n.npmrc\n.pnpmrc\n*.sqlite\n*.db\n`;
  if (!src.includes("# Security-sensitive files")) src += additions;
  write(file, src);
}

function patchDockerfile() {
  const file = "Dockerfile";
  let src = read(file);
  if (!src) return;
  if (!src.includes("adduser -S struta")) {
    src = src.replace('RUN corepack enable && corepack prepare pnpm@10.25.0 --activate', 'RUN corepack enable && corepack prepare pnpm@10.25.0 --activate && addgroup -S struta && adduser -S struta -G struta');
  }
  if (!src.includes('chown -R struta:struta /app')) {
    src = src.replace('RUN pnpm run build', 'RUN pnpm run build && chown -R struta:struta /app');
  }
  if (!src.includes('\nUSER struta\n')) {
    src = src.replace('EXPOSE 8081', 'USER struta\n\nEXPOSE 8081');
  }
  write(file, src);
}

function patchPackage() {
  const file = "package.json";
  const pkg = JSON.parse(read(file));
  pkg.scripts ||= {};
  pkg.scripts["security:audit"] = pkg.scripts["security:audit"] || "pnpm audit --audit-level moderate";
  pkg.scripts["security:secrets"] = pkg.scripts["security:secrets"] || "gitleaks detect --source . --redact --verbose";
  pkg.scripts["security:check"] = pkg.scripts["security:check"] || "pnpm run security:audit";
  write(file, `${JSON.stringify(pkg, null, 2)}\n`);
}

patchServer();
patchGitignore();
patchDockerfile();
patchPackage();
