// lib/utils/pdfGenerator.ts
//
// REWRITTEN. The previous implementation screenshotted the DOM with html2canvas
// and embedded the result as a PNG inside a PDF. That produced:
//   - no selectable or searchable text
//   - failure in corporate accounts-payable systems that OCR or parse invoices
//   - large files (a full-page retina PNG is ~1-3 MB)
//   - silent truncation of any invoice longer than one page
//
// This version draws real vector text with jsPDF primitives. Output is a
// genuine text PDF: selectable, searchable, machine-readable by AP software,
// and typically under 20 KB. It paginates properly and repeats table headers.
//
// html2canvas is no longer a dependency. You can remove it from package.json.
//
// PRIVACY: everything here runs in the browser. No invoice data is transmitted.
// jsPDF makes no network requests.
//
// FONT NOTE: jsPDF's built-in Helvetica is WinAnsi-encoded and cannot render
// the rupee, yen or many other symbols. That is why the PDF prints ISO 4217
// codes ("INR 1,00,000.00") rather than glyphs. This is also what banks and
// cross-border clients need to see, so it is the correct output either way.

import { jsPDF } from 'jspdf';
import type { InvoiceData } from '@/types/invoice';
import { calculateTotals, lineTotal, REVERSE_CHARGE_NOTE } from '@/lib/utils/invoiceMath';
import { formatAmount, resolveCurrency } from '@/lib/utils/currency';

/* -------------------------------------------------------------------------- */
/* Layout constants (millimetres)                                             */
/* -------------------------------------------------------------------------- */

const PAGE = { width: 210, height: 297 };
const MARGIN = { top: 18, right: 18, bottom: 20, left: 18 };
const CONTENT_WIDTH = PAGE.width - MARGIN.left - MARGIN.right;

const INK = { dark: 17, mid: 90, light: 140 } as const;

const COL = {
  description: MARGIN.left,
  qty: MARGIN.left + 104,
  rate: MARGIN.left + 128,
  amount: PAGE.width - MARGIN.right,
} as const;

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/** Strips characters the built-in WinAnsi fonts cannot draw. */
function asciiSafe(text: string): string {
  return String(text ?? '')
    .replace(/\u00A0/g, ' ') // NBSP from Intl output
    .replace(/\u202F/g, ' ') // narrow NBSP
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-');
}

/** "INR 1,00,000.00" — code plus locale-grouped number, no glyphs. */
function pdfMoney(amount: number, currency: string): string {
  const meta = resolveCurrency(currency);
  return asciiSafe(`${meta.code} ${formatAmount(amount, currency)}`);
}

/** Formats an ISO date (yyyy-mm-dd) as an unambiguous "12 Mar 2026". */
function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return asciiSafe(iso);
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/** Sanitizes an invoice number for use as a filename on any OS. */
function sanitizeFileName(name: string): string {
  const cleaned = String(name ?? '')
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  return cleaned || 'Draft';
}

/**
 * Thrown when PDF generation fails. Carries a message safe to show the user,
 * so the UI can explain what went wrong instead of doing nothing.
 */
export class PdfGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PdfGenerationError';
  }
}

/* -------------------------------------------------------------------------- */
/* Drawing primitives                                                        */
/* -------------------------------------------------------------------------- */

interface Cursor {
  y: number;
  page: number;
}

function setBody(pdf: jsPDF, size = 9.5, shade: number = INK.mid, bold = false) {
  pdf.setFont('helvetica', bold ? 'bold' : 'normal');
  pdf.setFontSize(size);
  pdf.setTextColor(shade);
}

function hairline(pdf: jsPDF, y: number, shade = 225) {
  pdf.setDrawColor(shade);
  pdf.setLineWidth(0.2);
  pdf.line(MARGIN.left, y, PAGE.width - MARGIN.right, y);
}

/** Starts a new page and resets the cursor below the top margin. */
function newPage(pdf: jsPDF, cursor: Cursor): void {
  pdf.addPage();
  cursor.page += 1;
  cursor.y = MARGIN.top;
}

/** Ensures `needed` mm of vertical space remains, paginating if not. */
function ensureSpace(pdf: jsPDF, cursor: Cursor, needed: number): void {
  if (cursor.y + needed > PAGE.height - MARGIN.bottom) {
    newPage(pdf, cursor);
  }
}

