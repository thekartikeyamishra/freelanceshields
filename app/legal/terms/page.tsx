// app/legal/terms/page.tsx
//
// -------------------------------------------------------------------------
// WHAT CHANGED
// -------------------------------------------------------------------------
//
// 1. "This tool uses automated heuristics and AI to identify potential common
//    risks" -> the AI claim is removed. There is no AI. This mattered more here
//    than elsewhere because the terms are the document a user is asked to rely
//    on when deciding what the tool does.
//
// 2. ADDED WHAT WAS MISSING. The previous version had no advertising clause, no
//    acceptable-use detail beyond three bullets, no severability, no changes
//    clause, and no statement about the guides as distinct from the tools.
//
// 3. THE LIABILITY SECTION IS UNCHANGED IN SUBSTANCE. It was reasonable.
//
// NOT LEGAL ADVICE, AND NOT LAWYER-REVIEWED. This is a factual description of
// what the software does, written by an engineer. Before relying on the
// governing-law and liability clauses in a dispute, have a lawyer read them.
// Consumer-protection law in the EU and UK limits how far liability exclusions
// bind consumers regardless of what a document says.

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const SITE = "https://freelanceshield.me";
const LAST_UPDATED = "3 September 2026";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms that apply when you use the FreelanceShield invoice generator, contract scanner and guides.",
  alternates: { canonical: `${SITE}/legal/terms` },
};

function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold text-slate-900">{heading}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-700">
        {children}
      </div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <div className="bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-100 bg-white p-8 shadow-sm md:p-12">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-brand-700"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to home
        </Link>

        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: {LAST_UPDATED}</p>

        <p className="mt-6 max-w-[68ch] text-sm leading-relaxed text-slate-700">
          These terms apply to freelanceshield.me and to the tools on it. Using the
          site means you accept them. If you do not, please do not use the tools.
        </p>

        <Section heading="1. What these tools are">
          <p>
            FreelanceShield provides two free tools and a set of guides.{" "}
            <strong className="font-semibold">
              It is not a law firm, an accountancy practice, or a financial adviser.
            </strong>
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong className="font-semibold">Contract scanner.</strong> It matches
              your text against the wording of a fixed list of clause types using
              pattern matching. It does not use artificial intelligence, it does not
              read or interpret your agreement, and it has no knowledge of the law
              that governs it. A clause being flagged does not mean it is unfair, and
              nothing being flagged does not mean your contract is safe. It is a
              reading aid, not a review.
            </li>
            <li>
              <strong className="font-semibold">Invoice generator.</strong> It formats
              and totals data you enter and produces a PDF. You are responsible for
              whether the resulting invoice complies with the tax and invoicing rules
              that apply to you. Which tax rate applies to your supply, and whether
              reverse charge is available, are questions about your circumstances in
              your jurisdiction.
            </li>
            <li>
              <strong className="font-semibold">Guides.</strong> General educational
              information. Each one states which country it applies to and, for tax
              content, which year the rules were current for. Rules change, and a
              guide accurate on its stated date may not be accurate now.
            </li>
          </ul>
        </Section>

        <Section heading="2. Your data and your responsibility for it">
          <p>
            The tools run in your browser. Invoice drafts are saved to your
            browser&apos;s local storage, which is on your device. Contract text is
            held only while the page is open. We do not receive, store or have any
            copy of either. The{" "}
            <Link
              href="/legal/privacy"
              className="font-medium text-brand-700 underline decoration-brand-300 underline-offset-2"
            >
              privacy policy
            </Link>{" "}
            sets this out in full.
          </p>
          <p>Because your data is on your device and not on a server:</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              Keeping your own copies is your responsibility. Download the PDFs you
              need.
            </li>
            <li>
              We cannot recover anything if you clear your browser storage, use a
              different browser or device, or lose the device.
            </li>
            <li>
              Local storage is not encrypted. Anyone with access to your unlocked
              device can read a saved draft.
            </li>
          </ul>
        </Section>

        <Section heading="3. Advertising">
          <p>
            The site carries advertising supplied by Google, which is what pays for
            the tools being free. Ads are labelled and are not placed inside the
            invoice form or the scanner workflow. We do not endorse advertised
            products, we do not choose which ads you see, and any transaction you
            enter into with an advertiser is between you and them.
          </p>
        </Section>

        <Section heading="4. Acceptable use">
          <p>You agree not to:</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              use the invoice generator to produce fraudulent, misleading or
              fictitious invoices;
            </li>
            <li>
              attempt to disrupt the site, including by automated request flooding;
            </li>
            <li>
              scrape the guides for republication, or reproduce them at scale without
              permission;
            </li>
            <li>use the site for any unlawful purpose.</li>
          </ul>
        </Section>

        <Section heading="5. Intellectual property">
          <p>
            The site&apos;s code, design and written guides belong to their author.
            Everything you put into the tools, and every invoice you generate, is
            yours. We claim no rights over your content and, since we never receive
            it, could not exercise any.
          </p>
        </Section>

        <Section heading="6. No warranty">
          <p>
            The service is provided on an &quot;as is&quot; and &quot;as
            available&quot; basis, without warranties of any kind. There is no
            guarantee that the site will be available, that the scanner will identify
            any particular clause, or that a generated invoice will satisfy any
            particular tax authority or client.
          </p>
        </Section>

        <Section heading="7. Limitation of liability">
          <p>
            To the maximum extent permitted by law, FreelanceShield and its operator
            shall not be liable for any indirect, incidental, special, consequential
            or punitive damages, or for loss of profits, revenue, data or goodwill,
            arising from:
          </p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>your use of, or inability to use, the service;</li>
            <li>
              anything the contract scanner failed to identify, or identified in a way
              that turned out not to matter;
            </li>
            <li>
              any tax, legal or commercial consequence of a document produced with
              these tools;
            </li>
            <li>loss of data stored on your own device.</li>
          </ul>
          <p>
            Nothing in these terms excludes or limits liability that cannot lawfully
            be excluded or limited. If you are a consumer, you keep all the statutory
            rights the law of your country gives you, and nothing here overrides them.
          </p>
        </Section>

        <Section heading="8. Changes">
          <p>
            These terms may change. The date at the top will be updated when they do.
            Continuing to use the site after a change means you accept the revised
            terms.
          </p>
        </Section>

        <Section heading="9. Severability">
          <p>
            If any provision here is found unenforceable, the rest continues to apply.
          </p>
        </Section>

        <Section heading="10. Governing law">
          <p>
            These terms are governed by the laws of India, and disputes are subject to
            the courts of Prayagraj, Uttar Pradesh, India. If you are a consumer
            resident elsewhere, this does not deprive you of the protection of
            mandatory consumer-protection rules in your own country.
          </p>
        </Section>

        <Section heading="11. Contact">
          <p>
            Questions about these terms:{" "}
            <a
              href="mailto:workmailkartikeya@gmail.com"
              className="font-medium text-brand-700 underline decoration-brand-300 underline-offset-2"
            >
              workmailkartikeya@gmail.com
            </a>
          </p>
        </Section>
      </div>
    </div>
  );
}
