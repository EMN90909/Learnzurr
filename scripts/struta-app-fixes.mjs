import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const p = (file) => path.join(root, file);
const read = (file) => fs.existsSync(p(file)) ? fs.readFileSync(p(file), "utf8") : "";
const write = (file, content) => fs.writeFileSync(p(file), content);

function patchApp() {
  const file = "src/App.tsx";
  let src = read(file);
  if (!src) return;
  if (!src.includes('path="/staff/login"')) src = src.replace('<Route path="/staff/auth" element={<StaffSignup />} />', '<Route path="/staff/auth" element={<StaffSignup />} /><Route path="/staff/login" element={<StaffSignup />} />');
  if (!src.includes('path="/signup/family"')) src = src.replace('<Route path="/signup/bereaved" element={<SignupBereaved />} />', '<Route path="/signup/family" element={<SignupBereaved />} /><Route path="/signup/bereaved" element={<SignupBereaved />} />');
  if (!src.includes('ProviderSetup')) src = src.replace('import PaymentError from "./pages/PaymentError";', 'import PaymentError from "./pages/PaymentError";\nimport ProviderSetup from "./pages/ProviderSetup";');
  if (!src.includes('path="/provider/setup"')) src = src.replace('<Route path="/payment-error" element={<PaymentError />} />', '<Route path="/payment-error" element={<PaymentError />} /><Route path="/provider/setup" element={<ProviderSetup />} />');
  if (!src.includes('path="/signin-link"')) src = src.replace('<Route path="/forgot-password" element={<ForgotPassword />} />', '<Route path="/signin-link" element={<ForgotPassword />} /><Route path="/forgot-password" element={<ForgotPassword />} />');
  src = src.replace(/<Route path="\/family\/billing"[^>]*>.*?<\/Route>/g, '<Route path="/family/billing" element={<Navigate to="/family" replace />} />');
  src = src.replace(/<Route path="\/(operations|marketplace|admin)\/integrations"[^>]*>.*?<\/Route>/g, "");
  src = src.replace(/<Route path="\/(operations|marketplace|admin)\/integrations"[^/]*\/?>/g, "");
  write(file, src);
}

function patchProviderSignupRedirects() {
  for (const file of ["src/features/funeral-home/pages/Signup.tsx", "src/features/marketplace/pages/Signup.tsx"]) {
    let src = read(file);
    if (!src) continue;
    src = src.replace('showSuccess("Home registered successfully! Please sign in.");\n      navigate("/login", { replace: true });', 'showSuccess("Home registered successfully! Finish setting up your listing.");\n      navigate("/provider/setup", { replace: true });');
    src = src.replace('showSuccess("Vendor registered successfully! Please sign in.");\n      navigate("/login", { replace: true });', 'showSuccess("Vendor registered successfully! Finish setting up your listing.");\n      navigate("/provider/setup", { replace: true });');
    write(file, src);
  }
}

patchApp();
patchProviderSignupRedirects();

for (const patch of [
  "scripts/paypal-order-checkout-patch.mjs",
  "scripts/signin-refuse-unknown-and-remove-family-premium.mjs",
  "scripts/admin-users-delete-speed.mjs",
  "scripts/email-signin-link-only.mjs",
  "scripts/route-email-link-settings-fixes.mjs",
  "scripts/country-picker-phone-formats.mjs",
  "scripts/phone-country-cleanup-settings.mjs",
  "scripts/provider-inbuilt-otp-final.mjs",
  "scripts/africa-provider-services.mjs",
  "scripts/final-family-provider-fixes.mjs",
  "scripts/auth-setup-version-polish.mjs",
  "scripts/final-ui-auth-fixes.mjs",
  "scripts/professional-setup-ui.mjs",
  "scripts/remove-glass-and-phone-country.mjs"
]) {
  const fullPath = p(patch);
  if (fs.existsSync(fullPath)) await import(pathToFileURL(fullPath).href);
}
