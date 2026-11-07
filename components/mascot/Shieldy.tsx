"use client";

// components/mascot/Shieldy.tsx
//
// The on-site guide. Answers come only from the reviewed set in
// lib/assist/knowledge.ts: free, instant, offline, and incapable of making
// things up. There is no AI model and no network request — nothing typed here
// leaves the device.
//
// Placement and behaviour rules: bottom-left, never auto-opens, never covers
// content, no sound, dismissible (remembered), all motion off under
// prefers-reduced-motion, pointer tracking only on fine pointers.

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Send, CheckCircle2, Circle } from "lucide-react";
import type { Mood, MascotEventDetail } from "@/lib/mascot";
import { FALLBACK, matchAnswer, type Answer, type Lang } from "@/lib/assist/knowledge";
import { invoiceWalkthrough, planWalkthrough, progress, type Walkthrough } from "@/lib/assist/steps";


/* ------------------------------------------------------------------ */
/* Faces — 20 expressions mapped from the smiley-emoji families.       */
/* ------------------------------------------------------------------ */

type EyeKind = "open" | "closed" | "wink" | "wide" | "heart" | "shades" | "happy" | "star" | "spiral" | "glasses" | "down";

interface Face {
  eye: EyeKind;
  mouth: string;
  brow?: "up" | "down" | "worried" | "tilt";
  blush?: boolean;
  extra?: "tear" | "sweat" | "zzz" | "bubble" | "confetti" | "sparkle";
}

const FACES: Record<Mood, Face> = {
  neutral:    { eye: "open",    mouth: "M24 42 Q32 45 40 42" },                                   // 🙂
  happy:      { eye: "happy",   mouth: "M22 40 Q32 50 42 40", blush: true },                      // 😊
  grin:       { eye: "open",    mouth: "M21 39 Q32 53 43 39 Z" },                                 // 😃
  laugh:      { eye: "happy",   mouth: "M20 38 Q32 56 44 38 Z", brow: "up" },                     // 😆
  wink:       { eye: "wink",    mouth: "M23 41 Q32 48 41 41", blush: true },                      // 😉
  thinking:   { eye: "open",    mouth: "M26 44 L38 42", brow: "tilt", extra: "bubble" },          // 🤔
  surprised:  { eye: "wide",    mouth: "M28 43 a4 5 0 1 0 8 0 a4 5 0 1 0 -8 0", brow: "up" },     // 😮
  worried:    { eye: "open",    mouth: "M24 46 Q32 40 40 46", brow: "worried" },                  // 😟
  sad:        { eye: "down",    mouth: "M24 47 Q32 40 40 47", brow: "worried", extra: "tear" },   // 😢
  celebrate:  { eye: "happy",   mouth: "M20 38 Q32 55 44 38 Z", blush: true, brow: "up", extra: "confetti" }, // 🥳
  starstruck: { eye: "star",    mouth: "M21 39 Q32 53 43 39 Z", extra: "sparkle" },               // 🤩
  sleepy:     { eye: "closed",  mouth: "M28 44 Q32 46 36 44", extra: "zzz" },                     // 😴
  love:       { eye: "heart",   mouth: "M23 40 Q32 49 41 40", blush: true },                      // 😍
  cool:       { eye: "shades",  mouth: "M24 42 Q34 46 41 40" },                                   // 😎
  confused:   { eye: "open",    mouth: "M24 44 Q28 41 32 44 Q36 47 40 44", brow: "tilt" },        // 😕
  nerd:       { eye: "glasses", mouth: "M24 41 Q32 47 40 41" },                                   // 🤓
  shy:        { eye: "down",    mouth: "M27 43 Q32 46 37 43", blush: true },                      // ☺️
  relieved:   { eye: "closed",  mouth: "M23 41 Q32 48 41 41", blush: true },                      // 😌
  sweat:      { eye: "happy",   mouth: "M22 40 Q32 49 42 40", extra: "sweat" },                   // 😅
  dizzy:      { eye: "spiral",  mouth: "M26 45 Q32 41 38 45" },                                   // 😵‍💫
};

