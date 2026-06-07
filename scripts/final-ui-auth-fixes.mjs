import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const wizardPath = path.join(root, "src/features/provider/pages/ProviderAccountSetup.tsx");
const cssPath = path.join(root, "src/globals.css");

if (fs.existsSync(wizardPath)) {
  let src = fs.readFileSync(wizardPath, "utf8");
  src = src.replace(/\n\s*else if \(!\/\[\^A-Za-z0-9\]\/.test\(form\.password\)\) next\.password = "Password must include at least one special character\.";/g, "");
  src = src.replace(/<li>✓ 1 special character<\/li>/g, "");
  src = src.replace(/fontFamily: "'Vollkorn', Georgia, serif"/g, "fontFamily: \"'Playfair Display', Georgia, serif\"");
  src = src.replace(/https:\/\/fonts\.googleapis\.com\/css2\?family=Vollkorn:wght@400;500;600;700;800;900&display=swap/g, "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800;900&display=swap");
  src = src.replace(/'Vollkorn'/g, "'Playfair Display'");
  fs.writeFileSync(wizardPath, src);
}

if (fs.existsSync(cssPath)) {
  let css = fs.readFileSync(cssPath, "utf8");
  if (!css.includes("family=Playfair+Display")) {
    css = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800;900&display=swap');\n${css}`;
  }
  css = css.replace(/--font-body: '[^']+', 'Instrument Sans', sans-serif;/g, "--font-body: 'Playfair Display', Georgia, serif;");
  css = css.replace(/--font-head: '[^']+', 'Instrument Sans', sans-serif;/g, "--font-head: 'Playfair Display', Georgia, serif;");
  const marker = "/* final universal font and form visibility */";
  if (!css.includes(marker)) {
    css += `\n\n${marker}\nhtml, body, button, input, textarea, select { font-family: 'Playfair Display', Georgia, serif !important; }\ninput, textarea, select, .setup-input { background: #fffaf0 !important; color: #0c0b08 !important; border: 1px solid rgba(12, 11, 8, 0.22) !important; box-shadow: inset 2px 2px 7px rgba(12,11,8,.08), inset -1px -1px 4px rgba(255,255,255,.4) !important; opacity: 1 !important; }\ninput::placeholder, textarea::placeholder { color: #5f574d !important; opacity: 1 !important; }\n:root[data-theme=\"dark\"] input, :root[data-theme=\"dark\"] textarea, :root[data-theme=\"dark\"] select, :root[data-theme=\"dark\"] .setup-input, .dark input, .dark textarea, .dark select { background: #fffaf0 !important; color: #0c0b08 !important; border-color: rgba(246,239,228,.22) !important; }\n:root[data-theme=\"dark\"] input::placeholder, :root[data-theme=\"dark\"] textarea::placeholder, .dark input::placeholder, .dark textarea::placeholder { color: #5f574d !important; opacity: 1 !important; }\n.provider-setup-shell, .provider-setup-shell * { font-family: 'Playfair Display', Georgia, serif !important; }\n`;
  }
  fs.writeFileSync(cssPath, css);
}
