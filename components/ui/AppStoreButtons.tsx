// components/ui/AppStoreButtons.tsx
// Store badges. While APP_STORES entries are null they render as a clearly
// disabled "Coming soon" badge — not a link, so no crawler or user ever hits a
// dead or fake listing. Paste real URLs into lib/site.ts to activate them.

import { APP_STORES } from "@/lib/site";

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
      <path fill="#34d399" d="M3.6 2.2 13.4 12l-9.8 9.8c-.4-.2-.6-.6-.6-1.1V3.3c0-.5.2-.9.6-1.1Z" />
      <path fill="#fbbf24" d="m16.8 15.4-3.4-3.4 3.4-3.4 3.8 2.2c1 .6 1 1.9 0 2.4l-3.8 2.2Z" />
      <path fill="#f87171" d="M13.4 12 3.6 21.8c.3.2.8.2 1.2 0l12-6.4-3.4-3.4Z" />
      <path fill="#60a5fa" d="M13.4 12 16.8 8.6l-12-6.4c-.4-.2-.9-.2-1.2 0L13.4 12Z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
      <path d="M16.4 12.6c0-2.4 2-3.6 2.1-3.7-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.8-1.6 0-3.1 1-4 2.4-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.2-.8 1.5 0 1.9.8 3.2.8 1.3 0 2.2-1.2 3-2.4.9-1.4 1.3-2.7 1.3-2.8 0 0-2.6-1-2.6-3.9ZM14 5.4c.7-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1 .1 2.1-.6 2.8-1.4Z" />
    </svg>
  );
}

function Badge({ href, label, store, icon }: { href: string | null; label: string; store: string; icon: React.ReactNode }) {
  const inner = (
    <>
      {icon}
      <span className="flex flex-col leading-tight">
        <span className="text-[10px] font-medium uppercase tracking-wide opacity-80">{href ? label : "Coming soon on"}</span>
        <span className="text-base font-bold">{store}</span>
      </span>
    </>
  );
  const base = "inline-flex min-w-[168px] items-center gap-3 rounded-xl border px-4 py-2.5 transition-colors";
  if (!href) {
    return (
      <span aria-disabled="true" className={`${base} cursor-not-allowed border-slate-300 bg-slate-100 text-slate-500`}>
        {inner}
      </span>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`${base} border-slate-900 bg-slate-900 text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2`}>
      {inner}
    </a>
  );
}

export default function AppStoreButtons({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      <Badge href={APP_STORES.playStore} label="Get it on" store="Google Play" icon={<PlayIcon />} />
      <Badge href={APP_STORES.appStore} label="Download on the" store="App Store" icon={<AppleIcon />} />
    </div>
  );
}
