"use client";

// components/core/InvoiceWorkspace.tsx
//
// The only client component on /invoice-maker. Everything else on that route is
// server-rendered, which is what fixes the crawlability problem: the page
// previously shipped no server-rendered body content at all, so search engines
// and AI crawlers saw an empty shell on the site's highest-intent URL.
//
// Keeping the interactive surface in one leaf component means the H1,
// explanation, FAQ and internal links all render on the server.

import React, { useEffect, useState } from "react";
import { fromBase64Url, normalizeInvoice } from "@/lib/engine/input";
import { useInvoice } from "@/lib/hooks/useInvoice";
import InvoiceForm from "@/components/core/InvoiceForm";
import InvoicePreview from "@/components/core/InvoicePreview";

export default function InvoiceWorkspace() {
  const {
    data,
    totals,
    setField,
    setParty,
    updateItem,
    addItem,
    removeItem,
    reset,
    replace,
    hydrated,
  } = useInvoice();
  const [prefillNote, setPrefillNote] = useState<string | null>(null);

  // An invoice prepared elsewhere (ChatGPT, Claude, Gemini, the API) arrives as
  // #invoice=<base64url JSON>. The fragment is never sent to any server. It is
  // validated like any untrusted input before it replaces the draft.
  const dataRef = React.useRef(data);
  dataRef.current = data;

  useEffect(() => {
    if (!hydrated) return;
    const load = () => {
      const hash = window.location.hash;
      if (!hash.startsWith("#invoice=")) return;
      window.history.replaceState(null, "", window.location.pathname);
      try {
        const incoming = normalizeInvoice(JSON.parse(fromBase64Url(hash.slice(9))));
        const d = dataRef.current;
        const hasDraft = d.items.some((i) => i.description.trim() || i.rate > 0) || d.client.name.trim();
        if (hasDraft && !window.confirm("Replace your current draft with the invoice you just opened?")) return;
        replace(incoming);
        setPrefillNote("Invoice loaded. Check every detail, then download the PDF.");
      } catch {
        setPrefillNote("That invoice link was damaged or incomplete, so nothing was loaded.");
      }
    };
    load();
    // Also handle a link opened while this page is already showing.
    window.addEventListener("hashchange", load);
    return () => window.removeEventListener("hashchange", load);
  }, [hydrated, replace]);

  // Wait for the saved draft before rendering inputs. Rendering defaults first
  // caused a flash of empty fields, and anything typed in that window was
  // overwritten when the stored draft loaded a moment later.
  if (!hydrated) {
    return (
      <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-2" aria-busy="true" aria-label="Loading your saved invoice">
        <div className="space-y-6">
          {[0, 1, 2].map((i) => <div key={i} className="h-48 animate-pulse rounded-xl bg-slate-200/70 motion-reduce:animate-none" />)}
        </div>
        <div className="h-[36rem] animate-pulse rounded-xl bg-slate-200/70 motion-reduce:animate-none" />
      </div>
    );
  }

  return (
    <div className="grid gap-0 lg:grid-cols-2">
      <div className="p-4 sm:p-6">
        {prefillNote && (
          <p role="status" className="mb-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-medium text-sky-900">
            {prefillNote}
          </p>
        )}
        <h2 className="sr-only">Invoice details form</h2>
        <InvoiceForm
          data={data}
          totals={totals}
          setField={setField}
          setParty={setParty}
          updateItem={updateItem}
          addItem={addItem}
          removeItem={removeItem}
        />
      </div>

      <div className="lg:sticky lg:top-0 lg:h-screen">
        <InvoicePreview data={data} totals={totals} onReset={reset} />
      </div>
    </div>
  );
}
