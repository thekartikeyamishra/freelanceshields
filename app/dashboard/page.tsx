// app/dashboard/page.tsx — the installed app's home screen.
// Personal and empty for crawlers, so it is noindexed and kept out of the sitemap.

import type { Metadata } from "next";
import Dashboard from "@/components/dashboard/Dashboard";

export const metadata: Metadata = {
  title: "Your dashboard",
  description: "See who owes you money, who to chase today, and send a polite reminder in one tap.",
  robots: { index: false, follow: true },
  alternates: { canonical: "https://freelanceshield.me/dashboard" },
};

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-black tracking-tight text-slate-900">Get paid</h1>
      <p className="mt-2 max-w-[60ch] text-slate-600">
        Every invoice you download is tracked here until you mark it paid. It&apos;s stored only on this device.
      </p>
      <div className="mt-8">
        <Dashboard />
      </div>
    </div>
  );
}
