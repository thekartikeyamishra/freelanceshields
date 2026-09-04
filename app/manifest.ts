// app/manifest.ts
//
// CHANGES
//
// 1. REMOVED REFERENCES TO FILES THAT MAY NOT EXIST. The previous manifest
//    pointed at /icons/shortcut-invoice.png, /icons/shortcut-scan.png,
//    /screenshots/invoice-mobile.png and /screenshots/scanner-desktop.png.
//    If any of those are missing, the browser rejects the entry and, for
//    screenshots, can refuse the richer install UI entirely. Shortcut icons are
//    now omitted (they are optional and shortcuts work without them), and the
//    screenshots block is commented out until the files are confirmed present.
//    See HANDOVER.md item 7.
//
// 2. FIXED THE ICON PURPOSES. The old file declared 192 as maskable only and
//    512 as any only. A maskable-only icon gets cropped when used as a standard
//    icon, and an any-only icon gets letterboxed on Android adaptive launchers.
//    Each size now has both purposes declared separately, which is the pattern
//    that actually works across platforms.
//
// 3. TONED DOWN THE DESCRIPTION. "The local-first operating system for
//    freelancers" and "audit-proof invoices" were both overstatements —
//    "audit-proof" in particular is a claim about tax outcomes that no invoice
//    formatter can make.

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FreelanceShield — Invoice generator and contract scanner",
    short_name: "FreelanceShield",
    description:
      "Make invoices and check contracts in your browser. Your data stays on your device.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#0284c7",
    orientation: "portrait-primary",
    categories: ["business", "finance", "productivity", "utilities"],

    shortcuts: [
      {
        name: "New invoice",
        short_name: "Invoice",
        description: "Create an invoice",
        url: "/invoice-maker",
      },
      {
        name: "Check a contract",
        short_name: "Scan",
        description: "Check a contract for clause types",
        url: "/contract-scanner",
      },
    ],

    icons: [
      { src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],

    // Re-enable once these files are confirmed to exist in /public:
    // screenshots: [
    //   { src: "/screenshots/invoice-mobile.png", sizes: "1080x1920", type: "image/png", form_factor: "narrow" },
    //   { src: "/screenshots/scanner-desktop.png", sizes: "1920x1080", type: "image/png", form_factor: "wide" },
    // ],
  };
}
