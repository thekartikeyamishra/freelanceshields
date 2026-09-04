// components/ui/HeuristicNotice.tsx
//
// Replaces AITransparencyBadge. Delete components/ui/AITransparencyBadge.tsx.
//
// -------------------------------------------------------------------------
// WHY THE OLD BADGE HAD TO GO
// -------------------------------------------------------------------------
//
// It rendered a purple "AI GENERATED" pill next to the words "Processed
// locally." on the output of the contract scanner. But the scanner is regex
// pattern matching — its own file header said "Advanced Heuristics (Regex)".
// Nothing was AI-generated.
//
// Combined with the homepage calling it an "AI Contract Scanner" and the old
// two-second artificial delay, the effect was to present keyword matching as
// machine reasoning on legal risk. Overstating what a tool does is a
// misleading-functionality problem, and it is the kind of claim that is hard to
// recover from once a user notices.
//
// This component states what actually happens. If a real local model ships
// later (WebLLM, WASM), add a `mode="model"` variant then, with the model name.

import React from "react";
import { Cpu, ShieldCheck } from "lucide-react";

interface HeuristicNoticeProps {
  /** How many clause types the scanner checks. Pass CLAUSE_COVERAGE_COUNT. */
  clauseCount: number;
  /** Optional link to the pattern list, so the check is inspectable. */
  methodologyHref?: string;
  className?: string;
}

export default function HeuristicNotice({
  clauseCount,
  methodologyHref = "/methodology",
  className = "",
}: HeuristicNoticeProps) {
  return (
    <div
      className={`rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-600 ${className}`}
    >
      <p className="flex items-start gap-2">
        <Cpu size={14} aria-hidden="true" className="mt-0.5 shrink-0 text-slate-400" />
        <span>
          <strong className="font-semibold text-slate-800">
            Pattern matching, not a language model.
          </strong>{" "}
          This checks your text against {clauseCount} known clause types. It does not
          interpret your contract and has no knowledge of the law that governs it.{" "}
          <a
            href={methodologyHref}
            className="font-medium text-brand-700 underline decoration-brand-300 underline-offset-2 hover:text-brand-800"
          >
            See what it checks for
          </a>
          .
        </span>
      </p>
      <p className="mt-2 flex items-start gap-2">
        <ShieldCheck size={14} aria-hidden="true" className="mt-0.5 shrink-0 text-slate-400" />
        <span>
          Runs in your browser. Your contract text is not uploaded, stored on our
          servers, or sent to any third party.
        </span>
      </p>
    </div>
  );
}
