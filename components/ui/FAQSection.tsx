// components/ui/FAQSection.tsx
//
// -------------------------------------------------------------------------
// WHAT CHANGED
// -------------------------------------------------------------------------
//
// 1. ANSWERS ARE NOW IN THE DOM. Previously the panel rendered as
//        {isActive && <motion.div>{faq.answer}</motion.div>}
//    so answer text only existed after a click, while the FAQPage JSON-LD
//    asserted all of it. Structured data has to describe content that is
//    actually on the page. Now built on <details>/<summary>: answers are in
//    the server-rendered HTML, collapsed by CSS, and expand natively.
//
// 2. NO LONGER A CLIENT COMPONENT. The accordion needed useState and
//    framer-motion for what <details> does natively. This removes JavaScript
//    from the critical path on every page that has an FAQ.
//
// 3. SAFER JSON-LD. JSON.stringify does not escape "<", so a question
//    containing "</script>" could break out of the script tag. Now escaped.
//    This mattered because FAQs are moving into markdown frontmatter.
//
// 4. NO FAQ ON EVERY PAGE. Only pass questions users actually ask. Repeating
//    the same generic block across pages is what makes FAQ markup look like
//    an SEO device rather than a help to the reader.

import React from "react";

export interface FAQ {
  question: string;
  /** Plain text. Keep it short enough to be a real answer, not a keyword dump. */
  answer: string;
}

interface FAQSectionProps {
  title?: string;
  description?: string;
  faqs: FAQ[];
  /**
   * Emit FAQPage structured data. Default false.
   *
   * Only enable it where the FAQs are the substantive purpose of that part of
   * the page. Google restricted FAQ rich results to authoritative government
   * and health sites, so for most pages this markup will not produce a rich
   * result and adding it everywhere is markup for its own sake.
   */
  withStructuredData?: boolean;
  /** Heading level, so the section nests correctly in the page outline. */
  headingLevel?: "h2" | "h3";
}

/** Escapes the sequences that can terminate a script element early. */
function safeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

export default function FAQSection({
  title = "Common questions",
  description,
  faqs,
  withStructuredData = false,
  headingLevel = "h2",
}: FAQSectionProps) {
  if (!faqs || faqs.length === 0) return null;

  const Heading = headingLevel;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <section className="border-t border-slate-100 py-14">
      {withStructuredData && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
        />
      )}

      <div className="mx-auto max-w-3xl px-6">
        <Heading className="text-2xl font-extrabold tracking-tight text-slate-900">
          {title}
        </Heading>
        {description && (
          <p className="mt-3 text-base text-slate-600">{description}</p>
        )}

        <div className="mt-8 divide-y divide-slate-200 border-y border-slate-200">
          {faqs.map((faq) => (
            <details key={faq.question} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded font-semibold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
                <span>{faq.question}</span>
                {/* Rotating chevron drawn in CSS. No animation library, and it
                    respects reduced-motion because the transition is on the
                    transform only and is under 200ms. */}
                <span
                  aria-hidden="true"
                  className="shrink-0 text-slate-400 transition-transform duration-150 group-open:rotate-45 motion-reduce:transition-none"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M8 3v10M3 8h10"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </summary>
              <div className="mt-3 max-w-[68ch] text-sm leading-relaxed text-slate-600">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
