"use client";

// components/ui/InstallPrompt.tsx
//
// -------------------------------------------------------------------------
// WHAT CHANGED
// -------------------------------------------------------------------------
//
// 1. DISMISSAL NOW PERSISTS. Previously dismissal lived in component state
//    only, so closing the banner brought it back on the very next page load.
//    That is an intrusive interstitial, which is both a poor experience and a
//    mobile-usability problem.
//
// 2. NO LONGER FIRES ON FIRST VISIT. The iOS branch previously appeared after
//    a fixed 3 seconds on every visit, before the visitor had seen anything.
//    It now waits until someone has actually used a tool, which is signalled by
//    calling markEngaged(). Prompting to install before the product has proved
//    useful converts badly and annoys everyone else.
//
// 3. THE iOS BRANCH NO LONGER BLOCKS THE PAGE. It was `fixed bottom-0 left-0
//    right-0` and covered content. It is now a compact card with a safe-area
//    inset, and it is dismissible from the keyboard with Escape.
//
// 4. FIXED A LOGIC BUG. The old effect returned early inside the iOS branch
//    (`return () => clearTimeout(timer)`) BEFORE registering the
//    beforeinstallprompt listener, so on any iOS device the Android/desktop
//    path was never wired up. The listener is now registered unconditionally.
//
// USAGE: call markEngaged() from a real completion event — after a PDF
// downloads, or after a contract scan finishes.

import React, { useCallback, useEffect, useState } from "react";
import { Download, X, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const DISMISSED_KEY = "fs:pwa-prompt-dismissed";
const ENGAGED_KEY = "fs:pwa-engaged";
/** Suppress for 60 days after a dismissal. */
const SUPPRESS_DAYS = 60;

/** Call this once the visitor has completed something real. */
export function markEngaged(): void {
  try {
    window.localStorage.setItem(ENGAGED_KEY, "1");
    window.dispatchEvent(new Event("fs:local-storage"));
  } catch {
    /* storage unavailable */
  }
}

function isSuppressed(): boolean {
  try {
    const raw = window.localStorage.getItem(DISMISSED_KEY);
    if (!raw) return false;
    const at = Number(raw);
    if (!Number.isFinite(at)) return true;
    const days = (Date.now() - at) / 86_400_000;
    return days < SUPPRESS_DAYS;
  } catch {
    return false;
  }
}

function hasEngaged(): boolean {
  try {
    return window.localStorage.getItem(ENGAGED_KEY) === "1";
  } catch {
    return false;
  }
}

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOS, setShowIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const dismiss = useCallback(() => {
    setDismissed(true);
    setShowIOS(false);
    setDeferred(null);
    try {
      window.localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    } catch {
      /* storage unavailable */
    }
  }, []);

  useEffect(() => {
    if (isSuppressed()) {
      setDismissed(true);
      return;
    }

    // Android / desktop: capture the browser's own install event.
    // Registered unconditionally — the previous version skipped this on iOS.
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    // iOS has no install event, so we show manual instructions — but only to
    // someone who has already used a tool and is not already in standalone mode.
    const ua = window.navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !("MSStream" in window);
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in window.navigator &&
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true);

    let timer: number | undefined;
    if (isIOS && !isStandalone && hasEngaged()) {
      timer = window.setTimeout(() => setShowIOS(true), 1500);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, []);

  // Escape closes the prompt.
  useEffect(() => {
    if (!showIOS && !deferred) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showIOS, deferred, dismiss]);

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  };

  if (dismissed) return null;

  const showAndroid = Boolean(deferred) && hasEngaged();
  if (!showAndroid && !showIOS) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="install-prompt-title"
      className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-6 md:max-w-sm"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="rounded-xl border border-slate-700 bg-slate-900 p-4 text-white shadow-2xl">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 rounded-lg bg-brand-600 p-2">
            <Download size={18} aria-hidden="true" />
          </span>

          <div className="min-w-0 flex-1">
            <h2 id="install-prompt-title" className="text-sm font-bold">
              Install FreelanceShield
            </h2>
            <p className="mt-0.5 text-xs text-slate-300">
              {showIOS
                ? "Add it to your home screen to make invoices without a connection."
                : "Works offline. Your data stays on this device."}
            </p>

            {showIOS && (
              <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-200">
                <Share size={14} aria-hidden="true" className="text-brand-400" />
                Tap Share, then “Add to Home Screen”.
              </p>
            )}

            {showAndroid && (
              <button
                type="button"
                onClick={install}
                className="mt-3 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-slate-900 transition-colors hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
              >
                Install
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={dismiss}
            className="rounded p-1 text-slate-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            <X size={16} aria-hidden="true" />
            <span className="sr-only">Dismiss install prompt</span>
          </button>
        </div>
      </div>
    </div>
  );
}
