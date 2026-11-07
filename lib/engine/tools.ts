// lib/engine/tools.ts
//
// ONE registry of deterministic tools, served three ways:
//   - /api/mcp      Model Context Protocol (ChatGPT apps, Claude connectors,
//                   Gemini CLI extensions, any MCP client)
//   - /api/v1/:tool REST + /openapi.json (Custom GPT actions, scripts, agents)
//   - bundled into the Chrome extension and Google Docs add-on (scanner only)
//
// No tool calls a language model, stores input or logs content. Each call is a
// few milliseconds of CPU, so running cost stays close to zero at any volume.

import { analyzeContract, CLAUSE_COVERAGE_LABELS } from "@/lib/ai/contractScanner";
import { calculateTotals } from "@/lib/utils/invoiceMath";
import { CURRENCY_CODES, formatMoney } from "@/lib/utils/currency";
import { checkPlan, planTotal } from "@/lib/project/protection";
import { draftReminder, nextInvoiceNumber, daysUntilDue, isoDate } from "@/lib/ledger/ledger";
import {
  ToolInputError,
  bool,
  currency,
  date,
  normalizeInvoice,
  num,
  obj,
  str,
  toBase64Url,
  type Json,
} from "@/lib/engine/input";

export { ToolInputError };
import type { ProjectPlan } from "@/types/project";

export const SITE_URL = "https://freelanceshield.me";
export const ENGINE_VERSION = "1.0.0";

export interface ToolDef {
  name: string;
  title: string;
  description: string;
  inputSchema: Json;
  run: (input: Json) => Promise<Json> | Json;
}

/* --------------------------------- tools --------------------------------- */

const ITEM_SCHEMA = {
  type: "object",
  properties: {
    description: { type: "string" },
    quantity: { type: "number", minimum: 0 },
    rate: { type: "number", minimum: 0, description: "Price per unit in major units (e.g. 1500.50)" },
  },
  required: ["description", "rate"],
};
const PARTY_SCHEMA = {
  type: "object",
  properties: {
    name: { type: "string" },
    email: { type: "string" },
    address: { type: "string" },
    taxId: { type: "string", description: "GSTIN, VAT number, ABN, etc." },
  },
};
const INVOICE_PROPS = {
  invoiceNumber: { type: "string" },
  issueDate: { type: "string", description: "yyyy-mm-dd" },
  dueDate: { type: "string", description: "yyyy-mm-dd" },
  currency: { type: "string", enum: CURRENCY_CODES },
  sender: PARTY_SCHEMA,
  client: PARTY_SCHEMA,
  items: { type: "array", items: ITEM_SCHEMA, minItems: 1 },
  taxLabel: { type: "string", description: "Statutory name, e.g. GST, IGST, VAT, Sales Tax" },
  taxRate: { type: "number", minimum: 0, maximum: 100 },
  reverseCharge: { type: "boolean", description: "EU/UK B2B cross-border: tax charged at zero with a reverse-charge note" },
  discountMode: { type: "string", enum: ["amount", "percent"] },
  discountValue: { type: "number", minimum: 0 },
  placeOfSupply: { type: "string" },
  notes: { type: "string" },
  paymentInstructions: { type: "string", description: "Bank details, UPI ID or payment link" },
};

