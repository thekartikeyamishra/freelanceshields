// app/contract-scanner/page.tsx
//
// Was a "use client" page, so its title and description fell back to the
// site-wide defaults and were identical to the homepage. Now a server component
// with its own metadata; only the workspace is client-side.
//
// The page-level <nav> the old version rendered has been removed. Site
// navigation now comes from the layout, so there is one nav, not three.

import type { Metadata } from "next";
import Link from "next/link";
import ContractScannerWorkspace from "@/components/core/ContractScannerWorkspace";
import FAQSection, { type FAQ } from "@/components/ui/FAQSection";

const SITE = "https://freelanceshield.me";

export const metadata: Metadata = {
  title: "Contract Scanner — Spot clauses worth reading twice",
  description:
    "Paste a freelance contract or NDA and see which of twelve clause types it contains, what each one does, and which freelancer protections are missing. Runs in your browser.",
  alternates: { canonical: `${SITE}/contract-scanner` },
  openGraph: {
    type: "website",
    url: `${SITE}/contract-scanner`,
    title: "Contract Scanner for freelancers",
    description:
      "See which clause types your agreement contains and which protections it lacks.",
  },
};

const faqs: FAQ[] = [
  {
    question: "Is my contract uploaded anywhere?",
    answer:
      "No. The text is held in the page while you are on it and is gone when you close or reload. It is not written to storage and there is no request in the code that sends it anywhere.",
  },
  {
    question: "Is this AI?",
    answer:
      "No, and it is worth being clear about that. It matches your text against the wording of twelve known clause types using regular expressions. It does not read or interpret your agreement.",
  },
  {
    question: "Why is there no risk score?",
    answer:
      "Because any score this tool could produce would be misleading. It can only count wordings it recognises, so a contract full of unusual language would score well while being terrible. Counting what was found and naming what was missing is honest; a single number is not.",
  },
  {
    question: "It found nothing. Is my contract safe?",
    answer:
      "That is not what a nil result means. It means none of the wordings this tool looks for appeared. A contract can be badly one-sided in language it does not recognise, and it may still be missing protections you need.",
  },
  {
    question: "Does this replace a lawyer?",
    answer:
      "No. It is a reading aid that points you at parts of the document worth slowing down over. For an agreement that carries real money or real liability, have a qualified lawyer in the relevant jurisdiction review it.",
  },
];

export default function ContractScannerPage() {
  return (
    <div className="bg-slate-50 pb-24">
      <nav aria-label="Breadcrumb" className="border-b border-slate-200 bg-white px-6 py-3">
        <ol className="mx-auto flex max-w-4xl items-center gap-2 text-xs text-slate-500">
          <li>
            <Link href="/" className="hover:text-brand-700 hover:underline">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="font-medium text-slate-700" aria-current="page">
            Contract scanner
          </li>
        </ol>
      </nav>

      <header className="bg-white px-4 pb-10 pt-12 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Contract scanner for freelancers
          </h1>
          <p className="mt-4 max-w-[68ch] text-lg leading-relaxed text-slate-600">
            Paste an agreement and see which of twelve clause types it contains, what
            each kind of clause generally does, and which freelancer-protective
            provisions are missing. It runs in your browser and nothing is uploaded.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <ContractScannerWorkspace />
      </main>

      <div className="bg-white">
        <section className="mx-auto max-w-3xl px-6 py-14">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
            The clauses that cost freelancers money
          </h2>
          <p className="mt-4 max-w-[68ch] leading-relaxed text-slate-600">
            Most freelance contracts are not malicious. They are a template written
            for the client&apos;s benefit that nobody on their side has thought hard
            about. Four provisions account for most of the damage.
          </p>

          <dl className="mt-8 space-y-6">
            <div>
              <dt className="font-bold text-slate-900">Uncapped indemnity</dt>
              <dd className="mt-1 max-w-[68ch] text-sm leading-relaxed text-slate-600">
                An indemnity moves the cost of third-party claims onto you. Whether
                that is reasonable depends on whether it is mutual, whether it is
                limited to claims arising from your own negligence, and whether it is
                capped. A one-sided uncapped indemnity on a small contract puts your
                exposure far above what you are being paid.
              </dd>
            </div>
            <div>
              <dt className="font-bold text-slate-900">
                IP that transfers on delivery rather than on payment
              </dt>
              <dd className="mt-1 max-w-[68ch] text-sm leading-relaxed text-slate-600">
                If ownership passes when you hand the work over, a client can be using
                it while your invoice is still outstanding. Tying transfer to payment
                in full is a one-line change that materially improves your position.
              </dd>
            </div>
            <div>
              <dt className="font-bold text-slate-900">
                Acceptance at the client&apos;s sole discretion
              </dt>
              <dd className="mt-1 max-w-[68ch] text-sm leading-relaxed text-slate-600">
                When acceptance rests on subjective satisfaction rather than written
                criteria, payment can be withheld over taste rather than over whether
                you met the brief. Objective acceptance criteria and a deadline after
                which work is deemed accepted both solve this.
              </dd>
            </div>
            <div>
              <dt className="font-bold text-slate-900">
                A venue you cannot realistically use
              </dt>
              <dd className="mt-1 max-w-[68ch] text-sm leading-relaxed text-slate-600">
                A governing-law clause pointing at a court on another continent can
                make a claim over an unpaid invoice cost more to bring than the
                invoice is worth. Worth checking before you sign, not after.
              </dd>
            </div>
          </dl>

          <p className="mt-8 max-w-[68ch] text-sm leading-relaxed text-slate-600">
            The scanner can point you at these. It cannot tell you whether yours is
            reasonable, because that depends on the exact wording, the rest of the
            agreement, and the law where you and your client are established.
          </p>
        </section>

        <FAQSection
          title="Questions about the scanner"
          faqs={faqs}
          withStructuredData={false}
        />

        <section className="mx-auto max-w-3xl px-6 pb-16">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Related guides
          </h2>
          <ul className="mt-6 space-y-3 text-sm">
            {[
              { href: "/resources/what-is-mutual-indemnity-freelance", label: "How mutual indemnity clauses work" },
              { href: "/resources/what-is-work-made-for-hire", label: "What “work made for hire” means for your ownership" },
              { href: "/resources/how-to-push-back-on-non-compete", label: "Negotiating a non-compete as a contractor" },
              { href: "/invoice-maker", label: "Make an invoice once the contract is signed" },
            ].map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="font-medium text-brand-700 underline decoration-brand-300 underline-offset-2 hover:text-brand-800"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
