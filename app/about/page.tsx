// app/about/page.tsx
//
// -------------------------------------------------------------------------
// CLAIMS REMOVED, AND WHY
// -------------------------------------------------------------------------
//
// The previous version of this page made four assertions the codebase does not
// support. An About page is where a publisher reviewer and an AI system both
// look to decide whether to trust everything else, so it is the worst possible
// place to overstate.
//
//   1. "AES — Encryption Standard" (in the values grid).
//      There is no encryption anywhere in the codebase. Invoice drafts sit in
//      localStorage as plain JSON, readable by anyone with the device or with
//      devtools open. Removed entirely rather than softened.
//
//   2. "100% — Open Source".
//      There is no public repository. github.com/thekartikeyamishra/freelanceshield
//      returns 404. Removed. If you open the repo later, put it back with a link.
//
//   3. "By using cutting-edge WebAssembly and WebLLM technologies, we run
//      powerful analysis engines directly inside your browser."
//      Neither WebAssembly nor WebLLM is used. The scanner is regular
//      expressions in a .ts file. This was the largest single overstatement on
//      the site, and it propagated: the homepage says "AI Contract Scanner",
//      an article explains the WASM architecture, and the terms say the scanner
//      "uses automated heuristics and AI".
//
//   4. "0ms — Server Latency".
//      Not a meaningful figure. The pages are served over a network.
//
// What replaces them is narrower and true: the tools genuinely do run in the
// browser and genuinely do not transmit your data. That claim is strong on its
// own and it survives scrutiny, which the other four would not.

import type { Metadata } from "next";
import Link from "next/link";
// Note: deliberately not importing brand icons (Linkedin/Twitter) from
// lucide-react. Those exports were removed in later versions, so importing
// them couples this page to a specific lucide release and breaks the build
// on upgrade. Plain labelled links work everywhere and read better anyway.
import { Cpu, Lock, FileText, ExternalLink } from "lucide-react";

const SITE = "https://freelanceshield.me";

export const metadata: Metadata = {
  title: "About FreelanceShield",
  description:
    "Who builds FreelanceShield, how the tools actually work, what they do and do not do with your data, and where the guides come from.",
  alternates: { canonical: `${SITE}/about` },
  openGraph: {
    type: "profile",
    url: `${SITE}/about`,
    title: "About FreelanceShield",
    description:
      "Who builds these tools, how they work, and what happens to your data.",
  },
};

