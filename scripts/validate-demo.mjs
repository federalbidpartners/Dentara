import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const allowedCdtCodes = new Set([
  "D0140",
  "D1110",
  "D2391",
  "D2392",
  "D2393",
  "D2394",
  "D2740",
  "D2750",
  "D3330",
  "D4910",
  "D6240",
  "D7140"
]);

const allowedInternalCodes = new Set(["WATCH"]);
const errors = [];

function readTextFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    if (["node_modules", "dist"].includes(name) || name.startsWith("qa-")) return [];
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) return readTextFiles(path);
    if (![".ts", ".tsx", ".js", ".jsx", ".json", ".md", ".html"].includes(extname(path))) return [];
    return [path];
  });
}

const files = readTextFiles(root);
for (const file of files) {
  const text = readFileSync(file, "utf8");
  if (/Molaris|MOLARIS|molaris/.test(text)) {
    errors.push(`Old brand reference found in ${file}`);
  }
}

const sourceText = files.map((file) => readFileSync(file, "utf8")).join("\n");
const discoveredCodes = new Set(sourceText.match(/\bD\d{4}\b/g) ?? []);
for (const code of discoveredCodes) {
  if (!allowedCdtCodes.has(code)) {
    errors.push(`Unreviewed CDT-like code found: ${code}`);
  }
}

if (!sourceText.includes("WATCH")) {
  errors.push("Internal WATCH chart status is missing from demo validation scope.");
}

for (const internalCode of allowedInternalCodes) {
  const unsafePattern = new RegExp(`plannedProcedure:\\s*\\{[^}]*code:\\s*["']${internalCode}["']`, "m");
  if (unsafePattern.test(sourceText)) {
    errors.push(`${internalCode} must never be seeded as a billable plannedProcedure code.`);
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Dentara demo validation passed. Reviewed CDT-like codes: ${[...discoveredCodes].sort().join(", ")}`);
