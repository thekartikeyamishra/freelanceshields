// app/project-planner/page.tsx — ProjectSafe planner. Server-rendered copy,
// client workspace. One H1; supporting content below the tool.

import type { Metadata } from "next";
import Link from "next/link";
import ProjectPlannerWorkspace from "@/components/project/ProjectPlannerWorkspace";
import AdPlacement from "@/components/ads/AdPlacement";
import FAQSection, { type FAQ } from "@/components/ui/FAQSection";

const SITE = "https://freelanceshield.me";

export const metadata: Metadata = {
  title: "Freelance Project Planner — Scope, Milestones and Agreement PDF",
  description:
    "Plan a freelance project with clear scope, paid milestones and fair terms. A built-in check flags gaps, and you can export a fingerprinted agreement summary PDF. Free, in your browser.",
  alternates: { canonical: `${SITE}/project-planner` },
  openGraph: {
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "FreelanceShield — free, private tools for freelancers" }],
    type: "website",
    url: `${SITE}/project-planner`,
    title: "Freelance Project Planner",
    description: "Scope, milestones and terms in one plan, checked for gaps, exported as a PDF.",
  },
};

const faqs: FAQ[] = [
  {
    question: "Does this hold or protect payments?",
    answer:
      "No. It plans and documents the project; it does not hold, move or guarantee money. Holding client funds requires a licensed payment arrangement. A clear plan with an upfront deposit and paid milestones is still the most effective protection most freelancers have.",
  },
  {
    question: "What is the fingerprint on the PDF?",
    answer:
      "A SHA-256 code computed from the exact plan. If anything is changed, the code changes. If you and your client compare codes and they match, you are both holding the same terms. It is not an electronic signature.",
  },
  {
    question: "Is the PDF a contract?",
    answer:
      "It is a summary of agreed terms, laid out so both sides can sign it. Whether a signed copy is binding depends on where you are. For significant projects, have a lawyer in your jurisdiction review it.",
  },
  {
    question: "Where is my plan stored?",
    answer:
      "In this browser's local storage, on your device. Nothing is uploaded. Use the Delete link under the export panel to erase the plan and its locked versions.",
  },
];

export default function ProjectPlannerPage() {
  return (
    <div className="bg-slate-50 pb-20">
      <nav aria-label="Breadcrumb" className="border-b border-slate-200 bg-white px-6 py-3">
        <ol className="mx-auto flex max-w-6xl items-center gap-2 text-xs text-slate-500">
          <li><Link href="/" className="hover:text-brand-700 hover:underline">Home</Link></li>
          <li aria-hidden="true">/</li>
          <li className="font-medium text-slate-700" aria-current="page">Project planner</li>
        </ol>
      </nav>

      <header className="bg-white px-4 pb-8 pt-10 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Freelance project planner</h1>
          <p className="mt-4 max-w-[68ch] text-base leading-relaxed text-slate-600">
            Turn a verbal agreement into a written plan before work starts: what you will deliver, how each
            part counts as done, which payment it belongs to, and what happens if the project is cancelled.
            A check flags the gaps that most often lead to unpaid work, and you can export the result as a PDF
            both sides can sign.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <ProjectPlannerWorkspace />
      </div>

      <div className="bg-white">
        <section className="mx-auto max-w-3xl px-6 py-14">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Why scope and milestones matter more than the contract template</h2>
          <p className="mt-4 max-w-[68ch] leading-relaxed text-slate-600">
            Most freelance payment disputes are not about legal wording. They are about whether something was
            in scope, whether it was finished, and when it should have been paid. Those three questions are
            answered by acceptance criteria, milestones and review deadlines — the parts a generic template
            leaves blank.
          </p>
          <dl className="mt-8 space-y-6">
            <div>
              <dt className="font-bold text-slate-900">Acceptance criteria</dt>
              <dd className="mt-1 max-w-[68ch] text-sm leading-relaxed text-slate-600">
                “Done when the client approves” invites endless revision. “Done when the pages render correctly
                at 375px and 1440px” is a fact either side can check.
              </dd>
            </div>
            <div>
              <dt className="font-bold text-slate-900">A deposit and paid milestones</dt>
              <dd className="mt-1 max-w-[68ch] text-sm leading-relaxed text-slate-600">
                Splitting payment caps how much work is ever at risk at once. If a client stops paying, you lose
                one milestone, not the whole project.
              </dd>
            </div>
            <div>
              <dt className="font-bold text-slate-900">A review deadline</dt>
              <dd className="mt-1 max-w-[68ch] text-sm leading-relaxed text-slate-600">
                Without one, a submission can sit unreviewed indefinitely. Agreeing a number of days gives both
                sides a clear point at which to follow up.
              </dd>
            </div>
          </dl>
          <p className="mt-8 text-sm text-slate-600">
            Got a contract from the client instead?{" "}
            <Link href="/contract-scanner" className="font-semibold text-brand-700 underline decoration-brand-300 underline-offset-2">Check it with the contract scanner</Link>.
            Ready to bill a milestone?{" "}
            <Link href="/invoice-maker" className="font-semibold text-brand-700 underline decoration-brand-300 underline-offset-2">Make the invoice</Link>.
          </p>
        </section>

        {/* One ad, after the supporting content, far from the tool controls. */}
        <AdPlacement name="toolFooter" />

        <FAQSection title="Questions about the planner" faqs={faqs} />
      </div>
    </div>
  );
}
