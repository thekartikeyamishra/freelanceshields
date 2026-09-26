// app/methodology/page.tsx
//
// NEW FILE. Three places link to /methodology and it does not exist, so those
// links currently 404: HeuristicNotice.tsx, SiteFooter.tsx, and the About page.
//
// It also does real work beyond fixing links. Publishing exactly what the
// scanner checks for is the strongest honest answer to "is this thing any
// good?" — a reader can see the whole list, judge the coverage themselves, and
// notice what is missing. That is a better trust signal than any badge, and it
// is the substance that a page like this is supposed to have.

import type { Metadata } from "next";
import Link from "next/link";
import { CLAUSE_COVERAGE_LABELS, CLAUSE_COVERAGE_COUNT } from "@/lib/ai/contractScanner";

const SITE = "https://freelanceshield.me";

export const metadata: Metadata = {
  title: "Methodology — how the contract scanner works",
  description:
    "The complete list of clause types the FreelanceShield scanner checks for, how the matching works, what it cannot do, and how the guides are sourced.",
  alternates: { canonical: `${SITE}/methodology` },
};

const PROTECTIONS = [
  "A stated payment deadline",
  "A cap on your liability",
  "A termination clause",
  "IP transfer tied to payment",
  "Interest or a fee on late payment",
  "A defined scope of work",
];

function Section({
  id,
  heading,
  children,
}: {
  id: string;
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mt-12 scroll-mt-20">
      <h2 className="text-2xl font-bold tracking-tight text-slate-900">{heading}</h2>
      <div className="mt-4 space-y-4 leading-relaxed text-slate-600">{children}</div>
    </section>
  );
}

export default function MethodologyPage() {
  return (
    <div className="bg-white">
      <nav aria-label="Breadcrumb" className="border-b border-slate-200 px-6 py-3">
        <ol className="mx-auto flex max-w-3xl items-center gap-2 text-xs text-slate-500">
          <li>
            <Link href="/" className="hover:text-brand-700 hover:underline">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="font-medium text-slate-700" aria-current="page">
            Methodology
          </li>
        </ol>
      </nav>

      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
          Methodology
        </h1>
        <p className="mt-5 max-w-[68ch] text-lg leading-relaxed text-slate-600">
          What the contract scanner actually does, the full list of what it checks
          for, and where the guides get their facts. If you are deciding whether to
          trust anything on this site, this is the page to read.
        </p>

        <Section id="scanner" heading="How the contract scanner works">
          <p>
            It is regular expressions. When you paste text, the tool tests it against
            a fixed set of patterns describing how {CLAUSE_COVERAGE_COUNT} clause
            types are usually worded. Where a pattern matches, it shows you the
            surrounding text and an explanation of what that kind of clause generally
            does.
          </p>
          <p>
            There is no machine learning, no language model, and no server. It is
            fast because pattern matching is trivial work, not because anything
            clever is happening. An earlier version of this tool inserted a
            two-second pause before showing results to make the analysis feel more
            substantial. That has been removed.
          </p>
        </Section>

        <Section id="checks" heading={`The ${CLAUSE_COVERAGE_COUNT} clause types it looks for`}>
          <p>
            Published in full so you can see the coverage and, more usefully, see
            what is not on the list.
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {CLAUSE_COVERAGE_LABELS.map((label) => (
              <li
                key={label}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700"
              >
                {label}
              </li>
            ))}
          </ul>
        </Section>

        <Section id="missing" heading="What it checks for the absence of">
          <p>
            This half is usually more useful than the detections. These six
            provisions generally work in a freelancer&apos;s favour, and the tool
            reports when it cannot find any wording matching them.
          </p>
          <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm">
            {PROTECTIONS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="text-sm">
            Absence detection is suppressed on pastes under roughly 120 words. On a
            short excerpt everything looks missing, and reporting that would be
            noise rather than information.
          </p>
        </Section>

        <Section id="no-score" heading="Why there is no risk score">
          <p>
            An earlier version showed a score out of 100. It started at 100 and
            subtracted points when a pattern matched, which meant a contract
            containing nothing but the sentence &quot;Contractor waives all
            payment&quot; scored 100 — presented as the most confident element on the
            page. Absence of recognised keywords is not safety.
          </p>
          <p>
            Any single number this tool could produce would carry that same flaw,
            because it can only measure wordings it recognises. Counting what was
            found and naming what was missing is something the method can actually
            support. A score is not.
          </p>
        </Section>

        <Section id="limits" heading="What it cannot do">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              It does not read your contract. It has no model of what your agreement
              says, only whether certain phrases appear in it.
            </li>
            <li>
              It has no knowledge of jurisdiction. Whether a non-compete is
              enforceable against a contractor differs by country and, in the US, by
              state. The tool does not know where you are.
            </li>
            <li>
              It will miss clauses written in unusual wording, and it will flag
              ordinary provisions that are fine in context. A perpetual licence
              matches the IP pattern whether it is a problem or not.
            </li>
            <li>
              It does not read attachments. If your agreement incorporates a
              statement of work or a schedule by reference, whatever is in that
              document is invisible to it.
            </li>
            <li>
              It is not legal advice and does not replace a lawyer.
            </li>
          </ul>
        </Section>

        <Section id="privacy" heading="What happens to what you paste">
          <p>
            It stays in the page. There is no request in the code that transmits it,
            it is not written to storage, and it is gone when you close or reload the
            tab. We do not have a copy, which also means there is nothing for us to
            lose or hand over.
          </p>
          <p>
            The invoice generator is slightly different: your draft is saved to your
            browser&apos;s local storage so a refresh does not destroy your work.
            That is on your disk, unencrypted, and you can erase it from the{" "}
            <Link
              href="/legal/privacy"
              className="font-medium text-brand-700 underline decoration-brand-300 underline-offset-2"
            >
              privacy page
            </Link>
            .
          </p>
        </Section>

        <Section id="editorial" heading="How the guides are written">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              Every guide names the country or countries it applies to. Tax and
              contract rules do not transfer across borders.
            </li>
            <li>
              Tax guides name the assessment or tax year their figures were current
              for, and cite the tax authority or statute they rest on. Thresholds
              change annually and a guide accurate on its date may not be accurate
              now.
            </li>
            <li>
              Revision dates are shown separately from publication dates, and are
              only changed when the content actually changes. Dates are not moved to
              make a page look fresh.
            </li>
            <li>
              Where a guide covers something the author has done personally, it says
              so. Where it does not, it rests on the cited sources and should be
              weighed accordingly.
            </li>
            <li>
              AI tools are used while drafting and while writing code. Everything
              published is checked against primary sources first.
            </li>
          </ul>
        </Section>

        <Section id="corrections" heading="Corrections">
          <p>
            If you find something wrong here, email{" "}
            <a
              href="mailto:workmailkartikeya@gmail.com"
              className="font-medium text-brand-700 underline decoration-brand-300 underline-offset-2"
            >
              workmailkartikeya@gmail.com
            </a>
            . Corrections to factual errors are made and the revision date on the
            affected page is updated.
          </p>
        </Section>

        <div className="mt-14 border-t border-slate-100 pt-8">
          <Link
            href="/contract-scanner"
            className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-7 py-3.5 font-bold text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            Try the scanner
          </Link>
        </div>
      </div>
    </div>
  );
}