// app/resources/[slug]/page.tsx
//
// -------------------------------------------------------------------------
// WHAT CHANGED
// -------------------------------------------------------------------------
//
// 1. THE FABRICATED CREDENTIAL IS GONE. The author block rendered:
//        "Kartikeya Mishra"  + a blue CheckCircle (a verification-badge mimic)
//        "E-E-A-T Verified AI Engineer"
//    No body awards "E-E-A-T Verified" — it is an SEO acronym dressed up as a
//    certification, and it sat on tax and legal pages. The blue tick beside the
//    name compounded it by imitating platform verification.
//
//    Replaced with a byline that states what is actually true and checkable: a
//    named person, their real role, a link to a real profile, and — where the
//    article covers something they have done themselves — a specific statement
//    of that experience rather than a badge asserting it.
//
// 2. THREE AD SLOTS DOWN TO ONE. The old template rendered "Sponsored Tools"
//    between the author block and the first paragraph, and "Recommended
//    Freelance Tools" at the end, on articles whose body ran to roughly 250
//    words. Both labels read as editorial recommendations. There is now one
//    slot, after the article ends, labelled "Advertisement", and it does not
//    render at all on articles below a length threshold.
//
// 3. EDITORIAL METADATA IS NOW DISPLAYED. Jurisdiction, the tax year the rules
//    were current for, the last revision date, and the sources the article rests
//    on. Previously none of this appeared, on pages covering eight tax regimes.
//
// 4. SCHEMA CORRECTED. The old Article markup asserted
//    jobTitle: "AI Engineer & Software Developer" and used a publisher logo at
//    kartikeyamishra.info/logo.svg — a different domain. dateModified was
//    absent entirely on date-sensitive tax content. Fixed.
//
// 5. notFound() NOW WORKS. getResourceBySlug used to return null on a bad slug
//    and the page checked for it. It now throws on invalid frontmatter, which is
//    a build error, but a genuinely missing slug should still be a 404 — handled
//    explicitly below rather than surfacing as a 500.

import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
// remark-gfm was already in package.json but was never passed to ReactMarkdown,
// so GitHub-flavoured markdown was not being parsed in ANY article: tables,
// strikethrough, task lists and autolinks all rendered as literal characters.
// On a tax guide comparing thresholds, a markdown table came out as raw pipes.
import remarkGfm from "remark-gfm";
import { ArrowLeft, CalendarDays, MapPin, ExternalLink } from "lucide-react";
import {
  getResourceBySlug,
  getResourceSlugs,
  type ResourcePost,
} from "@/lib/utils/markdown";
import AdSlot from "@/components/ads/AdSlot";

const SITE = "https://freelanceshield.me";

/** Ad unit for the end of an article. Replace with your real slot id. */
const ARTICLE_AD_SLOT = "9179557454";

/** Articles shorter than this carry no advertising at all. */
const MIN_WORDS_FOR_AD = 700;

interface Props {
  params: Promise<{ slug: string }>;
}

/** Safe lookup: build errors stay errors, missing slugs become 404s. */
function findPost(slug: string): ResourcePost | null {
  if (!getResourceSlugs().includes(slug)) return null;
  return getResourceBySlug(slug);
}

export async function generateStaticParams() {
  return getResourceSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = findPost(slug);

  if (!post) return { title: "Guide not found" };

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `${SITE}/resources/${post.slug}` },
    authors: [{ name: post.author }],
    // Honour the frontmatter flag. Consolidated or superseded articles can be
    // kept live for people who have the link while being kept out of search.
    robots: post.indexable ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      type: "article",
      url: `${SITE}/resources/${post.slug}`,
      title: post.title,
      description: post.description,
      publishedTime: post.published,
      modifiedTime: post.updated,
      authors: [post.author],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

function safeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const REGION_NAMES =
  typeof Intl !== "undefined" && "DisplayNames" in Intl
    ? new Intl.DisplayNames(["en"], { type: "region" })
    : null;

function jurisdictionLabel(code: string): string {
  if (code === "GLOBAL") return "Applies generally";
  try {
    return REGION_NAMES?.of(code) ?? code;
  } catch {
    return code;
  }
}

