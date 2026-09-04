// app/resources/page.tsx
//
// CHANGES
//
// 1. "Written by verified engineers" REMOVED from the meta description. It is
//    one person, and "verified" by nobody. That phrase was being served as the
//    search-result snippet for the whole knowledge base.
//
// 2. THE TOP-FOLD AD IS GONE. The old page opened with a slot labelled
//    "Sponsored" as the first thing under the header, above any article. On a
//    category page whose entire purpose is a list of links, an ad in that
//    position is the first thing a visitor sees and the first thing a reviewer
//    sees.
//
// 3. GROUPED BY TOPIC. A flat reverse-chronological list of ~110 items, nearly
//    all sharing one date, reads as a dump. Grouping by cluster makes the
//    structure legible to readers and gives crawlers a topical signal.
//
// 4. The <Suspense> wrapper was removed: getAllResources() is synchronous
//    filesystem work at build time, so it never suspended and the skeleton
//    never rendered.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getAllResources, type ResourceCategory } from "@/lib/utils/markdown";

const SITE = "https://freelanceshield.me";

export const metadata: Metadata = {
  title: "Guides for freelancers — invoicing, contracts and tax",
  description:
    "Practical guides on invoicing, contract clauses and freelance tax. Each one states which country it applies to and cites the authority it rests on.",
  alternates: { canonical: `${SITE}/resources` },
};

const CLUSTERS: Array<{ id: ResourceCategory; title: string; blurb: string }> = [
  {
    id: "invoicing",
    title: "Invoicing",
    blurb: "Getting an invoice built correctly so it clears a finance team first time.",
  },
  {
    id: "getting-paid",
    title: "Getting paid",
    blurb: "What to do when an invoice is late, disputed, or being ignored.",
  },
  {
    id: "contracts",
    title: "Contracts",
    blurb: "What individual clauses do, and which ones change your exposure.",
  },
  {
    id: "tax",
    title: "Tax",
    blurb: "Jurisdiction-specific. Each guide names its country and the year it applies to.",
  },
  {
    id: "pricing",
    title: "Pricing",
    blurb: "Setting rates, and charging for work outside the original scope.",
  },
  {
    id: "privacy",
    title: "Privacy and tooling",
    blurb: "Handling client documents without leaking them.",
  },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ResourcesPage() {
  const all = getAllResources().filter((post) => post.indexable);

  // With no publishable guides, this page has nothing on it. Returning 404 is
  // correct: an index page listing zero items that answers with HTTP 200 is a
  // soft-404, which is exactly what Google's guidance says not to serve.
  if (all.length === 0) notFound();


  return (
    <div className="bg-slate-50 pb-24">
      <header className="border-b border-slate-200 bg-white px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Guides for freelancers
          </h1>
          <p className="mt-4 max-w-[68ch] text-lg leading-relaxed text-slate-600">
            Invoicing, contract clauses and tax. Every guide states which country it
            applies to, because none of these rules transfer across borders, and the
            tax guides name the year their figures were current for.
          </p>
          <p className="mt-4 max-w-[68ch] text-sm leading-relaxed text-slate-500">
            Written by Kartikeya Mishra. General information, not legal or tax advice.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-6">
        {CLUSTERS.map((cluster) => {
          const posts = all.filter((post) => post.category === cluster.id);
          if (posts.length === 0) return null;

          return (
            <section key={cluster.id} className="mt-14 scroll-mt-20" id={cluster.id}>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                {cluster.title}
              </h2>
              <p className="mt-1 max-w-[68ch] text-sm text-slate-600">
                {cluster.blurb}
              </p>

              <ul className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                  <li key={post.slug} className="flex">
                    <Link
                      href={`/resources/${post.slug}`}
                      className="group flex flex-1 flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                    >
                      <p className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                        <time dateTime={post.updated}>{formatDate(post.updated)}</time>
                        {post.jurisdictions[0] !== "GLOBAL" && (
                          <span className="rounded border border-slate-200 px-1.5 py-0.5 font-medium text-slate-500">
                            {post.jurisdictions.join(", ")}
                          </span>
                        )}
                      </p>

                      <h3 className="mt-3 flex-1 text-lg font-bold leading-snug text-slate-900 transition-colors group-hover:text-brand-700">
                        {post.title}
                      </h3>

                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600">
                        {post.description}
                      </p>

                      <span className="mt-5 flex items-center gap-1.5 text-sm font-bold text-brand-700">
                        Read
                        <ArrowRight
                          size={15}
                          aria-hidden="true"
                          className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
                        />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </main>
    </div>
  );
}
