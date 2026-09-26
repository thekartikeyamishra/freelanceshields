#!/usr/bin/env node
/* scripts/migrate-frontmatter.mjs
 *
 * NEW FILE. One-time migration so you can actually deploy.
 *
 * THE PROBLEM THIS SOLVES
 *
 * The new content loader requires `category` and `jurisdictions` on every
 * article, and sources + applicableAsOf on tax and contract pages. None of your
 * ~110 files have any of those, so `next build` fails on the first file it
 * reads. Hand-editing 110 frontmatter blocks before you can ship infrastructure
 * fixes that are already tested is the wrong order of work.
 *
 * WHAT IT DOES
 *
 *   1. Adds `category`, derived from slug keywords. Falls back to a marker
 *      value rather than guessing when nothing matches.
 *   2. Adds `jurisdictions`, derived from explicit country signals in the slug
 *      (india, uk, us, eu, canada, australia, japan, korea, saudi). Where there
 *      is no signal, GLOBAL.
 *   3. Renames `date:` to `published:` if present.
 *   4. Adds `needsReview: true` to anything it had to guess.
 *   5. Sets `indexable: false` on tax and contract pages that have no sources.
 *
 * POINT 5 IS THE IMPORTANT ONE AND IT IS DELIBERATE.
 *
 * An unsourced tax page with no stated jurisdiction and no applicable year is
 * the exact thing you do not want a search engine serving while you fix it.
 * Setting indexable:false keeps the page live for anyone holding a link, keeps
 * it out of the sitemap, and adds a noindex — so the build passes, the fixes
 * ship today, and your weakest pages stop accumulating impressions until they
 * are actually fixed. Flip each one back to true as you rewrite it.
 *
 * This is a safety default, not a permanent state. If you never come back to
 * them, they should stay noindexed.
 *
 * USAGE
 *   node scripts/migrate-frontmatter.mjs --dry-run    # show what would change
 *   node scripts/migrate-frontmatter.mjs              # write changes
 *
 * COMMIT YOUR CONTENT DIRECTORY FIRST. This rewrites files in place.
 */

import fs from "node:fs";
import path from "node:path";

const DIR = path.join(process.cwd(), "content/resources");
const DRY = process.argv.includes("--dry-run");

/* Slug keyword -> category. First match wins, so order matters:
   more specific patterns go first. */
const CATEGORY_RULES = [
  [/\b(tax|gst|vat|jct|zatca|w9|1099|itr|44ada|lut|firc|tds|hmrc|irs|presumptive)\b/, "tax"],
  [/\b(contract|clause|nda|indemnit|indemnif|non-compete|noncompete|termination|liability|ip|work-made-for-hire|kill-fee|msa|sow|arbitration|jurisdiction)\b/, "contracts"],
  [/\b(unpaid|overdue|late|collections|ghosted|refus|small-claims|chase|non-payment|nonpayment|deposit|escrow)\b/, "getting-paid"],
  [/\b(invoice|invoicing|billing|receipt|proforma|remittance)\b/, "invoicing"],
  [/\b(rate|pricing|price|charge|hourly|retainer|quote|estimate|margin|utilization|utilisation)\b/, "pricing"],
  [/\b(privacy|local-first|offline|zero-knowledge|encrypt|anonymous|open-source|webassembly|wasm|secure|data)\b/, "privacy"],
];

/* Explicit country signals only. No inference beyond these. */
const JURISDICTION_RULES = [
  [/\b(india|indian|gst|lut|firc|44ada|itr)\b/, "IN"],
  [/\b(uk|british|hmrc|united-kingdom)\b/, "GB"],
  [/\b(us|usa|american|irs|w9|w-9|1099|united-states)\b/, "US"],
  [/\b(canada|canadian|cra)\b/, "CA"],
  [/\b(australia|australian|ato|abn)\b/, "AU"],
  [/\b(japan|japanese|jct)\b/, "JP"],
  [/\b(korea|korean)\b/, "KR"],
  [/\b(saudi|zatca|ksa)\b/, "SA"],
  [/\b(eu|european|reverse-charge)\b/, "EU"],
];

const HIGH_STAKES = ["tax", "contracts"];

function splitFrontmatter(raw) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
  if (!m) return null;
  return { fm: m[1], body: m[2] };
}

function hasKey(fm, key) {
  return new RegExp(`^${key}\\s*:`, "m").test(fm);
}

function guessCategory(slug) {
  for (const [pattern, category] of CATEGORY_RULES) {
    if (pattern.test(slug)) return { category, guessed: true };
  }
  // No confident match. Use a real category so the build passes, but flag it
  // loudly rather than silently filing it somewhere plausible.
  return { category: "invoicing", guessed: true, unmatched: true };
}

function guessJurisdictions(slug) {
  const found = [];
  for (const [pattern, code] of JURISDICTION_RULES) {
    if (pattern.test(slug) && !found.includes(code)) found.push(code);
  }
  return found.length > 0 ? found : ["GLOBAL"];
}

