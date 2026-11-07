// components/payments/PaymentLinks.tsx
//
// NOT RENDERED ANYWHERE YET. Kept ready for when a paid product exists.
// Returns null while PAYMENTS.enabled is false, so importing it is harmless.
//
// To enable:
//   1. Set PAYMENTS.enabled = true and the link(s) in lib/site.ts.
//   2. Create /pricing and render <PaymentLinks /> there — only there.
//   3. Add rzp.io / razorpay.com / squarespace domains to CSP if embedding.

import Link from "next/link";
import { PAYMENTS } from "@/lib/site";

export default function PaymentLinks() {
  if (!PAYMENTS.enabled) return null;

  return (
    <div className="space-y-3">
      {PAYMENTS.razorpayLink && (
        <a href={PAYMENTS.razorpayLink} target="_blank" rel="noopener noreferrer" className="block rounded-xl bg-brand-700 px-6 py-3 text-center font-bold text-white hover:bg-brand-800">
          Pay in INR (UPI, cards, netbanking) — Razorpay
        </a>
      )}
      {/* PayPal via Squarespace — uncomment when the link is live.
      {PAYMENTS.paypalLink && (
        <a href={PAYMENTS.paypalLink} target="_blank" rel="noopener noreferrer" className="block rounded-xl border border-slate-300 px-6 py-3 text-center font-bold text-slate-800 hover:bg-slate-50">
          Pay internationally — PayPal
        </a>
      )}
      */}
      <p className="text-xs text-slate-500">
        Payments are processed by the provider; card and bank details never reach this site.
        See the <Link href="/legal/refunds" className="underline">refund policy</Link>.
      </p>
    </div>
  );
}
