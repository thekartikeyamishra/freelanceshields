// app/layout.tsx
//
// -------------------------------------------------------------------------
// WHAT CHANGED
// -------------------------------------------------------------------------
//
// 1. THE NAVBAR AND FOOTER WERE EMPTY. The previous file contained literally:
//        <nav ...>{/* ... existing navbar code ... */}</nav>
//        <footer ...>{/* ... existing footer code ... */}</footer>
//    So the deployed site rendered an empty nav bar and an empty footer on
//    every page. That means: no site-wide navigation, no internal linking, and
//    no links to privacy, terms, about or contact anywhere. An AdSense reviewer
//    checks for exactly those. It is also why the site had almost no internal
//    link graph for crawlers to follow. This is the single highest-impact fix
//    in this batch.
//
// 2. DUPLICATE METADATA ON EVERY PAGE. `title` and `description` were set here
//    as plain strings with no template, so every route that did not export its
//    own metadata inherited "Freelance Shield | Invoices, Contracts & Legal
//    Protection" / "The ultimate toolkit for independent professionals."
//    That is why /invoice-maker and /contract-scanner were indistinguishable
//    from the homepage in search results. Now uses a title template.
//
// 3. NO metadataBase. Without it, Next.js cannot resolve relative Open Graph
//    and canonical URLs, so OG images silently fail to resolve absolutely.
//
// 4. HARDCODED PUBLISHER ID in the AdSense script src. Now from env, and the
//    script does not render at all when the env var is absent.
//
// 5. suppressHydrationWarning WAS ON <html> AND <body>. That silences real
//    hydration bugs rather than fixing them. Kept on <html> only, which is the
//    normal accommodation for theme/extension attributes; removed from <body>.

import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import SiteHeader from "@/components/layout/SiteHeader";
import ConsentBanner from "@/components/consent/ConsentBanner";
import ServiceWorkerRegistrar from "@/components/core/ServiceWorkerRegistrar";
import SiteFooter from "@/components/layout/SiteFooter";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });

const SITE = "https://freelanceshield.me";
const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    // Pages that set their own title get "<title> | FreelanceShield".
    template: "%s | FreelanceShield",
    default: "FreelanceShield — Private invoicing and contract tools for freelancers",
  },
  description:
    "Free browser-based tools for independent professionals. Make invoices, check contracts for clauses worth reading twice, and keep your data on your own device.",
  applicationName: "FreelanceShield",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "FreelanceShield",
    locale: "en",
    url: SITE,
  },
  twitter: { card: "summary_large_image" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  formatDetection: { telephone: false, address: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0284c7",
};

/**
 * Organization and WebSite markup. Included because it describes real,
 * verifiable things: the site, its operator, and its actual social profiles.
 *
 * Deliberately absent: aggregateRating, award, and any claim about users or
 * endorsements. We have no reviews, so asserting any would be both a policy
 * violation and untrue.
 */
function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE}/#website`,
        url: SITE,
        name: "FreelanceShield",
        publisher: { "@id": `${SITE}/#organization` },
        inLanguage: "en",
      },
      {
        "@type": "Organization",
        "@id": `${SITE}/#organization`,
        name: "FreelanceShield",
        url: SITE,
        description:
          "Browser-based invoicing and contract tools for freelancers and independent professionals.",
        founder: {
          "@type": "Person",
          name: "Kartikeya Mishra",
          sameAs: [
            "https://www.linkedin.com/in/thekartikeyamishra/",
            "https://x.com/KartikeyahereX",
          ],
        },
        // Add "logo" here once a logo file exists at a stable URL on THIS
        // domain. The previous markup pointed at kartikeyamishra.info/logo.svg,
        // a different domain, which is not a valid publisher logo for this site.
      },
    ],
  };
}

function safeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} scroll-smooth`} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: safeJsonLd(organizationJsonLd()) }}
        />
      </head>
      <body
        className={`${inter.className} flex min-h-screen flex-col bg-slate-50 text-slate-900 antialiased`}
      >
        {/* CONSENT MODE DEFAULT — MUST RUN BEFORE THE ADSENSE SCRIPT.
            beforeInteractive guarantees this executes before any ad request, so
            the first request is never made unconsented. Defaults are DENIED,
            which means Google serves non-personalised ads until the visitor
            chooses otherwise via ConsentBanner. Do not move this below the
            AdSense Script tag and do not change the strategy. */}
        {ADSENSE_CLIENT && (
          <Script id="consent-default" strategy="beforeInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:500});`}
          </Script>
        )}

        {/* Keyboard users land here first and can jump past the nav. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:font-semibold focus:text-white"
        >
          Skip to content
        </a>

        <SiteHeader />

        <main id="main" className="flex-grow">
          {children}
        </main>

        <SiteFooter />

        {ADSENSE_CLIENT && <ConsentBanner />}
        <ServiceWorkerRegistrar />

        {/* Loaded after hydration so it never competes with the tools for the
            main thread during first paint. Absent entirely without an env var,
            which keeps preview deploys and local dev free of ad requests. */}
        {ADSENSE_CLIENT && (
          <Script
            id="adsbygoogle-init"
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
