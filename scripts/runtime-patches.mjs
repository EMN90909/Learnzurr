import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const write = (file, content) => fs.writeFileSync(path.join(root, file), content);

function patchIndex() {
  const file = "server/index.ts";
  let src = read(file);
  if (!src.includes('import { supabaseAdmin } from "./supabase-admin";')) {
    src = src.replace('import { fileURLToPath } from "node:url";', 'import { fileURLToPath } from "node:url";\nimport { supabaseAdmin } from "./supabase-admin";');
  }
  if (!src.includes('import { registerAdminCompatRoutes } from "./routes/adminCompatRoutes";')) {
    src = src.replace('import { registerVendorErpRoutes } from "./routes/vendorErpRoutes";', 'import { registerVendorErpRoutes } from "./routes/vendorErpRoutes";\nimport { registerAdminCompatRoutes } from "./routes/adminCompatRoutes";');
  }
  if (!src.includes('import { startDailyModerationScheduler } from "./moderation/dailyScheduler";')) {
    src = src.replace('import { registerAdminCompatRoutes } from "./routes/adminCompatRoutes";', 'import { registerAdminCompatRoutes } from "./routes/adminCompatRoutes";\nimport { startDailyModerationScheduler } from "./moderation/dailyScheduler";');
  }
  if (!src.includes("registerAdminCompatRoutes(app, { requireActor, rateLimit });")) {
    src = src.replace('registerProductionRoutes(app, { requireActor, requireAdmin, rateLimit, insertNotificationSafe, sendInvoiceEmail, stripe });', 'registerAdminCompatRoutes(app, { requireActor, rateLimit });\nregisterProductionRoutes(app, { requireActor, requireAdmin, rateLimit, insertNotificationSafe, sendInvoiceEmail, stripe });');
  }
  if (!src.includes("startDailyModerationScheduler();")) {
    src = src.replace('server.listen(PORT, () => {', 'startDailyModerationScheduler();\n\nserver.listen(PORT, () => {');
  }
  src = patchInlineAi(src);
  write(file, src);
}

function patchInlineAi(src) { return src; }

function patchAppRoutes() {
  const file = "src/App.tsx";
  let src = read(file);
  src = src.replace('import Login from "./features/auth/pages/Login";', 'import Login from "./features/auth/pages/LoginPasswordOnly";');
  src = src.replace('import Login from "./features/auth/pages/LoginPasswordOnly";', 'import Login from "./features/auth/pages/LoginPasswordOnly";');
  src = src.replace('import type { StrutaNotification } from "./utils/notifications";\n', '');
  src = src.replace('import { NotificationCenter } from "./components/NotificationCenter";\n', 'import RealtimeNotifications from "./components/RealtimeNotifications";\n');
  src = src.replace(/const NotificationListener = \(\) => \{[\s\S]*?return <NotificationCenter notifications=\{notifications\} onDismiss=\{handleDismiss\} \/>; \};\n/, 'const NotificationListener = () => <RealtimeNotifications />;\n');
  src = src.replace('import EmbalmerDashboard from "./features/staff/pages/EmbalmerDashboard";', 'import EmbalmerDashboard from "./features/staff/pages/EmbalmerDashboard";\nimport SetupCrewDashboard from "./features/vendorstaffs/pages/SetupCrewDashboard";');
  src = src.replace('import CoordinatorDashboard from "./features/staff/pages/CoordinatorDashboard";', 'import CoordinatorDashboard from "./features/staff/pages/CoordinatorDashboard";\nimport VendorSecretaryDashboard from "./features/vendorstaffs/pages/SecretaryDashboard";\nimport VendorDriverDashboard from "./features/vendorstaffs/pages/DriverDashboard";\nimport VendorCoordinatorDashboard from "./features/vendorstaffs/pages/CoordinatorDashboard";');
  src = src.replace('const isErpStaff = ["Secretary", "Driver", "Embalmer", "Coordinator"].includes(userRole); if (isErpStaff && profile?.staff_business_type === "vendor") return <Navigate to="/marketplace" replace />;', 'const isErpStaff = ["Secretary", "Driver", "Embalmer", "Coordinator", "Setup Crew"].includes(userRole); if (isErpStaff && profile?.staff_business_type === "vendor") return <Navigate to="/marketplace" replace />;');
  src = src.replace('const isErpStaff = ["Secretary", "Driver", "Embalmer", "Coordinator"].includes(userRole); if (isErpStaff && profile?.staff_business_type !== "vendor") return <Navigate to="/operations" replace />;', 'const isErpStaff = ["Secretary", "Driver", "Coordinator", "Setup Crew"].includes(userRole); if (isErpStaff && profile?.staff_business_type !== "vendor") return <Navigate to="/operations" replace />;');
  src = src.replace('"Delivery / Setup team", "Inventory staff", "Accountant / Cashier"', '"Setup Crew", "Delivery / Setup team", "Inventory staff", "Accountant / Cashier"');
  src = src.replace('<Route path="/staff/auth" element={<StaffSignup />} />', '<Route path="/staff/login" element={<StaffSignup />} /><Route path="/staff/auth" element={<Navigate to="/staff/login" replace />} />');
  src = src.replaceAll('to="/staff/auth"', 'to="/staff/login"');
  src = src.replace('<Route path="/marketplace" element={<ProtectedRoute allowedRoles={["marketplace"]}><VendorDashboard /></ProtectedRoute>} /><Route path="/marketplace/secretary" element={<ProFeatureRoute redirectTo="/marketplace/billing"><SecretaryDashboard /></ProFeatureRoute>} /><Route path="/marketplace/driver" element={<ProFeatureRoute redirectTo="/marketplace/billing"><DriverDashboard /></ProFeatureRoute>} /><Route path="/marketplace/embalmer" element={<ProFeatureRoute redirectTo="/marketplace/billing"><EmbalmerDashboard /></ProFeatureRoute>} /><Route path="/marketplace/coordinator" element={<ProFeatureRoute redirectTo="/marketplace/billing"><CoordinatorDashboard /></ProFeatureRoute>} />', '<Route path="/marketplace" element={<ProtectedRoute allowedRoles={["marketplace"]}><VendorDashboard /></ProtectedRoute>} /><Route path="/marketplace/secretary" element={<ProFeatureRoute redirectTo="/marketplace/billing"><VendorSecretaryDashboard /></ProFeatureRoute>} /><Route path="/marketplace/driver" element={<ProFeatureRoute redirectTo="/marketplace/billing"><VendorDriverDashboard /></ProFeatureRoute>} /><Route path="/marketplace/setup-crew" element={<ProFeatureRoute redirectTo="/marketplace/billing"><SetupCrewDashboard /></ProFeatureRoute>} /><Route path="/marketplace/coordinator" element={<ProFeatureRoute redirectTo="/marketplace/billing"><VendorCoordinatorDashboard /></ProFeatureRoute>} />');
  write(file, src);
}

