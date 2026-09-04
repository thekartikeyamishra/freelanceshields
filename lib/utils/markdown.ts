// lib/utils/markdown.ts
//
// REWRITTEN. Three problems with the previous version:
//
// 1. DECEPTIVE FRESHNESS. `date: data.date ? ... : new Date().toISOString()`
//    stamped any article missing a frontmatter date with the BUILD TIME, so its
//    published date silently changed on every deploy without the content
//    changing. Google's spam policies treat manufactured freshness signals as a
//    violation. Now: a missing date fails the build.
//
// 2. PLACEHOLDER PAGES SHIPPED LIVE. Fallbacks of 'Untitled Guide',
//    'No description provided.' and 'Content is being updated...' meant a broken
//    file became a live indexable URL instead of a build error. Now: it throws.
//
// 3. NO EDITORIAL METADATA. The type had no field for the last review date,
//    sources, or jurisdiction — so tax and legal pages had nowhere to record
//    what they were based on or when they were last checked. Those fields are
//    now first-class and required for anything tagged as tax or legal.
//
// `ensureDirectory()` has also been removed. Creating the content folder at
// runtime meant a missing content deployment produced an empty /resources page
// returning HTTP 200 rather than a failure you would notice.

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

/** Topic cluster. Drives breadcrumbs, hub pages and internal linking. */
export type ResourceCategory =
  | 'invoicing'
  | 'contracts'
  | 'pricing'
  | 'tax'
  | 'privacy'
  | 'getting-paid';

/**
 * Categories where a factual error has real financial or legal consequences.
 * These carry extra required frontmatter.
 */
const HIGH_STAKES: ResourceCategory[] = ['tax', 'contracts'];

export interface ResourceSource {
  /** Publisher, e.g. "Income Tax Department, Government of India". */
  publisher: string;
  /** Document or page title. */
  title: string;
  url: string;
}

export interface ResourcePost {
  slug: string;
  title: string;
  description: string;
  /** ISO 8601. First publication. Never auto-generated. */
  published: string;
  /**
   * ISO 8601. Last substantive content revision.
   * Only bump this when the content actually changed. Changing it to appear
   * fresh is exactly the deceptive-freshness pattern Google penalises.
   */
  updated: string;
  author: string;
  category: ResourceCategory;
  /**
   * ISO 3166-1 alpha-2 codes the guidance applies to, or 'GLOBAL'.
   * Tax and legal content must state this: one jurisdiction's rules do not
   * transfer to another.
   */
  jurisdictions: string[];
  /**
   * Tax year / assessment year / date the rules described were current as of.
   * Required for tax content because thresholds change annually.
   */
  applicableAsOf?: string;
  sources: ResourceSource[];
  /** Set false to keep a page live but out of the sitemap and search results. */
  indexable: boolean;
  content: string;
}

/** Frontmatter validation failure. Surfaces at build time with the filename. */
export class ContentValidationError extends Error {
  constructor(slug: string, problems: string[]) {
    super(
      `Invalid frontmatter in content/resources/${slug}.md:\n` +
        problems.map((p) => `  - ${p}`).join('\n'),
    );
    this.name = 'ContentValidationError';
  }
}

const RESOURCES_DIR = path.join(process.cwd(), 'content/resources');

const VALID_CATEGORIES: ResourceCategory[] = [
  'invoicing',
  'contracts',
  'pricing',
  'tax',
  'privacy',
  'getting-paid',
];

/**
 * Accepts either a string or a Date.
 *
 * This matters: gray-matter runs the YAML through js-yaml, which parses an
 * unquoted date literal (`published: 2026-05-02`) into a JavaScript Date
 * object, not a string. An earlier version of this function required a string
 * and therefore rejected every correctly-written date in the content
 * directory. Quoted dates arrive as strings, so both forms must work.
 */
function isValidDate(value: unknown): boolean {
  if (value instanceof Date) return !Number.isNaN(value.getTime());
  if (typeof value === 'string' && value.trim()) {
    return !Number.isNaN(new Date(value).getTime());
  }
  return false;
}

function toIso(value: unknown): string {
  const d = value instanceof Date ? value : new Date(String(value));
  return d.toISOString();
}

function parseSources(raw: unknown, slug: string, problems: string[]): ResourceSource[] {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw)) {
    problems.push('`sources` must be a list');
    return [];
  }

  return raw.flatMap((entry, i): ResourceSource[] => {
    if (typeof entry !== 'object' || entry === null) {
      problems.push(`sources[${i}] must be an object with publisher, title and url`);
      return [];
    }
    const e = entry as Record<string, unknown>;
    const missing = ['publisher', 'title', 'url'].filter(
      (k) => typeof e[k] !== 'string' || !(e[k] as string).trim(),
    );
    if (missing.length > 0) {
      problems.push(`sources[${i}] is missing: ${missing.join(', ')}`);
      return [];
    }
    return [
      {
        publisher: String(e.publisher),
        title: String(e.title),
        url: String(e.url),
      },
    ];
  });
}

