"use client";

// components/core/InvoiceForm.tsx
//
// -------------------------------------------------------------------------
// WHAT CHANGED
// -------------------------------------------------------------------------
//
// 1. REMOVED THE IN-FLOW AD. The previous version ended with
//        <StrategicAdSlot slotId="7487201837" label="Recommended Financial Tools" />
//    directly after the last input, which on mobile placed an ad styled like a
//    form panel between the form and the preview. That is a click-proximity
//    problem and a labelling problem at once. No ads render inside the tool.
//
// 2. REMOVED THE "VERIFIED FREELANCER" BADGE. It was a self-applied badge,
//    verified by nobody, described in the UI as a "Trust Booster" and intended
//    to be shown to the user's clients. That is a fabricated credential we were
//    handing users to deploy against third parties.
//
// 3. FIXED LABELLING. Every input now has a real <label htmlFor> bound to an
//    id. Previously the sender name, sender email, client name, client email
//    and all line-item fields were placeholder-only, and the labels that did
//    exist had no htmlFor and did not wrap their input, so nothing was
//    programmatically associated for screen readers.
//
// 4. ADDED THE FIELDS OUR CONTENT PROMISES. We publish guides on GST, LUT,
//    reverse-charge VAT, W-9s and place of supply, all pointing at a generator
//    that had a single unlabelled tax percentage. Added: postal addresses, tax
//    registration numbers, a tax label, reverse charge, place of supply,
//    percentage discounts, notes and payment instructions.

import React from "react";
import { Plus, Trash2, Info } from "lucide-react";
import { CURRENCIES, CURRENCY_CODES, currencySymbol } from "@/lib/utils/currency";
import type { CurrencyCode } from "@/lib/utils/currency";
import type { InvoiceData, InvoiceItem, InvoiceTotals } from "@/types/invoice";

interface InvoiceFormProps {
  data: InvoiceData;
  totals: InvoiceTotals;
  setField: <K extends keyof InvoiceData>(field: K, value: InvoiceData[K]) => void;
  setParty: (
    party: "sender" | "client",
    field: keyof InvoiceData["sender"],
    value: string,
  ) => void;
  updateItem: (
    id: string,
    field: keyof Omit<InvoiceItem, "id">,
    value: string | number,
  ) => void;
  addItem: () => void;
  removeItem: (id: string) => void;
}

/* -------------------------------------------------------------------------- */
/* Shared field primitives                                                    */
/* -------------------------------------------------------------------------- */

