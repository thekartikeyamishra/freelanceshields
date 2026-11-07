// lib/engine/input.ts
//
// Input validation shared by the API, MCP server and the in-app "open this
// invoice" link. Light enough to ship to the browser (no scanner, no PDF code).

import { CURRENCY_CODES, type CurrencyCode } from "@/lib/utils/currency";
import { isoDate } from "@/lib/ledger/ledger";
import type { InvoiceData } from "@/types/invoice";

export type Json = Record<string, unknown>;

export class ToolInputError extends Error {}

/* ----------------------------- input helpers ----------------------------- */

export const obj = (v: unknown, field: string): Json => {
  if (v && typeof v === "object" && !Array.isArray(v)) return v as Json;
  throw new ToolInputError(`${field} must be an object`);
};
export const str = (v: unknown, field: string, { max = 500, required = false } = {}): string => {
  if (v === undefined || v === null || v === "") {
    if (required) throw new ToolInputError(`${field} is required`);
    return "";
  }
  if (typeof v !== "string") throw new ToolInputError(`${field} must be a string`);
  if (v.length > max) throw new ToolInputError(`${field} is longer than ${max} characters`);
  return v;
};
export const num = (v: unknown, field: string, { min = -Infinity, max = Infinity, fallback = 0 } = {}): number => {
  if (v === undefined || v === null || v === "") return fallback;
  const n = typeof v === "string" ? Number(v) : v;
  if (typeof n !== "number" || !Number.isFinite(n)) throw new ToolInputError(`${field} must be a number`);
  if (n < min || n > max) throw new ToolInputError(`${field} must be between ${min} and ${max}`);
  return n;
};
export const bool = (v: unknown) => v === true || v === "true";
export const date = (v: unknown, field: string, required = false): string => {
  const s = str(v, field, { max: 10, required });
  if (s && !/^\d{4}-\d{2}-\d{2}$/.test(s)) throw new ToolInputError(`${field} must be yyyy-mm-dd`);
  return s;
};
export const currency = (v: unknown): CurrencyCode => {
  const c = (str(v, "currency", { max: 3 }) || "USD").toUpperCase();
  if (!(CURRENCY_CODES as string[]).includes(c)) {
    throw new ToolInputError(`currency must be one of ${CURRENCY_CODES.join(", ")}`);
  }
  return c as CurrencyCode;
};

const party = (v: unknown, field: string) => {
  const p = v === undefined ? {} : obj(v, field);
  return {
    name: str(p.name, `${field}.name`, { max: 200 }),
    email: str(p.email, `${field}.email`, { max: 200 }),
    address: str(p.address, `${field}.address`, { max: 1000 }),
    taxId: str(p.taxId, `${field}.taxId`, { max: 60 }),
  };
};

/** Turns loose agent input into a complete, safe InvoiceData. */
export function normalizeInvoice(input: Json): InvoiceData {
  const itemsRaw = input.items;
  if (!Array.isArray(itemsRaw) || itemsRaw.length === 0) throw new ToolInputError("items must be a non-empty array");
  if (itemsRaw.length > 200) throw new ToolInputError("items is limited to 200 lines");
  const today = isoDate();
  const due = new Date();
  due.setDate(due.getDate() + 14);
  return {
    invoiceNumber: str(input.invoiceNumber, "invoiceNumber", { max: 60 }) || "INV-001",
    issueDate: date(input.issueDate, "issueDate") || today,
    dueDate: date(input.dueDate, "dueDate") || isoDate(due),
    currency: currency(input.currency),
    sender: party(input.sender, "sender"),
    client: party(input.client, "client"),
    items: itemsRaw.map((raw, i) => {
      const it = obj(raw, `items[${i}]`);
      return {
        id: `item-${i + 1}`,
        description: str(it.description, `items[${i}].description`, { max: 500 }),
        quantity: num(it.quantity, `items[${i}].quantity`, { min: 0, max: 1e7, fallback: 1 }),
        rate: num(it.rate, `items[${i}].rate`, { min: 0, max: 1e11 }),
      };
    }),
    taxLabel: str(input.taxLabel, "taxLabel", { max: 30 }) || "Tax",
    taxRate: num(input.taxRate, "taxRate", { min: 0, max: 100 }),
    reverseCharge: bool(input.reverseCharge),
    discountMode: input.discountMode === "percent" ? "percent" : "amount",
    discountValue: num(input.discountValue, "discountValue", { min: 0, max: 1e11 }),
    placeOfSupply: str(input.placeOfSupply, "placeOfSupply", { max: 100 }),
    notes: str(input.notes, "notes", { max: 2000 }),
    paymentInstructions: str(input.paymentInstructions, "paymentInstructions", { max: 2000 }),
  };
}

/** base64url without Buffer, so it also runs in browsers and edge runtimes. */
export function toBase64Url(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export function fromBase64Url(s: string): string {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(b64);
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

