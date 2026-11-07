// app/legal/refunds/page.tsx
// Refund, cancellation and delivery policy. Razorpay requires one before it
// will activate a merchant account, including for digital products.
//
// Written to be TRUE TODAY (nothing is sold) and SAFE LATER (clear rules for
// digital goods and subscriptions). It does not override statutory rights.
// ⚖︎ Have a lawyer review it once you sell something specific.

import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT, SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Refund, Cancellation and Delivery Policy",
  description: "How refunds, cancellations and delivery work for any paid FreelanceShield products. All current tools are free.",
  alternates: { canonical: `${SITE.url}/legal/refunds` },
};

const LAST_UPDATED = "6 November 2026";

function S({ h, children }: { h: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold text-slate-900">{h}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-700">{children}</div>
    </section>
  );
}

export default function RefundsPage() {
  return (
    <div className="bg-slate-50 px-4 py-12 sm:px-6">
      <article className="mx-auto max-w-3xl rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-12">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Refund, Cancellation and Delivery Policy</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: {LAST_UPDATED}</p>

        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <strong>Right now everything on {SITE.name} is free.</strong> No payment is taken for any tool, guide or download.
          This policy explains what will apply if paid products are offered in future, so the rules are public before anyone pays.
        </div>

        <S h="1. Who you are dealing with">
          <p>
            Paid products, when offered, are sold by {CONTACT.legalName}{CONTACT.address ? `, ${CONTACT.address}` : `, ${CONTACT.city}, ${CONTACT.country}`}.
            Payments are processed by Razorpay (for payments in India) or PayPal (international). We never see or store your card,
            UPI or bank details.
          </p>
        </S>

        <S h="2. What would be sold">
          <p>
            Digital products only: for example premium templates or a paid plan with additional tool features. Nothing physical
            is shipped. The exact product, price, currency and any taxes will be shown before you pay.
          </p>
        </S>

        <S h="3. Delivery">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Digital downloads are available immediately after payment is confirmed, and a link is sent to the email used at checkout.</li>
            <li>Paid plan features are activated immediately after payment is confirmed.</li>
            <li>If you have not received access within 24 hours, email {CONTACT.email} with your payment ID and it will be fixed or refunded.</li>
          </ul>
        </S>

        <S h="4. Refunds">
          <ul className="list-disc space-y-1.5 pl-5">
            <li><strong>Did not work or not as described:</strong> full refund if a product does not work as described and the problem cannot be fixed within 7 days of you reporting it.</li>
            <li><strong>Charged twice or charged in error:</strong> full refund of the duplicate or erroneous charge, always.</li>
            <li><strong>Changed your mind — one-time digital purchase:</strong> refund on request within 7 days of purchase, provided the product has not been substantially downloaded or used. Because digital files cannot be returned, refunds after substantial use are at our discretion.</li>
            <li><strong>Subscriptions:</strong> you can request a full refund within 7 days of your first payment. Renewal payments are not refunded, except where the law requires it or the renewal happened because of our error.</li>
          </ul>
          <p>
            Approved refunds are issued to the original payment method. We initiate them within 5 working days of approval.
            The time for funds to reach you then depends on your bank or card issuer, typically 5–10 working days.
          </p>
        </S>

        <S h="5. Cancellation">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>You can cancel a subscription at any time, from your account or by email. You keep access until the end of the period already paid for, and you are not charged again.</li>
            <li>Recurring charges are only ever made with your explicit authorisation, and in line with RBI rules on recurring payments where they apply.</li>
            <li>We may cancel an order and refund it in full if a product becomes unavailable or a price was shown in error.</li>
          </ul>
        </S>

        <S h="6. How to ask">
          <p>
            Email {CONTACT.email} with the payment ID from your receipt and a short reason. You will get a reply {CONTACT.responseTime}.
          </p>
        </S>

        <S h="7. Your legal rights">
          <p>
            Nothing in this policy limits rights you have under applicable consumer law, including the Consumer Protection Act, 2019
            and the Consumer Protection (E-Commerce) Rules, 2020 in India, or mandatory consumer law where you live. Where this policy and those rights conflict,
            the law applies.
          </p>
        </S>

        <p className="mt-12 border-t border-slate-100 pt-6 text-sm text-slate-500">
          Related: <Link href="/legal/terms" className="underline">Terms</Link> · <Link href="/legal/privacy" className="underline">Privacy</Link> · <Link href="/contact" className="underline">Contact</Link>
        </p>
      </article>
    </div>
  );
}
