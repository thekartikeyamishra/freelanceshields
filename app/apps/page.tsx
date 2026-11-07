// app/apps/page.tsx — every way to use FreelanceShield, in one place.
// Store links come from lib/site.ts and show "coming soon" until they are real.

import type { Metadata } from "next";
import Link from "next/link";
import { Smartphone, Chrome, FileText, MessageSquare, Bot, Sparkles, Terminal } from "lucide-react";
import { INTEGRATIONS } from "@/lib/site";
import AppStoreButtons from "@/components/ui/AppStoreButtons";
import CopyField from "@/components/ui/CopyField";

export const metadata: Metadata = {
  title: "Apps, extensions and AI assistant tools",
  description:
    "Use FreelanceShield as an installable app, a Chrome extension, a Google Docs add-on, or inside ChatGPT, Claude and Gemini. Free, no sign-up.",
  alternates: { canonical: "https://freelanceshield.me/apps" },
  openGraph: {
    title: "FreelanceShield apps and extensions",
    description: "Invoices, payment reminders and contract checks wherever you already work.",
    url: "https://freelanceshield.me/apps",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "FreelanceShield — free, private tools for freelancers" }],
  },
  twitter: { card: "summary_large_image", images: ["/opengraph-image"] },
};

function StoreLink({ href, label }: { href: string | null; label: string }) {
  if (!href) {
    return (
      <span className="inline-flex rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs font-bold text-slate-500">
        {label}: coming soon
      </span>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener" className="inline-flex rounded-lg bg-brand-700 px-3 py-2 text-xs font-bold text-white hover:bg-brand-800">
      {label}
    </a>
  );
}

const CARD = "rounded-2xl border border-slate-200 bg-white p-6";

export default function AppsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <h1 className="text-4xl font-black tracking-tight text-slate-900">Use it wherever you work</h1>
      <p className="mt-3 max-w-[62ch] text-lg text-slate-600">
        Same tools, same rules everywhere: free, no account, and nothing you type is stored by us.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <section className={CARD}>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><Smartphone size={20} aria-hidden="true" className="text-brand-700" /> App for phone and laptop</h2>
          <p className="mt-2 text-sm text-slate-600">
            Works offline and opens on your dashboard of who owes you money. On Android and desktop Chrome or Edge, use
            <strong> Install</strong> in the address bar or menu. On iPhone, open this site in Safari, tap Share, then
            <strong> Add to Home Screen</strong>.
          </p>
          <div className="mt-4"><AppStoreButtons /></div>
        </section>

        <section className={CARD}>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><Chrome size={20} aria-hidden="true" className="text-brand-700" /> Chrome and Edge extension</h2>
          <p className="mt-2 text-sm text-slate-600">
            Select contract text on any page, such as a proposal, an email or a job post, then right-click and choose
            <strong> Check this contract</strong>. The check runs inside the extension, and it reads a page only when you ask.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <StoreLink href={INTEGRATIONS.chromeWebStore} label="Chrome Web Store" />
            <StoreLink href={INTEGRATIONS.edgeAddons} label="Edge Add-ons" />
          </div>
        </section>

        <section className={CARD}>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><FileText size={20} aria-hidden="true" className="text-brand-700" /> Google Docs add-on</h2>
          <p className="mt-2 text-sm text-slate-600">
            Got the contract as a Google Doc? Go to <strong>Extensions → FreelanceShield → Check this contract</strong>. It can read only the
            document you have open.
          </p>
          <div className="mt-4"><StoreLink href={INTEGRATIONS.googleWorkspace} label="Workspace Marketplace" /></div>
        </section>

        <section className={CARD}>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><MessageSquare size={20} aria-hidden="true" className="text-brand-700" /> ChatGPT</h2>
          <p className="mt-2 text-sm text-slate-600">
            Ask for an invoice in plain words and get a link to a ready-to-download PDF. Draft a payment reminder or check a contract mid-conversation.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <StoreLink href={INTEGRATIONS.customGpt} label="Open the GPT" />
          </div>
          <p className="mt-3 text-xs text-slate-500">Or add it as an app: Settings → Apps &amp; Connectors → Create, then paste:</p>
          <CopyField value={INTEGRATIONS.mcpUrl} />
        </section>

        <section className={CARD}>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><Bot size={20} aria-hidden="true" className="text-brand-700" /> Claude</h2>
          <p className="mt-2 text-sm text-slate-600">Settings → Connectors → Add custom connector, then paste this URL. No sign-in is needed.</p>
          <CopyField value={INTEGRATIONS.mcpUrl} />
        </section>

        <section className={CARD}>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><Sparkles size={20} aria-hidden="true" className="text-brand-700" /> Gemini CLI</h2>
          <p className="mt-2 text-sm text-slate-600">Install the extension, then ask Gemini to make an invoice or check a contract.</p>
          {INTEGRATIONS.geminiExtensionRepo ? (
            <CopyField value={`gemini extensions install ${INTEGRATIONS.geminiExtensionRepo}`} />
          ) : (
            <div className="mt-4"><StoreLink href={null} label="Gemini extension" /></div>
          )}
        </section>
      </div>

      <section className={`${CARD} mt-6`}>
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><Terminal size={20} aria-hidden="true" className="text-brand-700" /> For developers and AI agents</h2>
        <p className="mt-2 text-sm text-slate-600">
          Free and open, with no key: an MCP server, a REST API and an OpenAPI spec. Every tool is deterministic and read-only, and inputs are
          processed in memory and never stored. Limited to 60 requests a minute per IP.
        </p>
        <ul className="mt-3 space-y-1 text-sm">
          <li><span className="font-semibold">MCP:</span> <code className="rounded bg-slate-100 px-1.5 py-0.5">{INTEGRATIONS.mcpUrl}</code></li>
          <li><span className="font-semibold">OpenAPI:</span> <Link className="text-brand-700 underline" href="/openapi.json">/openapi.json</Link></li>
          <li><span className="font-semibold">For LLMs:</span> <Link className="text-brand-700 underline" href="/llms.txt">/llms.txt</Link></li>
        </ul>
      </section>
    </div>
  );
}
