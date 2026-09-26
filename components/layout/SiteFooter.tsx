// components/layout/SiteFooter.tsx
//
// NEW FILE. The <footer> in app/layout.tsx was the comment
// "{/* ... existing footer code ... */}", so no page on the site linked to the
// privacy policy, the terms, or a contact route. A publisher review checks for
// those directly, and a visitor has no way to find them either.
//
// Deliberately NOT a link dump. Three short columns of links that a person
// would actually follow, plus an honest one-line statement of who runs this.

import Link from "next/link";
import { ShieldCheck } from "lucide-react";

const YEAR = new Date().getFullYear();

const COLUMNS: Array<{ heading: string; links: Array<{ href: string; label: string }> }> = [
  {
    heading: "Tools",
    links: [
      { href: "/invoice-maker", label: "Invoice generator" },
      { href: "/contract-scanner", label: "Contract scanner" },
    ],
  },
  {
    heading: "Guides",
    links: [
      { href: "/resources", label: "All guides" },
      { href: "/methodology", label: "How the scanner works" },
    ],
  },
  {
    heading: "About",
    links: [
      { href: "/about", label: "About this project" },
      { href: "/legal/privacy", label: "Privacy policy" },
      { href: "/legal/terms", label: "Terms of service" },
      { href: "mailto:workmailkartikeya@gmail.com", label: "Contact" },
    ],
  },
];

export interface SiteFooterProps {
  hasGuides: boolean;
}

export default function SiteFooter({ hasGuides }: SiteFooterProps) {
  // Filter out the "/resources" link if there are no guides available in the file system
  const displayColumns = COLUMNS.map((column) => ({
    ...column,
    links: column.links.filter((link) =>
      link.href === "/resources" ? hasGuides : true
    ),
  }));

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="flex items-center gap-2 font-bold tracking-tight text-slate-900">
              <ShieldCheck size={18} aria-hidden="true" className="text-brand-600" />
              FreelanceShield
            </p>
            <p className="mt-3 max-w-[42ch] text-sm leading-relaxed text-slate-600">
              Free browser-based tools for freelancers. Your invoices and contracts
              stay on your device.
            </p>
          </div>

          {displayColumns.map((column) => (
            <nav key={column.heading} aria-labelledby={`footer-${column.heading}`}>
              <h2
                id={`footer-${column.heading}`}
                className="text-sm font-bold text-slate-900"
              >
                {column.heading}
              </h2>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    {link.href.startsWith("mailto:") ? (
                      <a
                        href={link.href}
                        className="rounded text-sm text-slate-600 hover:text-brand-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="rounded text-sm text-slate-600 hover:text-brand-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 border-t border-slate-100 pt-6 text-xs leading-relaxed text-slate-500">
          <p>
            Built and maintained by Kartikeya Mishra in Prayagraj, India. The guides
            here are general information, not legal, tax or accounting advice.
          </p>
          <p className="mt-2">© {YEAR} Kartikeya Mishra.</p>
        </div>
      </div>
    </footer>
  );
}