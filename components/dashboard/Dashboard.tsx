"use client";

// components/dashboard/Dashboard.tsx
//
// The app's home screen once installed. It answers one question every time it
// is opened: "who owes me money, and who do I chase today?" Everything is read
// from this device; nothing is sent anywhere.

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FilePlus2,
  Mail,
  MessageCircle,
  Copy,
  CheckCircle2,
  CalendarPlus,
  CopyPlus,
  Download,
  Trash2,
  Upload,
  FileSpreadsheet,
  RotateCcw,
  ShieldAlert,
  Wallet,
  AlarmClock,
} from "lucide-react";
import { useLedger } from "@/lib/hooks/useLedger";
import {
  daysUntilDue,
  draftReminder,
  dueDateIcs,
  isoDate,
  ledgerCsv,
  stageOf,
  suggestNextNumber,
  type LedgerEntry,
  type Stage,
} from "@/lib/ledger/ledger";
import { formatMoney } from "@/lib/utils/currency";
import { downloadInvoicePDF } from "@/lib/utils/pdfGenerator";
import { downloadBackup, restoreBackup } from "@/lib/backup";
import { mascotSay } from "@/lib/mascot";

type Filter = "unpaid" | "paid" | "all";

const STAGE_LABEL: Record<Stage, { text: string; cls: string }> = {
  "not-due": { text: "Not due yet", cls: "bg-slate-100 text-slate-700" },
  "due-soon": { text: "Due soon", cls: "bg-sky-50 text-sky-800" },
  "due-today": { text: "Due today", cls: "bg-amber-50 text-amber-800" },
  overdue: { text: "Overdue", cls: "bg-orange-50 text-orange-800" },
  late: { text: "Late", cls: "bg-red-50 text-red-700" },
  "very-late": { text: "Very late", cls: "bg-red-100 text-red-800" },
};

function money(map: Record<string, number>): string {
  const parts = Object.entries(map).filter(([, v]) => v > 0);
  if (parts.length === 0) return "—";
  return parts.map(([cur, v]) => formatMoney(v, cur)).join(" · ");
}