/** Draws wrapped text and advances the cursor. Returns the height consumed. */
function drawParagraph(
  pdf: jsPDF,
  cursor: Cursor,
  text: string,
  opts: { width?: number; size?: number; shade?: number; bold?: boolean; lineHeight?: number } = {},
): void {
  const {
    width = CONTENT_WIDTH,
    size = 9.5,
    shade = INK.mid,
    bold = false,
    lineHeight = 4.4,
  } = opts;

  setBody(pdf, size, shade, bold);
  const lines = pdf.splitTextToSize(asciiSafe(text), width) as string[];

  for (const line of lines) {
    ensureSpace(pdf, cursor, lineHeight);
    pdf.text(line, MARGIN.left, cursor.y);
    cursor.y += lineHeight;
  }
}

/* -------------------------------------------------------------------------- */
/* Section renderers                                                          */
/* -------------------------------------------------------------------------- */

function drawHeader(pdf: jsPDF, cursor: Cursor, data: InvoiceData): void {
  const meta = resolveCurrency(data.currency);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(26);
  pdf.setTextColor(INK.dark);
  pdf.text('INVOICE', MARGIN.left, cursor.y + 6);

  setBody(pdf, 10, INK.mid);
  pdf.text(
    asciiSafe(data.invoiceNumber || 'INV-001'),
    MARGIN.left,
    cursor.y + 12.5,
  );

  // Right-hand meta block
  const rightX = PAGE.width - MARGIN.right;
  setBody(pdf, 8, INK.light, true);
  pdf.text('ISSUE DATE', rightX, cursor.y, { align: 'right' });
  setBody(pdf, 9.5, INK.dark);
  pdf.text(formatDate(data.issueDate), rightX, cursor.y + 4.5, { align: 'right' });

  setBody(pdf, 8, INK.light, true);
  pdf.text('DUE DATE', rightX, cursor.y + 11, { align: 'right' });
  setBody(pdf, 9.5, INK.dark);
  pdf.text(formatDate(data.dueDate), rightX, cursor.y + 15.5, { align: 'right' });

  setBody(pdf, 8, INK.light);
  pdf.text(
    `Currency: ${meta.code}`,
    rightX,
    cursor.y + 21,
    { align: 'right' },
  );

  cursor.y += 30;
  hairline(pdf, cursor.y);
  cursor.y += 8;
}

function drawParties(pdf: jsPDF, cursor: Cursor, data: InvoiceData): void {
  const colWidth = (CONTENT_WIDTH - 10) / 2;
  const rightX = MARGIN.left + colWidth + 10;
  const startY = cursor.y;

  const block = (
    x: number,
    heading: string,
    party: InvoiceData['sender'],
  ): number => {
    let y = startY;

    setBody(pdf, 8, INK.light, true);
    pdf.text(heading, x, y);
    y += 5.5;

    setBody(pdf, 11, INK.dark, true);
    const nameLines = pdf.splitTextToSize(
      asciiSafe(party.name || '—'),
      colWidth,
    ) as string[];
    for (const line of nameLines) {
      pdf.text(line, x, y);
      y += 5;
    }

    setBody(pdf, 9, INK.mid);
    const details = [party.address, party.email].filter(Boolean).join('\n');
    if (details) {
      const lines = pdf.splitTextToSize(asciiSafe(details), colWidth) as string[];
      for (const line of lines) {
        pdf.text(line, x, y);
        y += 4.2;
      }
    }

    if (party.taxId) {
      y += 1;
      setBody(pdf, 9, INK.dark);
      const taxLines = pdf.splitTextToSize(
        asciiSafe(`Tax ID: ${party.taxId}`),
        colWidth,
      ) as string[];
      for (const line of taxLines) {
        pdf.text(line, x, y);
        y += 4.2;
      }
    }

    return y;
  };

  const leftEnd = block(MARGIN.left, 'FROM', data.sender);
  const rightEnd = block(rightX, 'BILL TO', data.client);

  cursor.y = Math.max(leftEnd, rightEnd) + 4;

  if (data.placeOfSupply) {
    setBody(pdf, 9, INK.mid);
    pdf.text(
      asciiSafe(`Place of supply: ${data.placeOfSupply}`),
      MARGIN.left,
      cursor.y,
    );
    cursor.y += 6;
  }

  cursor.y += 2;
}

