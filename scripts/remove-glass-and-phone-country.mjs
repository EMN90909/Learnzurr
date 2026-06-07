import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const cssPath = path.join(root, "src/globals.css");
const signupPath = path.join(root, "src/features/bereaved/pages/Signup.tsx");

if (fs.existsSync(cssPath)) {
  let css = fs.readFileSync(cssPath, "utf8");
  const marker = "/* remove glassmorphism and floating orbs */";
  if (!css.includes(marker)) {
    css += `

${marker}
*, *::before, *::after {
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

.clay-surface,
.clay-surface-soft,
.clay-inset,
.card-struta,
.liquid-glass-header,
.nav-struta,
header,
aside,
.sticky.top-0,
[data-radix-popper-content-wrapper] > *,
[role="dialog"],
[role="menu"],
[role="listbox"] {
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

.provider-setup-orb,
.setup-orb,
[class*="orb"],
[class*="floating-orb"],
[class*="glass-orb"] {
  display: none !important;
  animation: none !important;
}

.provider-setup-shell .setup-art {
  background: var(--paper) !important;
}

.provider-setup-shell .setup-art::before,
.provider-setup-shell .setup-art::after {
  display: none !important;
}

@keyframes setupFloat { from { transform: none; opacity: 0; } to { transform: none; opacity: 0; } }
@keyframes providerSetupFloat { from { transform: none; opacity: 0; } to { transform: none; opacity: 0; } }
`;
  }
  fs.writeFileSync(cssPath, css);
}

if (fs.existsSync(signupPath)) {
  let src = fs.readFileSync(signupPath, "utf8");

  if (!src.includes("detectPhoneCountry")) {
    src = src.replace(
      'const isValidEmail = (email: string) => /^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/.test(email.trim());',
      'const isValidEmail = (email: string) => /^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/.test(email.trim());\n\nconst phoneCountries = [\n  { name: "Kenya", code: "254", example: "+254 xxx xxx xxx" },\n  { name: "Uganda", code: "256", example: "+256 xxx xxx xxx" },\n  { name: "Tanzania", code: "255", example: "+255 xxx xxx xxx" },\n  { name: "Rwanda", code: "250", example: "+250 xxx xxx xxx" },\n];\n\nconst detectPhoneCountry = (value: string) => {\n  const digits = value.replace(/\\D/g, "");\n  const normalized = digits.startsWith("00") ? digits.slice(2) : digits;\n  return phoneCountries.find((country) => normalized.startsWith(country.code)) || null;\n};'
    );
  }

  src = src.replace(
    /const formatRegionalPhone = \(value: string, country = "Kenya"\) => \{[\s\S]*?\n\};/,
    'const formatRegionalPhone = (value: string, country = "Kenya") => {\n  const detected = detectPhoneCountry(value);\n  const digits = value.replace(/\\D/g, "");\n  const countryName = (detected?.name || country).toLowerCase();\n  const code = detected?.code || (countryName.includes("uganda") ? "256" : countryName.includes("tanzania") ? "255" : countryName.includes("rwanda") ? "250" : "254");\n  let local = digits.startsWith("00") ? digits.slice(2) : digits;\n  if (local.startsWith(code)) local = local.slice(code.length);\n  if (local.startsWith("0")) local = local.slice(1);\n  local = local.slice(0, 9);\n  const groups = [local.slice(0, 3), local.slice(3, 6), local.slice(6, 9)].filter(Boolean).join(" ");\n  return (`+${code}${groups ? " " + groups : ""}`).trim();\n};'
  );

  src = src.replace(
    'const [formData, setFormData] = useState({ name: "", email: "", password: "", phone: "" });',
    'const [formData, setFormData] = useState({ name: "", email: "", password: "", phone: "" });\n  const detectedPhoneCountry = detectPhoneCountry(formData.phone);'
  );

  src = src.replace(
    'const formattedPhone = formatRegionalPhone(formData.phone, location.country || "Kenya");',
    'const phoneCountry = detectedPhoneCountry?.name || location.country || "Kenya";\n      const formattedPhone = formatRegionalPhone(formData.phone, phoneCountry);'
  );

  src = src.replace('country: location.country || "Kenya",', 'country: phoneCountry,');

  src = src.replace(
    '<div className="space-y-2"><Label htmlFor="phone" className="flex gap-1">Phone Number <Required /></Label><Input id="phone" type="tel" placeholder="+254 712 345 678" required disabled={!isSupported} value={formData.phone} onBlur={(e) => setFormData({ ...formData, phone: formatRegionalPhone(e.target.value, location.country || "Kenya") })} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /><p className="text-[10px] text-[var(--muted)] whitespace-pre-line">{getPhoneHelp()}</p></div>',
    '<div className="space-y-2"><Label htmlFor="phone" className="flex gap-1">Phone Number <Required /></Label><Input id="phone" type="tel" placeholder="+254 712 345 678" required disabled={!isSupported} value={formData.phone} onBlur={(e) => setFormData({ ...formData, phone: formatRegionalPhone(e.target.value, detectedPhoneCountry?.name || location.country || "Kenya") })} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />{detectedPhoneCountry ? <p className="text-[11px] font-bold text-[var(--gold)]">Detected country: {detectedPhoneCountry.name} ({detectedPhoneCountry.example})</p> : <p className="text-[10px] text-[var(--muted)] whitespace-pre-line">{getPhoneHelp()}</p>}</div>'
  );

  fs.writeFileSync(signupPath, src);
}
