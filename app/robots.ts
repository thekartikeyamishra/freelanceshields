// app/robots.ts
//
// Next.js generates /robots.txt from this file.
//
// Deliberately permissive on assets: blocking CSS or JS prevents Google from
// rendering the page as a user sees it, which is a common self-inflicted
// ranking problem. Only genuinely non-public paths are disallowed.
//
// Note what is NOT here: no blanket AI-crawler block. The tools are the moat
// and being cited by an assistant is a distribution channel, not a leak.
// If you later want to exclude specific AI crawlers, add named user-agent
// groups rather than a wildcard that also catches search engines.

import type { MetadataRoute } from "next";

const SITE = "https://freelanceshield.me";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          // Next.js internals. No crawl value, and they waste crawl budget.
          "/_next/static/chunks/",
          // Query-string states of the tools. The canonical tool URL is the
          // one that should be indexed; parameterised variants are duplicates.
          "/invoice-maker?",
          "/contract-scanner?",
        ],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
