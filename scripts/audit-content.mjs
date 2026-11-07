#!/usr/bin/env node
/* scripts/audit-content.mjs
 *
 * NEW FILE. Run this before you touch a single article:
 *
 *     node scripts/audit-content.mjs
 *     node scripts/audit-content.mjs --csv > content-audit.csv
 *
 * WHY THIS EXISTS
 *
 * You have roughly 110 articles and the biggest open question is which ones to
 * keep. Deciding that by reading all of them is a week of work. This does the
 * mechanical half in a second:
 *
 *   1. Reports every article missing the frontmatter the new loader requires
 *      (jurisdiction, sources, applicable year). That is your rewrite list.
 *   2. Reports body word count. Thin pages are the ones a reviewer flags.
 *   3. Groups articles into likely cannibalisation clusters by slug token
 *      overlap, so you can see the six invoice-by-profession pages and the ten
 *      local-first pages as groups rather than finding them by hand.
 *   4. Flags articles published on the same day in bulk, which is the pattern
 *      that reads as scaled content.
 *
 * KNOWN LIMITATION OF THE CLUSTERING
 *
 * Clustering works on slug tokens, so it catches groups that share vocabulary
 * (the six how-to-write-freelance-<profession>-invoice pages) but MISSES groups
 * that say the same thing in different words. On your site the local-first
 * cluster is exactly that case:
 *
 *     local-first-vs-cloud-software-freelance
 *     why-open-source-invoicing-is-better
 *     zero-knowledge-architecture-legal-docs
 *     secure-offline-invoice-generator
 *     how-to-run-offline-freelance-business
 *     client-data-safe-on-accounting-apps
 *     why-freelancers-leaving-quickbooks
 *     best-tools-for-anonymous-freelance-billing
 *     free-invoice-generator-no-watermark
 *
 * Those share almost no tokens and will not be grouped, but they are arguing
 * the same point. Treat the clustering output as a starting point that catches
 * the obvious cases cheaply, not as a complete map. Reading the titles in the
 * --csv output is still worth an hour.
 *
 * It changes nothing. It only reads and reports.
 *
 * The judgement — which page in a cluster survives, what merges into it, what
 * gets a 301 — is yours. This just puts the facts on one screen.
 */

import fs from "node:fs";
import path from "node:path";

const DIR = path.join(process.cwd(), "content/resources");
const CSV = process.argv.includes("--csv");

const VALID_CATEGORIES = [
  "invoicing",
  "contracts",
  "pricing",
  "tax",
  "privacy",
  "getting-paid",
];
const HIGH_STAKES = ["tax", "contracts"];

/* Thin-content threshold. Not a rule from anywhere — a working line below which
   a page is unlikely to fully answer the query it targets. */
const THIN_WORDS = 600;

/* Words too common to indicate a shared topic. */
const STOPWORDS = new Set([
  "how", "to", "the", "a", "an", "for", "of", "in", "on", "is", "and", "or",
  "my", "your", "what", "when", "why", "can", "do", "does", "i", "you", "it",
  "with", "without", "from", "vs", "guide", "best", "freelance", "freelancer",
  "freelancers", "client", "clients",
]);

/* ------------------------------------------------------------------ */
/* Minimal frontmatter parser. Avoids needing gray-matter for a script. */
/* ------------------------------------------------------------------ */