export default function AboutPage() {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
          About FreelanceShield
        </h1>
        <p className="mt-5 max-w-[68ch] text-lg leading-relaxed text-slate-600">
          FreelanceShield is a small set of free tools for people who invoice their
          own clients. It is built and maintained by one person, and it is funded by
          advertising rather than by subscriptions or by anything to do with your
          data.
        </p>

        <section className="mt-14">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Who runs this
          </h2>
          <p className="mt-4 max-w-[68ch] leading-relaxed text-slate-600">
            I am Kartikeya Mishra, a software engineer in Prayagraj, India. I built
            these tools because I invoice international clients myself and kept
            running into the same problems: generators that watermark the PDF unless
            you pay, tools that want an account before they will let you download
            anything, and guidance written for one country presented as though it
            applied everywhere.
          </p>
          <p className="mt-4 max-w-[68ch] leading-relaxed text-slate-600">
            It is one person, not a team. Where a guide describes something I have
            done myself — Indian GST, LUTs, FIRCs, invoicing US and UK clients from
            India — I say so. Where it does not, it rests on the sources cited at the
            bottom of the page, and you should weigh it accordingly.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="https://www.linkedin.com/in/thekartikeyamishra/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-brand-300 hover:bg-slate-50"
            >
              LinkedIn <ExternalLink size={13} aria-hidden="true" />
            </a>
            <a
              href="https://x.com/kartikeyahere"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-brand-300 hover:bg-slate-50"
            >
              X (Twitter) <ExternalLink size={13} aria-hidden="true" />
            </a>
            <a
              href="mailto:workmailkartikeya@gmail.com"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-brand-300 hover:bg-slate-50"
            >
              Email
            </a>
          </div>
        </section>

        <section className="mt-14">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            How the tools actually work
          </h2>
          <p className="mt-4 max-w-[68ch] leading-relaxed text-slate-600">
            Being specific here matters more than sounding impressive, so:
          </p>

          <div className="mt-6 space-y-6">
            <div className="flex gap-4">
              <FileText size={20} aria-hidden="true" className="mt-1 shrink-0 text-brand-600" />
              <div>
                <h3 className="font-bold text-slate-900">The invoice generator</h3>
                <p className="mt-1 max-w-[64ch] text-sm leading-relaxed text-slate-600">
                  A form and a PDF library, both running in your browser. The PDF is
                  drawn as real text rather than as a screenshot of the page, so it
                  is selectable, searchable, and readable by the accounts-payable
                  systems that parse incoming invoices.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Cpu size={20} aria-hidden="true" className="mt-1 shrink-0 text-brand-600" />
              <div>
                <h3 className="font-bold text-slate-900">The contract scanner</h3>
                <p className="mt-1 max-w-[64ch] text-sm leading-relaxed text-slate-600">
                  Pattern matching, not a language model. It looks for the wording of
                  twelve clause types and tells you what each kind of clause
                  generally does and what to check in yours. It also tells you which
                  freelancer-protective provisions it could <em>not</em> find, which
                  is usually the more useful half. It does not read your contract and
                  it knows nothing about the law that governs it.{" "}
                  <Link
                    href="/methodology"
                    className="font-medium text-brand-700 underline decoration-brand-300 underline-offset-2"
                  >
                    The full list of what it checks is published.
                  </Link>
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Lock size={20} aria-hidden="true" className="mt-1 shrink-0 text-brand-600" />
              <div>
                <h3 className="font-bold text-slate-900">Where your data goes</h3>
                <p className="mt-1 max-w-[64ch] text-sm leading-relaxed text-slate-600">
                  Nowhere. There is no code in either tool that sends your content to
                  a server, because there is no server to send it to. One point of
                  precision: your invoice draft is saved to your browser&apos;s local
                  storage, which is on disk, so a refresh does not lose your work. It
                  is stored in plain form and it is not encrypted — treat it the way
                  you would treat a file on your desktop. You can erase it from the{" "}
                  <Link
                    href="/legal/privacy"
                    className="font-medium text-brand-700 underline decoration-brand-300 underline-offset-2"
                  >
                    privacy page
                  </Link>{" "}
                  or from the tool itself.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-14">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            How the guides are written
          </h2>
          <ul className="mt-4 max-w-[68ch] list-disc space-y-2 pl-5 leading-relaxed text-slate-600">
            <li>
              Every guide states which country or countries it applies to. Tax and
              contract rules do not transfer across borders, and a guide that does not
              say where it applies is not usable.
            </li>
            <li>
              Tax guides state the year or assessment year the rules were current for,
              and cite the tax authority or statute they rest on. Thresholds change
              annually.
            </li>
            <li>
              Where a page has been revised, the revision date is shown alongside the
              original publication date. Dates are not changed to make a page look
              fresh.
            </li>
            <li>
              I use AI tools while drafting and while writing code. Everything
              published is checked against primary sources before it goes up, and I am
              accountable for it either way.
            </li>
          </ul>
        </section>

        <section className="mt-14">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            How this is paid for
          </h2>
          <p className="mt-4 max-w-[68ch] leading-relaxed text-slate-600">
            Advertising, served by Google. Ads are labelled &quot;Advertisement&quot;,
            styled so they do not resemble the tools&apos; own controls, and are never
            placed inside the invoice form or the scanner workflow. If anything on
            this site looks like one of my buttons but turns out to be an ad, tell me
            and I will move it.
          </p>
          <p className="mt-4 max-w-[68ch] leading-relaxed text-slate-600">
            Nothing about the tools depends on advertising. If every ad disappeared
            tomorrow, both would work identically.
          </p>
        </section>

        <section className="mt-14">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            What this is not
          </h2>
          <p className="mt-4 max-w-[68ch] leading-relaxed text-slate-600">
            Not a law firm and not an accountancy practice. The scanner does not
            review contracts and the generator does not decide your tax position. For
            an agreement or a filing that matters, get advice from a qualified
            professional in the jurisdiction that applies to you.
          </p>
        </section>

        <div className="mt-14 border-t border-slate-100 pt-8">
          <Link
            href="/invoice-maker"
            className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-7 py-3.5 font-bold text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            Make an invoice
          </Link>
        </div>
      </div>
    </div>
  );
}