// app/apple-icon.tsx — iOS home-screen icon. (Edge runtime removed: deprecated in Next 16.)
import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #38bdf8, #0c4a6e)" }}>
        <svg width="110" height="110" viewBox="0 0 24 24" fill="none">
          <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" fill="white" />
          <path d="M8.6 12.2l2.3 2.3 4.6-4.7" stroke="#0284c7" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    ),
    size,
  );
}