function saveFile(name: string, type: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function reminderFor(e: LedgerEntry) {
  const overdue = -daysUntilDue(e.dueDate);
  return draftReminder({
    invoiceNumber: e.invoiceNumber,
    clientName: e.clientName,
    amount: formatMoney(e.total, e.currency),
    dueDate: e.dueDate,
    senderName: e.snapshot?.sender?.name ?? "",
    daysOverdue: overdue,
    paymentInstructions: e.snapshot?.paymentInstructions ?? "",
  });
}

export default function Dashboard() {
  const router = useRouter();
  const { entries, summary, hydrated, setStatus, logReminder, remove } = useLedger();
  const [filter, setFilter] = useState<Filter>("unpaid");
  const [notice, setNotice] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const today = isoDate();

  const flash = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(null), 3500);
  };

  // Installed app icon shows how many invoices are overdue (Chrome, Edge, Safari 17+).
  useEffect(() => {
    if (!hydrated) return;
    const nav = navigator as Navigator & { setAppBadge?: (n?: number) => Promise<void>; clearAppBadge?: () => Promise<void> };
    try {
      if (summary.overdueCount > 0) void nav.setAppBadge?.(summary.overdueCount);
      else void nav.clearAppBadge?.();
    } catch {
      /* unsupported */
    }
  }, [hydrated, summary.overdueCount]);

  const visible = useMemo(() => {
    const list = filter === "all" ? entries : entries.filter((e) => (filter === "paid" ? e.status === "paid" : e.status === "unpaid"));
    return [...list].sort((a, b) => (a.status === "unpaid" && b.status === "unpaid" ? a.dueDate.localeCompare(b.dueDate) : b.createdAt.localeCompare(a.createdAt)));
  }, [entries, filter]);

  const duplicate = (e: LedgerEntry) => {
    const term = Math.max(0, daysUntilDue(e.snapshot.dueDate, e.snapshot.issueDate));
    const due = new Date();
    due.setDate(due.getDate() + (term || 14));
    const draft = {
      ...e.snapshot,
      invoiceNumber: suggestNextNumber(entries),
      issueDate: today,
      dueDate: isoDate(due),
      items: e.snapshot.items.map((it) => ({ ...it, id: `${it.id}-${Date.now().toString(36)}` })),
    };
    try {
      window.localStorage.setItem("fs:invoice-draft-v2", JSON.stringify(draft));
      window.dispatchEvent(new Event("fs:local-storage"));
    } catch {
      /* storage unavailable */
    }
    router.push("/invoice-maker");
  };

  const sendEmail = (e: LedgerEntry) => {
    const r = reminderFor(e);
    window.location.href = `mailto:${encodeURIComponent(e.clientEmail)}?subject=${encodeURIComponent(r.subject)}&body=${encodeURIComponent(r.body)}`;
    logReminder(e.id);
  };

  const sendWhatsApp = (e: LedgerEntry) => {
    const r = reminderFor(e);
    window.open(`https://wa.me/?text=${encodeURIComponent(r.body)}`, "_blank", "noopener,noreferrer");
    logReminder(e.id);
  };

  const copyReminder = async (e: LedgerEntry) => {
    const r = reminderFor(e);
    try {
      await navigator.clipboard.writeText(`${r.subject}\n\n${r.body}`);
      logReminder(e.id);
      flash("Reminder copied. Paste it wherever you talk to this client.");
    } catch {
      flash("Copy is blocked in this browser. Use the email button instead.");
    }
  };

  const markPaid = (e: LedgerEntry) => {
    setStatus(e.id, "paid");
    mascotSay("celebrate", `${e.clientName} paid. That's money in the bank.`);
    flash(`Marked ${e.invoiceNumber} as paid.`);
  };

  const onRestore = async (file: File | undefined) => {
    if (!file) return;
    try {
      const n = await restoreBackup(file);
      flash(`Restored ${n} item${n === 1 ? "" : "s"} from your backup.`);
    } catch (err) {
      flash(err instanceof Error ? err.message : "That backup could not be restored.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  if (!hydrated) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading your dashboard">
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200/70 motion-reduce:animate-none" />)}
        </div>
        <div className="h-64 animate-pulse rounded-2xl bg-slate-200/70 motion-reduce:animate-none" />
      </div>
    );
  }

  const empty = entries.length === 0;

  return (
    <div className="space-y-8">
      {notice && (
        <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {notice}
        </p>
      )}

      {/* Summary */}
      <section aria-label="Summary" className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-600"><Wallet size={16} aria-hidden="true" /> Waiting to be paid</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{money(summary.outstanding)}</p>
          <p className="mt-1 text-xs text-slate-500">{summary.unpaidCount} unpaid invoice{summary.unpaidCount === 1 ? "" : "s"}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-600"><AlarmClock size={16} aria-hidden="true" /> Overdue</p>
          <p className={`mt-2 text-2xl font-black ${summary.overdueCount ? "text-red-700" : "text-slate-900"}`}>{money(summary.overdue)}</p>
          <p className="mt-1 text-xs text-slate-500">{summary.overdueCount} past the due date</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-600"><CheckCircle2 size={16} aria-hidden="true" /> Paid this month</p>
          <p className="mt-2 text-2xl font-black text-emerald-700">{money(summary.paidThisMonth)}</p>
          <p className="mt-1 text-xs text-slate-500">Marked paid since the 1st</p>
        </div>
      </section>

      {/* Primary actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/invoice-maker" className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-5 py-3 text-sm font-bold text-white hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2">
          <FilePlus2 size={16} aria-hidden="true" /> New invoice
        </Link>
        <Link href="/contract-scanner" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
          <ShieldAlert size={16} aria-hidden="true" /> Check a contract
        </Link>
      </div>

      {empty ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8">
          <h2 className="text-xl font-bold text-slate-900">Nothing to chase yet</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-slate-600">
            <li>Make an invoice and download the PDF. It appears here automatically.</li>
            <li>Come back when it&apos;s due. Overdue invoices rise to the top with a reminder ready to send.</li>
            <li>Mark it paid when the money lands. Next month, duplicate it in one tap.</li>
          </ol>
          <p className="mt-4 text-sm text-slate-500">
            Switching devices? <button type="button" onClick={() => fileRef.current?.click()} className="font-semibold text-brand-700 underline">Restore a backup</button>.
          </p>
        </section>
      ) : (
        <>
          {/* Chase today */}
          <section aria-labelledby="today-h" className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5">
            <h2 id="today-h" className="text-lg font-bold text-slate-900">
              {summary.actionToday.length ? `Chase today (${summary.actionToday.length})` : "Nobody to chase today"}
            </h2>
            {summary.actionToday.length === 0 ? (
              <p className="mt-1 text-sm text-slate-600">Everything unpaid is either not due yet or was chased in the last 3 days.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {summary.actionToday.map((e) => {
                  const days = daysUntilDue(e.dueDate, today);
                  return (
                    <li key={e.id} className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="font-bold text-slate-900">{e.clientName} · {formatMoney(e.total, e.currency)}</p>
                        <p className="text-sm text-slate-600">
                          {e.invoiceNumber} · {days < 0 ? `${-days} day${days === -1 ? "" : "s"} overdue` : days === 0 ? "due today" : "due tomorrow"}
                        </p>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {e.clientEmail && (
                          <button type="button" onClick={() => sendEmail(e)} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-700 px-3 py-2 text-xs font-bold text-white hover:bg-brand-800">
                            <Mail size={14} aria-hidden="true" /> Email reminder
                          </button>
                        )}
                        <button type="button" onClick={() => sendWhatsApp(e)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                          <MessageCircle size={14} aria-hidden="true" /> WhatsApp
                        </button>
                        <button type="button" onClick={() => copyReminder(e)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                          <Copy size={14} aria-hidden="true" /> Copy text
                        </button>
                        <button type="button" onClick={() => markPaid(e)} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100">
                          <CheckCircle2 size={14} aria-hidden="true" /> It&apos;s paid
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* All invoices */}
          <section aria-labelledby="all-h">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="all-h" className="text-lg font-bold text-slate-900">Invoices</h2>
              <div role="tablist" aria-label="Filter invoices" className="flex rounded-lg border border-slate-200 bg-white p-1">
                {(["unpaid", "paid", "all"] as Filter[]).map((f) => (
                  <button
                    key={f}
                    role="tab"
                    aria-selected={filter === f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={`rounded-md px-3 py-1.5 text-xs font-bold capitalize ${filter === f ? "bg-brand-700 text-white" : "text-slate-600 hover:bg-slate-50"}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {visible.length === 0 ? (
              <p className="mt-4 text-sm text-slate-600">No {filter} invoices.</p>
            ) : (
              <ul className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {visible.map((e) => {
                  const st = e.status === "paid" ? { text: "Paid", cls: "bg-emerald-50 text-emerald-800" } : e.status === "void" ? { text: "Void", cls: "bg-slate-100 text-slate-600" } : STAGE_LABEL[stageOf(e, today)];
                  return (
                    <li key={e.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">
                          {e.clientName} <span className="font-normal text-slate-500">· {e.invoiceNumber}</span>
                        </p>
                        <p className="mt-0.5 text-sm text-slate-600">
                          {formatMoney(e.total, e.currency)} · due {e.dueDate}
                          {e.reminders.length > 0 && ` · ${e.reminders.length} reminder${e.reminders.length === 1 ? "" : "s"} sent`}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${st.cls}`}>{st.text}</span>
                        {e.status === "unpaid" ? (
                          <IconBtn label="Mark paid" onClick={() => markPaid(e)}><CheckCircle2 size={16} /></IconBtn>
                        ) : (
                          <IconBtn label="Mark unpaid" onClick={() => setStatus(e.id, "unpaid")}><RotateCcw size={16} /></IconBtn>
                        )}
                        <IconBtn label="Add due date to calendar" onClick={() => saveFile(`${e.invoiceNumber}-due.ics`, "text/calendar", dueDateIcs(e, formatMoney(e.total, e.currency)))}><CalendarPlus size={16} /></IconBtn>
                        <IconBtn label="Duplicate as a new invoice" onClick={() => duplicate(e)}><CopyPlus size={16} /></IconBtn>
                        <IconBtn label="Download PDF again" onClick={() => downloadInvoicePDF(e.snapshot)}><Download size={16} /></IconBtn>
                        <IconBtn
                          label="Delete from tracker"
                          onClick={() => {
                            if (window.confirm(`Remove ${e.invoiceNumber} from your tracker? The PDF you sent is not affected.`)) remove(e.id);
                          }}
                        >
                          <Trash2 size={16} />
                        </IconBtn>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}

      {/* Data ownership */}
      <section aria-labelledby="data-h" className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 id="data-h" className="font-bold text-slate-900">Your data, your file</h2>
        <p className="mt-1 text-sm text-slate-600">
          There is no account, so this tracker lives only in this browser. Back it up to move devices or keep a copy.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => { downloadBackup(); flash("Backup downloaded."); }} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
            <Download size={14} aria-hidden="true" /> Download backup
          </button>
          <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
            <Upload size={14} aria-hidden="true" /> Restore backup
          </button>
          {!empty && (
            <button type="button" onClick={() => saveFile(`invoices-${today}.csv`, "text/csv", ledgerCsv(entries))} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
              <FileSpreadsheet size={14} aria-hidden="true" /> Export CSV for your accountant
            </button>
          )}
          <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" aria-label="Choose a backup file" onChange={(ev) => onRestore(ev.target.files?.[0])} />
        </div>
      </section>
    </div>
  );
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      <span aria-hidden="true">{children}</span>
      <span className="sr-only">{label}</span>
    </button>
  );
}
