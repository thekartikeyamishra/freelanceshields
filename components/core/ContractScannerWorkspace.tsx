"use client";

// components/core/ContractScannerWorkspace.tsx
//
// -------------------------------------------------------------------------
// WHAT CHANGED FROM THE PREVIOUS PAGE
// -------------------------------------------------------------------------
//
// 1. THE BIG SCORE IS GONE. The old UI rendered `{result.score}/100` at 48px
//    beside "Overall Risk Level". That number started at 100 and only ever went
//    down when a regex matched, so a contract containing nothing but
//    "Contractor waives all payment" displayed 100 — presented as the most
//    confident element on the page. Replaced with what was found, what was not
//    found, and no aggregate number at all.
//
// 2. NO MORE dangerouslySetInnerHTML. The old code did:
//        finding.replace(/\*\*(.*?)\*\*/g, '<strong className="...">$1</strong>')
//    then injected it as raw HTML. Two problems: `className` is not a valid
//    HTML attribute so the styling never applied anyway, and injecting
//    constructed HTML into the DOM is a habit that becomes an XSS hole the
//    moment any of that text comes from user input. Findings are now structured
//    data rendered as React.
//
// 3. alert() REPLACED with inline validation. Blocking modals for "paste more
//    text" is a poor experience and is not announced to screen readers.
//
// 4. THE AD BETWEEN THE TOOL AND ITS RESULTS IS GONE. The old page placed a
//    slot labelled "Freelance Tools" directly after the Analyze button and
//    directly before the results panel, so pressing Analyze scrolled a user
//    straight into an ad on the way to their answer.

import React, { useRef, useState } from "react";
import {
  FileText,
  Loader2,
  AlertTriangle,
  Info,
  CircleSlash,
  ChevronDown,
} from "lucide-react";
import {
  analyzeContract,
  CLAUSE_COVERAGE_COUNT,
  type ScanResult,
  type Severity,
} from "@/lib/ai/contractScanner";
import HeuristicNotice from "@/components/ui/HeuristicNotice";

const MIN_CHARS = 200;

const ATTENTION_STYLE: Record<Severity, { label: string; chip: string }> = {
  high: { label: "Read closely", chip: "bg-red-50 text-red-700 border-red-200" },
  medium: { label: "Worth checking", chip: "bg-amber-50 text-amber-800 border-amber-200" },
  low: { label: "Standard", chip: "bg-slate-100 text-slate-700 border-slate-200" },
};

