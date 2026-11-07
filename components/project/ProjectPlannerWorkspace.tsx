"use client";

// components/project/ProjectPlannerWorkspace.tsx
//
// ProjectSafe planner: scope + milestones + terms → protection check →
// locked, fingerprinted agreement summary PDF. Everything stays on-device.
// Deliberately absent: accounts, money movement, escrow, e-signature.

import React, { useState } from "react";
import { Plus, Trash2, Lock, Download, AlertTriangle, CheckCircle2, Info, Loader2 } from "lucide-react";
import { useProjectPlan } from "@/lib/hooks/useProjectPlan";
import { TEMPLATES, applyTemplate } from "@/lib/project/defaults";
import { fingerprintPlan, formatFingerprint } from "@/lib/project/fingerprint";
import { buildAgreementPdf } from "@/lib/project/agreementPdf";
import { CURRENCIES, CURRENCY_CODES, formatMoney, type CurrencyCode } from "@/lib/utils/currency";
import { mascotSay } from "@/lib/mascot";
import type { IssueLevel } from "@/lib/project/protection";

const input =
  "w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-500/30";

const LEVEL: Record<IssueLevel, { label: string; cls: string }> = {
  high: { label: "Fix before sharing", cls: "border-red-200 bg-red-50 text-red-800" },
  medium: { label: "Worth agreeing", cls: "border-amber-200 bg-amber-50 text-amber-900" },
  low: { label: "Nice to have", cls: "border-slate-200 bg-slate-50 text-slate-700" },
};

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-sm font-bold text-slate-800">{title}</h2>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
      {children}
    </div>
  );
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export default function ProjectPlannerWorkspace() {
  const p = useProjectPlan();
  const { plan } = p;
  const [budget, setBudget] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<"lock" | "pdf" | null>(null);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  const high = p.issues.filter((i) => i.level === "high").length;

  const handleTemplate = (id: string) => {
    if (!id) return;
    const hasWork = plan.scope.some((s) => s.title.trim()) || plan.milestones.some((m) => m.amount > 0);
    if (hasWork && !window.confirm("Replace the current scope and milestones with this template? Parties and terms are kept.")) return;
    p.setPlan(applyTemplate(plan, id, Number(budget)));
    mascotSay("happy", "Template applied. Edit anything that doesn’t match your project.");
  };

  const handleLock = async () => {
    setBusy("lock");
    setStatus(null);
    try {
      const v = await p.lockVersion(note);
      setNote("");
      setStatus({ ok: true, msg: `Locked as version ${v.version}. Fingerprint ${formatFingerprint(v.hash, 2)}…` });
      mascotSay("celebrate", `Version ${v.version} locked. Send the PDF so you both hold the same fingerprint.`);
    } catch (e) {
      setStatus({ ok: false, msg: e instanceof Error ? e.message : "Could not lock this version." });
    } finally {
      setBusy(null);
    }
  };

  const handlePdf = async () => {
    setBusy("pdf");
    setStatus(null);
    try {
      const hash = await fingerprintPlan(plan);
      const match = p.versions.find((v) => v.hash === hash);
      const blob = buildAgreementPdf(plan, { hash, version: match?.version ?? null });
      const slug = (plan.title || "project").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "project";
      download(blob, `${slug}-agreement${match ? `-v${match.version}` : "-draft"}.pdf`);
      setStatus({ ok: true, msg: match ? `Downloaded version ${match.version}.` : "Downloaded as an unlocked draft. Lock a version before sending it for signature." });
      mascotSay(match ? "grin" : "wink", match ? "PDF ready." : "Downloaded a draft — lock it before you send it.");
    } catch {
      setStatus({ ok: false, msg: "The PDF could not be created. Check the amounts are numbers and try again." });
      mascotSay("worried", "The PDF failed. Try again, or reload the page.");
    } finally {
      setBusy(null);
    }
  };

  if (!p.hydrated) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]" aria-busy="true">
        <div className="space-y-4">{[0, 1, 2].map((i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-slate-200/70" />)}</div>
        <div className="h-72 animate-pulse rounded-xl bg-slate-200/70" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="min-w-0 space-y-6">
        <Section title="Start from a template (optional)" hint="Splits your budget across typical milestones. Everything stays editable.">
          <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
            <Field id="tpl" label="Project type">
              <select id="tpl" defaultValue="" onChange={(e) => { handleTemplate(e.target.value); e.target.value = ""; }} className={input}>
                <option value="">Choose a template…</option>
                {TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </Field>
            <Field id="budget" label={`Total budget (${plan.currency})`}>
              <input id="budget" type="number" inputMode="decimal" min="0" value={budget} onChange={(e) => setBudget(e.target.value)} className={`${input} text-right`} />
            </Field>
          </div>
        </Section>

        <Section title="Project and parties">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field id="title" label="Project name">
                <input id="title" value={plan.title} onChange={(e) => p.set("title", e.target.value)} className={input} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field id="summary" label="One-paragraph summary">
                <textarea id="summary" rows={3} value={plan.summary} onChange={(e) => p.set("summary", e.target.value)} className={`${input} resize-y`} />
              </Field>
            </div>
            {(["freelancer", "client"] as const).map((who) => (
              <fieldset key={who} className="min-w-0 space-y-3">
                <legend className="mb-2 text-xs font-bold text-slate-700">{who === "freelancer" ? "Freelancer (you)" : "Client"}</legend>
                <Field id={`${who}-name`} label="Name">
                  <input id={`${who}-name`} value={plan[who].name} onChange={(e) => p.setParty(who, "name", e.target.value)} className={input} />
                </Field>
                <Field id={`${who}-email`} label="Email">
                  <input id={`${who}-email`} type="email" value={plan[who].email} onChange={(e) => p.setParty(who, "email", e.target.value)} className={input} />
                </Field>
              </fieldset>
            ))}
            <Field id="start" label="Start date">
              <input id="start" type="date" value={plan.startDate} onChange={(e) => p.set("startDate", e.target.value)} className={input} />
            </Field>
            <Field id="end" label="Target end date">
              <input id="end" type="date" value={plan.endDate} min={plan.startDate || undefined} onChange={(e) => p.set("endDate", e.target.value)} className={input} />
            </Field>
            <Field id="currency" label="Currency">
              <select id="currency" value={plan.currency} onChange={(e) => p.set("currency", e.target.value as CurrencyCode)} className={input}>
                {CURRENCY_CODES.map((c) => <option key={c} value={c}>{c} — {CURRENCIES[c].label}</option>)}
              </select>
            </Field>
          </div>
        </Section>

        <Section title="Milestones" hint="Each milestone is a payment. An upfront milestone is a deposit paid before work starts.">
          <ul className="space-y-3">
            {plan.milestones.map((m, i) => (
              <li key={m.id} className="rounded-lg border border-slate-200/70 bg-slate-50 p-3">
                <div className="grid gap-3 sm:grid-cols-[1fr_140px_150px]">
                  <Field id={`ms-t-${m.id}`} label={`Milestone ${i + 1}`}>
                    <input id={`ms-t-${m.id}`} value={m.title} onChange={(e) => p.updateMilestone(m.id, { title: e.target.value })} className={input} />
                  </Field>
                  <Field id={`ms-a-${m.id}`} label={`Amount (${plan.currency})`}>
                    <input id={`ms-a-${m.id}`} type="number" inputMode="decimal" min="0" step="any" value={m.amount} onChange={(e) => p.updateMilestone(m.id, { amount: Math.max(0, Number(e.target.value) || 0) })} className={`${input} text-right`} />
                  </Field>
                  <Field id={`ms-d-${m.id}`} label="Due date">
                    <input id={`ms-d-${m.id}`} type="date" value={m.dueDate} onChange={(e) => p.updateMilestone(m.id, { dueDate: e.target.value })} className={input} />
                  </Field>
                </div>
                <div className="mt-3 flex flex-wrap items-end gap-3">
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" checked={m.upfront} onChange={(e) => p.updateMilestone(m.id, { upfront: e.target.checked })} className="h-4 w-4 rounded border-slate-300 text-brand-700" />
                    Paid upfront
                  </label>
                  {!m.upfront && (
                    <>
                      <div className="w-28">
                        <Field id={`ms-r-${m.id}`} label="Revisions">
                          <input id={`ms-r-${m.id}`} type="number" min="0" max="20" value={m.revisions} onChange={(e) => p.updateMilestone(m.id, { revisions: Math.min(20, Math.max(0, Math.floor(Number(e.target.value) || 0))) })} className={`${input} text-right`} />
                        </Field>
                      </div>
                      <div className="w-32">
                        <Field id={`ms-v-${m.id}`} label="Review days">
                          <input id={`ms-v-${m.id}`} type="number" min="0" max="60" value={m.reviewDays} onChange={(e) => p.updateMilestone(m.id, { reviewDays: Math.min(60, Math.max(0, Math.floor(Number(e.target.value) || 0))) })} className={`${input} text-right`} />
                        </Field>
                      </div>
                    </>
                  )}
                  <button type="button" onClick={() => p.removeMilestone(m.id)} className="ml-auto rounded p-2.5 text-slate-400 hover:bg-red-50 hover:text-red-600 focus-visible:ring-2 focus-visible:ring-red-400">
                    <Trash2 size={16} aria-hidden="true" /><span className="sr-only">Remove milestone {i + 1}</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <button type="button" onClick={p.addMilestone} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-50 px-4 py-2 text-sm font-bold text-brand-700 hover:bg-brand-100">
            <Plus size={16} aria-hidden="true" /> Add milestone
          </button>
        </Section>

        <Section title="Scope" hint="What gets delivered, and how both of you will know it is done.">
          <ul className="space-y-3">
            {plan.scope.map((s, i) => (
              <li key={s.id} className="rounded-lg border border-slate-200/70 bg-slate-50 p-3">
                <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
                  <Field id={`sc-t-${s.id}`} label={`Deliverable ${i + 1}`}>
                    <input id={`sc-t-${s.id}`} value={s.title} onChange={(e) => p.updateScope(s.id, { title: e.target.value })} className={input} />
                  </Field>
                  <Field id={`sc-m-${s.id}`} label="Paid in milestone">
                    <select id={`sc-m-${s.id}`} value={s.milestoneId ?? ""} onChange={(e) => p.updateScope(s.id, { milestoneId: e.target.value || null })} className={input}>
                      <option value="">Not assigned</option>
                      {plan.milestones.map((m, j) => <option key={m.id} value={m.id}>{m.title || `Milestone ${j + 1}`}</option>)}
                    </select>
                  </Field>
                </div>
                <div className="mt-3 flex items-end gap-3">
                  <div className="flex-1">
                    <Field id={`sc-a-${s.id}`} label="Done when…">
                      <input id={`sc-a-${s.id}`} value={s.acceptance} placeholder="e.g. Client approves in writing, or it passes the agreed checklist" onChange={(e) => p.updateScope(s.id, { acceptance: e.target.value })} className={input} />
                    </Field>
                  </div>
                  <button type="button" onClick={() => p.removeScope(s.id)} className="rounded p-2.5 text-slate-400 hover:bg-red-50 hover:text-red-600 focus-visible:ring-2 focus-visible:ring-red-400">
                    <Trash2 size={16} aria-hidden="true" /><span className="sr-only">Remove deliverable {i + 1}</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <button type="button" onClick={p.addScope} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-50 px-4 py-2 text-sm font-bold text-brand-700 hover:bg-brand-100">
            <Plus size={16} aria-hidden="true" /> Add deliverable
          </button>
        </Section>

        <Section title="Terms" hint="Sensible defaults for a freelancer. Agree changes with your client, not around them.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="pd" label="Invoice payable within (days)">
              <input id="pd" type="number" min="0" max="120" value={plan.terms.paymentDays} onChange={(e) => p.setTerm("paymentDays", Math.min(120, Math.max(0, Math.floor(Number(e.target.value) || 0))))} className={`${input} text-right`} />
            </Field>
            <Field id="lf" label="Late fee (% per month)">
              <input id="lf" type="number" min="0" max="5" step="0.1" value={plan.terms.lateFeePercentMonthly} onChange={(e) => p.setTerm("lateFeePercentMonthly", Math.min(5, Math.max(0, Number(e.target.value) || 0)))} className={`${input} text-right`} />
            </Field>
            <Field id="tn" label="Termination notice (days)">
              <input id="tn" type="number" min="0" max="90" value={plan.terms.terminationNoticeDays} onChange={(e) => p.setTerm("terminationNoticeDays", Math.min(90, Math.max(0, Math.floor(Number(e.target.value) || 0))))} className={`${input} text-right`} />
            </Field>
            <Field id="kf" label="Cancellation fee (% of unpaid remainder)">
              <input id="kf" type="number" min="0" max="100" value={plan.terms.killFeePercent} onChange={(e) => p.setTerm("killFeePercent", Math.min(100, Math.max(0, Number(e.target.value) || 0)))} className={`${input} text-right`} />
            </Field>
            <div className="sm:col-span-2">
              <Field id="gl" label="Governing law and venue">
                <input id="gl" value={plan.terms.governingLaw} placeholder="e.g. Laws of India; courts at Bengaluru" onChange={(e) => p.setTerm("governingLaw", e.target.value)} className={input} />
              </Field>
            </div>
            {([
              ["ipOnFullPayment", "Ownership transfers only on payment in full"],
              ["portfolioUse", "I may show the work in my portfolio"],
              ["confidentiality", "Mutual confidentiality"],
            ] as const).map(([k, label]) => (
              <label key={k} className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={plan.terms[k]} onChange={(e) => p.setTerm(k, e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-700" />
                {label}
              </label>
            ))}
          </div>
        </Section>
      </div>

      {/* Sidebar: check + actions */}
      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start" aria-label="Plan check and export">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total across milestones</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">{formatMoney(p.total, plan.currency)}</p>
          <p className="mt-3 flex items-center gap-2 text-sm font-semibold" aria-live="polite">
            {p.issues.length === 0 ? (
              <><CheckCircle2 size={16} className="text-emerald-600" aria-hidden="true" /> No gaps found by the checks</>
            ) : (
              <><AlertTriangle size={16} className={high ? "text-red-600" : "text-amber-600"} aria-hidden="true" /> {p.issues.length} gap{p.issues.length === 1 ? "" : "s"} to review</>
            )}
          </p>
          {p.issues.length > 0 && (
            <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
              {p.issues.map((i) => (
                <li key={i.id} className={`rounded-lg border p-2.5 text-xs ${LEVEL[i.level].cls}`}>
                  <span className="font-semibold">{i.message}</span> {i.fix}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <Field id="note" label="Version note (optional)">
            <input id="note" value={note} maxLength={200} placeholder="e.g. Agreed on call, 6 Nov" onChange={(e) => setNote(e.target.value)} className={input} />
          </Field>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" onClick={handleLock} disabled={busy !== null} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-50">
              {busy === "lock" ? <Loader2 size={15} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Lock size={15} aria-hidden="true" />} Lock version
            </button>
            <button type="button" onClick={handlePdf} disabled={busy !== null} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-700 px-3 py-2.5 text-sm font-bold text-white hover:bg-brand-800 disabled:opacity-50">
              {busy === "pdf" ? <Loader2 size={15} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Download size={15} aria-hidden="true" />} PDF
            </button>
          </div>
          <div aria-live="polite" className="min-h-[1.25rem]">
            {status && <p className={`mt-3 text-xs font-medium ${status.ok ? "text-emerald-700" : "text-red-700"}`}>{status.msg}</p>}
          </div>
          {high > 0 && <p className="mt-2 text-xs text-slate-500">You can still export, but {high} gap{high === 1 ? " is" : "s are"} marked “fix before sharing”.</p>}
        </div>

        {p.versions.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800">Locked versions</h2>
            <ol className="mt-3 space-y-2 text-xs">
              {[...p.versions].reverse().map((v) => (
                <li key={v.hash} className="rounded-lg bg-slate-50 p-2.5">
                  <p className="font-semibold text-slate-800">v{v.version} · {new Date(v.lockedAt).toLocaleString()}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-slate-500">{formatFingerprint(v.hash, 4)}</p>
                  {v.note && <p className="mt-0.5 text-slate-600">{v.note}</p>}
                  <button type="button" onClick={() => { if (window.confirm(`Restore version ${v.version}? Unlocked edits will be replaced.`)) p.setPlan(v.snapshot); }} className="mt-1 font-semibold text-brand-700 underline underline-offset-2">Restore</button>
                </li>
              ))}
            </ol>
          </div>
        )}

        <p className="flex gap-2 px-1 text-[11px] leading-snug text-slate-500">
          <Info size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
          Saved on this device only, never uploaded. The fingerprint shows whether a copy was changed; it is not a signature, and this tool does not hold or move money.
          <button type="button" onClick={() => { if (window.confirm("Delete this plan and all locked versions from this device?")) p.reset(); }} className="ml-1 shrink-0 font-semibold text-slate-600 underline">Delete</button>
        </p>
      </aside>
    </div>
  );
}