function drawTableHead(pdf: jsPDF, cursor: Cursor, currencyCode: string): void {
  ensureSpace(pdf, cursor, 14);

  pdf.setDrawColor(INK.dark);
  pdf.setLineWidth(0.4);
  pdf.line(MARGIN.left, cursor.y, PAGE.width - MARGIN.right, cursor.y);
  cursor.y += 5;

  setBody(pdf, 8, INK.dark, true);
  pdf.text('DESCRIPTION', COL.description, cursor.y);
  pdf.text('QTY', COL.qty, cursor.y, { align: 'right' });
  pdf.text('RATE', COL.rate, cursor.y, { align: 'right' });
  pdf.text(`AMOUNT (${currencyCode})`, COL.amount, cursor.y, { align: 'right' });

  cursor.y += 3;
  hairline(pdf, cursor.y, 200);
  cursor.y += 5;
}

function drawItems(pdf: jsPDF, cursor: Cursor, data: InvoiceData): void {
  const meta = resolveCurrency(data.currency);
  const items = data.items ?? [];

  drawTableHead(pdf, cursor, meta.code);

  if (items.length === 0) {
    setBody(pdf, 9.5, INK.light);
    pdf.text('No line items.', COL.description, cursor.y);
    cursor.y += 8;
    return;
  }

  const descWidth = COL.qty - COL.description - 8;

  for (const item of items) {
    setBody(pdf, 9.5, INK.dark);
    const descLines = pdf.splitTextToSize(
      asciiSafe(item.description || 'Item'),
      descWidth,
    ) as string[];

    const rowHeight = Math.max(descLines.length * 4.4, 4.4) + 3.5;

    // Repeat the header when a row spills onto a new page, so the second page
    // is still readable on its own.
    if (cursor.y + rowHeight > PAGE.height - MARGIN.bottom) {
      newPage(pdf, cursor);
      drawTableHead(pdf, cursor, meta.code);
    }

    const rowTop = cursor.y;

    setBody(pdf, 9.5, INK.dark);
    descLines.forEach((line, i) => {
      pdf.text(line, COL.description, rowTop + i * 4.4);
    });

    setBody(pdf, 9.5, INK.mid);
    pdf.text(String(item.quantity ?? 0), COL.qty, rowTop, { align: 'right' });
    pdf.text(
      asciiSafe(formatAmount(item.rate ?? 0, data.currency)),
      COL.rate,
      rowTop,
      { align: 'right' },
    );

    setBody(pdf, 9.5, INK.dark);
    pdf.text(
      asciiSafe(formatAmount(lineTotal(item, data.currency), data.currency)),
      COL.amount,
      rowTop,
      { align: 'right' },
    );

    cursor.y = rowTop + rowHeight;
    hairline(pdf, cursor.y - 2.5, 235);
  }

  cursor.y += 4;
}

function drawTotals(pdf: jsPDF, cursor: Cursor, data: InvoiceData): void {
  const totals = calculateTotals(data);

  // Keep the totals block intact rather than splitting it across pages.
  ensureSpace(pdf, cursor, 40);

  const labelX = COL.rate;
  const valueX = COL.amount;

  const row = (label: string, value: string, opts: { bold?: boolean; shade?: number } = {}) => {
    setBody(pdf, 9.5, opts.shade ?? INK.mid, opts.bold);
    pdf.text(asciiSafe(label), labelX, cursor.y, { align: 'right' });
    pdf.text(value, valueX, cursor.y, { align: 'right' });
    cursor.y += 5.4;
  };

  row('Subtotal', pdfMoney(totals.subtotal, data.currency));

  if (totals.discountAmount > 0) {
    const label =
      data.discountMode === 'percent'
        ? `Discount (${data.discountValue}%)`
        : 'Discount';
    row(label, `- ${pdfMoney(totals.discountAmount, data.currency)}`);
    row('Taxable value', pdfMoney(totals.taxableBase, data.currency));
  }

  if (data.reverseCharge) {
    row(`${data.taxLabel || 'VAT'} (reverse charge)`, pdfMoney(0, data.currency));
  } else if (data.taxRate > 0) {
    row(
      `${data.taxLabel || 'Tax'} (${data.taxRate}%)`,
      pdfMoney(totals.taxAmount, data.currency),
    );
  }

  cursor.y += 1.5;
  pdf.setDrawColor(INK.dark);
  pdf.setLineWidth(0.4);
  pdf.line(labelX - 40, cursor.y, valueX, cursor.y);
  cursor.y += 6;

  setBody(pdf, 12, INK.dark, true);
  pdf.text('Total due', labelX, cursor.y, { align: 'right' });
  pdf.text(pdfMoney(totals.total, data.currency), valueX, cursor.y, { align: 'right' });
  cursor.y += 10;
}