export default function ContractScannerWorkspace() {
  const [text, setText] = useState("");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleScan = async () => {
    const trimmed = text.trim();
    if (trimmed.length < MIN_CHARS) {
      setValidationError(
        `Paste at least ${MIN_CHARS} characters. You have ${trimmed.length}. A short excerpt cannot tell you much either way.`,
      );
      return;
    }

    setValidationError(null);
    setScanning(true);
    setResult(null);

    try {
      const analysis = await analyzeContract(trimmed);
      setResult(analysis);
      // Move focus to the results so keyboard and screen-reader users are taken
      // to the answer rather than left on the button.
      window.requestAnimationFrame(() => resultsRef.current?.focus());
    } catch {
      setValidationError(
        "The check could not run. Reload the page and try again.",
      );
    } finally {
      setScanning(false);
    }
  };

  const handleClear = () => {
    setText("");
    setResult(null);
    setValidationError(null);
  };

  return (
    <div className="space-y-8">
      {/* Input */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/60 p-6">
          <label
            htmlFor="contract-text"
            className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700"
          >
            <FileText size={16} aria-hidden="true" />
            Paste your contract text
          </label>
          <p id="contract-text-hint" className="mb-3 text-xs text-slate-500">
            The whole agreement works better than one clause. Nothing you paste is
            uploaded or saved.
          </p>
          <textarea
            id="contract-text"
            aria-describedby="contract-text-hint"
            aria-invalid={Boolean(validationError) || undefined}
            className="h-64 w-full resize-y rounded-xl border border-slate-200 p-4 leading-relaxed text-slate-700 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
            placeholder="The Contractor agrees to indemnify and hold harmless the Client against all claims…"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (validationError) setValidationError(null);
            }}
            disabled={scanning}
          />
          <p className="mt-2 text-right text-xs text-slate-400">
            {text.trim().length.toLocaleString()} characters
          </p>
        </div>

        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div aria-live="polite" className="min-h-[20px] flex-1">
            {validationError && (
              <p className="flex items-start gap-1.5 text-sm font-medium text-red-700">
                <AlertTriangle size={15} aria-hidden="true" className="mt-px shrink-0" />
                {validationError}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            {text.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                disabled={scanning}
                className="rounded-xl bg-slate-100 px-6 py-3 font-bold text-slate-600 transition-colors hover:bg-slate-200 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={handleScan}
              disabled={scanning || text.trim().length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-8 py-3 font-bold text-white shadow-lg shadow-brand-600/20 transition-colors hover:bg-brand-700 disabled:opacity-60 disabled:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
            >
              {scanning && (
                <Loader2
                  size={18}
                  aria-hidden="true"
                  className="animate-spin motion-reduce:animate-none"
                />
              )}
              {scanning ? "Checking" : "Check contract"}
            </button>
          </div>
        </div>
      </div>

      <HeuristicNotice clauseCount={CLAUSE_COVERAGE_COUNT} />

      {/* Results */}
      {result && (
        <div
          ref={resultsRef}
          tabIndex={-1}
          aria-label="Results"
          className="scroll-mt-20 space-y-6 focus:outline-none"
        >
          {result.inconclusive && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="flex items-start gap-2 text-sm font-medium text-amber-900">
                <Info size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
                <span>
                  That is a short excerpt, so this check is inconclusive. It is not a
                  sign that the contract is fine — there simply is not enough text to
                  say anything either way.
                </span>
              </p>
            </div>
          )}

          {/* Summary. Counts, deliberately not a score. */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              {result.detected.length === 0
                ? "No known clause types matched"
                : `Found ${result.detected.length} clause type${result.detected.length === 1 ? "" : "s"} worth reading`}
            </h2>
            <p className="mt-2 max-w-[68ch] text-sm leading-relaxed text-slate-600">
              {result.detected.length === 0
                ? "That does not mean the contract is safe. It means none of the wordings this tool looks for appeared. Contracts can be unfair in language it does not recognise."
                : "These are clause types, not verdicts. Each one is normal in some contracts and a problem in others, depending on the exact wording and your jurisdiction."}
            </p>

            {result.detected.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2">
                {(["high", "medium", "low"] as Severity[])
                  .filter((sev) => result.counts[sev] > 0)
                  .map((sev) => (
                    <li
                      key={sev}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${ATTENTION_STYLE[sev].chip}`}
                    >
                      {result.counts[sev]} × {ATTENTION_STYLE[sev].label}
                    </li>
                  ))}
              </ul>
            )}
          </div>

          {/* Detected clauses */}
          {result.detected.length > 0 && (
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <h3 className="border-b border-slate-100 px-6 py-4 text-sm font-bold text-slate-700">
                What it found
              </h3>
              <ul className="divide-y divide-slate-100">
                {result.detected.map((clause) => (
                  <li key={clause.id}>
                    <details className="group">
                      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-6 py-4 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500">
                        <span className="min-w-0">
                          <span className="font-bold text-slate-900">
                            {clause.label}
                          </span>
                          <span
                            className={`ml-2 inline-block rounded-full border px-2 py-0.5 align-middle text-[11px] font-semibold ${ATTENTION_STYLE[clause.attention].chip}`}
                          >
                            {ATTENTION_STYLE[clause.attention].label}
                          </span>
                        </span>
                        <ChevronDown
                          size={18}
                          aria-hidden="true"
                          className="mt-0.5 shrink-0 text-slate-400 transition-transform duration-150 group-open:rotate-180 motion-reduce:transition-none"
                        />
                      </summary>

                      <div className="px-6 pb-6">
                        <p className="max-w-[68ch] text-sm leading-relaxed text-slate-600">
                          {clause.whatItMeans}
                        </p>

                        <h4 className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                          What to check in yours
                        </h4>
                        <ul className="mt-2 max-w-[68ch] list-disc space-y-1 pl-5 text-sm text-slate-600">
                          {clause.whatToCheck.map((point) => (
                            <li key={point}>{point}</li>
                          ))}
                        </ul>

                        {clause.excerpts.length > 0 && (
                          <>
                            <h4 className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                              Where it appears in your text
                            </h4>
                            <ul className="mt-2 space-y-2">
                              {clause.excerpts.map((excerpt, i) => (
                                <li
                                  key={i}
                                  className="rounded-lg border-l-2 border-slate-300 bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-600"
                                >
                                  {excerpt}
                                </li>
                              ))}
                            </ul>
                          </>
                        )}
                      </div>
                    </details>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Missing protections — usually the more useful half. */}
          {result.missingProtections.length > 0 && (
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-4">
                <h3 className="text-sm font-bold text-slate-700">
                  What it could not find
                </h3>
                <p className="mt-1 max-w-[68ch] text-xs leading-relaxed text-slate-500">
                  These provisions usually work in a freelancer&apos;s favour and no
                  matching wording appeared. They may be phrased in a way this tool
                  does not recognise, or in a document this one refers to.
                </p>
              </div>
              <ul className="divide-y divide-slate-100">
                {result.missingProtections.map((item) => (
                  <li key={item.id} className="flex gap-3 px-6 py-4">
                    <CircleSlash
                      size={17}
                      aria-hidden="true"
                      className="mt-0.5 shrink-0 text-slate-400"
                    />
                    <div>
                      <p className="font-semibold text-slate-900">{item.label}</p>
                      <p className="mt-0.5 max-w-[68ch] text-sm leading-relaxed text-slate-600">
                        {item.whyItMatters}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Limitations. Always shown with results, never collapsed away. */}
          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h3 className="text-sm font-bold text-slate-800">
              What this check cannot tell you
            </h3>
            <ul className="mt-3 max-w-[68ch] list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-600">
              {result.limitations.map((limitation) => (
                <li key={limitation}>{limitation}</li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
