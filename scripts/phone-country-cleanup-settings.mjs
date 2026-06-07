import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const p = (file) => path.join(root, file);
const read = (file) => fs.existsSync(p(file)) ? fs.readFileSync(p(file), "utf8") : "";
const write = (file, content) => fs.writeFileSync(p(file), content);

const helperBlock = `
const phoneCountries = [
  { name: "Kenya", code: "254" },
  { name: "Uganda", code: "256" },
  { name: "Tanzania", code: "255" },
  { name: "Rwanda", code: "250" },
];

const detectPhoneCountry = (value: string) => {
  const digits = value.replace(/\D/g, "");
  const normalized = digits.startsWith("00") ? digits.slice(2) : digits;
  return phoneCountries.find((country) => normalized.startsWith(country.code)) || null;
};

const formatRegionalPhone = (value: string, fallbackCountry = "Kenya") => {
  const detected = detectPhoneCountry(value);
  const digits = value.replace(/\D/g, "");
  const fallback = fallbackCountry.toLowerCase();
  const code = detected?.code || (fallback.includes("uganda") ? "256" : fallback.includes("tanzania") ? "255" : fallback.includes("rwanda") ? "250" : "254");
  let local = digits.startsWith("00") ? digits.slice(2) : digits;
  if (local.startsWith(code)) local = local.slice(code.length);
  if (local.startsWith("0")) local = local.slice(1);
  local = local.slice(0, 9);
  const groups = [local.slice(0, 3), local.slice(3, 6), local.slice(6, 9)].filter(Boolean).join(" ");
  return ("+" + code + (groups ? " " + groups : "")).trim();
};
`;

function patchBereavedSignup() {
  const file = "src/features/bereaved/pages/Signup.tsx";
  let src = read(file);
  if (!src) return;
  src = src.replace(/\nconst phoneCountries = \[[\s\S]*?const detectPhoneCountry = \(value: string\) => \{[\s\S]*?\};/g, helperBlock);
  src = src.replace(/const formatRegionalPhone = \(value: string, country = "Kenya"\) => \{[\s\S]*?\n\};/g, helperBlock.match(/const formatRegionalPhone[\s\S]*?\n\};/)?.[0] || "");
  src = src.replace(/, example: "\+\d+ xxx xxx xxx"/g, "");
  src = src.replace(/placeholder="\+254 712 345 678"/g, 'placeholder="Phone number"');
  src = src.replace(/\{detectedPhoneCountry \? <p className="text-\[11px\] font-bold text-\[var\(--gold\)\]">Detected country: \{detectedPhoneCountry\.name\} \(\{detectedPhoneCountry\.example\}\)<\/p> : <p className="text-\[10px\] text-\[var\(--muted\)\] whitespace-pre-line">\{getPhoneHelp\(\)\}<\/p>\}/g, '{detectedPhoneCountry ? <p className="text-[11px] font-bold text-[var(--gold)]">Detected country: {detectedPhoneCountry.name}</p> : formData.phone ? <p className="text-[10px] text-[var(--muted)]">Start with +254, +256, +255, or +250 to detect country.</p> : null}');
  src = src.replace(/<p className="text-\[10px\] text-\[var\(--muted\)\] whitespace-pre-line">\{getPhoneHelp\(\)\}<\/p>/g, "");
  src = src.replace(/<div className="flex items-center gap-1\.5 mt-2[\s\S]*?Beta Mode v0\.4[\s\S]*?<\/div>/g, "");
  write(file, src);
}

function patchPhoneInSettings(file, label) {
  let src = read(file);
  if (!src) return;
  if (!src.includes("detectPhoneCountry")) {
    src = src.replace(/const OperationsSettings = \(\) => \{|const VendorSettings = \(\) => \{/, (match) => helperBlock + "\n" + match);
  }
  if (!src.includes("detectedPrimaryPhoneCountry")) {
    src = src.replace('  const [form, setForm] = useState({', '  const [form, setForm] = useState({');
    src = src.replace(/\n\s*const currencySymbols:/, '\n  const detectedPrimaryPhoneCountry = detectPhoneCountry(form.phone);\n  const detectedMpesaCountry = detectPhoneCountry(form.mpesa_phone);\n\n  const currencySymbols:');
  }
  src = src.replace(/placeholder="\+254 712 345 678"/g, 'placeholder="Phone number"');
  src = src.replace(/placeholder="\+254 7\d{2} \d{3} \d{3}"/g, 'placeholder="Phone number"');
  src = src.replace(/placeholder="\+254 700 000 000"/g, 'placeholder="Phone number"');
  src = src.replace(/onBlur=\{\(e\) => setForm\(\{ \.\.\.form, phone: e\.target\.value \}\)\}/g, 'onBlur={(e) => setForm({ ...form, phone: formatRegionalPhone(e.target.value, form.country || "Kenya"), country: detectPhoneCountry(e.target.value)?.name || form.country })}');
  src = src.replace(/onChange=\{\(e\) => setForm\(\{ \.\.\.form, phone: e\.target\.value \}\)\}/g, 'onChange={(e) => setForm({ ...form, phone: e.target.value, country: detectPhoneCountry(e.target.value)?.name || form.country })}');
  src = src.replace(/onBlur=\{\(e\) => setForm\(\{ \.\.\.form, mpesa_phone: e\.target\.value \}\)\}/g, 'onBlur={(e) => setForm({ ...form, mpesa_phone: formatRegionalPhone(e.target.value, form.country || "Kenya"), country: detectPhoneCountry(e.target.value)?.name || form.country })}');
  src = src.replace(/onChange=\{\(e\) => setForm\(\{ \.\.\.form, mpesa_phone: e\.target\.value \}\)\}/g, 'onChange={(e) => setForm({ ...form, mpesa_phone: e.target.value, country: detectPhoneCountry(e.target.value)?.name || form.country })}');
  src = src.replace(/(<Input[^>]*value=\{form\.phone\}[^>]*\/>)/g, '$1{detectedPrimaryPhoneCountry && <p className="text-[11px] font-bold text-[var(--gold)] mt-1">Detected country: {detectedPrimaryPhoneCountry.name}</p>}');
  src = src.replace(/(<Input[^>]*value=\{form\.mpesa_phone\}[^>]*\/>)/g, '$1{detectedMpesaCountry && <p className="text-[11px] font-bold text-[var(--gold)] mt-1">Detected country: {detectedMpesaCountry.name}</p>}');
  src = src.replace(/Beta Mode v0\.4/g, "");
  write(file, src);
}

function removeBetaText(file) {
  let src = read(file);
  if (!src) return;
  src = src.replace(/<div className="flex items-center gap-1\.5 mt-2[\s\S]*?Beta Mode v0\.4[\s\S]*?<\/div>/g, "");
  src = src.replace(/Beta Mode v0\.4/g, "");
  write(file, src);
}

patchBereavedSignup();
patchPhoneInSettings("src/features/funeral-home/pages/Settings.tsx", "Funeral Home");
patchPhoneInSettings("src/features/marketplace/pages/Settings.tsx", "Vendor");
removeBetaText("src/features/auth/pages/ForgotPassword.tsx");
removeBetaText("src/pages/Index.tsx");
