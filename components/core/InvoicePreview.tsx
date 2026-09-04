"use client";

// components/core/InvoicePreview.tsx
//
// -------------------------------------------------------------------------
// WHAT CHANGED
// -------------------------------------------------------------------------
//
// 1. TAX MATH MOVED OUT AND CORRECTED. The component previously computed
//        taxAmount = subtotal * (taxRate / 100)
//        total     = subtotal + taxAmount - discount
//    which taxes the pre-discount subtotal. All figures now come from
//    calculateTotals(), which taxes the discounted base. See invoiceMath.ts.
//
// 2. DOWNLOAD FAILURES ARE NOW VISIBLE. Previously downloadPDF() returned
//    false and handleDownload only acted on success, so a failed export did
//    nothing at all with no message. Errors are surfaced.
//
// 3. NO MORE DOM SCREENSHOT. The PDF is built from the data, not from this
//    element, so there is no id="invoice-capture-area" contract between the
//    preview markup and the exporter. Restyling the preview can no longer
//    break the PDF.
//
// 4. REAL CURRENCY FORMATTING via Intl, replacing `${symbol} ${n.toFixed(2)}`.

import React, { useState } from "react";
import { Download, Share2, CheckCircle2, Loader2, AlertCircle, Trash2 } from "lucide-react";
import {
  downloadInvoicePDF,
  shareInvoicePDF,
  PdfGenerationError,
} from "@/lib/utils/pdfGenerator";
import { formatMoney, formatAmount, resolveCurrency } from "@/lib/utils/currency";
import { lineTotal, REVERSE_CHARGE_NOTE } from "@/lib/utils/invoiceMath";
import type { InvoiceData, InvoiceTotals } from "@/types/invoice";

interface InvoicePreviewProps {
  data: InvoiceData;
  totals: InvoiceTotals;
  onReset: () => void;
}

type Status =
  | { kind: "idle" }
  | { kind: "working"; action: "download" | "share" }
  | { kind: "done"; message: string }
  | { kind: "error"; message: string };