/** Lists article slugs (without the .md extension). */
export function getResourceSlugs(): string[] {
  if (!fs.existsSync(RESOURCES_DIR)) {
    // A missing content directory must fail a PRODUCTION build: shipping an
    // empty /resources page that returns HTTP 200 is worse than not shipping.
    //
    // In development it should not be fatal. You may not have created the
    // directory yet, and crashing the dev server stops you working on every
    // other route for a reason unrelated to them.
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        `Content directory not found at ${RESOURCES_DIR}. ` +
          'The resources index would otherwise build as an empty page returning HTTP 200.',
      );
    }

    console.warn(
      `[content] No directory at ${RESOURCES_DIR}. Guides will be empty. ` +
        'Create it and add markdown files; see content/_TEMPLATE.md.',
    );
    return [];
  }

  return fs
    .readdirSync(RESOURCES_DIR)
    .filter((file) => file.endsWith('.md'))
    .map((file) => file.replace(/\.md$/, ''));
}

/**
 * Reads and validates one article.
 * Throws ContentValidationError rather than shipping a placeholder page.
 */
export function getResourceBySlug(slug: string): ResourcePost {
  const realSlug = slug.replace(/\.md$/, '');
  const fullPath = path.join(RESOURCES_DIR, `${realSlug}.md`);

  if (!fs.existsSync(fullPath)) {
    throw new ContentValidationError(realSlug, ['file does not exist']);
  }

  const { data, content } = matter(fs.readFileSync(fullPath, 'utf8'));
  const problems: string[] = [];

  // --- Always required -----------------------------------------------------
  if (typeof data.title !== 'string' || !data.title.trim()) {
    problems.push('`title` is required');
  }
  if (typeof data.description !== 'string' || !data.description.trim()) {
    problems.push('`description` is required (used as the meta description)');
  }
  if (!isValidDate(data.published ?? data.date)) {
    problems.push('`published` is required and must be a valid date');
  }
  if (typeof data.author !== 'string' || !data.author.trim()) {
    problems.push('`author` is required');
  }
  if (!VALID_CATEGORIES.includes(data.category)) {
    problems.push(`\`category\` must be one of: ${VALID_CATEGORIES.join(', ')}`);
  }
  if (!content.trim()) {
    problems.push('body content is empty');
  }

  const jurisdictions = Array.isArray(data.jurisdictions)
    ? data.jurisdictions.map(String)
    : [];
  if (jurisdictions.length === 0) {
    problems.push("`jurisdictions` is required (use ['GLOBAL'] if genuinely universal)");
  }

  const sources = parseSources(data.sources, realSlug, problems);

  // --- Extra requirements for high-stakes categories -----------------------
  //
  // These apply only to pages that are actually search-facing. A page marked
  // `indexable: false` is excluded from the sitemap and carries a noindex, so
  // it does not need to meet the search-facing sourcing bar to exist.
  //
  // This is what makes a staged migration possible: unsourced tax pages can be
  // noindexed and shipped rather than blocking the build for every other fix in
  // the repository. Flip `indexable` back to true as each page is sourced, and
  // these checks re-engage at that moment.
  const category = data.category as ResourceCategory;
  const searchFacing = data.indexable !== false;

  if (HIGH_STAKES.includes(category) && searchFacing) {
    if (sources.length === 0) {
      problems.push(
        `\`sources\` is required for category "${category}" — cite the tax authority, ` +
          'regulator or statute the guidance rests on',
      );
    }
    if (jurisdictions.includes('GLOBAL')) {
      problems.push(
        `category "${category}" cannot be GLOBAL — name the specific jurisdictions`,
      );
    }
  }
  if (
    category === 'tax' &&
    searchFacing &&
    !String(data.applicableAsOf ?? '').trim()
  ) {
    problems.push(
      '`applicableAsOf` is required for tax content (e.g. "AY 2026-27") because thresholds change annually',
    );
  }

  if (problems.length > 0) {
    throw new ContentValidationError(realSlug, problems);
  }

  const published = toIso(data.published ?? data.date);
  // An article that has never been revised has updated === published.
  // We do NOT default this to "now".
  const updated = isValidDate(data.updated) ? toIso(data.updated) : published;

  if (new Date(updated).getTime() < new Date(published).getTime()) {
    throw new ContentValidationError(realSlug, [
      '`updated` is earlier than `published`',
    ]);
  }

  return {
    slug: realSlug,
    title: String(data.title),
    description: String(data.description),
    published,
    updated,
    author: String(data.author),
    category,
    jurisdictions,
    applicableAsOf: data.applicableAsOf
      ? String(data.applicableAsOf)
      : undefined,
    sources,
    indexable: data.indexable !== false,
    content,
  };
}

/** All articles, newest first. Throws if any file is invalid. */
export function getAllResources(): ResourcePost[] {
  return getResourceSlugs()
    .map(getResourceBySlug)
    .sort(
      (a, b) => new Date(b.published).getTime() - new Date(a.published).getTime(),
    );
}

/** Articles that belong in the sitemap and may be indexed. */
export function getIndexableResources(): ResourcePost[] {
  return getAllResources().filter((post) => post.indexable);
}

/** Articles in one topic cluster, for hub pages and related links. */
export function getResourcesByCategory(category: ResourceCategory): ResourcePost[] {
  return getAllResources().filter((post) => post.category === category);
}
