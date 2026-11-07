// scripts/build-integrations.mjs
//
// Bundles the SAME contract-scanner engine the website uses into:
//   integrations/chrome-extension/engine.js      (global FSEngine)
//   integrations/google-docs-addon/Engine.html   (Apps Script HTML include)
// plus the shared renderer and styles for the Docs add-on.
//
// Run: npm run build:integrations
// One engine, every surface — a fix to a clause pattern ships everywhere.

import { build } from "esbuild";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ext = path.join(root, "integrations/chrome-extension");
const docs = path.join(root, "integrations/google-docs-addon");

const entry = path.join(root, "scripts/.engine-entry.ts");
writeFileSync(
  entry,
  `export { analyzeContract, CLAUSE_COVERAGE_LABELS, CLAUSE_COVERAGE_COUNT } from "../lib/ai/contractScanner";\n`,
);

const result = await build({
  entryPoints: [entry],
  bundle: true,
  format: "iife",
  globalName: "FSEngine",
  platform: "browser",
  target: ["chrome102", "es2019"],
  minify: true,
  legalComments: "none",
  write: false,
  tsconfig: path.join(root, "tsconfig.json"),
  banner: { js: "/* FreelanceShield contract engine — https://freelanceshield.me — generated, do not edit */" },
});

const js = result.outputFiles[0].text;
if (/<\/script/i.test(js)) throw new Error("Bundle contains </script>, which would break the Apps Script include.");

writeFileSync(path.join(ext, "engine.js"), js);
writeFileSync(path.join(docs, "Engine.html"), `<script>\n${js}\n</script>\n`);
writeFileSync(path.join(docs, "Render.html"), `<script>\n${readFileSync(path.join(ext, "render.js"), "utf8")}\n</script>\n`);
writeFileSync(path.join(docs, "Styles.html"), `<style>\n${readFileSync(path.join(ext, "styles.css"), "utf8")}\n</style>\n`);

const manifest = JSON.parse(readFileSync(path.join(ext, "manifest.json"), "utf8"));
console.log(`engine.js ${(js.length / 1024).toFixed(1)} KB · extension v${manifest.version} · Docs add-on includes written`);
