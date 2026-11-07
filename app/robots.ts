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
        // NEVER disallow /_next/: Googlebot needs those JS and CSS files to
        // render the tools. Blocking them makes pages look empty to Google.
        disallow: [
          // Machine endpoints. (/dashboard is noindexed via metadata instead: a
          // robots block would stop Google from seeing that noindex.)
          "/api/",
          // Query-string states of the tools. The canonical tool URL is the
          // one that should be indexed; parameterised variants are duplicates.
          "/invoice-maker?",
          "/contract-scanner?",
          "/project-planner?",
        ],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
