// lib/utils/invoiceMath.ts
//
// FIXES A CORRECTNESS BUG IN THE PREVIOUS IMPLEMENTATION.
//
// The old code did:
//     taxAmount = subtotal * (taxRate / 100)
//     total     = subtotal + taxAmount - discount
//
// That charges tax on the pre-discount subtotal and then subtracts the discount
// afterwards. Under Indian GST (taxable value is net of trade discount shown on
// the invoice) and under EU/UK VAT (taxable amount excludes discounts granted at
// the time of supply), tax is charged on the DISCOUNTED value. Every discounted
// invoice the old tool produced carried an overstated tax figure.
//
// The correct order is: subtotal -> apply discount -> tax the remainder.
//
// This module also works in integer minor units (cents/paise) rather than floats,
// because 0.1 + 0.2 !== 0.3 in IEEE-754 and invoice totals must reconcile exactly
// against the sum of their line items.
//
// This is arithmetic, not tax advice. Which rate applies, whether a discount is
// a trade discount, and whether reverse charge is available are all
// jurisdiction-specific questions.

import type { InvoiceData, InvoiceItem, InvoiceTotals } from '@/types/invoice';
import { minorUnitFactor } from '@/lib/utils/currency';

/** Coerces possibly-NaN user input to a finite non-negative number. */
function safeNumber(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

/** Converts major units to integer minor units using half-up rounding. */
function toMinor(major: number, factor: number): number {
  return Math.round(safeNumber(major) * factor);
}

/** Converts integer minor units back to major units. */
function toMajor(minor: number, factor: number): number {
  return minor / factor;
}

/**
 * Multiplies a rate by a quantity in minor units.
 * Quantity may be fractional (e.g. 7.5 hours), so we round the product once,
 * at the line level, which is what accounting systems expect.
 */
export function lineTotalMinor(item: InvoiceItem, factor: number): number {
  const qty = safeNumber(item.quantity);
  const rateMinor = toMinor(item.rate, factor);
  return Math.round(rateMinor * qty);
}

/** Line total in major units, for display in the preview table. */
export function lineTotal(item: InvoiceItem, currency: string): number {
  const factor = minorUnitFactor(currency);
  return toMajor(lineTotalMinor(item, factor), factor);
}

/**
 * Computes every figure on the invoice.
 *
 * Order of operations:
 *   1. Sum line items          -> subtotal
 *   2. Subtract the discount   -> taxableBase
 *   3. Apply the tax rate to taxableBase (or zero it under reverse charge)
 *   4. Add tax                 -> total
 */
export function calculateTotals(data: InvoiceData): InvoiceTotals {
  const factor = minorUnitFactor(data.currency);

  // 1. Subtotal
  const subtotalMinor = (data.items ?? []).reduce(
    (acc, item) => acc + lineTotalMinor(item, factor),
    0,
  );

  // 2. Discount
  let discountMinor: number;
  if (data.discountMode === 'percent') {
    const pct = Math.min(safeNumber(data.discountValue), 100);
    discountMinor = Math.round((subtotalMinor * pct) / 100);
  } else {
    discountMinor = toMinor(data.discountValue, factor);
  }

  const discountExceedsSubtotal = discountMinor > subtotalMinor;
  // Clamp so the taxable base can never go negative. We surface the condition
  // via the flag rather than silently hiding it, so the UI can warn.
  const effectiveDiscountMinor = Math.min(discountMinor, subtotalMinor);
  const taxableBaseMinor = subtotalMinor - effectiveDiscountMinor;

  // 3. Tax on the discounted base
  const taxRate = data.reverseCharge ? 0 : Math.min(safeNumber(data.taxRate), 100);
  const taxMinor = Math.round((taxableBaseMinor * taxRate) / 100);

  // 4. Total
  const totalMinor = taxableBaseMinor + taxMinor;

  return {
    subtotal: toMajor(subtotalMinor, factor),
    discountAmount: toMajor(effectiveDiscountMinor, factor),
    taxableBase: toMajor(taxableBaseMinor, factor),
    taxAmount: toMajor(taxMinor, factor),
    total: toMajor(totalMinor, factor),
    discountExceedsSubtotal,
  };
}

/**
 * Standard reverse-charge wording for cross-border B2B services.
 *
 * The requirement to state this on the invoice comes from the EU VAT Directive
 * as implemented in each member state; the exact phrasing accepted varies by
 * country, so treat this as a starting point and confirm against the guidance
 * of the tax authority where your client is established.
 */
export const REVERSE_CHARGE_NOTE =
  'Reverse charge: VAT to be accounted for by the recipient.';
