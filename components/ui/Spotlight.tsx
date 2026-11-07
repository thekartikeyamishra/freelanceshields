"use client";
// components/ui/Spotlight.tsx
// A soft light that follows the pointer across a section. One rAF-throttled
// listener, CSS variables only (no re-renders), off for touch and for
// prefers-reduced-motion. Purely decorative: aria-hidden, pointer-events none.

import { useEffect, useRef } from "react";

export default function Spotlight({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    let frame = 0;
    const onMove = (e: PointerEvent) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--spot-x", `${e.clientX - r.left}px`);
        el.style.setProperty("--spot-y", `${e.clientY - r.top}px`);
        el.style.setProperty("--spot-o", "1");
      });
    };
    const onLeave = () => el.style.setProperty("--spot-o", "0");
    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={ref} className={`relative isolate ${className}`}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 transition-opacity duration-500"
        style={{
          opacity: "var(--spot-o, 0)",
          background:
            "radial-gradient(520px circle at var(--spot-x, 50%) var(--spot-y, 30%), rgba(56,189,248,0.18), transparent 60%)",
        }}
      />
      {children}
    </div>
  );
}