const ROUTE_TIP: Record<string, { en: string; hi: string; mood: Mood }> = {
  "/invoice-maker": { en: "Tip: set a due date — it makes a late invoice unambiguous.", hi: "सुझाव: ड्यू डेट ज़रूर डालें।", mood: "nerd" },
  "/contract-scanner": { en: "Tip: paste the whole agreement, not one clause.", hi: "सुझाव: पूरा अनुबंध पेस्ट करें।", mood: "thinking" },
  "/project-planner": { en: "Tip: every deliverable needs a “done when”.", hi: "सुझाव: हर काम का “कब पूरा” लिखें।", mood: "nerd" },
};

const HIDDEN_KEY = "fs:mascot-hidden";
const LANG_KEY = "fs:mascot-lang";

function read(key: string): string | null {
  try { return window.localStorage.getItem(key); } catch { return null; }
}
function write(key: string, v: string | null) {
  try { if (v === null) window.localStorage.removeItem(key); else window.localStorage.setItem(key, v); } catch { /* storage unavailable */ }
}

function walkthroughFor(path: string): Walkthrough | null {
  if (path.startsWith("/invoice-maker")) return invoiceWalkthrough(read("fs:invoice-draft-v2"));
  if (path.startsWith("/project-planner")) return planWalkthrough(read("fs:project-plan-v1"));
  return null;
}

/** The most-progressed unfinished piece of work on this device, for a return nudge. */
function findUnfinished(): Walkthrough | null {
  const candidates = [planWalkthrough(read("fs:project-plan-v1")), invoiceWalkthrough(read("fs:invoice-draft-v2"))];
  const started = candidates.filter((w) => progress(w) > 0 && progress(w) < 1);
  return started.sort((a, b) => progress(b) - progress(a))[0] ?? null;
}

/* ------------------------------------------------------------------ */

function Eyes({ face, look }: { face: Face; look: { x: number; y: number } }) {
  const px = look.x * 2.2;
  const py = look.y * 1.8;
  const ink = "#0c4a6e";
  const one = (cx: number, right: boolean) => {
    switch (face.eye) {
      case "closed": return <path d={`M${cx - 4} 28 Q${cx} 31 ${cx + 4} 28`} stroke={ink} strokeWidth="2.2" fill="none" strokeLinecap="round" />;
      case "happy": return <path d={`M${cx - 4} 29 Q${cx} 24 ${cx + 4} 29`} stroke={ink} strokeWidth="2.4" fill="none" strokeLinecap="round" />;
      case "down": return <g><ellipse cx={cx} cy={29} rx="3.6" ry="3.8" fill="#fff" /><circle cx={cx} cy={30.5} r="2" fill={ink} /></g>;
      case "wink": return right
        ? <path d={`M${cx - 4} 28 Q${cx} 31 ${cx + 4} 28`} stroke={ink} strokeWidth="2.2" fill="none" strokeLinecap="round" />
        : <g><ellipse cx={cx} cy={28} rx="4" ry="4.6" fill="#fff" /><circle cx={cx + px} cy={28 + py} r="2.2" fill={ink} /></g>;
      case "heart": return <path d={`M${cx} 31.5 l-3.6 -3.6 a2.2 2.2 0 0 1 3.6 -2.6 a2.2 2.2 0 0 1 3.6 2.6 z`} fill="#e11d48" />;
      case "star": return <path d={`M${cx} 23.5 l1.4 3 3.2 .4 -2.4 2.2 .6 3.2 -2.8 -1.6 -2.8 1.6 .6 -3.2 -2.4 -2.2 3.2 -.4z`} fill="#facc15" stroke="#ca8a04" strokeWidth=".5" />;
      case "spiral": return <path d={`M${cx} 28 m-.5 0 a.8 .8 0 1 1 1.6 0 a1.8 1.8 0 1 1 -3.6 0 a2.8 2.8 0 1 1 5.6 0 a3.8 3.8 0 1 1 -7.6 0`} stroke={ink} strokeWidth="1.2" fill="none" />;
      case "wide": return <g><ellipse cx={cx} cy={28} rx="5" ry="5.8" fill="#fff" /><circle cx={cx + px} cy={28 + py} r="2" fill={ink} /></g>;
      case "shades": return null;
      default: return <g><ellipse cx={cx} cy={28} rx="4" ry="4.6" fill="#fff" /><circle cx={cx + px} cy={28 + py} r="2.2" fill={ink} /><circle cx={cx + px + 0.8} cy={27 + py} r="0.7" fill="#fff" /></g>;
    }
  };
  return (
    <g>
      {face.eye === "glasses"
        ? <g>{[24, 40].map((cx) => <g key={cx}><ellipse cx={cx} cy={28} rx="4" ry="4.6" fill="#fff" /><circle cx={cx + px} cy={28 + py} r="2.2" fill={ink} /></g>)}<g stroke={ink} strokeWidth="1.6" fill="none"><circle cx="24" cy="28" r="6" /><circle cx="40" cy="28" r="6" /><path d="M30 28 h4" /></g></g>
        : <>{one(24, false)}{one(40, true)}</>}
      {face.eye === "shades" && <path d="M17 25 h14 v5 a3 3 0 0 1 -3 3 h-8 a3 3 0 0 1 -3 -3 z M33 25 h14 v5 a3 3 0 0 1 -3 3 h-8 a3 3 0 0 1 -3 -3 z M31 26 h2" fill="#0f172a" stroke="#0f172a" strokeWidth="1" />}
    </g>
  );
}

