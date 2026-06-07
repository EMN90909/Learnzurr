import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const p = (file) => path.join(root, file);
const read = (file) => fs.existsSync(p(file)) ? fs.readFileSync(p(file), "utf8") : "";
const write = (file, content) => fs.writeFileSync(p(file), content);

function patchAppRoutes() {
  const file = "src/App.tsx";
  let src = read(file);
  if (!src) return;

  if (!src.includes('ProviderSettingsGate')) {
    src = src.replace(
      'import ManagerBillingPage from "./features/manager/pages/Billing";',
      'import ManagerBillingPage from "./features/manager/pages/Billing";\nimport ProviderSettingsGate from "./features/manager/pages/ProviderSettingsGate";'
    );
  }

  src = src.replace(
    '<Route path="/operations/settings" element={<ProtectedRoute allowedRoles={["operations"]}><OperationsSettings /></ProtectedRoute>} />',
    '<Route path="/operations/settings" element={<ProtectedRoute allowedRoles={["operations"]}><ProviderSettingsGate portalType="operations" /></ProtectedRoute>} />'
  );

  src = src.replace(
    '<Route path="/marketplace/settings" element={<ProtectedRoute allowedRoles={["marketplace"]}><VendorSettings /></ProtectedRoute>} />',
    '<Route path="/marketplace/settings" element={<ProtectedRoute allowedRoles={["marketplace"]}><ProviderSettingsGate portalType="marketplace" /></ProtectedRoute>} />'
  );

  write(file, src);
}

function patchStaffNavHard() {
  const file = "src/components/layout/PortalLayout.tsx";
  let src = read(file);
  if (!src) return;
  src = src.replace(
    'if (isStaffSession && item.hiddenForStaff) return false;',
    'if (isStaffSession && item.hiddenForStaff) return false; if (isStaffSession && item.label === "Staff") return false;'
  );
  write(file, src);
}

function patchBereavedReferralSignup() {
  const file = "src/features/bereaved/pages/Signup.tsx";
  let src = read(file);
  if (!src) return;
  src = src.replace('import React, { useState } from "react";', 'import React, { useEffect, useState } from "react";');
  src = src.replace('import { useNavigate, Link } from "react-router-dom";', 'import { useNavigate, Link, useSearchParams } from "react-router-dom";');
  src = src.replace('import { convertStoredReferral, getStoredReferralCode } from "@/lib/referrals";', 'import { captureReferralFromUrl, convertStoredReferral, getStoredReferralCode } from "@/lib/referrals";');
  src = src.replace('const [loading, setLoading] = useState(false);', 'const [searchParams] = useSearchParams();\n  const [loading, setLoading] = useState(false);');
  src = src.replace('const referralCode = getStoredReferralCode();', 'const referralCode = searchParams.get("ref") || searchParams.get("referral") || searchParams.get("r") || getStoredReferralCode();\n\n  useEffect(() => { void captureReferralFromUrl(); }, []);');
  src = src.replace('active: true,', 'referred_by: referralCode || null,\n        referral_code_used: referralCode || null,\n        active: true,');
  write(file, src);
}

patchAppRoutes();
patchStaffNavHard();
patchBereavedReferralSignup();
