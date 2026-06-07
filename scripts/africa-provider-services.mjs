import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const p = (file) => path.join(root, file);
const read = (file) => fs.existsSync(p(file)) ? fs.readFileSync(p(file), "utf8") : "";
const write = (file, content) => fs.writeFileSync(p(file), content);

const servicesBlock = `const funeralHomeServiceOptions = [
  "Mortuary services",
  "Body preservation",
  "Embalming services",
  "Refrigeration storage",
  "Autopsy handling",
  "Chapel viewing",
  "Viewing room",
  "Funeral arrangement",
  "Burial coordination",
  "Cremation coordination",
  "Repatriation of remains",
  "Hearse transport",
  "Body transport",
  "Dressing of the body",
  "Cosmetology services",
  "Grief counseling",
  "Bereavement support",
  "Aftercare support",
  "Death certificate assistance",
  "Funeral program planning",
  "Cemetery liaison",
  "Graveside service",
  "Memorial service setup",
  "Body receiving service",
  "Postmortem coordination",
  "Family waiting room",
  "Live-stream funeral service",
  "Funeral package planning",
  "Body washing and preparation",
  "Funeral home administration",
];

const vendorServiceOptions = [
  "Casket sales",
  "Urn sales",
  "Flowers and wreaths",
  "Tents and chairs",
  "Music and sound system",
  "Catering services",
  "Lowering gear",
  "Coffin handles",
  "Casket lining",
  "Funeral printing and design",
  "Obituary printing",
  "Program printing",
  "Hearse accessories",
  "Burial clothes",
  "Body viewing accessories",
  "Funeral cover packages",
  "Cemetery equipment",
  "Headstone supplies",
  "Grave markers",
  "Banner printing",
  "Tent decoration",
  "Water and refreshments",
  "Transport vans",
  "Chairs and table rental",
  "Canopies and gazebos",
  "Generators",
  "Lighting equipment",
  "Portable toilets",
  "PA systems",
  "Photo and video coverage",
];`;

function replaceServiceOptions(src) {
  return src.replace(/const serviceOptions = \[[\s\S]*?\];/, servicesBlock);
}

function patchAccountSetup() {
  const file = "src/features/provider/pages/ProviderAccountSetup.tsx";
  let src = read(file);
  if (!src) return;
  src = replaceServiceOptions(src);
  if (!src.includes("const serviceOptions = isVendor ? vendorServiceOptions : funeralHomeServiceOptions;")) {
    src = src.replace('const label = isVendor ? "Vendor" : "Funeral Home";', 'const label = isVendor ? "Vendor" : "Funeral Home";\n  const serviceOptions = isVendor ? vendorServiceOptions : funeralHomeServiceOptions;');
  }
  src = src.replace(/<Label>Services Offered<\/Label>/g, '<Label>Services Offered</Label><p className="text-xs text-[var(--muted)] mt-1">Select the services your {label.toLowerCase()} actually offers. Families will see options based on your selection.</p>');
  write(file, src);
}

function patchSetupEditor() {
  const file = "src/features/provider/components/ProviderSetupEditor.tsx";
  let src = read(file);
  if (!src) return;
  src = replaceServiceOptions(src);
  if (!src.includes("const serviceOptions = providerType === \"vendor\" ? vendorServiceOptions : funeralHomeServiceOptions;")) {
    src = src.replace('const label = providerType === "vendor" ? "Vendor" : "Funeral Home";', 'const label = providerType === "vendor" ? "Vendor" : "Funeral Home";\n  const serviceOptions = providerType === "vendor" ? vendorServiceOptions : funeralHomeServiceOptions;');
  }
  src = src.replace(/<Label>Services Offered<\/Label>/g, '<Label>Services Offered</Label><p className="text-xs text-slate-500 mt-1">Select the services your {label.toLowerCase()} actually offers. Families will see options based on your selection.</p>');
  write(file, src);
}

patchAccountSetup();
patchSetupEditor();
