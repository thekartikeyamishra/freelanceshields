// types/invoice.ts
//
// Single source of truth for invoice shape. Previously this lived inside
// InvoiceForm.tsx, which meant the PDF layer imported a React component file
// just to get a type. Splitting it out lets the PDF, math and form layers share
// one definition without circular imports.

import type { CurrencyCode } from '@/lib/utils/currency';

export interface InvoiceItem {
  id: string;
  description: string;
  /** Major units. Kept as a string in the form so partial input ("1.") doesn't reset. */
  quantity: number;
  rate: number;
}

/** Whether the discount is a flat amount or a percentage of subtotal. */
export type DiscountMode = 'amount' | 'percent';

export interface Party {
  name: string;
  email: string;
  /** Free-text postal address. Multi-line allowed. */
  address: string;
  /**
   * Tax registration number. Deliberately generic: this is GSTIN in India,
   * VAT number in the EU/UK, ABN in Australia, and blank where not applicable.
   */
  taxId: string;
}

export interface InvoiceData {
  invoiceNumber: string;
  /** ISO date string (yyyy-mm-dd) as produced by <input type="date">. */
  issueDate: string;
  dueDate: string;

  currency: CurrencyCode;

  sender: Party;
  client: Party;

  items: InvoiceItem[];

  /**
   * Label for the tax line. Users need to print the correct statutory name
   * ("GST", "VAT", "IGST", "Sales Tax") rather than a generic "Tax".
   */
  taxLabel: string;
  /** Percentage, e.g. 18 for 18%. */
  taxRate: number;

  /**
   * When true, tax is charged at zero and a reverse-charge note is printed.
   * Required for EU/UK B2B cross-border services, where the customer accounts
   * for the VAT. See the reverse-charge guide for when this applies.
   */
  reverseCharge: boolean;

  discountMode: DiscountMode;
  /** Flat amount in major units when mode is 'amount'; percentage when 'percent'. */
  discountValue: number;

  /**
   * Place of supply. Relevant for Indian GST and for EU VAT determination.
   * Optional and only printed when filled.
   */
  placeOfSupply: string;

  /** Free-text notes printed under the totals. */
  notes: string;
  /** Bank details, UPI ID, payment link, etc. */
  paymentInstructions: string;
}

/** Result of the money calculation, all in major units, already rounded. */
export interface InvoiceTotals {
  subtotal: number;
  discountAmount: number;
  /** Subtotal minus discount. This is the base tax is charged on. */
  taxableBase: number;
  taxAmount: number;
  total: number;
  /** True when the discount exceeded the subtotal, so the caller can warn. */
  discountExceedsSubtotal: boolean;
}
