"use client";

// components/ads/AdSlot.tsx
//
// Replaces StrategicAdSlot. Delete components/ads/StrategicAdSlot.tsx.
//
// -------------------------------------------------------------------------
// WHAT WAS WRONG WITH THE PREVIOUS COMPONENT
// -------------------------------------------------------------------------
//
// 1. VISUALLY IDENTICAL TO TOOL UI. It rendered
//        bg-white p-4 rounded-lg shadow-sm border border-slate-100
//    while InvoiceForm's own panels rendered
//        bg-white p-6 rounded-xl shadow-sm border border-slate-100
//    Same background, same shadow, same border token. Ads must be
//    distinguishable from content.
//
// 2. DECEPTIVE LABELS. It was called with label="Recommended Financial Tools"
//    and label="Recommended Freelance Tools". Those read as editorial
//    recommendations from us. The label is now fixed at "Advertisement" and is
//    not overridable — a caller cannot relabel an ad as a recommendation.
//
// 3. HARDCODED PUBLISHER ID. `data-ad-client="ca-pub-..."` was inline.
//    Now read from NEXT_PUBLIC_ADSENSE_CLIENT_ID.
//
// 4. NO LAZY LOADING and no reserved height, so slots requested on load and
//    shifted layout on fill (a CLS cost).
//
// PLACEMENT RULES, enforced by convention and reviewed in code review:
//   - Never between a form's last input and its primary action.
//   - Never inside the invoice or scanner workflow.
//   - Never adjacent to a button that performs a tool action.
//   - Only in the content column of article pages, and between sections
//     rather than mid-sentence.

import React, { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export type AdFormat = "auto" | "fluid" | "rectangle" | "horizontal";

interface AdSlotProps {
  /** AdSense ad unit id. */
  slotId: string;
  format?: AdFormat;
  /**
   * Reserved height in pixels, to prevent layout shift when the ad fills.
   * Match this to the unit's typical rendered height.
   */
  reservedHeight?: number;
  className?: string;
}

const CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

export default function AdSlot({
  slotId,
  format = "auto",
  reservedHeight = 280,
  className = "",
}: AdSlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const requested = useRef(false);
  const [inView, setInView] = useState(false);

  // Only request the ad once the slot is near the viewport. Saves bandwidth on
  // long article pages and keeps initial load lighter.
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || requested.current || !CLIENT_ID) return;

    const node = containerRef.current;
    // A zero-width container means the slot is hidden; requesting an ad for it
    // throws and wastes an impression.
    if (!node || node.offsetWidth === 0) return;

    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
      requested.current = true;
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[AdSlot] push failed:", error);
      }
    }
  }, [inView]);

  // With no publisher id configured, render nothing at all rather than an
  // empty labelled box. Keeps preview deploys and local dev clean.
  if (!CLIENT_ID) {
    if (process.env.NODE_ENV !== "production") {
      return (
        <div
          className={`my-8 rounded border border-dashed border-slate-300 bg-slate-50 p-4 text-center font-mono text-[11px] text-slate-400 ${className}`}
        >
          Ad slot {slotId} — NEXT_PUBLIC_ADSENSE_CLIENT_ID not set
        </div>
      );
    }
    return null;
  }

  return (
    // Deliberately NOT a white rounded card with a shadow. Ads sit on a tinted
    // inset panel with a dashed rule and a hard label so they cannot be mistaken
    // for one of the tool's own panels.
    <aside
      ref={containerRef}
      aria-label="Advertisement"
      className={`my-8 border-y border-dashed border-slate-300 bg-slate-50/60 py-3 ${className}`}
    >
      <p className="mb-2 text-center text-[11px] font-medium uppercase tracking-wide text-slate-500">
        Advertisement
      </p>
      <div style={{ minHeight: reservedHeight }} className="flex justify-center">
        <ins
          className="adsbygoogle"
          style={{ display: "block", width: "100%", minHeight: reservedHeight }}
          data-ad-client={CLIENT_ID}
          data-ad-slot={slotId}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
      </div>
    </aside>
  );
}