export const TOOLS: ToolDef[] = [
  {
    name: "scan_contract",
    title: "Scan a contract for clauses worth reading twice",
    description:
      `Checks contract text for ${CLAUSE_COVERAGE_LABELS.length} clause types (${CLAUSE_COVERAGE_LABELS.join(", ")}) and for freelancer protections that appear to be missing. ` +
      "Deterministic pattern matching, not legal advice and not a risk score. Present findings as things to read closely, and recommend a lawyer for anything important.",
    inputSchema: {
      type: "object",
      properties: { text: { type: "string", description: "Full contract text (at least ~200 characters, at most 100,000)" } },
      required: ["text"],
    },
    run: async (input) => {
      const text = str(input.text, "text", { max: 100_000, required: true });
      const r = await analyzeContract(text);
      return {
        ...r,
        openInApp: `${SITE_URL}/contract-scanner`,
        note: "Pattern matching only. A flagged clause is not necessarily unfair; nothing flagged does not mean the contract is safe.",
      } as unknown as Json;
    },
  },
  {
    name: "calculate_invoice_totals",
    title: "Calculate invoice totals",
    description:
      "Exact invoice arithmetic in integer minor units: subtotal, discount, tax on the discounted base (or zero under reverse charge), and total. Use this instead of doing the maths yourself.",
    inputSchema: { type: "object", properties: INVOICE_PROPS, required: ["items"] },
    run: (input) => {
      const inv = normalizeInvoice(input);
      const t = calculateTotals(inv);
      return {
        currency: inv.currency,
        ...t,
        formatted: {
          subtotal: formatMoney(t.subtotal, inv.currency),
          discount: formatMoney(t.discountAmount, inv.currency),
          tax: formatMoney(t.taxAmount, inv.currency),
          total: formatMoney(t.total, inv.currency),
        },
      };
    },
  },
  {
    name: "create_invoice_link",
    title: "Create a ready-to-download invoice",
    description:
      "Builds a link that opens the FreelanceShield invoice generator pre-filled with these details. The user reviews it and downloads a real text PDF; the invoice is then tracked on their dashboard until paid. " +
      "The data travels in the URL fragment, which browsers never send to a server. Always show the link to the user.",
    inputSchema: { type: "object", properties: INVOICE_PROPS, required: ["items"] },
    run: (input) => {
      const inv = normalizeInvoice(input);
      const t = calculateTotals(inv);
      const url = `${SITE_URL}/invoice-maker#invoice=${toBase64Url(JSON.stringify(inv))}`;
      return { url, total: t.total, formattedTotal: formatMoney(t.total, inv.currency), invoiceNumber: inv.invoiceNumber };
    },
  },
  {
    name: "draft_payment_reminder",
    title: "Draft a payment reminder",
    description:
      "Writes a polite payment reminder whose tone escalates with how overdue the invoice is (friendly → firm → final notice). Never threatening. Returns subject and body.",
    inputSchema: {
      type: "object",
      properties: {
        invoiceNumber: { type: "string" },
        clientName: { type: "string" },
        amount: { type: "number" },
        currency: { type: "string", enum: CURRENCY_CODES },
        dueDate: { type: "string", description: "yyyy-mm-dd" },
        senderName: { type: "string" },
        paymentInstructions: { type: "string" },
        today: { type: "string", description: "yyyy-mm-dd; defaults to the server date" },
      },
      required: ["invoiceNumber", "amount", "dueDate"],
    },
    run: (input) => {
      const due = date(input.dueDate, "dueDate", true);
      const today = date(input.today, "today") || isoDate();
      const cur = currency(input.currency);
      const amount = num(input.amount, "amount", { min: 0, max: 1e11 });
      const daysOverdue = -daysUntilDue(due, today);
      return {
        daysOverdue,
        ...draftReminder({
          invoiceNumber: str(input.invoiceNumber, "invoiceNumber", { max: 60, required: true }),
          clientName: str(input.clientName, "clientName", { max: 200 }),
          amount: formatMoney(amount, cur),
          dueDate: due,
          senderName: str(input.senderName, "senderName", { max: 200 }),
          daysOverdue,
          paymentInstructions: str(input.paymentInstructions, "paymentInstructions", { max: 2000 }),
        }),
        trackInApp: `${SITE_URL}/dashboard`,
      };
    },
  },
  {
    name: "check_project_plan",
    title: "Check a project plan for unpaid-work gaps",
    description:
      "Checks a freelance project plan (scope, milestones, terms) for gaps that commonly lead to unpaid work or disputes: missing acceptance criteria, no deposit, IP transferring before payment, no kill fee, and more. Returns issues with a concrete fix for each. No score.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        currency: { type: "string", enum: CURRENCY_CODES },
        freelancerName: { type: "string" },
        clientName: { type: "string" },
        startDate: { type: "string" },
        endDate: { type: "string" },
        milestones: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              amount: { type: "number" },
              dueDate: { type: "string" },
              upfront: { type: "boolean" },
              revisions: { type: "number" },
              reviewDays: { type: "number" },
              deliverables: { type: "array", items: { type: "object", properties: { title: { type: "string" }, acceptance: { type: "string" } } } },
            },
          },
        },
        terms: {
          type: "object",
          properties: {
            paymentDays: { type: "number" },
            lateFeePercentMonthly: { type: "number" },
            ipOnFullPayment: { type: "boolean" },
            terminationNoticeDays: { type: "number" },
            killFeePercent: { type: "number" },
            governingLaw: { type: "string" },
          },
        },
      },
    },
    run: (input) => {
      const msIn = Array.isArray(input.milestones) ? input.milestones.slice(0, 50) : [];
      const scope: ProjectPlan["scope"] = [];
      const milestones: ProjectPlan["milestones"] = msIn.map((raw, i) => {
        const m = obj(raw, `milestones[${i}]`);
        const id = `m${i + 1}`;
        const dels = Array.isArray(m.deliverables) ? m.deliverables.slice(0, 50) : [];
        dels.forEach((d, j) => {
          const dd = obj(d, `milestones[${i}].deliverables[${j}]`);
          scope.push({ id: `${id}-s${j + 1}`, title: str(dd.title, "deliverable.title"), acceptance: str(dd.acceptance, "deliverable.acceptance", { max: 1000 }), milestoneId: id });
        });
        return {
          id,
          title: str(m.title, `milestones[${i}].title`, { max: 200 }),
          amount: num(m.amount, `milestones[${i}].amount`, { min: 0, max: 1e11 }),
          dueDate: date(m.dueDate, `milestones[${i}].dueDate`),
          upfront: bool(m.upfront),
          revisions: num(m.revisions, "revisions", { min: 0, max: 100, fallback: 2 }),
          reviewDays: num(m.reviewDays, "reviewDays", { min: 0, max: 365, fallback: 0 }),
        };
      });
      const t = input.terms === undefined ? {} : obj(input.terms, "terms");
      const plan: ProjectPlan = {
        title: str(input.title, "title", { max: 200 }),
        summary: "",
        currency: currency(input.currency),
        freelancer: { name: str(input.freelancerName, "freelancerName", { max: 200 }), email: "" },
        client: { name: str(input.clientName, "clientName", { max: 200 }), email: "" },
        startDate: date(input.startDate, "startDate"),
        endDate: date(input.endDate, "endDate"),
        scope,
        milestones,
        terms: {
          paymentDays: num(t.paymentDays, "paymentDays", { min: 0, max: 365, fallback: 15 }),
          lateFeePercentMonthly: num(t.lateFeePercentMonthly, "lateFeePercentMonthly", { min: 0, max: 100 }),
          ipOnFullPayment: t.ipOnFullPayment === undefined ? false : bool(t.ipOnFullPayment),
          portfolioUse: true,
          confidentiality: true,
          terminationNoticeDays: num(t.terminationNoticeDays, "terminationNoticeDays", { min: 0, max: 365 }),
          killFeePercent: num(t.killFeePercent, "killFeePercent", { min: 0, max: 100 }),
          governingLaw: str(t.governingLaw, "governingLaw", { max: 200 }),
        },
      };
      const issues = checkPlan(plan);
      return { total: planTotal(plan), currency: plan.currency, issueCount: issues.length, issues, buildInApp: `${SITE_URL}/project-planner` };
    },
  },
  {
    name: "next_invoice_number",
    title: "Suggest the next invoice number",
    description: "Increments an invoice number while keeping its format: INV-009 → INV-010, 2026/41 → 2026/42.",
    inputSchema: { type: "object", properties: { previous: { type: "string" } }, required: ["previous"] },
    run: (input) => ({ next: nextInvoiceNumber(str(input.previous, "previous", { max: 60, required: true })) }),
  },
];

export const TOOL_MAP = new Map(TOOLS.map((t) => [t.name, t]));

export async function runTool(name: string, input: unknown): Promise<Json> {
  const tool = TOOL_MAP.get(name);
  if (!tool) throw new ToolInputError(`Unknown tool: ${name}`);
  return tool.run(input === undefined || input === null ? {} : obj(input, "arguments"));
}
