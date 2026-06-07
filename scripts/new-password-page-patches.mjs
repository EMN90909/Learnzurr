import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const write = (file, content) => fs.writeFileSync(path.join(root, file), content);

function patchAuthHelper() {
  const file = "src/lib/auth.ts";
  let src = read(file);
  src = src.replace(
    'export const getResetPasswordUrl = () => `${getBaseUrl()}/accounts/newpsw`;',
    'export const getResetPasswordUrl = () => `${getAuthCallbackUrl()}?next=${encodeURIComponent("/accounts/newpsw")}&type=recovery`;'
  );
  write(file, src);
}

function patchAppRoute() {
  const file = "src/App.tsx";
  let src = read(file);
  src = src.replace(
    '<Route path="/reset-password" element={<ResetPassword />} />',
    '<Route path="/reset-password" element={<Navigate to="/accounts/newpsw" replace />} /><Route path="/accounts/newpsw" element={<ResetPassword />} />'
  );
  write(file, src);
}

function patchResetPage() {
  const file = "src/features/auth/pages/ResetPassword.tsx";
  let src = read(file);
  src = src.replace('Password must be at least 6 characters long.', 'Password must be at least 8 characters long.');
  src = src.replace('if (password.length < 6)', 'if (password.length < 8)');
  src = src.replace('Reset password', 'Create a new password');
  src = src.replace('Choose a new password for your Struta account.', 'Choose a new password for your Struta account. You cannot reuse your previous password.');
  src = src.replace('showError(error.message || "Failed to reset password.");', 'showError(String(error.message || "").toLowerCase().includes("same") || String(error.message || "").toLowerCase().includes("different") ? "You cannot reuse your previous password. Choose a different password." : error.message || "Failed to reset password.");');
  write(file, src);
}

patchAuthHelper();
patchAppRoute();
patchResetPage();
console.log("[new-password-page-patches] reset links route through auth callback and /accounts/newpsw.");
