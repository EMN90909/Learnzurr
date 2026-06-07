import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const p = (file) => path.join(root, file);
const read = (file) => fs.existsSync(p(file)) ? fs.readFileSync(p(file), "utf8") : "";
const write = (file, content) => fs.writeFileSync(p(file), content);

function patchLogin() {
  const file = "src/features/auth/pages/Login.tsx";
  let src = read(file);
  if (!src) return;
  src = src.replace(/, AlertTriangle/g, "");
  src = src.replace(/const HCAPTCHA_SITE_KEY[\s\S]*?\.trim\(\);\n/g, "");
  src = src.replace(/\n\s*const \[captchaToken, setCaptchaToken\] = useState\(""\);\n\s*const captchaCallback = "onStrutaLoginCaptcha";/g, "");
  src = src.replace(/\n\s*useEffect\(\(\) => \{\n\s*if \(!HCAPTCHA_SITE_KEY\) return;[\s\S]*?\n\s*\}, \[\]\);/g, "");
  src = src.replace(/\n\s*if \(HCAPTCHA_SITE_KEY && !captchaToken\) return showError\("Complete hCAPTCHA before signing in\."\);/g, "");
  src = src.replace(/\n\s*const payload: any = \{ email: cleanEmail, password \};\n\s*if \(HCAPTCHA_SITE_KEY\) payload\.options = \{ captchaToken \};\n\s*const \{ error \} = await supabase\.auth\.signInWithPassword\(payload\);/g, "\n      const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });");
  src = src.replace(/\n\s*\{HCAPTCHA_SITE_KEY && <div className="flex justify-center[\s\S]*?<\/div>\}/g, "");
  src = src.replace(/\n\s*<div className="flex items-center gap-1\.5 mt-2[\s\S]*?<\/div>/g, "");
  write(file, src);
}

function patchProviderSetup() {
  const file = "src/features/provider/pages/ProviderAccountSetup.tsx";
  let src = read(file);
  if (!src) return;
  src = src.replace(/<div className="inline-flex rounded-\[2rem\][\s\S]*?">Struta<\/div>/g, '<div className="text-7xl xl:text-8xl font-black tracking-[-0.08em] leading-none text-[var(--ink)] dark:text-[#f6efe4] drop-shadow-sm">Struta</div>');
  src = src.replace(/<p className="text-xs font-black uppercase tracking-\[0\.24em\] text-\[var\(--gold\)\]">Struta<\/p>/g, '<div className="text-7xl xl:text-8xl font-black tracking-[-0.08em] leading-none text-[var(--ink)] dark:text-[#f6efe4] drop-shadow-sm">Struta</div>');
  src = src.replace(/<div className="rounded-\[2rem\] bg-\[var\(--clay-bg\)\][\s\S]*?A dignified digital presence for care providers\.<\/p><\/div>/g, '<p className="text-base font-bold text-[var(--muted)] dark:text-[#c8bda9] max-w-md">A dignified digital presence for East African care providers, built with calm onboarding, clear steps, and reliable tools.</p>');
  src = src.replace(/<div className="provider-setup-building[\s\S]*?<\/div>\n\s*<div className="relative z-10/g, '<div className="relative z-10');
  src = src.replace(/\n\s*<div className="provider-setup-orb[^>]*" \/>/g, "");
  src = src.replace(/className="relative z-10 w-full max-w-lg space-y-8"/g, 'className="relative z-10 w-full max-w-xl space-y-8"');
  src = src.replace(/className="text-5xl font-black tracking-tight text-\[var\(--ink\)\] dark:text-\[#f6efe4\]"/g, 'className="text-5xl xl:text-6xl font-black tracking-tight text-[var(--ink)] dark:text-[#f6efe4]"');
  write(file, src);
}

function patchCss() {
  const file = "src/globals.css";
  let css = read(file);
  const marker = "/* final subtle clay auth/setup polish */";
  if (!css || css.includes(marker)) return;
  css += `

${marker}
.provider-setup-shell .setup-art {
  background:
    linear-gradient(135deg, rgba(244,239,229,0.96), rgba(244,239,229,0.72)),
    var(--paper) !important;
}

.dark .provider-setup-shell .setup-art,
:root[data-theme="dark"] .provider-setup-shell .setup-art {
  background: linear-gradient(135deg, #0f0d0a, #181510) !important;
}

.provider-setup-shell .setup-panel {
  background: var(--surface) !important;
  box-shadow: inset 1px 0 0 rgba(255,255,255,0.22) !important;
}

.provider-setup-shell .setup-input,
.provider-setup-shell input,
.provider-setup-shell textarea,
.provider-setup-shell select {
  border-radius: 1.1rem !important;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.5), 0 10px 24px rgba(12,11,8,0.045) !important;
}

.provider-setup-shell .btn-struta-primary,
.provider-setup-shell .btn-struta-gold {
  box-shadow: 0 16px 34px rgba(12,11,8,0.13), inset 0 1px 0 rgba(255,255,255,0.35) !important;
}

.provider-setup-shell .rounded-2xl.border,
.provider-setup-shell .rounded-\[1\.7rem\],
.provider-setup-shell .rounded-\[1\.5rem\] {
  box-shadow: 0 16px 40px rgba(12,11,8,0.065), inset 0 1px 0 rgba(255,255,255,0.42) !important;
}
`;
  write(file, css);
}

patchLogin();
patchProviderSetup();
patchCss();
