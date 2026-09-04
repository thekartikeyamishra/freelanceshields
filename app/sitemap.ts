// app/sitemap.ts
//
// Next.js generates /sitemap.xml from this file.
//
// The sitemap is built from the content loader, so it contains only articles
// that pass frontmatter validation and are marked indexable. It cannot drift
// out of sync with what actually exists, and it will never list a redirect,
// a 404, a noindex page or a duplicate — which was the failure mode your
// instruction 13 warned about.
//
// lastModified uses each article's `updated` field, which is only bumped when
// content actually changes. It is not the build time. Feeding Google a fresh
// lastmod on every deploy is a deceptive-freshness signal.

import type { MetadataRoute } from "next";
import { getIndexableResources } from "@/lib/utils/markdown";

const SITE = "https://freelanceshield.me";

/**
 * Static routes. Add a route here only once it exists and has a reason to be
 * indexed. An empty category page in the sitemap is worse than no page.
 */
const STATIC_ROUTES: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "/", changeFrequency: "weekly", priority: 1.0 },
  { path: "/invoice-maker", changeFrequency: "monthly", priority: 0.9 },
  { path: "/contract-scanner", changeFrequency: "monthly", priority: 0.9 },
  { path: "/resources", changeFrequency: "weekly", priority: 0.7 },
  { path: "/about", changeFrequency: "yearly", priority: 0.5 },
  { path: "/methodology", changeFrequency: "yearly", priority: 0.4 },
  { path: "/legal/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/legal/terms", changeFrequency: "yearly", priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${SITE}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const articleEntries: MetadataRoute.Sitemap = getIndexableResources().map((post) => ({
    url: `${SITE}/resources/${post.slug}`,
    lastModified: new Date(post.updated),
    changeFrequency: "yearly",
    priority: 0.6,
  }));

  return [...staticEntries, ...articleEntries];
}
