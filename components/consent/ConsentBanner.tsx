"use client";

// components/consent/ConsentBanner.tsx
//
// NEW FILE. You serve Google AdSense to UK and EU visitors and there was no
// consent mechanism of any kind in the codebase.
//
// -------------------------------------------------------------------------
// WHAT THIS DOES, AND WHAT IT DOES NOT
// -------------------------------------------------------------------------
//
// This implements Google Consent Mode v2 with a default of DENIED. That means:
//
//   - Before any choice is made, ad storage and ad personalisation are denied,
//     so Google serves NON-PERSONALISED ads. Those do not require consent under
//     the ePrivacy/GDPR framework in the same way personalised ads do.
//   - If the visitor accepts, signals flip to granted and personalised ads
//     become available.
//   - If they decline, it stays denied and they keep seeing non-personalised
//     ads. The site keeps working and keeps earning, at a lower rate.
//
// THIS IS NOT A CERTIFIED TCF CMP. Google requires a certified CMP integrated
// with the IAB Transparency and Consent Framework to serve *personalised* ads
// to users in the EEA, UK and Switzerland. This component does not provide that.
//
// What it does give you is a legitimate compliant position TODAY: non-personalised
// ads everywhere by default, personalised ads only outside the regions where a
// certified CMP is mandatory. That is a real, supported configuration — not a
// workaround — and it means you can leave AdSense enabled while you evaluate a
// certified CMP rather than either running non-compliant or turning ads off.
//
// See HANDOVER.md for the decision you still need to make here.
//
// -------------------------------------------------------------------------
// IMPORTANT ORDERING NOTE
// -------------------------------------------------------------------------
// The consent DEFAULT must be set before the AdSense script loads, or the first
// ad request goes out unconsented. That default is set by an inline
// beforeInteractive script in app/layout.tsx, not here. This component only
// renders the banner and handles the UPDATE. Do not move the default here.

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "fs:consent-v1";

type ConsentChoice = "granted" | "denied";

interface StoredConsent {
  choice: ConsentChoice;
  /** Epoch ms. Consent is re-requested after 12 months. */
  at: number;
}

/** Re-ask after this long, so consent does not persist indefinitely. */
const CONSENT_TTL_MS = 365 * 24 * 60 * 60 * 1000;

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gtag?: (...args: any[]) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dataLayer?: any[];
  }
}

/** Pushes a consent update to Google's consent API. */
function updateGoogleConsent(choice: ConsentChoice): void {
  const value = choice === "granted" ? "granted" : "denied";

  // gtag may not have loaded yet; dataLayer is queued either way, so push
  // directly rather than depending on the wrapper existing.
  window.dataLayer = window.dataLayer || [];
  // eslint-disable-next-line prefer-rest-params
  function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
  }

  gtag("consent", "update", {
    ad_storage: value,
    ad_user_data: value,
    ad_personalization: value,
    // Analytics storage is denied regardless — there is no analytics on this
    // site. Change this only if you add one, and disclose it in the policy.
    analytics_storage: "denied",
  });
}

function readStored(): StoredConsent | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredConsent;
    if (parsed.choice !== "granted" && parsed.choice !== "denied") return null;
    if (Date.now() - parsed.at > CONSENT_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

export default function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = readStored();

    if (stored) {
      // Re-apply the stored choice on every page load. Consent Mode defaults
      // reset per page, so a previously granted choice must be replayed.
      updateGoogleConsent(stored.choice);
      return;
    }

    setVisible(true);
  }, []);

  const decide = useCallback((choice: ConsentChoice) => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ choice, at: Date.now() } satisfies StoredConsent),
      );
    } catch {
      // Storage unavailable. The choice still applies for this page load; the
      // banner will simply reappear next time.
    }
    updateGoogleConsent(choice);
    setVisible(false);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="consent-title"
      aria-describedby="consent-body"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-slate-200 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-4 p-4 sm:p-6 md:flex-row md:items-center">
        <div className="flex-1">
          <h2 id="consent-title" className="text-sm font-bold text-slate-900">
            Cookies for advertising
          </h2>
          <p
            id="consent-body"
            className="mt-1 max-w-[68ch] text-sm leading-relaxed text-slate-600"
          >
            Advertising pays for these tools being free. With your agreement,
            Google can use cookies to personalise the ads you see. Decline and you
            will still see ads, just less relevant ones — nothing else changes, and
            the tools work identically either way.{" "}
            <a
              href="/legal/privacy"
              className="font-medium text-brand-700 underline decoration-brand-300 underline-offset-2"
            >
              What we collect
            </a>
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Your invoices and contracts are never part of this. They stay on your
            device.
          </p>
        </div>

        {/* Both buttons are equally prominent. A styled "Accept" beside a greyed
            "Decline" is a dark pattern and invalidates the consent it collects. */}
        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            onClick={() => decide("denied")}
            className="flex-1 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 md:flex-none"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => decide("granted")}
            className="flex-1 rounded-xl border border-slate-900 bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 md:flex-none"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Clears the stored choice so the banner reappears.
 * Wire this to a "Cookie settings" link in the footer — consent must be as easy
 * to withdraw as it was to give.
 */
export function resetConsent(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  } catch {
    /* storage unavailable */
  }
}