export default async function ResourcePostPage({ params }: Props) {
  const { slug } = await params;
  const post = findPost(slug);
  if (!post) notFound();

  const wordCount = post.content.trim().split(/\s+/).length;
  const showAd = wordCount >= MIN_WORDS_FOR_AD;
  const wasRevised = post.updated !== post.published;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.published,
    dateModified: post.updated,
    inLanguage: "en",
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE}/resources/${post.slug}` },
    author: {
      "@type": "Person",
      name: post.author,
      // Real role, not an invented credential.
      jobTitle: "Software engineer",
      sameAs: [
        "https://www.linkedin.com/in/thekartikeyamishra/",
        "https://x.com/kartikeyahere",
      ],
    },
    publisher: {
      "@type": "Organization",
      name: "FreelanceShield",
      url: SITE,
    },
    // Only present when the article actually cites sources.
    ...(post.sources.length > 0 && {
      citation: post.sources.map((source) => ({
        "@type": "CreativeWork",
        name: source.title,
        publisher: source.publisher,
        url: source.url,
      })),
    }),
  };

  return (
    <div className="bg-slate-50 pb-20">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />

      <nav aria-label="Breadcrumb" className="border-b border-slate-200 bg-white px-6 py-3">
        <ol className="mx-auto flex max-w-3xl flex-wrap items-center gap-2 text-xs text-slate-500">
          <li>
            <Link href="/" className="hover:text-brand-700 hover:underline">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/resources" className="hover:text-brand-700 hover:underline">
              Guides
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="font-medium text-slate-700" aria-current="page">
            {post.title}
          </li>
        </ol>
      </nav>

      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <Link
          href="/resources"
          className="group mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-brand-700"
        >
          <ArrowLeft
            size={16}
            aria-hidden="true"
            className="transition-transform group-hover:-translate-x-0.5 motion-reduce:transition-none"
          />
          All guides
        </Link>

        <header>
          <h1 className="text-3xl font-black leading-[1.15] tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            {post.title}
          </h1>
          <p className="mt-5 max-w-[68ch] text-lg leading-relaxed text-slate-600">
            {post.description}
          </p>

          {/* Editorial metadata. Everything here is checkable. */}
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
              <p className="text-slate-700">
                By{" "}
                <a
                  href="https://www.linkedin.com/in/thekartikeyamishra/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-brand-700 underline decoration-brand-300 underline-offset-2"
                >
                  {post.author}
                </a>
                , software engineer
              </p>

              <p className="flex items-center gap-1.5 text-slate-600">
                <CalendarDays size={14} aria-hidden="true" className="text-slate-400" />
                {wasRevised ? (
                  <>
                    Revised{" "}
                    <time dateTime={post.updated}>{formatDate(post.updated)}</time>
                    <span className="text-slate-400">
                      {" "}
                      · first published{" "}
                      <time dateTime={post.published}>{formatDate(post.published)}</time>
                    </span>
                  </>
                ) : (
                  <>
                    Published{" "}
                    <time dateTime={post.published}>{formatDate(post.published)}</time>
                  </>
                )}
              </p>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-slate-100 pt-4 text-sm">
              <p className="flex items-center gap-1.5 text-slate-600">
                <MapPin size={14} aria-hidden="true" className="text-slate-400" />
                {post.jurisdictions.map(jurisdictionLabel).join(", ")}
              </p>
              {post.applicableAsOf && (
                <p className="text-slate-600">
                  Rules as at{" "}
                  <span className="font-medium text-slate-800">
                    {post.applicableAsOf}
                  </span>
                </p>
              )}
            </div>

            {(post.category === "tax" || post.category === "contracts") && (
              <p className="mt-4 border-t border-slate-100 pt-4 text-xs leading-relaxed text-slate-500">
                General information, not {post.category === "tax" ? "tax" : "legal"}{" "}
                advice. Rules change and depend on your circumstances. Check the
                sources at the end and speak to a qualified professional before
                acting on anything here.
              </p>
            )}
          </div>
        </header>

        {/* Body. No ad between the header and the first paragraph.
            NOTE: the `prose` classes below only work now that globals.css
            declares `@plugin "@tailwindcss/typography"`. Under the previous
            setup the typography plugin was never loaded, so every article
            rendered with browser-default markdown styling. */}
        <div className="prose prose-slate prose-lg mt-12 max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-slate-900 prose-a:font-semibold prose-a:text-brand-700 hover:prose-a:text-brand-800 prose-img:rounded-2xl">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
        </div>

        {/* Sources */}
        {post.sources.length > 0 && (
          <section className="mt-14 rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-bold text-slate-900">Sources</h2>
            <p className="mt-1 text-sm text-slate-500">
              Where the factual claims above come from.
            </p>
            <ol className="mt-4 space-y-3">
              {post.sources.map((source) => (
                <li key={source.url} className="text-sm leading-relaxed">
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-start gap-1 font-medium text-brand-700 underline decoration-brand-300 underline-offset-2 hover:text-brand-800"
                  >
                    {source.title}
                    <ExternalLink
                      size={12}
                      aria-hidden="true"
                      className="mt-1 shrink-0"
                    />
                  </a>
                  <span className="text-slate-500"> — {source.publisher}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* One ad, after the article, only on substantial pages. */}
        {showAd && <AdSlot slotId={ARTICLE_AD_SLOT} reservedHeight={280} />}

        <div className="mt-12 border-t border-slate-200 pt-8">
          <p className="text-sm text-slate-600">
            Need to send an invoice?{" "}
            <Link
              href="/invoice-maker"
              className="font-semibold text-brand-700 underline decoration-brand-300 underline-offset-2 hover:text-brand-800"
            >
              The generator is free and runs in your browser.
            </Link>
          </p>
        </div>
      </article>
    </div>
  );
}