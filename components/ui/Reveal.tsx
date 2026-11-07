"use client";
// components/ui/Reveal.tsx
// Fades content up as it scrolls into view. Content is VISIBLE in the server
// HTML and without JavaScript: the hidden state is only applied after mount,
// and only to elements still below the fold — so crawlers and slow devices
// always see everything, and nothing above the fold ever flashes.

import { useEffect, useRef, useState } from "react";

export default function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"idle" | "pending" | "shown">("idle");

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight) return; // already visible
    setState("pending");
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setState("shown");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-[opacity,transform] duration-700 ease-out ${state === "pending" ? "translate-y-4 opacity-0" : "translate-y-0 opacity-100"} ${className}`}
      style={{ transitionDelay: state === "shown" ? `${delay}ms` : undefined }}
    >
      {children}
    </div>
  );
}
