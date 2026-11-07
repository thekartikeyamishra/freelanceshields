// lib/project/agreementPdf.ts
// Builds the project agreement summary as a real-text PDF in the browser.
// Same approach as the invoice PDF: vector text, paginated, no upload.

import { jsPDF } from 'jspdf';
import type { ProjectPlan } from '@/types/project';
import { formatAmount, resolveCurrency } from '@/lib/utils/currency';
import { planTotal } from '@/lib/project/protection';
import { formatFingerprint } from '@/lib/project/fingerprint';

const PAGE = { w: 210, h: 297 };
const M = { top: 18, side: 18, bottom: 20 };
const WIDTH = PAGE.w - M.side * 2;

function safe(text: string): string {
  return String(text ?? '')
    .replace(/[  ]/g, ' ')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/[^\x20-\x7E\n]/g, '');
}

function money(n: number, code: string): string {
  return safe(`${resolveCurrency(code).code} ${formatAmount(n, code)}`);
}

function date(iso: string): string {
  if (!iso) return 'Not set';
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? safe(iso)
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export interface AgreementMeta {
  hash: string;
  /** Locked version number, or null for an unlocked draft. */
  version: number | null;
}

export function buildAgreementPdf(plan: ProjectPlan, meta: AgreementMeta): Blob {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  let y = M.top;

  const ensure = (h: number) => {
    if (y + h > PAGE.h - M.bottom) {
      pdf.addPage();
      y = M.top;
    }
  };
  const text = (t: string, size = 9.5, bold = false, shade = 60, indent = 0) => {
    pdf.setFont('helvetica', bold ? 'bold' : 'normal');
    pdf.setFontSize(size);
    pdf.setTextColor(shade);
    const lines = pdf.splitTextToSize(safe(t), WIDTH - indent) as string[];
    for (const line of lines) {
      ensure(size * 0.5);
      pdf.text(line, M.side + indent, y);
      y += size * 0.47;
    }
  };
  const heading = (t: string) => {
    ensure(14);
    y += 4;
    text(t, 11, true, 17);
    pdf.setDrawColor(210);
    pdf.line(M.side, y - 1.5, PAGE.w - M.side, y - 1.5);
    y += 2.5;
  };

  // Title block
  text(plan.title || 'Untitled project', 18, true, 17);
  y += 1;
  text(
    meta.version ? `Project agreement summary - version ${meta.version}` : 'Project agreement summary - DRAFT (not locked)',
    9.5,
    false,
    110,
  );
  y += 2;

  heading('Parties');
  text(`Freelancer: ${plan.freelancer.name || 'Not named'}${plan.freelancer.email ? ` (${plan.freelancer.email})` : ''}`);
  text(`Client: ${plan.client.name || 'Not named'}${plan.client.email ? ` (${plan.client.email})` : ''}`);
  text(`Project period: ${date(plan.startDate)} to ${date(plan.endDate)}`);

  if (plan.summary.trim()) {
    heading('Project summary');
    text(plan.summary);
  }

  heading('Milestones and payments');
  plan.milestones.forEach((m, i) => {
    ensure(16);
    text(`${i + 1}. ${m.title || 'Untitled milestone'} - ${money(m.amount, plan.currency)}${m.upfront ? ' (payable before work begins)' : ''}`, 9.5, true, 30);
    text(
      `Due ${date(m.dueDate)}.${m.upfront ? '' : ` ${m.revisions} revision round(s) included. Client review period: ${m.reviewDays} day(s).`}`,
      9,
      false,
      70,
      5,
    );
    const items = plan.scope.filter((s) => s.milestoneId === m.id);
    items.forEach((s) => {
      text(`- ${s.title || 'Untitled deliverable'}`, 9, false, 40, 5);
      if (s.acceptance) text(`Done when: ${s.acceptance}`, 8.5, false, 100, 9);
    });
    y += 1.5;
  });
  text(`Total: ${money(planTotal(plan), plan.currency)}`, 10.5, true, 17);

  const unassigned = plan.scope.filter((s) => !plan.milestones.some((m) => m.id === s.milestoneId));
  if (unassigned.length > 0) {
    heading('Scope not yet attached to a milestone');
    unassigned.forEach((s) => text(`- ${s.title || 'Untitled'}`));
  }

  const t = plan.terms;
  heading('Terms');
  [
    `Invoices are payable within ${t.paymentDays} day(s) of issue.`,
    t.lateFeePercentMonthly > 0
      ? `Overdue amounts accrue a late fee of ${t.lateFeePercentMonthly}% per month, where lawful.`
      : 'No late-payment fee has been agreed.',
    t.ipOnFullPayment
      ? 'Ownership of the deliverables transfers to the client on payment in full. The freelancer keeps their pre-existing tools, code and materials.'
      : 'Ownership of the deliverables transfers on delivery.',
    t.portfolioUse
      ? 'The freelancer may show the completed work in their portfolio, excluding confidential information.'
      : 'The freelancer may not show the work in their portfolio.',
    t.confidentiality
      ? 'Both parties keep each other’s confidential information confidential.'
      : 'No confidentiality obligation has been agreed.',
    `Either party may end the project with ${t.terminationNoticeDays} day(s) written notice. Work completed to that date is paid for.`,
    t.killFeePercent > 0
      ? `If the client cancels, ${t.killFeePercent}% of the unpaid remaining fees is also payable.`
      : 'No cancellation fee has been agreed.',
    'Work outside the scope above is quoted and agreed in writing before it starts.',
    `Governing law and venue: ${t.governingLaw || 'Not specified'}.`,
  ].forEach((line) => text(`- ${line}`));

  heading('Document fingerprint');
  text(`SHA-256: ${formatFingerprint(meta.hash, 16)}`, 8.5, false, 40);
  text(
    'This fingerprint is computed from the exact plan contents. If any detail is changed, the fingerprint changes. Compare it with the copy the other party holds. It is not an electronic signature.',
    8,
    false,
    110,
  );

  heading('Important');
  text(
    'This is a summary of terms prepared with FreelanceShield. It is not legal advice and is not a signed contract. Both parties should review it, and for significant projects have it reviewed by a lawyer in the relevant jurisdiction, before signing it by a method valid where they are.',
    8.5,
    false,
    90,
  );

  y += 6;
  ensure(30);
  const col = WIDTH / 2 - 5;
  pdf.setDrawColor(150);
  pdf.line(M.side, y + 12, M.side + col, y + 12);
  pdf.line(M.side + col + 10, y + 12, PAGE.w - M.side, y + 12);
  pdf.setFontSize(8.5);
  pdf.setTextColor(100);
  pdf.text('Freelancer signature and date', M.side, y + 17);
  pdf.text('Client signature and date', M.side + col + 10, y + 17);

  const pages = pdf.getNumberOfPages();
  for (let i = 1; i <= pages; i += 1) {
    pdf.setPage(i);
    pdf.setFontSize(7.5);
    pdf.setTextColor(150);
    pdf.text(`${formatFingerprint(meta.hash, 4)}  |  Page ${i} of ${pages}`, PAGE.w - M.side, PAGE.h - 10, { align: 'right' });
  }

  return pdf.output('blob');
}
