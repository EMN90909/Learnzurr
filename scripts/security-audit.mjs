import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const root = process.cwd();
const ignoreDirs = new Set([".git", "node_modules", "dist", "build", ".next"]);
const riskyPatterns = [
  { name: "Possible raw SQL string interpolation", re: /query\s*\([^\n)]*`[^`]*\$\{/g },
  { name: "Possible dangerouslySetInnerHTML", re: /dangerouslySetInnerHTML/g },
  { name: "Possible eval usage", re: /\beval\s*\(/g },
  { name: "Possible new Function usage", re: /new\s+Function\s*\(/g },
  { name: "SVG upload allowance", re: /image\/svg\+xml|\.svg|\"svg\"|'svg'/g },
];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoreDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.(ts|tsx|js|jsx|mjs|sql|json)$/i.test(entry.name)) files.push(full);
  }
  return files;
}

const findings = [];
for (const file of walk(root)) {
  const rel = path.relative(root, file);
  const text = fs.readFileSync(file, "utf8");
  for (const pattern of riskyPatterns) {
    const matches = text.match(pattern.re);
    if (matches?.length) findings.push(`${pattern.name}: ${rel} (${matches.length})`);
  }
}

console.log("\nStruta security audit\n======================");
if (findings.length) {
  console.log(findings.map((f) => `- ${f}`).join("\n"));
  console.log("\nReview the findings before deployment.");
} else {
  console.log("No high-risk patterns found by the lightweight scan.");
}

try {
  console.log("\nRunning npm audit --audit-level=high...");
  execSync("npm audit --audit-level=high", { stdio: "inherit" });
} catch {
  console.log("npm audit reported issues or could not run. Review dependency advisories before production deployment.");
}
