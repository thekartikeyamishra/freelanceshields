"use client";

// components/core/PrivacyDataControls.tsx
//
// A privacy claim needs a matching control, not just a sentence in a policy.
// This lists exactly what the site has stored on the device and erases it.
//
// It exists because the tools persist invoice drafts to localStorage. Saying
// "your data stays on your device" is only half an answer if the visitor has no
// way to see what is there or remove it.

import React, { useEffect, useState } from "react";
import { Trash2, Check } from "lucide-react";
import { clearNamespace, listStoredKeys } from "@/lib/hooks/useLocalStorage";

/** Maps internal storage keys to something a person can recognise. */
const FRIENDLY: Record<string, string> = {
  "invoice-draft-v2": "Your saved invoice draft",
  "pwa-prompt-dismissed": "A note that you dismissed the install prompt",
  "pwa-engaged": "A note that you have used a tool before",
};

function describe(key: string): string {
  return FRIENDLY[key] ?? key;
}

export default function PrivacyDataControls() {
  const [keys, setKeys] = useState<string[]>([]);
  const [cleared, setCleared] = useState<number | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setKeys(listStoredKeys());
    setReady(true);
  }, []);

  const handleClear = () => {
    const confirmed = window.confirm(
      "Erase everything FreelanceShield has stored on this device? This cannot be undone.",
    );
    if (!confirmed) return;

    const removed = clearNamespace();
    setKeys(listStoredKeys());
    setCleared(removed);
  };

  // Render nothing until the client read completes, so the server HTML and the
  // first client render agree.
  if (!ready) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
        Checking what is stored on this device…
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      {keys.length === 0 ? (
        <p className="text-sm text-slate-600">
          Nothing from this site is currently stored on this device.
        </p>
      ) : (
        <>
          <p className="text-sm font-medium text-slate-800">
            Stored on this device right now:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
            {keys.map((key) => (
              <li key={key}>{describe(key)}</li>
            ))}
          </ul>
        </>
      )}

      <div aria-live="polite">
        {cleared !== null && (
          <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-emerald-700">
            <Check size={15} aria-hidden="true" />
            {cleared === 0
              ? "There was nothing left to erase."
              : `Erased ${cleared} stored item${cleared === 1 ? "" : "s"}.`}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={handleClear}
        disabled={keys.length === 0}
        className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
      >
        <Trash2 size={15} aria-hidden="true" />
        Erase my data from this device
      </button>

      <p className="mt-2 text-xs text-slate-500">
        This clears only what this site stored. It does not affect anything you have
        already downloaded.
      </p>
    </div>
  );
}
