"use client";

// app/offline/page.tsx
//
// CHANGES
//
// 1. REMOVED "Once you're back online, we'll sync any updates automatically."
//    There is no sync. There is no account, no server, and no code that
//    reconciles anything. Promising a sync that does not exist means a user who
//    loses a device expects their data to come back.
//
// 2. TONED DOWN THE OFFLINE CLAIM. This page only helps if a service worker is
//    actually caching the tool routes. There is no service worker in the
//    repository. Until one exists, this page is unreachable and the offline
//    promise in the manifest and the install prompt is not backed by anything.
//    See HANDOVER.md — this is on the outstanding list, not fixed.

import Link from "next/link";
import { WifiOff, FileText, ShieldCheck, RefreshCw } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-xl shadow-slate-200/50 md:p-12">
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full border border-slate-200 bg-slate-100">
          <WifiOff size={34} aria-hidden="true" className="text-slate-400" />
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          You&apos;re offline
        </h1>
        <p className="mx-auto mt-4 max-w-[52ch] leading-relaxed text-slate-600">
          The tools run in your browser, so they keep working without a
          connection. Your saved invoice draft is on this device and is untouched.
        </p>

        <div className="mt-8 grid gap-4 text-left sm:grid-cols-2">
          <Link
            href="/invoice-maker"
            className="group rounded-xl border border-slate-200 p-4 transition-colors hover:border-brand-400 hover:bg-brand-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <span className="mb-2 flex items-center gap-3">
              <span className="rounded-lg bg-brand-100 p-2">
                <FileText size={18} aria-hidden="true" className="text-brand-700" />
              </span>
              <span className="text-sm font-bold text-slate-900">Invoice generator</span>
            </span>
            <span className="block text-xs text-slate-500">
              Build and download a PDF.
            </span>
          </Link>

          <Link
            href="/contract-scanner"
            className="group rounded-xl border border-slate-200 p-4 transition-colors hover:border-brand-400 hover:bg-brand-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <span className="mb-2 flex items-center gap-3">
              <span className="rounded-lg bg-slate-100 p-2">
                <ShieldCheck size={18} aria-hidden="true" className="text-slate-700" />
              </span>
              <span className="text-sm font-bold text-slate-900">Contract scanner</span>
            </span>
            <span className="block text-xs text-slate-500">
              Check an agreement for clause types.
            </span>
          </Link>
        </div>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-4 font-bold text-white transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
        >
          <RefreshCw size={18} aria-hidden="true" />
          Check connection
        </button>

        <p className="mt-4 text-xs text-slate-500">
          Guides need a connection. The tools don&apos;t.
        </p>
      </div>
    </div>
  );
}
