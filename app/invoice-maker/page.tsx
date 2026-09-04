// app/invoice-maker/page.tsx
//
// -------------------------------------------------------------------------
// WHY THIS FILE IS A REWRITE
// -------------------------------------------------------------------------
//
// The deployed /invoice-maker returned NO server-rendered body content — no h1,
// no headings, no copy — and inherited the site-wide title and description,
// identical to the homepage:
//
//     title:       Freelance Shield | Invoices, Contracts & Legal Protection
//     description: The ultimate toolkit for independent professionals.
//
// This is the highest commercial-intent URL on the site and it was both
// invisible to crawlers and untargeted. Everything below the tool is now server
// rendered; only InvoiceWorkspace is a client component.
//
// The supporting copy is here because it answers questions people actually have
// while making an invoice, not to pad the page. It sits BELOW the tool, so
// someone who came to make an invoice can make one immediately.

import type { Metadata } from "next";
import Link from "next/link";
import InvoiceWorkspace from "@/components/core/InvoiceWorkspace";
import FAQSection from "@/components/ui/FAQSection";
import type { FAQ } from "@/components/ui/FAQSection";

const SITE = "https://freelanceshield.me";

export const metadata: Metadata = {
  title: "Free Invoice Generator for Freelancers | FreelanceShield",
  description:
    "Make a professional invoice PDF in your browser. Multi-currency, tax and reverse-charge support, no sign-up, no watermark. Your data stays on your device.",
  alternates: { canonical: `${SITE}/invoice-maker` },
  openGraph: {
    type: "website",
    url: `${SITE}/invoice-maker`,
    title: "Free Invoice Generator for Freelancers",
    description:
      "Make a professional invoice PDF in your browser. No sign-up, no watermark, no upload.",
    siteName: "FreelanceShield",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Invoice Generator for Freelancers",
    description: "Make a professional invoice PDF in your browser. No sign-up.",
  },
};

const faqs: FAQ[] = [
  {
    question: "Does my invoice data get uploaded anywhere?",
    answer:
      "No. The form runs in your browser and the PDF is built there too. Nothing is sent to us. Your draft is saved on this device so a refresh does not lose it, and the Delete saved draft button erases it.",
  },
  {
    question: "Is the PDF text or an image?",
    answer:
      "Real text. You can select and search it, and accounts-payable systems that parse invoices can read it. Many free generators export a flattened screenshot, which is one reason invoices get stuck in corporate intake.",
  },
  {
    question: "How is tax calculated when I add a discount?",
    answer:
      "The discount comes off the subtotal first, and tax is charged on what remains. That is how taxable value is normally determined under GST and VAT where a discount is shown on the invoice itself.",
  },
  {
    question: "What does the reverse charge checkbox do?",
    answer:
      "It sets the tax to zero and prints a statement that the recipient accounts for the tax. It is used for some cross-border business-to-business services. Whether it applies to your specific supply depends on where you and your client are established, so confirm before relying on it.",
  },
  {
    question: "Why does the PDF show currency codes instead of symbols?",
    answer:
      "It prints ISO codes like INR and GBP rather than glyphs. Codes are unambiguous, which matters when a client's bank processes the payment, and they avoid the rendering failures that symbols cause in PDF fonts.",
  },
];

/**
 * SoftwareApplication markup. Included because it describes what is actually on
 * this page: a free browser-based tool. No aggregateRating — we have no reviews,
 * and inventing them would be both a policy violation and a lie.
 */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "FreelanceShield Invoice Generator",
  url: `${SITE}/invoice-maker`,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Any (web browser)",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: [
    "Multi-currency invoicing",
    "Tax and reverse-charge handling",
    "Text-based PDF export",
    "Runs entirely in the browser",
  ],
};

function safeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

