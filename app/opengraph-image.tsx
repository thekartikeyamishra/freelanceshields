// app/opengraph-image.tsx — default social share image (1200×630) for every
// page without its own. Generated at build/edge, so no binary asset to manage.
import { ImageResponse } from "next/og";

export const alt = "FreelanceShield — free, private tools for freelancers";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "linear-gradient(135deg, #0c4a6e 0%, #0284c7 60%, #38bdf8 100%)", color: "white", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="72" height="72" viewBox="0 0 24 24" fill="none">
            <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" fill="white" />
            <path d="M9 12l2 2 4-4" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div style={{ fontSize: 40, fontWeight: 800 }}>FreelanceShield</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 72, fontWeight: 900, lineHeight: 1.05, letterSpacing: -2 }}>Get paid. Stay protected.</div>
          <div style={{ fontSize: 32, opacity: 0.9 }}>Invoices, contract checks and project plans — free, and private to your device.</div>
        </div>
        <div style={{ fontSize: 26, opacity: 0.8 }}>freelanceshield.me</div>
      </div>
    ),
    size,
  );
}
