// app/page.tsx
//
// -------------------------------------------------------------------------
// CLAIMS CORRECTED
// -------------------------------------------------------------------------
//
// 1. "AI Contract Scanner" -> "Contract scanner". The tool is regular
//    expressions. The scanner's own page already said "heuristics engine" and
//    "heuristic pattern matching", so the site contradicted itself between the
//    homepage and the tool.
//
// 2. "our tools and guides are engineered by professionals who have navigated
//    the complexities of international independent contracting" -> singular and
//    specific. It is one person. /resources/why-freelance-shield-is-free says
//    "why I built these local-first tools", so the plural was contradicted by
//    the site's own content.
//
// 3. "Zero Data Retention" and "never touch our servers" -> kept, because the
//    code supports them, but made precise about localStorage being on disk.
//
// 4. "Instantly detect dangerous indemnity clauses ... before you sign" ->
//    "detect" overstates what matching can do. Reworded to what it does.
//
// 5. The comment "SEO / ADSENSE COMPLIANCE SECTION — Crucial for preventing
//    'Low Value Content' flags" is gone, along with the mindset. That section
//    now exists because a first-time visitor needs to know what this is.

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileText, ShieldAlert, BookOpen } from "lucide-react";
import { getIndexableResources } from "@/lib/utils/markdown";

const SITE = "https://freelanceshield.me";

export const metadata: Metadata = {
  // Overrides the layout template with an absolute title for the homepage.
  title: {
    absolute:
      "FreelanceShield — Free invoice generator and contract scanner for freelancers",
  },
  description:
    "Make an invoice PDF or check a contract for clauses worth reading twice. Free, no sign-up, and your data never leaves your browser.",
  alternates: { canonical: SITE },
};

const TOOLS = [
  {
    href: "/invoice-maker",
    icon: FileText,
    iconClass: "text-brand-600",
    title: "Invoice generator",
    body: "Thirteen currencies, tax registration numbers, discounts and cross-border reverse charge. Exports a real text PDF, not a screenshot, so it survives corporate accounts-payable systems.",
    cta: "Make an invoice",
  },
  {
    href: "/contract-scanner",
    icon: ShieldAlert,
    iconClass: "text-amber-500",
    title: "Contract scanner",
    body: "Paste an agreement and see which of twelve clause types it contains, what each one generally does, and which freelancer protections are missing. Pattern matching, not a language model.",
    cta: "Check a contract",
  },
  {
    href: "/resources",
    icon: BookOpen,
    iconClass: "text-emerald-600",
    title: "Guides",
    body: "Invoicing, contracts and tax, each one stating which country it applies to and citing the authority it rests on. Because none of those rules transfer across borders.",
    cta: "Read the guides",
    requiresGuides: true,
  },
];

export default function HomePage() {
  // The guides card links to /resources, which 404s when no guides exist.
  // Advertising a section that is not there is worse than a two-card grid.
  const hasGuides = getIndexableResources().length > 0;
  const tools = TOOLS.filter((t) => !t.requiresGuides || hasGuides);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-50 px-4 pb-24 pt-20 sm:px-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 mx-auto max-w-7xl opacity-40"
        >
          <div className="absolute right-[-5%] top-[-10%] h-[500px] w-[500px] rounded-full bg-brand-200/50 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
            Free, no account needed
          </p>

          <h1 className="mt-8 text-4xl font-black leading-[1.1] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Invoicing and contract tools that keep your data on your device
          </h1>

          <p className="mx-auto mt-6 max-w-[60ch] text-lg leading-relaxed text-slate-600">
            Make a professional invoice PDF, or check an agreement for the clauses
            worth reading twice. Both run entirely in your browser. Nothing you type
            is uploaded.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/invoice-maker"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-8 py-4 font-bold text-white shadow-xl shadow-brand-600/20 transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 sm:w-auto"
            >
              Make an invoice
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link
              href="/contract-scanner"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-8 py-4 font-bold text-slate-700 transition-colors hover:border-brand-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 sm:w-auto"
            >
              <ShieldAlert size={18} aria-hidden="true" className="text-slate-400" />
              Check a contract
            </Link>
          </div>
        </div>
      </section>

      {/* Tools.
          No ad sits between the hero and this grid any more. The previous
          version placed a slot labelled "Sponsored Tools" immediately below the
          hero CTAs and immediately above three cards that are also links to
          tools — an ad labelled like the content directly beside it, in the
          path of the primary action. */}
      <section className="bg-white px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
            What&apos;s here
          </h2>

          <div className={`mt-12 grid gap-8 ${tools.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="group flex flex-col rounded-3xl border border-slate-100 bg-slate-50 p-8 transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                >
                  <span className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-100 bg-white shadow-sm">
                    <Icon size={24} aria-hidden="true" className={tool.iconClass} />
                  </span>
                  <h3 className="text-xl font-bold text-slate-900">{tool.title}</h3>
                  <p className="mt-3 flex-1 leading-relaxed text-slate-600">
                    {tool.body}
                  </p>
                  <span className="mt-6 flex items-center gap-1.5 font-bold text-brand-700">
                    {tool.cta}
                    <ArrowRight
                      size={16}
                      aria-hidden="true"
                      className="transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
                    />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* What this is */}
      <section className="bg-slate-900 px-4 py-24 text-white sm:px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-extrabold tracking-tight">
            What you should know before you use it
          </h2>

          <div className="mt-10 space-y-8">
            <div>
              <h3 className="text-lg font-bold">Your documents stay on your device</h3>
              <p className="mt-2 max-w-[68ch] leading-relaxed text-slate-300">
                Neither tool contains code that sends your content anywhere. Your
                invoice draft is saved to your browser&apos;s local storage so a
                refresh does not lose it, which means it is on your disk in plain
                form, not encrypted and not on a server. You can erase it from the
                tool at any time. That is the whole of the claim, and it is one the
                code can back.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold">
                The scanner matches patterns; it does not read your contract
              </h3>
              <p className="mt-2 max-w-[68ch] leading-relaxed text-slate-300">
                It checks for the wording of twelve clause types and explains what
                each kind of clause generally does. A clause being flagged does not
                mean it is unfair, and nothing being flagged does not mean the
                contract is safe. For anything that matters, get a lawyer to read it.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold">Guides say where they apply</h3>
              <p className="mt-2 max-w-[68ch] leading-relaxed text-slate-300">
                Indian GST, LUTs and FIRCs are things I have dealt with directly,
                invoicing US and UK clients from India. Where a guide covers ground I
                have not walked, it cites the tax authority or statute it rests on, and
                names the year those rules were current for. Nothing here is legal or
                tax advice.
              </p>
            </div>
          </div>

          <div className="mt-12">
            <Link
              href="/about"
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-5 py-3 font-semibold transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              More about how this works
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}