function patchProductionRoutes() {}
function patchAdminDataRoutes() {}
function patchBillingPayPal() {}
function patchJamila() {}
function patchPlanningBoardLayout(file) {
  let src = read(file);
  src = src.replaceAll('className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-0"', 'className="h-full min-h-0"');
  src = src.replaceAll('className="lg:col-span-2 space-y-6 overflow-y-auto pr-2"', 'className="space-y-6 overflow-y-auto pr-0 md:pr-2 max-w-5xl mx-auto pb-6"');
  src = src.replaceAll(`\n\n                    {/* Right Side Chat Panel */}\n                    <div className="lg:col-span-1 h-full min-h-[400px]">\n                      {renderChatPanel()}\n                    </div>`, "");
  write(file, src);
}
function patchPlanningBoards() { patchPlanningBoardLayout("src/components/MySentRequests.tsx"); patchPlanningBoardLayout("src/components/ProviderRequests.tsx"); }
function patchAuthProviderNoOtp() {
  const file = "src/components/auth/AuthProvider.tsx";
  let src = read(file);
  src = src.replace('const OTP_PENDING_KEY = "struta_pending_signin_otp";\n', '');
  src = src.replace(/const pendingOtpEmail = \(\) => \{[\s\S]*?\};\nconst readStaffSession/, 'const readStaffSession');
  src = src.replace('      const pendingEmail = pendingOtpEmail();\n', '      try { localStorage.removeItem("struta_pending_signin_otp"); } catch {}\n');
  src = src.replace(/ if \(pendingEmail && supabaseSession\?\.user\?\.email\?\.toLowerCase\(\) === pendingEmail\) \{[\s\S]*?return; \}/, '');
  src = src.replace('    const handleStorage = (event: StorageEvent) => { if (event.key === OTP_PENDING_KEY && event.newValue) void resetAuthState(); };\n', '');
  src = src.replace('    window.addEventListener("storage", handleStorage);\n', '');
  src = src.replace(/ const pendingEmail = pendingOtpEmail\(\); if \(pendingEmail && session\?\.user\?\.email\?\.toLowerCase\(\) === pendingEmail\) \{[\s\S]*?return; \}/, '');
  src = src.replace('window.removeEventListener("storage", handleStorage); ', '');
  src = src.replace('localStorage.removeItem(OTP_PENDING_KEY); ', 'localStorage.removeItem("struta_pending_signin_otp"); ');
  write(file, src);
}

patchIndex();
patchAppRoutes();
patchProductionRoutes();
patchAdminDataRoutes();
patchBillingPayPal();
patchJamila();
patchPlanningBoards();
patchAuthProviderNoOtp();