export default function InvoicePreview({ data, totals, onReset }: InvoicePreviewProps) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const currencyCode = resolveCurrency(data.currency).code;

  const flash = (next: Status) => {
    setStatus(next);
    if (next.kind === "done") {
      window.setTimeout(() => setStatus({ kind: "idle" }), 3000);
    }
  };

  const handleDownload = () => {
    setStatus({ kind: "working", action: "download" });
    try {
      downloadInvoicePDF(data);
      flash({ kind: "done", message: "PDF downloaded" });
    } catch (error) {
      flash({
        kind: "error",
        message:
          error instanceof PdfGenerationError
            ? error.message
            : "The PDF could not be created. Try again, or reload the page if it keeps failing.",
      });
    }
  };

  const handleShare = async () => {
    setStatus({ kind: "working", action: "share" });
    try {
      const result = await shareInvoicePDF(data);
      if (result === "shared") {
        flash({ kind: "done", message: "Invoice shared" });
      } else if (result === "cancelled") {
        setStatus({ kind: "idle" });
      } else {
        // Be explicit rather than silently doing nothing: this browser cannot
        // attach files, so download and let the user attach it themselves.
        downloadInvoicePDF(data);
        flash({
          kind: "done",
          message: "This browser cannot share files, so the PDF was downloaded instead. Attach it to your email.",
        });
      }
    } catch (error) {
      flash({
        kind: "error",
        message:
          error instanceof PdfGenerationError
            ? error.message
            : "Sharing failed. Download the PDF and attach it manually.",
      });
    }
  };

  const handleReset = () => {
    const confirmed = window.confirm(
      "Delete this saved draft from your device? This cannot be undone.",
    );
    if (confirmed) {
      onReset();
      flash({ kind: "done", message: "Saved draft deleted" });
    }
  };

  const busy = status.kind === "working";

  return (
    <div className="flex h-full flex-col border-l border-slate-200 bg-slate-100">
      {/* Action bar */}
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 p-4 backdrop-blur-md sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-slate-800">Preview</h2>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              <Trash2 size={15} aria-hidden="true" />
              <span className="hidden sm:inline">Delete saved draft</span>
              <span className="sr-only sm:hidden">Delete saved draft</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-brand-300 hover:bg-slate-50 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              {busy && status.action === "share" ? (
                <Loader2 size={15} aria-hidden="true" className="animate-spin motion-reduce:animate-none" />
              ) : (
                <Share2 size={15} aria-hidden="true" />
              )}
              Share
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-600/20 transition-colors hover:bg-brand-700 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
            >
              {busy && status.action === "download" ? (
                <Loader2 size={15} aria-hidden="true" className="animate-spin motion-reduce:animate-none" />
              ) : (
                <Download size={15} aria-hidden="true" />
              )}
              Download PDF
            </button>
          </div>
        </div>

        {/* Status region. aria-live so screen readers hear the outcome. */}
        <div aria-live="polite" className="mt-2 min-h-[20px]">
          {status.kind === "done" && (
            <p className="flex items-start gap-1.5 text-xs font-medium text-emerald-700">
              <CheckCircle2 size={14} aria-hidden="true" className="mt-px shrink-0" />
              {status.message}
            </p>
          )}
          {status.kind === "error" && (
            <p className="flex items-start gap-1.5 text-xs font-medium text-red-700">
              <AlertCircle size={14} aria-hidden="true" className="mt-px shrink-0" />
              {status.message}
            </p>
          )}
        </div>
      </div>

      {/* Paper */}
      <div className="flex flex-grow justify-center overflow-y-auto p-4 sm:p-8">
        <article className="w-full max-w-[210mm] bg-white p-8 shadow-xl shadow-slate-300/40 sm:p-12">
          {/* Header */}
          <header className="mb-10 flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="text-3xl font-black uppercase tracking-tight text-slate-900">
                Invoice
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {data.invoiceNumber || "INV-001"}
              </p>
            </div>
            <dl className="text-right text-sm">
              <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                Issue date
              </dt>
              <dd className="mb-2 text-slate-700">{data.issueDate || "—"}</dd>
              <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                Due date
              </dt>
              <dd className="mb-2 text-slate-700">{data.dueDate || "—"}</dd>
              <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                Currency
              </dt>
              <dd className="text-slate-700">{currencyCode}</dd>
            </dl>
          </header>

          {/* Parties */}
          <div className="mb-10 grid gap-8 border-b border-slate-100 pb-8 sm:grid-cols-2">
            {(["sender", "client"] as const).map((key) => {
              const p = data[key];
              return (
                <div key={key} className="min-w-0">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    {key === "sender" ? "From" : "Bill to"}
                  </p>
                  <p className="font-bold text-slate-900">
                    {p.name || (key === "sender" ? "Your name" : "Client name")}
                  </p>
                  {p.address && (
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-600">
                      {p.address}
                    </p>
                  )}
                  {p.email && (
                    <p className="mt-1 break-words text-sm text-slate-600">{p.email}</p>
                  )}
                  {p.taxId && (
                    <p className="mt-1 break-words text-sm text-slate-700">
                      Tax ID: {p.taxId}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {data.placeOfSupply && (
            <p className="mb-6 text-sm text-slate-600">
              Place of supply: {data.placeOfSupply}
            </p>
          )}

          {/* Items */}
          <table className="mb-8 w-full border-collapse text-left">
            <caption className="sr-only">
              Line items for invoice {data.invoiceNumber}
            </caption>
            <thead>
              <tr className="border-b-2 border-slate-800">
                <th scope="col" className="py-2 text-xs font-bold text-slate-800">
                  Description
                </th>
                <th scope="col" className="w-20 py-2 text-right text-xs font-bold text-slate-800">
                  Qty
                </th>
                <th scope="col" className="w-28 py-2 text-right text-xs font-bold text-slate-800">
                  Rate
                </th>
                <th scope="col" className="w-32 py-2 text-right text-xs font-bold text-slate-800">
                  Amount ({currencyCode})
                </th>
              </tr>
            </thead>
            <tbody>
              {data.items.length > 0 ? (
                data.items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="break-words py-3 pr-4 text-sm text-slate-700">
                      {item.description || "—"}
                    </td>
                    <td className="py-3 text-right text-sm text-slate-700">
                      {item.quantity}
                    </td>
                    <td className="py-3 text-right text-sm text-slate-700">
                      {formatAmount(item.rate, data.currency)}
                    </td>
                    <td className="py-3 text-right text-sm font-medium text-slate-900">
                      {formatAmount(lineTotal(item, data.currency), data.currency)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-sm text-slate-400">
                    Add a line item to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Totals */}
          <div className="mb-10 flex justify-end">
            <dl className="w-full max-w-[300px] space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <dt>Subtotal</dt>
                <dd>{formatMoney(totals.subtotal, data.currency)}</dd>
              </div>

              {totals.discountAmount > 0 && (
                <>
                  <div className="flex justify-between text-slate-600">
                    <dt>
                      Discount
                      {data.discountMode === "percent" && ` (${data.discountValue}%)`}
                    </dt>
                    <dd>−{formatMoney(totals.discountAmount, data.currency)}</dd>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <dt>Taxable value</dt>
                    <dd>{formatMoney(totals.taxableBase, data.currency)}</dd>
                  </div>
                </>
              )}

              {data.reverseCharge ? (
                <div className="flex justify-between text-slate-600">
                  <dt>{data.taxLabel || "VAT"} (reverse charge)</dt>
                  <dd>{formatMoney(0, data.currency)}</dd>
                </div>
              ) : (
                data.taxRate > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <dt>
                      {data.taxLabel || "Tax"} ({data.taxRate}%)
                    </dt>
                    <dd>{formatMoney(totals.taxAmount, data.currency)}</dd>
                  </div>
                )
              )}

              <div className="flex items-center justify-between border-t-2 border-slate-800 pt-3">
                <dt className="text-base font-bold text-slate-900">Total due</dt>
                <dd className="text-lg font-bold text-brand-700">
                  {formatMoney(totals.total, data.currency)}
                </dd>
              </div>
            </dl>
          </div>

          {data.reverseCharge && (
            <p className="mb-6 text-sm font-medium text-slate-800">
              {REVERSE_CHARGE_NOTE}
            </p>
          )}

          {data.paymentInstructions && (
            <section className="mb-6">
              <h3 className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                Payment details
              </h3>
              <p className="whitespace-pre-wrap break-words text-sm text-slate-700">
                {data.paymentInstructions}
              </p>
            </section>
          )}

          {data.notes && (
            <section>
              <h3 className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                Notes
              </h3>
              <p className="whitespace-pre-wrap break-words text-sm text-slate-600">
                {data.notes}
              </p>
            </section>
          )}
        </article>
      </div>
    </div>
  );
}
