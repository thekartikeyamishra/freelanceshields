// components/ui/HeroButton.tsx
//
// Fixed: the icon used `group-hover:translate-x-1` but the parent <Link> never
// had the `group` class, so the animation never fired. Added `group`, and the
// transform now respects prefers-reduced-motion.
//
// Also: the arrow is decorative, so it is aria-hidden. Screen readers read the
// label only.

import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface HeroButtonProps {
  href: string;
  /** Say what happens. "Create an invoice", not "Get started". */
  text: string;
  variant?: "primary" | "secondary";
  icon?: boolean;
  className?: string;
}

export default function HeroButton({
  href,
  text,
  variant = "primary",
  icon = true,
  className = "",
}: HeroButtonProps) {
  const base =
    "group inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-base font-bold " +
    "transition-colors duration-200 active:scale-[0.98] motion-reduce:active:scale-100 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2";

  const variants = {
    primary: "bg-brand-900 text-white shadow-lg hover:bg-brand-800",
    secondary:
      "border border-brand-200 bg-white text-brand-900 shadow-sm hover:border-brand-300 hover:bg-brand-50",
  };

  return (
    <Link href={href} className={`${base} ${variants[variant]} ${className}`}>
      {text}
      {icon && (
        <ArrowRight
          aria-hidden="true"
          className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
        />
      )}
    </Link>
  );
}
