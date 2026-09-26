// app/legal/privacy/page.tsx
//
// -------------------------------------------------------------------------
// WHY THE PREVIOUS POLICY HAD TO BE REPLACED
// -------------------------------------------------------------------------
//
// The old policy was four short sections. While serving Google AdSense to UK
// and EU visitors, it disclosed none of the following, all of which AdSense's
// own programme policies or GDPR require:
//   - that a third party (Google) sets cookies or similar identifiers
//   - what those are used for, including personalised advertising
//   - the legal basis for processing, and how consent is obtained
//   - retention periods
//   - the visitor's access, deletion and objection rights, and how to use them
//   - opt-out routes
//
// Two specific corrections to claims the old policy made:
//
//   1. It said tool data is processed "entirely within your browser's Random
//      Access Memory (RAM)". That was inaccurate. Invoice drafts are written to
//      localStorage, which is disk and persists across sessions. The accurate
//      claim, which the code does support, is that the data never leaves the
//      device. That is what this policy now says, plus how to erase it.
//
//   2. It named the operator as "Data Protection Officer". That is a statutory
//      role under Article 37 GDPR with specific independence requirements. A
//      sole operator handling their own enquiries is a privacy contact, not a
//      DPO. Retitled.
//
// -------------------------------------------------------------------------
// ACTION REQUIRED FROM YOU BEFORE THIS GOES LIVE
// -------------------------------------------------------------------------
// This is a factual description of what the software does. It is not legal
// advice and it has not been reviewed by a lawyer. Two items need your input:
//
//   1. LEGAL ENTITY AND ADDRESS. Replace OPERATOR_LEGAL_NAME and
//      OPERATOR_ADDRESS below. GDPR Article 13 requires the controller's
//      identity and contact details. If you trade as an individual rather than
//      a company, your own name and a contactable address are what belong here.
//      I have not invented these.
//
//   2. CONSENT MANAGEMENT. If you serve personalised ads to visitors in the
//      EU, UK or Switzerland, Google requires a certified CMP integrated with
//      the IAB TCF. No CMP exists in the codebase. Until one is added, either
//      install one or restrict ad serving to non-personalised.
//      See REMAINING WORK in the handover notes.

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PrivacyDataControls from "@/components/core/PrivacyDataControls";

const SITE = "https://freelanceshield.me";

/* -------------------------------------------------------------------------- */
/* CONFIGURATION                                                              */
/* -------------------------------------------------------------------------- */
const OPERATOR_LEGAL_NAME = "Kartikeya Mishra";
const OPERATOR_ADDRESS = "Prayagraj, Uttar Pradesh, India";
const PRIVACY_EMAIL = "workmailkartikeya@gmail.com";
const LAST_UPDATED = "26 September 2026";

