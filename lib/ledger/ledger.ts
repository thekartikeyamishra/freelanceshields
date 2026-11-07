// lib/ledger/ledger.ts
//
// The "who owes me money" ledger. Pure functions only — no React, no storage,
// no network — so the same code runs in the web app, the API/MCP server and the
// browser extension.
//
// WHY THIS EXISTS: a one-off tool gets used once. Getting paid is a weekly
// problem. Every invoice the user downloads lands here, and the dashboard turns
// it into a short "chase today" list. That recurring job is the habit loop, and
// it costs nothing to run because it lives on the user's device.

import type { InvoiceData } from "@/types/invoice";
import { calculateTotals } from "@/lib/utils/invoiceMath";

export type LedgerStatus = "unpaid" | "paid" | "void";

export interface LedgerEntry {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  currency: string;
  total: number;
  issueDate: string; // yyyy-mm-dd
  dueDate: string; // yyyy-mm-dd
  status: LedgerStatus;
  paidAt: string | null;
  /** ISO dates on which a reminder was sent, oldest first. */
  reminders: string[];
  createdAt: string;
  updatedAt: string;
  /** Full invoice, so "duplicate" and "re-download" work offline. */
  snapshot: InvoiceData;
}

/** Where an unpaid invoice is in its life. Drives the tone of reminders. */
export type Stage = "not-due" | "due-soon" | "due-today" | "overdue" | "late" | "very-late";

const DAY = 86_400_000;

export function isoDate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseIso(iso: string): number {
  const [y, m, d] = String(iso).split("-").map(Number);
  if (!y || !m || !d) return NaN;
  return Date.UTC(y, m - 1, d);
}

/** Whole days from `today` to the due date. Negative = overdue. */
export function daysUntilDue(dueDate: string, today: string = isoDate()): number {
  const a = parseIso(dueDate);
  const b = parseIso(today);
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.round((a - b) / DAY);
}

export function stageOf(entry: Pick<LedgerEntry, "dueDate">, today: string = isoDate()): Stage {
  const d = daysUntilDue(entry.dueDate, today);
  if (d > 3) return "not-due";
  if (d > 0) return "due-soon";
  if (d === 0) return "due-today";
  if (d >= -7) return "overdue";
  if (d >= -30) return "late";
  return "very-late";
}

function makeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `inv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Build a ledger entry from an invoice, preserving status if it already exists. */
export function entryFromInvoice(
  invoice: InvoiceData,
  existing?: LedgerEntry,
  now: Date = new Date(),
): LedgerEntry {
  const totals = calculateTotals(invoice);
  const stamp = now.toISOString();
  return {
    id: existing?.id ?? makeId(),
    invoiceNumber: invoice.invoiceNumber.trim() || "Untitled",
    clientName: invoice.client.name.trim() || "Unnamed client",
    clientEmail: invoice.client.email.trim(),
    currency: invoice.currency,
    total: totals.total,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate || invoice.issueDate,
    status: existing?.status ?? "unpaid",
    paidAt: existing?.paidAt ?? null,
    reminders: existing?.reminders ?? [],
    createdAt: existing?.createdAt ?? stamp,
    updatedAt: stamp,
    snapshot: invoice,
  };
}

/**
 * Insert or update by invoice number. Re-downloading the same invoice after a
 * typo fix updates the existing row instead of creating a duplicate.
 */
export function upsertInvoice(entries: LedgerEntry[], invoice: InvoiceData, now?: Date): LedgerEntry[] {
  const key = invoice.invoiceNumber.trim().toLowerCase();
  const idx = entries.findIndex((e) => e.invoiceNumber.trim().toLowerCase() === key);
  if (idx === -1) return [entryFromInvoice(invoice, undefined, now), ...entries];
  const next = entries.slice();
  next[idx] = entryFromInvoice(invoice, entries[idx], now);
  return next;
}

/** "INV-009" → "INV-010", "2026/41" → "2026/42", "Acme" → "Acme-2". */
export function nextInvoiceNumber(previous: string): string {
  const p = previous.trim() || "INV-000";
  const m = p.match(/^(.*?)(\d+)(\D*)$/);
  if (!m) return `${p}-2`;
  const [, head, digits, tail] = m;
  const n = String(Number(digits) + 1).padStart(digits.length, "0");
  return `${head}${n}${tail}`;
}

/** Highest-numbered invoice in the ledger, by creation time. */
export function suggestNextNumber(entries: LedgerEntry[], fallback = "INV-001"): string {
  if (entries.length === 0) return fallback;
  const latest = entries.reduce((a, b) => (a.createdAt > b.createdAt ? a : b));
  const candidate = nextInvoiceNumber(latest.invoiceNumber);
  const taken = new Set(entries.map((e) => e.invoiceNumber.toLowerCase()));
  let n = candidate;
  for (let i = 0; i < 1000 && taken.has(n.toLowerCase()); i += 1) n = nextInvoiceNumber(n);
  return n;
}

export interface LedgerSummary {
  /** Unpaid totals by currency. Currencies are never summed together. */
  outstanding: Record<string, number>;
  overdue: Record<string, number>;
  paidThisMonth: Record<string, number>;
  unpaidCount: number;
  overdueCount: number;
  /** Unpaid invoices that warrant action today, most urgent first. */
  actionToday: LedgerEntry[];
}

function add(map: Record<string, number>, cur: string, amount: number) {
  map[cur] = Math.round(((map[cur] ?? 0) + amount) * 100) / 100;
}

/** A reminder was already sent today or within the last `gap` days. */
function remindedRecently(entry: LedgerEntry, today: string, gap: number): boolean {
  const last = entry.reminders[entry.reminders.length - 1];
  if (!last) return false;
  // daysUntilDue(a, b) = a − b in days, so this is "days since the last reminder".
  const since = daysUntilDue(today, last.slice(0, 10));
  return since >= 0 && since < gap;
}

export function summarize(entries: LedgerEntry[], today: string = isoDate()): LedgerSummary {
  const s: LedgerSummary = {
    outstanding: {},
    overdue: {},
    paidThisMonth: {},
    unpaidCount: 0,
    overdueCount: 0,
    actionToday: [],
  };
  const month = today.slice(0, 7);

  for (const e of entries) {
    if (e.status === "paid") {
      if (e.paidAt && e.paidAt.slice(0, 7) === month) add(s.paidThisMonth, e.currency, e.total);
      continue;
    }
    if (e.status === "void") continue;

    s.unpaidCount += 1;
    add(s.outstanding, e.currency, e.total);
    const days = daysUntilDue(e.dueDate, today);
    if (days < 0) {
      s.overdueCount += 1;
      add(s.overdue, e.currency, e.total);
    }
    // Action today: due within a day, or overdue — and not chased in the last 3 days.
    if (days <= 1 && !remindedRecently(e, today, 3)) s.actionToday.push(e);
  }

  s.actionToday.sort((a, b) => daysUntilDue(a.dueDate, today) - daysUntilDue(b.dueDate, today));
  return s;
}

export interface ReminderDraft {
  subject: string;
  body: string;
  tone: "friendly" | "firm" | "final";
}

export interface ReminderInput {
  invoiceNumber: string;
  clientName: string;
  amount: string; // already formatted, e.g. "₹63,720.00"
  dueDate: string;
  senderName: string;
  daysOverdue: number; // negative or 0 = not yet overdue
  paymentInstructions?: string;
}

/**
 * Plain, polite reminder text that escalates with time but never threatens.
 * Pre-written, so it costs nothing and says nothing we cannot stand behind.
 */
export function draftReminder(r: ReminderInput): ReminderDraft {
  const who = r.clientName.trim() || "there";
  const me = r.senderName.trim() || "";
  const sign = me ? `\n\nThanks,\n${me}` : "\n\nThanks";
  const pay = r.paymentInstructions?.trim() ? `\n\nPayment details:\n${r.paymentInstructions.trim()}` : "";

  if (r.daysOverdue <= 0) {
    return {
      tone: "friendly",
      subject: `Invoice ${r.invoiceNumber} — due ${r.dueDate}`,
      body: `Hi ${who},\n\nA quick note that invoice ${r.invoiceNumber} for ${r.amount} is due on ${r.dueDate}. Let me know if you need anything from me to process it.${pay}${sign}`,
    };
  }
  if (r.daysOverdue <= 14) {
    return {
      tone: "firm",
      subject: `Overdue: invoice ${r.invoiceNumber} (${r.amount})`,
      body: `Hi ${who},\n\nInvoice ${r.invoiceNumber} for ${r.amount} was due on ${r.dueDate} and is now ${r.daysOverdue} day${r.daysOverdue === 1 ? "" : "s"} overdue. Could you confirm when payment will be made? If it has already been sent, please share the reference so I can match it.${pay}${sign}`,
    };
  }
  return {
    tone: "final",
    subject: `Second notice: invoice ${r.invoiceNumber} is ${r.daysOverdue} days overdue`,
    body: `Hi ${who},\n\nI have not yet received payment for invoice ${r.invoiceNumber} (${r.amount}), due on ${r.dueDate} — now ${r.daysOverdue} days overdue. Please arrange payment this week, or reply with a date I can expect it. If there is a problem with the invoice, tell me and I will fix it straight away.${pay}${sign}`,
  };
}

/** RFC 5545 calendar file with a reminder on the due date. No server, no account. */
export function dueDateIcs(e: Pick<LedgerEntry, "id" | "invoiceNumber" | "clientName" | "dueDate">, amount: string): string {
  const esc = (s: string) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
  const d = e.dueDate.replace(/-/g, "");
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const nextDay = new Date(parseIso(e.dueDate) + DAY).toISOString().slice(0, 10).replace(/-/g, "");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FreelanceShield//Ledger//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${e.id}@freelanceshield.me`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${d}`,
    `DTEND;VALUE=DATE:${nextDay}`,
    `SUMMARY:${esc(`Payment due: ${e.invoiceNumber} — ${e.clientName} (${amount})`)}`,
    `DESCRIPTION:${esc("Check whether this invoice has been paid. Open https://freelanceshield.me/dashboard to send a reminder.")}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "DESCRIPTION:Invoice payment due",
    "TRIGGER:PT9H",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

