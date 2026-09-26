import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import SiteHeader from "@/components/layout/SiteHeader";
import ConsentBanner from "@/components/consent/ConsentBanner";
import ServiceWorkerRegistrar from "@/components/core/ServiceWorkerRegistrar";
import SiteFooter from "@/components/layout/SiteFooter";
import { getResourceSlugs } from "@/lib/utils/markdown";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });
const SITE = "https://freelanceshield.me";
const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    template: "%s | FreelanceShield",
    default: "FreelanceShield   Private invoicing and contract tools for freelancers",
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
            "https://x.com/kartikeyahere",
          ],
        },
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
  
  // Safely check if any guides exist in the file system without parsing all frontmatter
  let hasGuides = false;
  try {
    hasGuides = getResourceSlugs().length > 0;
  } catch {
    hasGuides = false;
  }

  return (
    <html lang="en" className={`${inter.variable} scroll-smooth`} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(organizationJsonLd()) }}
        />
      </head>
      <body
        className={`${inter.className} flex min-h-screen flex-col bg-slate-50 text-slate-900 antialiased`}
      >
        {ADSENSE_CLIENT && (
          <Script id="consent-default" strategy="beforeInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);} gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:500});`}
          </Script>
        )}
        
        {/* Keyboard users land here first and can jump past the nav. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-100 focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:font-semibold focus:text-white"
        >
          Skip to content
        </a>
        
        <SiteHeader hasGuides={hasGuides} />
        
        <main id="main" className="grow">
          {children}
        </main>
        
        <SiteFooter hasGuides={hasGuides} />
        
        {ADSENSE_CLIENT && <ConsentBanner />}
        <ServiceWorkerRegistrar />
        
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