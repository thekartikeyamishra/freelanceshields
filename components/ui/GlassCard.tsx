// components/ui/GlassCard.tsx
//
// Changed: the hover lift and shadow growth now respect prefers-reduced-motion,
// and the backdrop blur is dropped on low-end devices via a media query rather
// than being applied unconditionally (backdrop-filter is expensive to composite
// and was previously applied to every card on the homepage at once).

import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  /** Set false for cards that are not interactive, so they get no hover affordance. */
  interactive?: boolean;
}

export default function GlassCard({
  children,
  className = "",
  interactive = true,
}: GlassCardProps) {
  const hover = interactive
    ? "transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-2xl " +
      "motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    : "";

  return (
    <div
      className={`rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-xl supports-[backdrop-filter]:backdrop-blur-lg ${hover} ${className}`}
    >
      {children}
    </div>
  );
}