function Brows({ kind }: { kind?: Face["brow"] }) {
  if (!kind) return null;
  const s = { stroke: "#0c4a6e", strokeWidth: 2, strokeLinecap: "round" as const, fill: "none" };
  if (kind === "up") return <g {...s}><path d="M19 19 Q24 16 29 19" /><path d="M35 19 Q40 16 45 19" /></g>;
  if (kind === "worried") return <g {...s}><path d="M19 21 L29 18" /><path d="M35 18 L45 21" /></g>;
  if (kind === "down") return <g {...s}><path d="M19 18 L29 21" /><path d="M35 21 L45 18" /></g>;
  return <g {...s}><path d="M19 20 L29 20" /><path d="M35 18 Q40 16 45 19" /></g>;
}

function Extra({ kind }: { kind?: Face["extra"] }) {
  switch (kind) {
    case "tear": return <path d="M44 33 q2 4 0 6 q-2 -2 0 -6z" fill="#60a5fa" />;
    case "sweat": return <path d="M48 18 q3 5 0 7 q-3 -2 0 -7z" fill="#93c5fd" />;
    case "zzz": return <text x="46" y="16" fontSize="9" fontWeight="700" fill="#0c4a6e">z</text>;
    case "bubble": return <g fill="#fff" stroke="#0c4a6e" strokeWidth="0.8"><circle cx="52" cy="10" r="3" /><circle cx="49" cy="15" r="1.4" /></g>;
    case "confetti": return <g><circle cx="8" cy="10" r="1.6" fill="#facc15" /><circle cx="56" cy="6" r="1.6" fill="#f472b6" /><rect x="57" y="20" width="2.4" height="2.4" fill="#34d399" transform="rotate(20 58 21)" /><rect x="5" y="22" width="2.4" height="2.4" fill="#60a5fa" transform="rotate(-20 6 23)" /></g>;
    case "sparkle": return <g fill="#facc15"><path d="M8 8 l1 3 3 1 -3 1 -1 3 -1 -3 -3 -1 3 -1z" /><path d="M55 14 l.8 2 2 .8 -2 .8 -.8 2 -.8 -2 -2 -.8 2 -.8z" /></g>;
    default: return null;
  }
}

/* ------------------------------------------------------------------ */

interface Reply { text: string; href?: string; cta?: string; source: "kb" | "fallback" }