function parseFrontmatter(raw) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
  if (!match) return { data: {}, body: raw, hasFrontmatter: false };

  const data = {};
  let currentKey = null;

  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim()) continue;

    // List item belonging to the previous key.
    if (/^\s*-\s/.test(line) && currentKey) {
      if (!Array.isArray(data[currentKey])) data[currentKey] = [];
      data[currentKey].push(line.replace(/^\s*-\s*/, "").trim());
      continue;
    }

    const kv = /^([A-Za-z_][\w-]*)\s*:\s*(.*)$/.exec(line);
    if (!kv) continue;

    currentKey = kv[1];
    const value = kv[2].trim().replace(/^["']|["']$/g, "");

    if (value === "") {
      data[currentKey] = [];
    } else if (value.startsWith("[")) {
      data[currentKey] = value
        .replace(/^\[|\]$/g, "")
        .split(",")
        .map((v) => v.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    } else {
      data[currentKey] = value;
    }
  }

  return { data, body: match[2], hasFrontmatter: true };
}

/* ------------------------------------------------------------------ */

function analyse(slug, raw) {
  const { data, body, hasFrontmatter } = parseFrontmatter(raw);
  const problems = [];

  if (!hasFrontmatter) problems.push("no frontmatter block");
  if (!data.title) problems.push("missing title");
  if (!data.description) problems.push("missing description");
  if (!data.published && !data.date) problems.push("missing published date");
  if (!data.author) problems.push("missing author");

  const category = data.category;
  if (!category) {
    problems.push("missing category");
  } else if (!VALID_CATEGORIES.includes(category)) {
    problems.push(`invalid category "${category}"`);
  }

  const jurisdictions = Array.isArray(data.jurisdictions)
    ? data.jurisdictions
    : data.jurisdictions
      ? [data.jurisdictions]
      : [];
  if (jurisdictions.length === 0) problems.push("missing jurisdictions");

  const sourceCount = Array.isArray(data.sources) ? data.sources.length : 0;

  if (HIGH_STAKES.includes(category)) {
    if (sourceCount === 0) problems.push(`no sources (required for "${category}")`);
    if (jurisdictions.includes("GLOBAL")) {
      problems.push(`category "${category}" cannot be GLOBAL`);
    }
  }
  if (category === "tax" && !data.applicableAsOf) {
    problems.push("missing applicableAsOf (required for tax)");
  }

  const words = body.trim() ? body.trim().split(/\s+/).length : 0;
  if (words < THIN_WORDS) problems.push(`thin: ${words} words`);

  const published = String(data.published || data.date || "").slice(0, 10);

  return { slug, title: data.title || "(untitled)", category: category || "-",
           jurisdictions, sourceCount, words, published, problems };
}

/** Groups slugs sharing two or more meaningful tokens. */
function findClusters(records) {
  const tokensBySlug = new Map(
    records.map((r) => [
      r.slug,
      new Set(r.slug.split("-").filter((t) => t.length > 2 && !STOPWORDS.has(t))),
    ]),
  );

  const clusters = [];
  const assigned = new Set();

  for (const a of records) {
    if (assigned.has(a.slug)) continue;
    const group = [a.slug];

    for (const b of records) {
      if (b.slug === a.slug || assigned.has(b.slug)) continue;
      const shared = [...tokensBySlug.get(a.slug)].filter((t) =>
        tokensBySlug.get(b.slug).has(t),
      );
      if (shared.length >= 2) group.push(b.slug);
    }

    if (group.length > 1) {
      group.forEach((s) => assigned.add(s));
      clusters.push(group);
    }
  }

  return clusters.sort((x, y) => y.length - x.length);
}

/* ------------------------------------------------------------------ */

function main() {
  if (!fs.existsSync(DIR)) {
    console.error(`No content directory at ${DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".md"));
  if (files.length === 0) {
    console.error("No markdown files found.");
    process.exit(1);
  }

  const records = files.map((file) =>
    analyse(file.replace(/\.md$/, ""), fs.readFileSync(path.join(DIR, file), "utf8")),
  );

  if (CSV) {
    console.log("slug,category,jurisdictions,sources,words,published,problems");
    for (const r of records) {
      console.log(
        [
          r.slug,
          r.category,
          `"${r.jurisdictions.join(" ")}"`,
          r.sourceCount,
          r.words,
          r.published,
          `"${r.problems.join("; ")}"`,
        ].join(","),
      );
    }
    return;
  }

  const clean = records.filter((r) => r.problems.length === 0);
  const broken = records.filter((r) => r.problems.length > 0);
  const thin = records.filter((r) => r.words < THIN_WORDS);
  const unsourced = records.filter(
    (r) => HIGH_STAKES.includes(r.category) && r.sourceCount === 0,
  );

  console.log(`\n${"=".repeat(64)}`);
  console.log(`  CONTENT AUDIT — ${records.length} articles`);
  console.log("=".repeat(64));

  console.log(`\n  Passing all checks:        ${clean.length}`);
  console.log(`  Needing work:              ${broken.length}`);
  console.log(`  Thin (<${THIN_WORDS} words):        ${thin.length}`);
  console.log(`  High-stakes, no sources:   ${unsourced.length}`);

  /* Publication-date concentration. */
  const byDate = {};
  for (const r of records) byDate[r.published] = (byDate[r.published] || 0) + 1;
  const bulk = Object.entries(byDate)
    .filter(([, n]) => n >= 5)
    .sort((a, b) => b[1] - a[1]);

  if (bulk.length > 0) {
    console.log(`\n${"-".repeat(64)}`);
    console.log("  PUBLICATION DATE CONCENTRATION");
    console.log("-".repeat(64));
    console.log("  Days with 5 or more articles. Heavy concentration on one or");
    console.log("  two days is the pattern that reads as scaled publication.\n");
    for (const [date, n] of bulk) {
      console.log(`    ${date || "(no date)"}  ${String(n).padStart(4)} articles`);
    }
  }

  /* Cannibalisation. */
  const clusters = findClusters(records);
  if (clusters.length > 0) {
    console.log(`\n${"-".repeat(64)}`);
    console.log("  LIKELY OVERLAPPING CLUSTERS");
    console.log("-".repeat(64));
    console.log("  Articles sharing two or more slug tokens. These probably");
    console.log("  compete for the same queries. Pick one to keep per cluster,");
    console.log("  merge the useful parts in, and 301 the rest to it.\n");

    for (const group of clusters.slice(0, 15)) {
      console.log(`    [${group.length} pages]`);
      for (const slug of group) {
        const r = records.find((x) => x.slug === slug);
        console.log(`      ${String(r.words).padStart(5)}w  /resources/${slug}`);
      }
      console.log("");
    }
    if (clusters.length > 15) {
      console.log(`    …and ${clusters.length - 15} more clusters.\n`);
    }
  }

  /* Per-article problems. */
  if (broken.length > 0) {
    console.log(`${"-".repeat(64)}`);
    console.log("  ARTICLES NEEDING WORK");
    console.log("-".repeat(64));
    console.log("  These will fail the build until fixed.\n");

    for (const r of broken) {
      console.log(`    /resources/${r.slug}`);
      for (const problem of r.problems) console.log(`        · ${problem}`);
      console.log("");
    }
  }

  console.log("=".repeat(64));
  console.log("  Suggested order of work:");
  console.log("    1. Resolve the clusters above — that removes the most pages");
  console.log("       for the least effort, and 301s preserve any equity.");
  console.log("    2. For survivors, add jurisdiction, sources and applicable year.");
  console.log("    3. Expand or merge anything still under the thin threshold.");
  console.log("    4. Re-run this script. Aim for 0 needing work.");
  console.log("=".repeat(64) + "\n");
}

main();
