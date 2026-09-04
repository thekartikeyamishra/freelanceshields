// app/not-found.tsx
//
// CHANGES: the previous version was largely fine. Two fixes.
//
// 1. The decorative pulsing blur div had no aria-hidden and ran an infinite
//    animation regardless of motion preference. Now hidden from assistive tech
//    and covered by the global reduced-motion rule in globals.css.
// 2. Added recovery links to the guides and the scanner. A 404 on this site is
//    most likely someone following a stale link to a consolidated article, so
//    pointing at the guides index is the useful move — that is where the
//    surviving page will be after the content pruning.
//
// No SEO filler here, deliberately. A 404 should help someone leave usefully.

import Link from "next/link";
import { FileQuestion, Home, FileText, BookOpen } from "lucide-react";

const LINKS = [
  { href: "/invoice-maker", icon: FileText, label: "Make an invoice" },
  { href: "/resources", icon: BookOpen, label: "Browse the guides" },
];

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-xl shadow-slate-200/50 md:p-12">
        <div
          aria-hidden="true"
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-slate-100 bg-slate-50"
        >
          <FileQuestion size={34} className="text-slate-400" />
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">404</h1>
        <h2 className="mt-2 text-lg font-bold text-slate-700">
          That page isn&apos;t here
        </h2>
        <p className="mx-auto mt-4 max-w-[46ch] text-sm leading-relaxed text-slate-600">
          The link may be out of date, or the guide it pointed to may have been
          merged into another one. Anything you had saved on this device is
          untouched.
        </p>

        <div className="mt-8 space-y-3">
          <Link
            href="/"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-900 px-6 py-3.5 font-bold text-white transition-colors hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            <Home size={18} aria-hidden="true" />
            Go to the homepage
          </Link>

          {LINKS.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 font-bold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              <Icon size={18} aria-hidden="true" />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