export default function Shieldy() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [hidden, setHidden] = useState(true);
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<Lang>("en");
  const [mood, setMood] = useState<Mood>("neutral");
  const [bubble, setBubble] = useState<string | null>(null);
  const [look, setLook] = useState({ x: 0, y: 0 });
  const [blink, setBlink] = useState(false);
  const [query, setQuery] = useState("");
  const [reply, setReply] = useState<Reply | null>(null);
  const [walk, setWalk] = useState<Walkthrough | null>(null);
  const [unfinished, setUnfinished] = useState<Walkthrough | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const idleRef = useRef<number | undefined>(undefined);
  const moodTimer = useRef<number | undefined>(undefined);
  const pokes = useRef<number[]>([]);

  const t = useCallback((en: string, hi: string) => (lang === "hi" ? hi : en), [lang]);

  const react = useCallback((m: Mood, message?: string, ms = 3500) => {
    setMood(m);
    if (message) setBubble(message);
    window.clearTimeout(moodTimer.current);
    moodTimer.current = window.setTimeout(() => { setMood("neutral"); setBubble(null); }, ms);
  }, []);

  const refreshProgress = useCallback(() => {
    setWalk(walkthroughFor(pathname));
    setUnfinished(findUnfinished());
  }, [pathname]);

  useEffect(() => {
    setMounted(true);
    setHidden(read(HIDDEN_KEY) === "1");
    const l = read(LANG_KEY);
    if (l === "hi" || l === "en") setLang(l);
    else if (navigator.language?.toLowerCase().startsWith("hi")) setLang("hi");
  }, []);

  useEffect(() => {
    if (!mounted) return;
    refreshProgress();
    setReply(null);
  }, [pathname, mounted, refreshProgress]);

  // Re-check progress whenever a tool saves its draft.
  useEffect(() => {
    if (!mounted) return;
    let t = 0;
    const onStore = () => { window.clearTimeout(t); t = window.setTimeout(refreshProgress, 400); };
    window.addEventListener("fs:local-storage", onStore);
    window.addEventListener("storage", onStore);
    return () => { window.removeEventListener("fs:local-storage", onStore); window.removeEventListener("storage", onStore); window.clearTimeout(t); };
  }, [mounted, refreshProgress]);

  // Eyes follow the pointer — fine pointers only, one update per frame.
  useEffect(() => {
    if (hidden || !mounted) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    let frame = 0;
    const onMove = (e: PointerEvent) => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const r = rootRef.current?.getBoundingClientRect();
        if (!r) return;
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.bottom - 32);
        const d = Math.max(1, Math.hypot(dx, dy));
        setLook({ x: dx / d, y: dy / d });
        setMood((m) => (m === "sleepy" ? "neutral" : m));
        window.clearTimeout(idleRef.current);
        idleRef.current = window.setTimeout(() => setMood("sleepy"), 60_000);
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => { window.removeEventListener("pointermove", onMove); window.cancelAnimationFrame(frame); };
  }, [hidden, mounted]);

  useEffect(() => {
    if (hidden || !mounted) return;
    const id = window.setInterval(() => { setBlink(true); window.setTimeout(() => setBlink(false), 140); }, 4200);
    return () => window.clearInterval(id);
  }, [hidden, mounted]);

  useEffect(() => {
    const onEvent = (e: Event) => {
      const d = (e as CustomEvent<MascotEventDetail>).detail;
      if (d) react(d.mood, d.message, 4500);
    };
    window.addEventListener("fs:mascot", onEvent);
    return () => window.removeEventListener("fs:mascot", onEvent);
  }, [react]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const face = useMemo(() => {
    const f = FACES[mood];
    return blink && (f.eye === "open" || f.eye === "wide" || f.eye === "glasses") ? { ...f, eye: "closed" as const } : f;
  }, [mood, blink]);


  if (!mounted) return null;
  if (hidden) {
    return (
      <button
        type="button"
        onClick={() => { write(HIDDEN_KEY, null); setHidden(false); react("starstruck", t("Hello again!", "फिर से नमस्ते!")); }}
        className="no-print fixed bottom-3 left-3 z-40 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-50"
      >
        {t("Show guide", "गाइड दिखाएँ")}
      </button>
    );
  }

  const tip = ROUTE_TIP[pathname];

  const ask = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim().slice(0, 300);
    if (!q) return;
    setQuery("");
    const a: Answer | null = matchAnswer(q);
    if (a) {
      setReply({ text: a[lang], href: a.href, cta: a.cta?.[lang], source: "kb" });
      react("happy");
      return;
    }
    setReply({ text: FALLBACK[lang], source: "fallback" });
    react("confused");
  };

  // Rapid clicks get a playful escalation: wink → laugh → dizzy.
  const onPoke = () => {
    const now = Date.now();
    pokes.current = [...pokes.current.filter((p) => now - p < 1500), now];
    const n = pokes.current.length;
    if (n >= 5) { react("dizzy", t("Whoa, I'm dizzy!", "अरे, चक्कर आ गया!")); pokes.current = []; return; }
    if (n >= 3) { react("laugh", t("That tickles!", "गुदगुदी होती है!")); return; }
    setOpen((o) => !o);
    react(open ? "wink" : "happy");
  };

  return (
    <div ref={rootRef} className="no-print fixed bottom-4 left-4 z-40 flex flex-col items-start gap-2" style={{ marginBottom: "env(safe-area-inset-bottom)" }}>
      {open && (
        <div role="dialog" aria-modal="false" aria-labelledby="shieldy-title" className="max-h-[min(34rem,calc(100vh-7rem))] w-[min(21rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
          <div className="flex items-center justify-between gap-2">
            <h2 id="shieldy-title" className="text-sm font-bold text-slate-900">{t("Hi, I'm Shieldy", "नमस्ते, मैं शील्डी")}</h2>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => { const n: Lang = lang === "en" ? "hi" : "en"; setLang(n); write(LANG_KEY, n); }} className="rounded-md border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50">
                {lang === "en" ? "हिंदी" : "English"}
              </button>
              <button type="button" onClick={() => setOpen(false)} className="rounded p-1 text-slate-400 hover:text-slate-700"><X size={16} aria-hidden="true" /><span className="sr-only">{t("Close", "बंद करें")}</span></button>
            </div>
          </div>

          {/* Progress on the current tool, computed from the real draft. */}
          {walk && (
            <div className="mt-3 rounded-xl border border-slate-200 p-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>{t(walk.title.en, walk.title.hi)}</span>
                <span>{walk.steps.filter((s) => s.done).length}/{walk.steps.length}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-emerald-500 transition-[width] duration-500" style={{ width: `${Math.round(progress(walk) * 100)}%` }} />
              </div>
              <ol className="mt-2 space-y-1">
                {walk.steps.map((s) => (
                  <li key={s.en} className={`flex items-center gap-2 text-xs ${s.done ? "text-slate-400 line-through" : "text-slate-700"}`}>
                    {s.done ? <CheckCircle2 size={13} className="text-emerald-500" aria-hidden="true" /> : <Circle size={13} className="text-slate-300" aria-hidden="true" />}
                    {t(s.en, s.hi)}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {!walk && unfinished && (
            <Link href={unfinished.href} onClick={() => setOpen(false)} className="mt-3 block rounded-xl border border-brand-200 bg-brand-50 p-3 text-xs font-medium text-brand-800 hover:bg-brand-100">
              {t(`Your “${unfinished.title.en}” is ${Math.round(progress(unfinished) * 100)}% done.`, `आपका “${unfinished.title.hi}” ${Math.round(progress(unfinished) * 100)}% पूरा है।`)}{" "}
              <span className="font-bold underline">{t("Continue", "जारी रखें")}</span>
            </Link>
          )}

          {reply ? (
            <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-700" aria-live="polite">
              {reply.text}
              {reply.href && reply.cta && <Link href={reply.href} onClick={() => setOpen(false)} className="mt-2 block font-bold text-brand-700 underline underline-offset-2">{reply.cta}</Link>}
            </div>
          ) : (
            <p className="mt-3 text-xs leading-relaxed text-slate-600">
              {tip ? t(tip.en, tip.hi) : t("Ask me about invoices, contracts, project planning, rates or late payment.", "इनवॉइस, कॉन्ट्रैक्ट, प्रोजेक्ट, रेट या देर से भुगतान के बारे में पूछें।")}
            </p>
          )}

          <form onSubmit={ask} className="mt-3 flex gap-2">
            <label htmlFor="shieldy-q" className="sr-only">{t("Your question", "आपका सवाल")}</label>
            <input id="shieldy-q" value={query} maxLength={300} onChange={(e) => setQuery(e.target.value)} onFocus={() => setMood("thinking")} onBlur={() => setMood("neutral")} placeholder={t("Type a question…", "सवाल लिखें…")} className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2.5 py-2 text-xs outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/30" />
            <button type="submit" className="rounded-lg bg-brand-700 px-2.5 text-white hover:bg-brand-800">
              <Send size={14} aria-hidden="true" />
              <span className="sr-only">{t("Ask", "पूछें")}</span>
            </button>
          </form>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {[
              { href: "/invoice-maker", en: "Invoice", hi: "इनवॉइस" },
              { href: "/contract-scanner", en: "Contract", hi: "कॉन्ट्रैक्ट" },
              { href: "/project-planner", en: "Project plan", hi: "प्रोजेक्ट" },
              { href: "/contact", en: "Talk to a human", hi: "इंसान से बात" },
            ].map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:border-brand-300 hover:bg-brand-50">{t(l.en, l.hi)}</Link>
            ))}
          </div>

          <p className="mt-3 border-t border-slate-100 pt-2 text-[10px] leading-snug text-slate-400">
            {t("Pre-written answers, not an AI model. Nothing you type leaves your device.", "पहले से लिखे जवाब, AI मॉडल नहीं। आपका लिखा कहीं नहीं जाता।")}{" "}
            <button type="button" onClick={() => { write(HIDDEN_KEY, "1"); setOpen(false); setHidden(true); }} className="underline">{t("Hide guide", "गाइड छिपाएँ")}</button>
          </p>
        </div>
      )}

      {bubble && !open && (
        <p role="status" className="max-w-[16rem] rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-lg">{bubble}</p>
      )}

      <button
        type="button"
        aria-expanded={open}
        aria-label={open ? t("Close guide", "गाइड बंद करें") : t("Open guide", "गाइड खोलें")}
        onClick={onPoke}
        onMouseEnter={() => { if (mood === "neutral") setMood(tip?.mood ?? "happy"); }}
        onMouseLeave={() => { if (mood !== "neutral" && !bubble) setMood("neutral"); }}
        onDoubleClick={() => react("love", t("Thanks for the love!", "शुक्रिया!"))}
        className="group relative h-14 w-14 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 sm:h-16 sm:w-16"
      >
        <span className="absolute inset-0 animate-[shieldy-float_4s_ease-in-out_infinite] motion-reduce:animate-none">
          <svg
            viewBox="0 0 64 64"
            aria-hidden="true"
            className={`h-full w-full drop-shadow-lg transition-transform duration-200 group-active:scale-90 ${
              mood === "celebrate" || mood === "laugh" || mood === "starstruck" ? "animate-[shieldy-hop_0.6s_ease-out_2] motion-reduce:animate-none" : ""
            } ${mood === "dizzy" ? "animate-[shieldy-spin_0.8s_ease-in-out_1] motion-reduce:animate-none" : ""}`}
          >
            <path d="M32 4 L54 12 V30 C54 45 44 55 32 60 C20 55 10 45 10 30 V12 Z" fill="#0284c7" />
            <path d="M32 7.5 L51 14.5 V30 C51 43 42.5 52 32 56.5 C21.5 52 13 43 13 30 V14.5 Z" fill="#38bdf8" />
            <Brows kind={face.brow} />
            <Eyes face={face} look={look} />
            {face.blush && <g fill="#f472b6" opacity="0.55"><ellipse cx="18" cy="37" rx="3.4" ry="2" /><ellipse cx="46" cy="37" rx="3.4" ry="2" /></g>}
            <path d={face.mouth} stroke="#0c4a6e" strokeWidth="2.4" fill={face.mouth.endsWith("Z") ? "#0c4a6e" : "none"} strokeLinecap="round" strokeLinejoin="round" />
            <Extra kind={face.extra} />
          </svg>
        </span>
        {(unfinished || (walk && progress(walk) < 1 && progress(walk) > 0)) && !open && (
          <span className="absolute right-0.5 top-0.5 h-3 w-3 rounded-full border-2 border-white bg-amber-400" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
