import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const p = (file) => path.join(root, file);
const read = (file) => fs.existsSync(p(file)) ? fs.readFileSync(p(file), "utf8") : "";
const write = (file, content) => fs.writeFileSync(p(file), content);

const appFile = "src/App.tsx";
let app = read(appFile);
if (app) {
  if (!app.includes('FamilyCreate from "./features/bereaved/pages/Create"')) {
    app = app.replace('import FamilyBillingPage from "./features/bereaved/pages/Billing";', 'import FamilyBillingPage from "./features/bereaved/pages/Billing";\nimport FamilyCreate from "./features/bereaved/pages/Create";');
  }
  if (!app.includes('path="/family/create"')) {
    app = app.replace('<Route path="/family" element={<ProtectedRoute allowedRoles={["family"]}><FamilyDashboard /></ProtectedRoute>} />', '<Route path="/family" element={<ProtectedRoute allowedRoles={["family"]}><FamilyDashboard /></ProtectedRoute>} /><Route path="/family/create" element={<ProFeatureRoute><FamilyCreate /></ProFeatureRoute>} />');
  }
  write(appFile, app);
}

const hardening = p("scripts/family-pro-suite.mjs");
if (fs.existsSync(hardening)) await import(pathToFileURL(hardening).href);
