// lib/site.ts — single source of truth for brand, contact, store and payment
// configuration. Legal pages, footer, schema and store buttons all read from
// here, so a fact is changed once and stays consistent everywhere.
//
// NOTHING BELOW MAY BE INVENTED. Values set to null render as nothing (or as
// "coming soon"), never as a fake address, phone number or store link.

export const SITE = {
  name: "FreelanceShield",
  url: "https://freelanceshield.me",
  tagline: "Get paid. Stay protected. Keep your data.",
  description:
    "Free, private tools for freelancers: invoices, contract checks and project plans that run in your browser.",
  owner: "Kartikeya Mishra",
  locale: "en",
} as const;

/** Brand palette. Mirrors the @theme tokens in app/globals.css. */
export const BRAND = {
  navy: "#0c4a6e",   // brand-900: headings, primary dark surfaces
  action: "#0284c7", // brand-600: primary buttons, links
  sky: "#38bdf8",    // brand-400: highlights, mascot
  mint: "#10b981",   // success, "safe" states
  amber: "#f59e0b",  // attention, never alarm
  ink: "#0f172a",    // body text
} as const;

/**
 * Business contact details. Razorpay's website review requires a real
 * operating address and a working contact method on the Contact page.
 * Fill these with REAL values before applying to Razorpay.
 */
export const CONTACT = {
  email: "workmailkartikeya@gmail.com",
  /** Legal name of the business or individual operating the site. */
  legalName: "Kartikeya Mishra" as string,
  /** e.g. "12 MG Road, Bengaluru, Karnataka 560001, India". null = not shown. */
  address: null as string | null,
  /** e.g. "+91 98xxxxxxxx". null = not shown. */
  phone: null as string | null,
  /** Response-time promise shown on the contact page. Keep it one you can meet. */
  responseTime: "within 2 working days",
  /** Grievance officer (IT Rules 2021). Defaults to the operator. */
  grievanceOfficer: "Kartikeya Mishra",
  country: "India",
  city: "Bengaluru",
} as const;

/**
 * App store listings. null = "Coming soon" badge, not a link.
 * When the apps ship, paste the listing URLs here — nothing else changes.
 */
export const APP_STORES = {
  playStore: null as string | null, // e.g. "https://play.google.com/store/apps/details?id=com.kartikeyamishra.freelanceshield"
  appStore: null as string | null,  // e.g. "https://apps.apple.com/app/idXXXXXXXXXX"
} as const;

/**
 * Payments — DISABLED. Nothing is sold yet, so nothing is rendered.
 *
 * Before enabling either option:
 *   1. Add a public /pricing page listing exactly what is sold and for how much.
 *   2. Review app/legal/refunds/page.tsx against the actual product.
 *   3. Add the provider's domains to the CSP in next.config.ts.
 */
export const PAYMENTS = {
  enabled: false,

  // --- PayPal (international), via a Squarespace-hosted payment link -------
  // paypalLink: "https://YOUR-SQUARESPACE-SITE.squarespace.com/checkout/...",
  paypalLink: null as string | null,

  // --- Razorpay (India) ----------------------------------------------------
  // Use a Razorpay Payment Link or Payment Page for the first products — no
  // server code, no keys in this repo. Move to Razorpay Checkout + a server
  // route only when you need subscriptions or per-user entitlements.
  // razorpayLink: "https://rzp.io/l/XXXXXXX",
  razorpayLink: null as string | null,
} as const;

/**
 * Store listings for the extension and assistant apps. null = "coming soon".
 * Paste the real listing URL once each one is approved.
 */
export const INTEGRATIONS = {
  chromeWebStore: null as string | null,
  edgeAddons: null as string | null,
  googleWorkspace: null as string | null,
  customGpt: null as string | null,
  geminiExtensionRepo:"https://github.com/thekartikeyamishra/freelanceshield-gemini" as string | null,
  mcpUrl: "https://freelanceshield.me/api/mcp",
} as const;
