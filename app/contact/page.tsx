// app/contact/page.tsx
// Razorpay and AdSense reviewers both look for a real, reachable operator.
// Address and phone render only when set in lib/site.ts — never invented.

import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MapPin, Phone, Clock } from "lucide-react";
import { CONTACT, SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "How to reach the person who runs FreelanceShield: support, privacy requests, corrections and grievances.",
  alternates: { canonical: `${SITE.url}/contact` },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  url: `${SITE.url}/contact`,
  mainEntity: {
    "@type": "Organization",
    name: SITE.name,
    url: SITE.url,
    email: CONTACT.email,
    ...(CONTACT.phone && { telephone: CONTACT.phone }),
    ...(CONTACT.address && { address: CONTACT.address }),
  },
};

function safeJsonLd(v: unknown) {
  return JSON.stringify(v).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}

const REASONS = [
  { title: "Something in a tool looks wrong", body: "Tell me what you entered and what you expected. A screenshot helps. Please don't send real client data." },
  { title: "A correction to a guide", body: "Link the page and the source that shows the error. Corrections are made and the revision date updated." },
  { title: "Privacy or data request", body: "Access, deletion or objection under the DPDP Act or GDPR. Most tool data never reaches me — see the privacy policy." },
  { title: "A payment or refund", body: "Only applies once paid features exist. Include the payment ID from your receipt." },
];

export default function ContactPage() {
  return (
    <div className="bg-slate-50 px-4 py-14 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Contact</h1>
        <p className="mt-4 max-w-[60ch] text-lg leading-relaxed text-slate-600">
          FreelanceShield is run by one person. Every message is read by a human — me.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <a href={`mailto:${CONTACT.email}`} className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-colors hover:border-brand-300">
            <Mail className="text-brand-700" size={22} aria-hidden="true" />
            <p className="mt-3 text-sm font-medium text-slate-500">Email</p>
            <p className="mt-1 break-all font-bold text-slate-900 group-hover:text-brand-700">{CONTACT.email}</p>
          </a>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <Clock className="text-brand-700" size={22} aria-hidden="true" />
            <p className="mt-3 text-sm font-medium text-slate-500">Response time</p>
            <p className="mt-1 font-bold text-slate-900">Usually {CONTACT.responseTime}</p>
          </div>
          {CONTACT.phone && (
            <a href={`tel:${CONTACT.phone.replace(/\s/g, "")}`} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-brand-300">
              <Phone className="text-brand-700" size={22} aria-hidden="true" />
              <p className="mt-3 text-sm font-medium text-slate-500">Phone</p>
              <p className="mt-1 font-bold text-slate-900">{CONTACT.phone}</p>
            </a>
          )}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <MapPin className="text-brand-700" size={22} aria-hidden="true" />
            <p className="mt-3 text-sm font-medium text-slate-500">Operated by</p>
            <p className="mt-1 font-bold text-slate-900">{CONTACT.legalName}</p>
            <p className="mt-1 text-sm text-slate-600">{CONTACT.address ?? `${CONTACT.city}, ${CONTACT.country}`}</p>
          </div>
        </div>

        <section className="mt-12">
          <h2 className="text-xl font-bold text-slate-900">What to include</h2>
          <dl className="mt-4 space-y-4">
            {REASONS.map((r) => (
              <div key={r.title} className="rounded-xl border border-slate-200 bg-white p-4">
                <dt className="font-semibold text-slate-900">{r.title}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-slate-600">{r.body}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-12 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold text-slate-900">Grievance officer</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Under India&apos;s Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021,
            complaints can be sent to the grievance officer, {CONTACT.grievanceOfficer}, at {CONTACT.email}.
            Complaints are acknowledged within 24 hours and resolved within 15 days.
          </p>
        </section>

        <p className="mt-10 text-sm text-slate-500">
          See also: <Link href="/about" className="underline">About</Link> ·{" "}
          <Link href="/legal/privacy" className="underline">Privacy</Link> ·{" "}
          <Link href="/legal/terms" className="underline">Terms</Link> ·{" "}
          <Link href="/legal/refunds" className="underline">Refunds</Link>
        </p>
      </div>
    </div>
  );
}