function drawFooterSections(pdf: jsPDF, cursor: Cursor, data: InvoiceData): void {
  if (data.reverseCharge) {
    ensureSpace(pdf, cursor, 12);
    setBody(pdf, 9, INK.dark, true);
    pdf.text(asciiSafe(REVERSE_CHARGE_NOTE), MARGIN.left, cursor.y);
    cursor.y += 8;
  }

  if (data.paymentInstructions) {
    ensureSpace(pdf, cursor, 14);
    setBody(pdf, 8, INK.light, true);
    pdf.text('PAYMENT DETAILS', MARGIN.left, cursor.y);
    cursor.y += 5;
    drawParagraph(pdf, cursor, data.paymentInstructions, { shade: INK.dark });
    cursor.y += 4;
  }

  if (data.notes) {
    ensureSpace(pdf, cursor, 14);
    setBody(pdf, 8, INK.light, true);
    pdf.text('NOTES', MARGIN.left, cursor.y);
    cursor.y += 5;
    drawParagraph(pdf, cursor, data.notes, { shade: INK.mid });
  }
}

/** Adds "Page n of m" to every page. Called last, once the count is known. */
function stampPageNumbers(pdf: jsPDF): void {
  const total = pdf.getNumberOfPages();
  if (total <= 1) return;

  for (let i = 1; i <= total; i += 1) {
    pdf.setPage(i);
    setBody(pdf, 8, INK.light);
    pdf.text(
      `Page ${i} of ${total}`,
      PAGE.width - MARGIN.right,
      PAGE.height - 10,
      { align: 'right' },
    );
  }
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Builds the invoice PDF entirely in the browser and returns it as a Blob.
 * Throws PdfGenerationError with a user-safe message on failure.
 */
export function generateInvoicePDF(data: InvoiceData): Blob {
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    pdf.setProperties({
      title: `Invoice ${data.invoiceNumber || ''}`.trim(),
      subject: 'Invoice',
      creator: 'FreelanceShield',
    });

    const cursor: Cursor = { y: MARGIN.top, page: 1 };

    drawHeader(pdf, cursor, data);
    drawParties(pdf, cursor, data);
    drawItems(pdf, cursor, data);
    drawTotals(pdf, cursor, data);
    drawFooterSections(pdf, cursor, data);
    stampPageNumbers(pdf);

    return pdf.output('blob');
  } catch (error) {
    throw new PdfGenerationError(
      'The PDF could not be built. Check that every line item has a description and a numeric rate, then try again.',
    );
  }
}

/**
 * Triggers a download of the invoice PDF.
 * Throws PdfGenerationError so the caller can surface a message.
 */
export function downloadInvoicePDF(data: InvoiceData): void {
  const blob = generateInvoicePDF(data);
  const url = createObjectURLSafe(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `Invoice_${sanitizeFileName(data.invoiceNumber)}.pdf`;
  link.rel = 'noopener';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Release the blob once the browser has picked up the download.
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Small indirection so the call site reads clearly and stays testable. */
function createObjectURLSafe(blob: Blob): string {
  return URL.createObjectURL(blob);
}

/**
 * Shares the PDF via the native share sheet where available.
 *
 * Returns 'shared' on success, 'cancelled' if the user dismissed the sheet, and
 * 'unsupported' when the browser cannot share files — in which case the caller
 * should fall back to downloading and let the user attach it themselves.
 */
export async function shareInvoicePDF(
  data: InvoiceData,
): Promise<'shared' | 'cancelled' | 'unsupported'> {
  const blob = generateInvoicePDF(data);
  const fileName = `Invoice_${sanitizeFileName(data.invoiceNumber)}.pdf`;
  const file = new File([blob], fileName, { type: 'application/pdf' });

  const canShareFiles =
    typeof navigator !== 'undefined' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [file] });

  if (!canShareFiles) return 'unsupported';

  try {
    await navigator.share({
      title: `Invoice ${data.invoiceNumber || ''}`.trim(),
      files: [file],
    });
    return 'shared';
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') return 'cancelled';
    return 'unsupported';
  }
}
