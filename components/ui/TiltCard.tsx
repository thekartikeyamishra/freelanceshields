"use client";
// components/ui/TiltCard.tsx
// Max 4° tilt toward the pointer plus a moving sheen. Transform-only (GPU,
// no layout shift), fine pointers only, disabled under reduced motion.

import { useRef } from "react";

export default function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  const enabled = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || !enabled()) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateX(${(-py * 4).toFixed(2)}deg) rotateY(${(px * 4).toFixed(2)}deg)`;
    el.style.setProperty("--sheen-x", `${(px + 0.5) * 100}%`);
    el.style.setProperty("--sheen-o", "1");
  };
  const reset = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "";
    el.style.setProperty("--sheen-o", "0");
  };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={reset}
      className={`relative h-full transition-transform duration-200 ease-out will-change-transform ${className}`}
    >
      {children}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-3xl transition-opacity duration-300"
        style={{
          opacity: "var(--sheen-o, 0)",
          background: "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.55) var(--sheen-x, 50%), transparent 65%)",
          mixBlendMode: "soft-light",
        }}
      />
    </div>
  );
}
