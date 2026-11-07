// lib/assist/steps.ts
// Walkthroughs that TRACK real progress: each step's "done" is computed from
// the draft the user already has on this device. No tracking, no server.

export interface Step { en: string; hi: string; done: boolean }
export interface Walkthrough { title: { en: string; hi: string }; href: string; steps: Step[] }

function parse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}

interface InvoiceDraft {
  sender?: { name?: string };
  client?: { name?: string };
  items?: Array<{ description?: string; rate?: number }>;
  dueDate?: string;
  paymentInstructions?: string;
}

interface PlanDraft {
  client?: { name?: string };
  scope?: Array<{ acceptance?: string; milestoneId?: string | null }>;
  milestones?: Array<{ upfront?: boolean; amount?: number }>;
  terms?: { governingLaw?: string };
}

export function invoiceWalkthrough(raw: string | null): Walkthrough {
  const d = parse<InvoiceDraft>(raw) ?? {};
  return {
    title: { en: "Make an invoice", hi: "इनवॉइस बनाएँ" },
    href: "/invoice-maker",
    steps: [
      { en: "Add your name", hi: "अपना नाम जोड़ें", done: Boolean(d.sender?.name?.trim()) },
      { en: "Add the client", hi: "क्लाइंट जोड़ें", done: Boolean(d.client?.name?.trim()) },
      { en: "Add a line item with a rate", hi: "रेट के साथ आइटम जोड़ें", done: Boolean(d.items?.some((i) => i.description?.trim() && (i.rate ?? 0) > 0)) },
      { en: "Set a due date", hi: "ड्यू डेट डालें", done: Boolean(d.dueDate) },
      { en: "Say how to pay you", hi: "भुगतान का तरीका लिखें", done: Boolean(d.paymentInstructions?.trim()) },
    ],
  };
}

export function planWalkthrough(raw: string | null): Walkthrough {
  const d = parse<PlanDraft>(raw) ?? {};
  const scope = d.scope ?? [];
  return {
    title: { en: "Plan a project", hi: "प्रोजेक्ट प्लान करें" },
    href: "/project-planner",
    steps: [
      { en: "Name the client", hi: "क्लाइंट का नाम", done: Boolean(d.client?.name?.trim()) },
      { en: "Add an upfront deposit", hi: "एडवांस जोड़ें", done: Boolean(d.milestones?.some((m) => m.upfront && (m.amount ?? 0) > 0)) },
      { en: "Give every deliverable a “done when”", hi: "हर काम का “कब पूरा” लिखें", done: scope.length > 0 && scope.every((s) => s.acceptance?.trim()) },
      { en: "Attach every deliverable to a milestone", hi: "हर काम को माइलस्टोन से जोड़ें", done: scope.length > 0 && scope.every((s) => s.milestoneId) },
      { en: "Set governing law", hi: "लागू कानून लिखें", done: Boolean(d.terms?.governingLaw?.trim()) },
    ],
  };
}

export function progress(w: Walkthrough): number {
  return w.steps.length ? w.steps.filter((s) => s.done).length / w.steps.length : 0;
}