const inputClass =
  "w-full rounded-lg border border-slate-200 p-2.5 text-sm outline-none transition-colors " +
  "focus:border-brand-400 focus:ring-2 focus:ring-brand-500/30";

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-bold text-slate-700">{title}</h2>
      {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-slate-600">
        {label}
      </label>
      {children}
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-[11px] leading-snug text-slate-500">
          {hint}
        </p>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Party block                                                                */
/* -------------------------------------------------------------------------- */

function PartyFields({
  party,
  heading,
  taxIdHint,
  data,
  setParty,
}: {
  party: "sender" | "client";
  heading: string;
  taxIdHint: string;
  data: InvoiceData;
  setParty: InvoiceFormProps["setParty"];
}) {
  const p = data[party];

  return (
    <fieldset className="min-w-0">
      <legend className="mb-3 text-sm font-bold text-slate-700">{heading}</legend>
      <div className="space-y-3">
        <Field id={`${party}-name`} label="Name or business name">
          <input
            id={`${party}-name`}
            type="text"
            autoComplete={party === "sender" ? "organization" : "off"}
            value={p.name}
            onChange={(e) => setParty(party, "name", e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field id={`${party}-email`} label="Email">
          <input
            id={`${party}-email`}
            type="email"
            inputMode="email"
            autoComplete={party === "sender" ? "email" : "off"}
            value={p.email}
            onChange={(e) => setParty(party, "email", e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field
          id={`${party}-address`}
          label="Address"
          hint={
            party === "sender"
              ? "A business address is fine if you would rather not print your home address."
              : undefined
          }
        >
          <textarea
            id={`${party}-address`}
            rows={3}
            value={p.address}
            onChange={(e) => setParty(party, "address", e.target.value)}
            className={`${inputClass} resize-y`}
          />
        </Field>

        <Field id={`${party}-taxid`} label="Tax registration number" hint={taxIdHint}>
          <input
            id={`${party}-taxid`}
            type="text"
            value={p.taxId}
            onChange={(e) => setParty(party, "taxId", e.target.value)}
            aria-describedby={`${party}-taxid-hint`}
            className={inputClass}
          />
        </Field>
      </div>
    </fieldset>
  );
}

/* -------------------------------------------------------------------------- */
/* Main form                                                                  */
/* -------------------------------------------------------------------------- */

export default function InvoiceForm({
  data,
  totals,
  setField,
  setParty,
  updateItem,
  addItem,
  removeItem,
}: InvoiceFormProps) {
  const symbol = currencySymbol(data.currency);

  return (
    <div className="space-y-6">
      {/* 1. Invoice details ------------------------------------------------ */}
      <Panel title="Invoice details">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="invoice-number" label="Invoice number">
            <input
              id="invoice-number"
              type="text"
              value={data.invoiceNumber}
              onChange={(e) => setField("invoiceNumber", e.target.value)}
              className={inputClass}
              placeholder="INV-001"
            />
          </Field>

          <Field id="currency" label="Currency">
            <select
              id="currency"
              value={data.currency}
              onChange={(e) => setField("currency", e.target.value as CurrencyCode)}
              className={`${inputClass} bg-white`}
            >
              {CURRENCY_CODES.map((code) => (
                <option key={code} value={code}>
                  {code} — {CURRENCIES[code].label}
                </option>
              ))}
            </select>
          </Field>

          <Field id="issue-date" label="Issue date">
            <input
              id="issue-date"
              type="date"
              value={data.issueDate}
              onChange={(e) => setField("issueDate", e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field
            id="due-date"
            label="Due date"
            hint="Stating a date makes a late invoice unambiguous."
          >
            <input
              id="due-date"
              type="date"
              value={data.dueDate}
              min={data.issueDate || undefined}
              onChange={(e) => setField("dueDate", e.target.value)}
              aria-describedby="due-date-hint"
              className={inputClass}
            />
          </Field>
        </div>
      </Panel>

      {/* 2. Parties -------------------------------------------------------- */}
      <Panel title="Who this invoice is between">
        <div className="grid gap-8 md:grid-cols-2">
          <PartyFields
            party="sender"
            heading="From you"
            taxIdHint="GSTIN in India, VAT number in the UK or EU, ABN in Australia. Leave blank if you are not registered."
            data={data}
            setParty={setParty}
          />
          <PartyFields
            party="client"
            heading="Bill to"
            taxIdHint="Your client's VAT or GST number. Required on the invoice for EU reverse charge."
            data={data}
            setParty={setParty}
          />
        </div>
      </Panel>

      {/* 3. Line items ----------------------------------------------------- */}
      <Panel
        title="Line items"
        description="Specific descriptions are approved faster than vague ones."
      >
        <ul className="space-y-3">
          {data.items.map((item, index) => (
            <li
              key={item.id}
              className="rounded-lg border border-slate-200/70 bg-slate-50 p-3"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1">
                  <label
                    htmlFor={`item-desc-${item.id}`}
                    className="mb-1 block text-xs font-medium text-slate-600"
                  >
                    Description
                    <span className="sr-only"> for line item {index + 1}</span>
                  </label>
                  <input
                    id={`item-desc-${item.id}`}
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(item.id, "description", e.target.value)}
                    className={`${inputClass} bg-white`}
                  />
                </div>

                <div className="w-full sm:w-24">
                  <label
                    htmlFor={`item-qty-${item.id}`}
                    className="mb-1 block text-xs font-medium text-slate-600"
                  >
                    Quantity
                  </label>
                  <input
                    id={`item-qty-${item.id}`}
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="any"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(item.id, "quantity", Number(e.target.value) || 0)
                    }
                    className={`${inputClass} bg-white text-right`}
                  />
                </div>

                <div className="w-full sm:w-32">
                  <label
                    htmlFor={`item-rate-${item.id}`}
                    className="mb-1 block text-xs font-medium text-slate-600"
                  >
                    Rate ({symbol})
                  </label>
                  <input
                    id={`item-rate-${item.id}`}
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="any"
                    value={item.rate}
                    onChange={(e) =>
                      updateItem(item.id, "rate", Number(e.target.value) || 0)
                    }
                    className={`${inputClass} bg-white text-right`}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="self-end rounded p-2.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                >
                  <Trash2 size={16} aria-hidden="true" />
                  <span className="sr-only">
                    Remove line item {index + 1}
                    {item.description ? `: ${item.description}` : ""}
                  </span>
                </button>
              </div>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={addItem}
          className="mt-4 inline-flex w-fit items-center gap-2 rounded-lg bg-brand-50 px-4 py-2 text-sm font-bold text-brand-700 transition-colors hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <Plus size={16} aria-hidden="true" /> Add line item
        </button>
      </Panel>

      {/* 4. Tax and discount ----------------------------------------------- */}
      <Panel
        title="Tax and discount"
        description="Which rate applies, and whether reverse charge is available, depends on where you and your client are based."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            id="tax-label"
            label="Tax name"
            hint="Print the statutory name your client expects: GST, IGST, VAT, Sales Tax."
          >
            <input
              id="tax-label"
              type="text"
              value={data.taxLabel}
              onChange={(e) => setField("taxLabel", e.target.value)}
              aria-describedby="tax-label-hint"
              className={inputClass}
              placeholder="GST"
            />
          </Field>

          <Field id="tax-rate" label="Tax rate (%)">
            <input
              id="tax-rate"
              type="number"
              inputMode="decimal"
              min="0"
              max="100"
              step="any"
              value={data.taxRate}
              disabled={data.reverseCharge}
              onChange={(e) => setField("taxRate", Number(e.target.value) || 0)}
              className={`${inputClass} text-right disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400`}
            />
          </Field>

          <Field id="discount-mode" label="Discount type">
            <select
              id="discount-mode"
              value={data.discountMode}
              onChange={(e) =>
                setField("discountMode", e.target.value as InvoiceData["discountMode"])
              }
              className={`${inputClass} bg-white`}
            >
              <option value="amount">Fixed amount</option>
              <option value="percent">Percentage of subtotal</option>
            </select>
          </Field>

          <Field
            id="discount-value"
            label={
              data.discountMode === "percent"
                ? "Discount (%)"
                : `Discount (${symbol})`
            }
          >
            <input
              id="discount-value"
              type="number"
              inputMode="decimal"
              min="0"
              max={data.discountMode === "percent" ? 100 : undefined}
              step="any"
              value={data.discountValue}
              onChange={(e) => setField("discountValue", Number(e.target.value) || 0)}
              aria-invalid={totals.discountExceedsSubtotal || undefined}
              className={`${inputClass} text-right`}
            />
          </Field>
        </div>

        {totals.discountExceedsSubtotal && (
          <p role="alert" className="mt-3 text-xs font-medium text-red-600">
            The discount is larger than the subtotal. The invoice total has been held
            at zero. Reduce the discount or add line items.
          </p>
        )}

        <div className="mt-5 border-t border-slate-100 pt-4">
          <div className="flex items-start gap-3">
            <input
              id="reverse-charge"
              type="checkbox"
              checked={data.reverseCharge}
              onChange={(e) => setField("reverseCharge", e.target.checked)}
              aria-describedby="reverse-charge-hint"
              className="mt-0.5 h-4 w-4 cursor-pointer rounded border-slate-300 text-brand-600 focus-visible:ring-2 focus-visible:ring-brand-500"
            />
            <div>
              <label
                htmlFor="reverse-charge"
                className="cursor-pointer text-sm font-medium text-slate-700"
              >
                Apply reverse charge
              </label>
              <p id="reverse-charge-hint" className="mt-1 text-[11px] leading-snug text-slate-500">
                Charges tax at zero and prints a reverse-charge statement. Used for
                some cross-border B2B services where the customer accounts for the
                tax. Confirm it applies to your situation before relying on it.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <Field
            id="place-of-supply"
            label="Place of supply (optional)"
            hint="Relevant for Indian GST and for determining EU VAT treatment."
          >
            <input
              id="place-of-supply"
              type="text"
              value={data.placeOfSupply}
              onChange={(e) => setField("placeOfSupply", e.target.value)}
              aria-describedby="place-of-supply-hint"
              className={inputClass}
            />
          </Field>
        </div>
      </Panel>

      {/* 5. Payment and notes ---------------------------------------------- */}
      <Panel title="Payment details and notes">
        <div className="space-y-4">
          <Field
            id="payment-instructions"
            label="How to pay you"
            hint="Bank name, account and IBAN or SWIFT, UPI ID, or a payment link."
          >
            <textarea
              id="payment-instructions"
              rows={4}
              value={data.paymentInstructions}
              onChange={(e) => setField("paymentInstructions", e.target.value)}
              aria-describedby="payment-instructions-hint"
              className={`${inputClass} resize-y`}
            />
          </Field>

          <Field id="notes" label="Notes (optional)">
            <textarea
              id="notes"
              rows={3}
              value={data.notes}
              onChange={(e) => setField("notes", e.target.value)}
              className={`${inputClass} resize-y`}
            />
          </Field>
        </div>

        <p className="mt-4 flex items-start gap-2 text-[11px] leading-snug text-slate-500">
          <Info size={13} aria-hidden="true" className="mt-0.5 shrink-0" />
          <span>
            This draft is saved on this device so you do not lose it on refresh. It is
            never sent to us. Use “Delete saved draft” to erase it.
          </span>
        </p>
      </Panel>
    </div>
  );
}
