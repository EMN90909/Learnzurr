const fs = require("node:fs");
const path = require("node:path");

const distDir = path.resolve(process.cwd(), "dist");
const outFile = path.join(distDir, "env.js");

const publicEnv = {
  VITE_SUPABASE_URL:
    process.env.VITE_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "",
  VITE_SUPABASE_ANON_KEY:
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    "",
  VITE_PAYSTACK_PUBLIC_KEY:
    process.env.VITE_PAYSTACK_PUBLIC_KEY ||
    process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ||
    process.env.PAYSTACK_PUBLIC_KEY ||
    "",
  VITE_HCAPTCHA_SITEKEY:
    process.env.VITE_HCAPTCHA_SITEKEY ||
    process.env.NEXT_PUBLIC_HCAPTCHA_SITEKEY ||
    process.env.HCAPTCHA_SITEKEY ||
    "",
};

fs.mkdirSync(distDir, { recursive: true });
fs.writeFileSync(
  outFile,
  `window.__STRUTA_ENV__ = ${JSON.stringify(publicEnv, null, 2)};\n`,
  "utf8",
);

const configured = Object.entries(publicEnv)
  .filter(([, value]) => Boolean(value))
  .map(([key]) => key);

console.log(`[runtime-env] wrote ${path.relative(process.cwd(), outFile)} (${configured.length} configured)`);
if (!publicEnv.VITE_SUPABASE_URL || !publicEnv.VITE_SUPABASE_ANON_KEY) {
  console.warn("[runtime-env] Supabase frontend env is incomplete. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Render.");
}
