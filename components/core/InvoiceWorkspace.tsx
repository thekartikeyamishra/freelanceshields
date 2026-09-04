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

import React from "react";
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
  } = useInvoice();

  return (
    <div className="grid gap-0 lg:grid-cols-2">
      <div className="p-4 sm:p-6">
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
