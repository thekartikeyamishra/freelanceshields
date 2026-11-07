"use client";

// components/ui/CopyField.tsx — a read-only value with a copy button.

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function CopyField({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked; the text is selectable */
    }
  };
  return (
    <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-1.5 pl-3">
      <code className="min-w-0 flex-1 truncate text-xs text-slate-800">{value}</code>
      <button
        type="button"
        onClick={copy}
        className="inline-flex shrink-0 items-center gap-1 rounded-md bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