function migrate(slug, raw) {
  const parts = splitFrontmatter(raw);
  if (!parts) {
    return { slug, skipped: "no frontmatter block — fix by hand", changed: false };
  }

  let { fm } = parts;
  const { body } = parts;
  const notes = [];

  // date: -> published:
  if (!hasKey(fm, "published") && hasKey(fm, "date")) {
    fm = fm.replace(/^date\s*:/m, "published:");
    notes.push("renamed date -> published");
  }

  const additions = [];
  let guessed = false;

  if (!hasKey(fm, "category")) {
    const { category, unmatched } = guessCategory(slug);
    additions.push(`category: ${category}`);
    guessed = true;
    notes.push(
      unmatched
        ? `category: NO KEYWORD MATCH, defaulted to "${category}" — CHECK THIS`
        : `category: ${category}`,
    );
  }

  const category =
    /^category\s*:\s*(\S+)/m.exec(fm)?.[1] ??
    additions.find((a) => a.startsWith("category:"))?.split(": ")[1] ??
    "invoicing";

  if (!hasKey(fm, "jurisdictions")) {
    const codes = guessJurisdictions(slug);
    additions.push(`jurisdictions: [${codes.join(", ")}]`);
    guessed = true;
    notes.push(`jurisdictions: ${codes.join(", ")}`);
  }

  const jurisdictionLine =
    /^jurisdictions\s*:\s*\[(.*)\]/m.exec(fm)?.[1] ??
    additions.find((a) => a.startsWith("jurisdictions:"))?.match(/\[(.*)\]/)?.[1] ??
    "GLOBAL";
  const isGlobal = jurisdictionLine.includes("GLOBAL");

  const hasSources = hasKey(fm, "sources");
  const isHighStakes = HIGH_STAKES.includes(category);

  // High-stakes pages cannot be GLOBAL under the loader's rules. If we could not
  // derive a country, that page genuinely needs a human to say which one.
  if (isHighStakes && isGlobal) {
    notes.push("HIGH-STAKES BUT NO COUNTRY DERIVED — you must set jurisdictions");
  }

  if (category === "tax" && !hasKey(fm, "applicableAsOf")) {
    additions.push(`applicableAsOf: "UNKNOWN — SET THE TAX YEAR"`);
    guessed = true;
    notes.push("applicableAsOf: placeholder added");
  }

  // The safety default. See the header comment.
  if (isHighStakes && !hasSources && !hasKey(fm, "indexable")) {
    additions.push("indexable: false");
    notes.push("indexable: false (unsourced high-stakes page, kept out of search)");
  }

  if (guessed && !hasKey(fm, "needsReview")) {
    additions.push("needsReview: true");
  }

  if (additions.length === 0 && notes.length === 0) {
    return { slug, changed: false, notes: ["already complete"] };
  }

  const merged = `---\n${fm}\n${additions.join("\n")}\n---\n${body}`;
  return { slug, changed: true, notes, content: merged };
}

function main() {
  if (!fs.existsSync(DIR)) {
    console.error(`No content directory at ${DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".md"));
  const results = files.map((file) => {
    const slug = file.replace(/\.md$/, "");
    return { file, ...migrate(slug, fs.readFileSync(path.join(DIR, file), "utf8")) };
  });

  let written = 0;
  const needsAttention = [];

  console.log(`\n${"=".repeat(66)}`);
  console.log(`  FRONTMATTER MIGRATION${DRY ? " — DRY RUN, nothing written" : ""}`);
  console.log("=".repeat(66) + "\n");

  for (const r of results) {
    if (r.skipped) {
      console.log(`  SKIP  ${r.slug}\n          ${r.skipped}\n`);
      needsAttention.push(r.slug);
      continue;
    }
    if (!r.changed) continue;

    console.log(`  ${DRY ? "WOULD EDIT" : "EDITED"}  ${r.slug}`);
    for (const note of r.notes) console.log(`          · ${note}`);
    console.log("");

    if (r.notes.some((n) => n.includes("CHECK THIS") || n.includes("must set"))) {
      needsAttention.push(r.slug);
    }

    if (!DRY) {
      fs.writeFileSync(path.join(DIR, r.file), r.content, "utf8");
      written += 1;
    }
  }

  const noindexed = results.filter((r) =>
    r.notes?.some((n) => n.startsWith("indexable: false")),
  );

  console.log("=".repeat(66));
  console.log(`  ${DRY ? "Would edit" : "Edited"}: ${DRY ? results.filter((r) => r.changed).length : written} files`);
  console.log(`  Set to noindex pending sources: ${noindexed.length}`);
  console.log(`  Need a human decision: ${needsAttention.length}`);

  if (needsAttention.length > 0) {
    console.log("\n  These could not be derived and need you:");
    for (const slug of needsAttention) console.log(`    · ${slug}`);
  }

  console.log("\n  Next: node scripts/audit-content.mjs");
  console.log("=".repeat(66) + "\n");
}

main();