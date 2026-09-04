import type { NextConfig } from "next";

// next.config.ts
//
// -------------------------------------------------------------------------
// WHAT CHANGED AND WHY
// -------------------------------------------------------------------------
//
// 1. images.remotePatterns hostname was '**'.
//    That turns /_next/image into an open image proxy for the entire internet.
//    Anyone can hit your deployment with
//        /_next/image?url=https://any-host/any-file&w=3840&q=75
//    and make your Vercel account fetch, transform and cache it. It is a
//    bandwidth and cost vector, and it lets a third party use your domain to
//    serve their images. Now restricted to hosts you actually load from.
//    Add entries as needed; do not go back to a wildcard.
//
// 2. compiler.removeConsole stripped ALL console calls in production,
//    including console.error. app/error.tsx logs there, and so does AdSlot's
//    failure path, so in production those diagnostics silently vanished. Now
//    keeps console.error and console.warn.
//
// 3. CSP had 'unsafe-eval' in script-src.
//    That is needed by the Next dev overlay, not by production. It is now
//    applied only in development, which removes a meaningful XSS mitigation gap
//    from your live site.
//
// 4. CSP was missing object-src, base-uri, form-action and frame-ancestors.
//    Without base-uri, an injected <base> tag can redirect every relative URL
//    on the page. Without object-src 'none', legacy plugin embeds are allowed.
//    frame-ancestors is the modern replacement for X-Frame-Options.
//
// 5. X-XSS-Protection: "1; mode=block" is deprecated and its filter has itself
//    been a source of vulnerabilities. Modern guidance is to disable it
//    explicitly with "0" and rely on CSP.
//
// 6. No HSTS. Added, with a conservative max-age. Read the note on it below
//    before deploying — preload is deliberately omitted.
//
// 7. No Permissions-Policy. Added, denying sensors and capture APIs this site
//    has no use for.
//
// 8. Added ep2.adtrafficquality.google and the Google static/CSI hosts that
//    AdSense actually contacts. The previous CSP listed only ep1, so ad quality
//    calls to ep2 were being blocked and reported as console errors.
//
// 9. ads.txt gets an explicit text/plain content type. Serving it as anything
//    else can cause Google's crawler to reject it.

const isProd = process.env.NODE_ENV === "production";

/** Google hosts AdSense genuinely contacts. Keep this list tight. */
const GOOGLE_ADS_HOSTS = [
  "https://pagead2.googlesyndication.com",
  "https://tpc.googlesyndication.com",
  "https://googleads.g.doubleclick.net",
  "https://ep1.adtrafficquality.google",
  "https://ep2.adtrafficquality.google",
  "https://www.googletagservices.com",
].join(" ");

const csp = [
  `default-src 'self'`,
  // 'unsafe-inline' is required by AdSense's injected scripts.
  // 'unsafe-eval' is dev-only (Next's error overlay).
  `script-src 'self' 'unsafe-inline' ${isProd ? "" : "'unsafe-eval'"} ${GOOGLE_ADS_HOSTS} https://adservice.google.com`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' blob: data: https:`,
  // next/font self-hosts Inter, so no external font origin is needed.
  `font-src 'self' data:`,
  `connect-src 'self' ${GOOGLE_ADS_HOSTS} https://csi.gstatic.com`,
  `frame-src 'self' ${GOOGLE_ADS_HOSTS}`,
  // Blocks <base href> injection redirecting every relative URL on the page.
  `base-uri 'self'`,
  `form-action 'self'`,
  // Modern replacement for X-Frame-Options.
  `frame-ancestors 'none'`,
  `object-src 'none'`,
  `upgrade-insecure-requests`,
]
  .filter(Boolean)
  .join("; ")
  .replace(/\s{2,}/g, " ");

const nextConfig: NextConfig = {
  reactStrictMode: true,

  compiler: {
    // Keep error and warn. Stripping them removed the only diagnostics
    // available in production.
    removeConsole: isProd ? { exclude: ["error", "warn"] } : false,
  },

  images: {
    remotePatterns: [
      // Add the hosts you actually serve images from. Left deliberately narrow.
      { protocol: "https", hostname: "freelanceshield.me" },
    ],
    formats: ["image/avif", "image/webp"],
  },

  // Fails the build on type errors rather than shipping them. Defaults to false
  // already; stated explicitly so nobody flips it to true under deadline
  // pressure without noticing.
  //
  // The matching `eslint: { ignoreDuringBuilds: false }` key was removed:
  // Next.js 16 no longer supports eslint configuration here and warns about it.
  // Lint runs via `npm run lint` instead.
  typescript: { ignoreBuildErrors: false },

  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          // Deprecated header, explicitly disabled. CSP does this job properly.
          { key: "X-XSS-Protection", value: "0" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), interest-cohort=()",
          },
          {
            // Two years, subdomains included. `preload` is deliberately NOT set:
            // submitting to the preload list is effectively irreversible and
            // would break any subdomain you later need to serve over HTTP.
            // Add it only once you are certain every subdomain is HTTPS-only.
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
      {
        // Google's crawler expects plain text here. Serving it as anything else
        // can cause the file to be rejected.
        source: "/ads.txt",
        headers: [
          { key: "Content-Type", value: "text/plain; charset=utf-8" },
          { key: "Cache-Control", value: "public, max-age=3600" },
        ],
      },
    ];
  },

  async redirects() {
    return [
      // The old privacy route. Update or remove once you confirm which paths
      // were live — do not leave a redirect pointing at a page that never
      // existed, and do not break inbound links to one that did.
      { source: "/privacy", destination: "/legal/privacy", permanent: true },
      { source: "/terms", destination: "/legal/terms", permanent: true },
    ];
  },
};

export default nextConfig;