export default function InvoiceMakerPage() {
  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />

      {/* Breadcrumb, server rendered so it is crawlable and usable without JS */}
      <nav aria-label="Breadcrumb" className="border-b border-slate-100 bg-white px-6 py-3">
        <ol className="mx-auto flex max-w-6xl items-center gap-2 text-xs text-slate-500">
          <li>
            <Link href="/" className="hover:text-brand-700 hover:underline">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="font-medium text-slate-700" aria-current="page">
            Invoice generator
          </li>
        </ol>
      </nav>

      <header className="bg-white px-6 pb-6 pt-10">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Free invoice generator for freelancers
          </h1>
          {/* First paragraph answers the query directly. */}
          <p className="mt-4 max-w-[68ch] text-base leading-relaxed text-slate-600">
            Fill in the form and download a professional invoice as a PDF. It handles
            13 currencies, tax registration numbers, percentage or fixed discounts,
            and cross-border reverse charge. There is no sign-up, no watermark and no
            upload: the form and the PDF both run in your browser.
          </p>
        </div>
      </header>

      {/* The tool. First thing after the introduction, not buried under prose. */}
      <div className="border-y border-slate-200 bg-slate-50">
        <InvoiceWorkspace />
      </div>

      {/* Supporting content */}
      <div className="bg-white">
        <section className="mx-auto max-w-3xl px-6 py-14">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
            What to put on a freelance invoice
          </h2>
          <p className="mt-4 max-w-[68ch] text-base leading-relaxed text-slate-600">
            Most invoices that sit unpaid for weeks are not disputed. They are missing
            something the client&apos;s finance team needs, so they never enter the
            payment run. These are the fields that cause that.
          </p>

          <dl className="mt-8 space-y-6">
            <div>
              <dt className="font-bold text-slate-900">A unique invoice number</dt>
              <dd className="mt-1 max-w-[68ch] text-sm leading-relaxed text-slate-600">
                Sequential and never reused. Finance teams reference it in every
                query, and you will need it if you ever have to prove what was
                billed and when.
              </dd>
            </div>
            <div>
              <dt className="font-bold text-slate-900">A specific due date</dt>
              <dd className="mt-1 max-w-[68ch] text-sm leading-relaxed text-slate-600">
                A date, not &quot;Net 30&quot; alone. It removes the argument about
                when the clock started, which is what makes chasing a late invoice
                straightforward.{" "}
                <Link
                  href="/resources/net-30-vs-net-60-freelance-payment-terms"
                  className="font-medium text-brand-700 underline decoration-brand-300 underline-offset-2 hover:text-brand-800"
                >
                  Comparing payment terms
                </Link>{" "}
                covers how to negotiate this before the work starts.
              </dd>
            </div>
            <div>
              <dt className="font-bold text-slate-900">
                Line descriptions a non-specialist can approve
              </dt>
              <dd className="mt-1 max-w-[68ch] text-sm leading-relaxed text-slate-600">
                The person approving your invoice usually did not commission the
                work. &quot;Development work&quot; invites a question;
                &quot;Checkout redesign: build and QA, 22 Feb–8 Mar&quot; does not.
              </dd>
            </div>
            <div>
              <dt className="font-bold text-slate-900">
                Tax registration numbers, where you have them
              </dt>
              <dd className="mt-1 max-w-[68ch] text-sm leading-relaxed text-slate-600">
                Your GSTIN, VAT number or equivalent, and your client&apos;s where
                the transaction requires it. For EU reverse charge the customer&apos;s
                VAT number normally has to appear on the invoice alongside the
                reverse-charge statement.
              </dd>
            </div>
            <div>
              <dt className="font-bold text-slate-900">Payment instructions</dt>
              <dd className="mt-1 max-w-[68ch] text-sm leading-relaxed text-slate-600">
                Bank details with IBAN or SWIFT for international transfers, or a
                payment link. An invoice with no route to pay it is a reminder, not
                a bill.
              </dd>
            </div>
          </dl>
        </section>

        <section className="mx-auto max-w-3xl px-6 pb-14">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Where your data goes
          </h2>
          <p className="mt-4 max-w-[68ch] text-base leading-relaxed text-slate-600">
            Nothing you type here reaches our servers, because there is no code that
            sends it. The PDF is assembled in the browser by a JavaScript library
            that makes no network requests.
          </p>
          <p className="mt-4 max-w-[68ch] text-base leading-relaxed text-slate-600">
            To be precise about one thing: your draft is written to this
            browser&apos;s local storage, which is on disk, so it survives closing
            the tab. That is what stops a refresh from wiping your work. It stays on
            your device, and{" "}
            <strong className="font-semibold text-slate-800">Delete saved draft</strong>{" "}
            removes it. Our{" "}
            <Link
              href="/legal/privacy"
              className="font-medium text-brand-700 underline decoration-brand-300 underline-offset-2 hover:text-brand-800"
            >
              privacy policy
            </Link>{" "}
            sets out what we do and do not collect elsewhere on the site.
          </p>
        </section>

        <FAQSection
          title="Questions about this invoice generator"
          faqs={faqs}
          withStructuredData={false}
        />

        <section className="mx-auto max-w-3xl px-6 py-14">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Related guides
          </h2>
          <ul className="mt-6 space-y-3 text-sm">
            <li>
              <Link
                href="/resources/how-to-write-freelance-invoice"
                className="font-medium text-brand-700 underline decoration-brand-300 underline-offset-2 hover:text-brand-800"
              >
                How to write a freelance invoice that gets paid on time
              </Link>
            </li>
            <li>
              <Link
                href="/resources/how-to-invoice-eu-client-without-vat"
                className="font-medium text-brand-700 underline decoration-brand-300 underline-offset-2 hover:text-brand-800"
              >
                Invoicing EU clients and the reverse-charge mechanism
              </Link>
            </li>
            <li>
              <Link
                href="/resources/how-to-charge-late-fees-on-freelance-invoices"
                className="font-medium text-brand-700 underline decoration-brand-300 underline-offset-2 hover:text-brand-800"
              >
                Charging late fees on an overdue invoice
              </Link>
            </li>
            <li>
              <Link
                href="/contract-scanner"
                className="font-medium text-brand-700 underline decoration-brand-300 underline-offset-2 hover:text-brand-800"
              >
                Check a contract for clauses worth reading twice
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </>
  );
}