export const metadata: Metadata = {
  title: "Privacy Policy | FreelanceShield",
  description:
    "What FreelanceShield collects, what stays on your device, how advertising cookies are used, and how to erase your data.",
  alternates: { canonical: `${SITE}/legal/privacy` },
  robots: { index: true, follow: true },
};

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
    <section id={id} className="mt-10 scroll-mt-6">
      <h2 className="text-xl font-bold text-slate-900">{heading}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-700">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-100 bg-white p-8 shadow-sm md:p-12">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-brand-700"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to home
        </Link>

        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: {LAST_UPDATED}</p>

        <p className="mt-6 max-w-[68ch] text-sm leading-relaxed text-slate-700">
          This policy covers freelanceshield.me. It is written to be specific about
          two different things: what our tools do with the documents you put into
          them, and what the website itself collects while you browse. Those answers
          are not the same.
        </p>

        {/* Summary table gives the honest answer up front. */}
        <div className="mt-8 overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">
              Summary of what is and is not collected
            </caption>
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-4 py-2 font-semibold text-slate-700">
                  Data
                </th>
                <th scope="col" className="px-4 py-2 font-semibold text-slate-700">
                  Where it goes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="px-4 py-2.5 text-slate-700">
                  Invoice contents, client details, amounts
                </td>
                <td className="px-4 py-2.5 text-slate-600">
                  Your device only. Never transmitted.
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-slate-700">Contract text you paste</td>
                <td className="px-4 py-2.5 text-slate-600">
                  Your device only. Never transmitted or stored.
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-slate-700">
                  Advertising cookies and identifiers
                </td>
                <td className="px-4 py-2.5 text-slate-600">
                  Google, as an independent third party. See section 4.
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-slate-700">
                  Server logs, including IP address
                </td>
                <td className="px-4 py-2.5 text-slate-600">
                  Our hosting provider, for security and delivery.
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-slate-700">
                  Anything you email us
                </td>
                <td className="px-4 py-2.5 text-slate-600">
                  Our email provider, until we no longer need it.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <Section id="controller" heading="1. Who is responsible for your data">
          <p>
            The site is operated by{" "}
            <strong className="font-semibold">{OPERATOR_LEGAL_NAME}</strong>, at{" "}
            {OPERATOR_ADDRESS}. For any privacy question, or to exercise the rights in
            section 8, write to{" "}
            <a
              href={`mailto:${PRIVACY_EMAIL}`}
              className="font-medium text-brand-700 underline decoration-brand-300 underline-offset-2"
            >
              {PRIVACY_EMAIL}
            </a>
            . Enquiries are handled by the operator directly. We have not appointed a
            statutory Data Protection Officer, and are not required to.
          </p>
        </Section>

        <Section id="tools" heading="2. What the tools do with your documents">
          <p>
            The invoice generator and the contract scanner run in your browser. Their
            code contains no request that sends your content anywhere. We do not
            receive it, cannot read it, and have no copy of it to disclose, lose or
            hand over.
          </p>
          <p>
            <strong className="font-semibold">
              One point of precision, because the distinction matters.
            </strong>{" "}
            Your invoice draft is saved to your browser&apos;s local storage so that
            refreshing the page does not destroy your work. Local storage is on disk,
            not in memory: it survives closing the tab and closing the browser. It
            remains on your device and is never uploaded. An earlier version of this
            policy described this as processing in RAM, which was wrong, and we have
            corrected it.
          </p>
          <p>
            Contract text you paste into the scanner is held in memory only and is
            gone when you close or reload the page. It is not written to storage.
          </p>
          <p>
            You can erase everything this site has stored on your device at any time:
          </p>
          <PrivacyDataControls />
        </Section>

        <Section id="collected" heading="3. What we collect when you browse">
          <p>
            We do not ask you to create an account and we do not run a newsletter, so
            there is no user database. Two things are nonetheless collected:
          </p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong className="font-semibold">Server logs.</strong> Our hosting
              provider records requests, including IP address, user agent, and the
              page requested. This is used to deliver the site and to investigate
              abuse or outages. Retained for a short period by the provider and not
              used to build a profile of you.
            </li>
            <li>
              <strong className="font-semibold">Advertising data.</strong> Handled by
              Google rather than by us. Section 4.
            </li>
          </ul>
          <p>
            If you email us, we hold that message and your address for as long as
            needed to deal with it, and then delete it.
          </p>
        </Section>

        <Section id="advertising" heading="4. Advertising, cookies and third parties">
          <p>
            This site carries advertising supplied by{" "}
            <strong className="font-semibold">Google AdSense</strong>. That advertising
            pays for the tools being free.
          </p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              Third-party vendors, including Google, use cookies and similar
              identifiers to serve ads based on your prior visits to this and other
              websites.
            </li>
            <li>
              Google&apos;s use of advertising cookies enables it and its partners to
              serve ads to you based on your visits to this site and other sites on
              the internet.
            </li>
            <li>
              You can opt out of personalised advertising in{" "}
              <a
                href="https://www.google.com/settings/ads"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-brand-700 underline decoration-brand-300 underline-offset-2"
              >
                Google Ads Settings
              </a>
              , and opt out of third-party vendor cookies more broadly at{" "}
              <a
                href="https://optout.aboutads.info/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-brand-700 underline decoration-brand-300 underline-offset-2"
              >
                aboutads.info
              </a>
              .
            </li>
            <li>
              How Google handles data from sites that use its services is described in{" "}
              <a
                href="https://policies.google.com/technologies/partner-sites"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-brand-700 underline decoration-brand-300 underline-offset-2"
              >
                Google&apos;s privacy and terms
              </a>
              .
            </li>
          </ul>
          <p>
            Advertising is never placed inside the invoice form or the scanner
            workflow, and every ad is labelled &quot;Advertisement&quot;. If you see
            something on this site that looks like one of our own controls but is an
            ad, tell us and we will move it.
          </p>
        </Section>

        <Section id="basis" heading="5. Legal basis for processing">
          <p>
            Where the UK GDPR or EU GDPR applies, we rely on:
          </p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong className="font-semibold">Legitimate interests</strong> for
              server logs, limited to keeping the site available and secure.
            </li>
            <li>
              <strong className="font-semibold">Consent</strong> for advertising
              cookies and any non-essential identifier, which you may withdraw at any
              time through the controls described in section 4.
            </li>
            <li>
              <strong className="font-semibold">Legitimate interests</strong> for
              replying to an email you chose to send us.
            </li>
          </ul>
          <p>
            No processing takes place in relation to the contents of your invoices or
            contracts, because that content never reaches us.
          </p>
        </Section>

        <Section id="retention" heading="6. How long things are kept">
          <p>
            Invoice drafts stay on your device until you delete them or clear your
            browser storage. There is no expiry we control. Server logs are retained
            by our hosting provider for their standard period. Email correspondence is
            deleted once the matter is closed. Advertising identifiers are governed by
            Google&apos;s own retention practices, linked in section 4.
          </p>
        </Section>

        <Section id="children" heading="7. Children">
          <p>
            This site is a business tool for working adults. It is not directed at
            children and we do not knowingly collect information from anyone under 16.
          </p>
        </Section>

        <Section id="rights" heading="8. Your rights">
          <p>
            Depending on where you live, you may have the right to access a copy of
            your data, to have it corrected or erased, to object to or restrict
            processing, and to withdraw consent. To exercise any of these, email{" "}
            <a
              href={`mailto:${PRIVACY_EMAIL}`}
              className="font-medium text-brand-700 underline decoration-brand-300 underline-offset-2"
            >
              {PRIVACY_EMAIL}
            </a>
            . We will respond within one month.
          </p>
          <p>
            In practice there is usually very little for us to give you, because the
            data our tools handle never leaves your device. For your invoice and
            contract data, the erasure control in section 2 is faster and more
            complete than asking us.
          </p>
          <p>
            If you are in the UK or EU and are unhappy with how we have handled a
            request, you can complain to your national data protection authority. In
            the UK that is the Information Commissioner&apos;s Office.
          </p>
        </Section>

        <Section id="limits" heading="9. What our tools are not">
          <p>
            The contract scanner matches text against a list of known clause types. It
            does not read or interpret your agreement, and it has no knowledge of the
            law that governs it. A clause being flagged does not mean it is unfair,
            and a clause not being flagged does not mean your contract is safe.
          </p>
          <p>
            The invoice generator performs arithmetic. Which tax rate applies to your
            supply, and whether reverse charge is available to you, are questions
            about your specific circumstances in your specific jurisdiction.
          </p>
          <p>
            Nothing on this site is legal, tax or accounting advice. For an agreement
            or a filing that matters, get advice from a qualified professional in the
            relevant jurisdiction.
          </p>
        </Section>

        <Section id="changes" heading="10. Changes to this policy">
          <p>
            If we change what we collect or who we share it with, we will update this
            page and change the date at the top. We will not backdate it, and we will
            not change the date without changing the content.
          </p>
        </Section>

        <div className="mt-12 border-t border-slate-100 pt-8 text-sm text-slate-500">
          <p>
            See also our{" "}
            <Link href="/legal/terms" className="underline hover:text-slate-700">
              terms of service
            </Link>{" "}
            and{" "}
            <Link href="/about" className="underline hover:text-slate-700">
              about page
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}