/** CSV for accountants. Values are quoted; formula-leading cells are neutralised. */
export function ledgerCsv(entries: LedgerEntry[]): string {
  const cell = (v: string | number) => {
    let s = String(v ?? "");
    if (/^[=+\-@]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };
  const head = ["Invoice", "Client", "Email", "Currency", "Total", "Issued", "Due", "Status", "Paid on", "Reminders sent"];
  const rows = entries.map((e) =>
    [e.invoiceNumber, e.clientName, e.clientEmail, e.currency, e.total.toFixed(2), e.issueDate, e.dueDate, e.status, e.paidAt?.slice(0, 10) ?? "", e.reminders.length].map(cell).join(","),
  );
  return [head.map(cell).join(","), ...rows].join("\r\n");
}

/** Runtime check for imported data. Anything malformed is dropped, not trusted. */
export function sanitizeEntries(raw: unknown): LedgerEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (e): e is LedgerEntry =>
      !!e &&
      typeof e === "object" &&
      typeof (e as LedgerEntry).id === "string" &&
      typeof (e as LedgerEntry).invoiceNumber === "string" &&
      typeof (e as LedgerEntry).total === "number" &&
      typeof (e as LedgerEntry).dueDate === "string" &&
      ["unpaid", "paid", "void"].includes((e as LedgerEntry).status) &&
      Array.isArray((e as LedgerEntry).reminders) &&
      !!(e as LedgerEntry).snapshot,
  );
}
