"use client";

// app/error.tsx
//
// CHANGES
//
// 1. STOPPED PRINTING error.message TO THE USER. The previous version rendered
//    the raw message in a monospace box. React error messages can contain
//    internal paths, property names and occasionally values from the failing
//    render — including, on the invoice route, invoice field contents. Showing a
//    digest instead gives you something to correlate against logs without
//    putting internals on screen.
//
// 2. REMOVED "The error has been logged locally." It was a console.error call.
//    Nothing was logged anywhere retrievable, and telling a user their problem
//    has been recorded when it has not is a small lie that stops them reporting it.
//
// 3. The recovery copy now tells the user their invoice draft is intact, which
//    is the thing they are actually worried about when a tool crashes.

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Replace with a real error reporting call if you add one.
    console.error("FreelanceShield runtime error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-xl shadow-slate-200/50 md:p-12">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-red-100 bg-red-50">
          <AlertTriangle size={28} aria-hidden="true" className="text-red-500" />
        </div>

        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          Something broke on this page
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Your saved invoice draft is stored on this device and is unaffected.
          Try again, and if it keeps happening, email me the digest below.
        </p>

        {error.digest && (
          <p className="mt-4 rounded bg-slate-50 p-2 font-mono text-xs text-slate-500">
            Reference: {error.digest}
          </p>
        )}

        <div className="mt-8 space-y-3">
          <button
            type="button"
            onClick={reset}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 font-bold text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            <RefreshCcw size={18} aria-hidden="true" />
            Try again
          </button>

          <Link
            href="/"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 font-bold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            <Home size={18} aria-hidden="true" />
            Go to the homepage
          </Link>
        </div>

        <p className="mt-8 border-t border-slate-100 pt-6 text-xs text-slate-500">
          Still stuck?{" "}
          <a
            href="mailto:workmailkartikeya@gmail.com"
            className="font-medium text-brand-700 underline decoration-brand-300 underline-offset-2"
          >
            Email me
          </a>
          .
        </p>
      </div>
    </div>
  );
}
