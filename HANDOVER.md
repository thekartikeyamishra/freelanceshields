# FreelanceShield — code handover (batch 4, supersedes 1–3)

48 files. Typecheck clean under `strict: true`. Logic tested: **24 assertions,
0 failures**. CSS build verified against Tailwind v4.3.3. Audit script tested
against fixtures modelled on your live slugs.

---

## 0. What batch 4 adds

Everything you have uploaded was already covered. This batch builds the three
things that were on the "still outstanding" list and blocked on nothing but me,
plus the tooling for the one thing that is genuinely yours to do.

### `/methodology` now exists

Three files linked to it and it 404'd: `HeuristicNotice`, `SiteFooter`, and the
About page. It publishes the complete list of clause types the scanner checks
for, the six protections it checks for the absence of, why there is no score,
and what it cannot do. Publishing the whole check list is a better trust signal
than any badge, because a reader can judge the coverage and see what is missing.

### Consent Mode v2, so EEA/UK monetisation is unblocked

`components/consent/ConsentBanner.tsx` plus a `beforeInteractive` default in the
layout. Defaults are **denied**, so Google serves non-personalised ads until a
visitor chooses otherwise. Accept flips to personalised; decline keeps
non-personalised. The site keeps earning either way.

**Read this carefully:** this is *not* a certified TCF CMP, and Google requires
one to serve *personalised* ads in the EEA, UK and Switzerland. What this gives
you is a legitimate compliant position today — non-personalised by default
everywhere — so you can keep AdSense enabled while you evaluate a certified CMP,
rather than choosing between running non-compliant and switching ads off. That
is a supported configuration, not a workaround. Deciding whether to buy a
certified CMP is still yours.

Both buttons are equally prominent by design. A styled Accept beside a greyed
Decline is a dark pattern and invalidates the consent it collects.

### A real service worker, so the offline claim becomes true

`public/sw.js` and `ServiceWorkerRegistrar.tsx`. Until now the manifest declared
standalone display, `InstallPrompt` promised offline use, `/offline` existed and
the homepage claimed it — with nothing behind any of it.

Navigations are network-first (so guides are never stale), `_next/static` is
cache-first (content-hashed, so a cached copy is never wrong), and the two tool
routes are precached. **Ads and all cross-origin requests are never
intercepted** — caching ad responses would inflate impressions against cached
creatives, which is a policy problem.

### `scripts/audit-content.mjs` — your pruning worklist

```bash
node scripts/audit-content.mjs
node scripts/audit-content.mjs --csv > content-audit.csv
```

Reports every article missing required frontmatter, word counts, publication-date
concentration, and likely cannibalisation clusters. Tested against fixtures built
from your real slugs — it correctly grouped the four
`how-to-write-freelance-<profession>-invoice` pages, flagged the bulk 2026-05-02
date, and passed the one well-formed article.

**Honest limitation:** clustering works on slug tokens, so it catches groups that
share vocabulary but misses groups that say the same thing in different words.
Your local-first cluster (`local-first-vs-cloud-software-freelance`,
`why-open-source-invoicing-is-better`, `zero-knowledge-architecture-legal-docs`,
`secure-offline-invoice-generator` and the rest) shares almost no tokens and will
not be grouped. Reading the `--csv` titles is still worth an hour.

### `content/_TEMPLATE.md` and `content/CONTENT_STANDARD.md`

The frontmatter template and the keep-or-kill checklist.

---

## 0b. Why I did not rewrite your tax article

`CONTENT_STANDARD.md` lists the specific errors I verified on the India
presumptive-tax page: the missing 95%-digital-receipts condition on the ₹75 lakh
limit, "50% of total income" where it should be gross receipts, the omitted
Section 44AA(1) specified-professions restriction (which likely excludes a large
part of your own audience), the single-instalment advance tax rule, and the
₹10 lakh special-category GST threshold.

I did not write the replacement. Sources actively disagree on one point —
whether HUFs are eligible under 44ADA — with some citing the Income Tax
Department's own page as listing only individuals and partnership firms. That
needs resolving against the primary source, not against a search result.

More to the point: publishing tax guidance under your name that I assembled from
search results is the exact failure mode your original brief warned about. It is
your byline and your exposure. The corrections above are checkable facts; the
writing should be yours.

---

## 1. Your entire article styling has been dead

`postcss.config.mjs` uses `@tailwindcss/postcss` and `globals.css` opens with
`@import "tailwindcss"`. That is **Tailwind v4**, and v4 does not auto-load
`tailwind.config.ts`. Config files must be pulled in explicitly with `@config`,
and plugins with `@plugin`. Neither directive was present.

I compiled your exact setup to confirm rather than assume:

```
=== Your current config ===
.prose rules generated:                    0
text-brand-600 (declared in @theme):       present
text-brand-700 (declared in config only):  ABSENT
bg-brand-300  (declared in config only):   ABSENT
compiled CSS: 8 KB

=== With @plugin + full @theme scale ===
.prose rules generated:                    9
text-brand-700:                            present
bg-brand-300:                              present
compiled CSS: 24 KB
```

So:

- **`@tailwindcss/typography` was never loaded.** Every `prose` class on the site
  is a no-op. All ~110 articles have been rendering with browser-default markdown
  styling — no paragraph spacing, no heading scale, no link colour, no list
  indentation. Same on the privacy and terms pages.
- **`tailwind.config.ts` is entirely dead code.** Every colour in it is unused.
  The `@theme` block in `globals.css` is what actually defines your palette, and
  it declared only brand 50/100/500/600/900. Components referenced 200, 300, 400,
  700 and 800, which produced nothing.
- `animate-spin-slow`, defined only in the config, never existed.

Fixed: `@plugin "@tailwindcss/typography";` added to `globals.css`, full brand
scale declared in `@theme`. Verified compiling: 9 `.prose` rules, brand-700 and
brand-300 present. **Delete `tailwind.config.ts`.**

---

## 2. remark-gfm was installed but never passed to the renderer

`remark-gfm` sits in your dependencies. `<ReactMarkdown>` was called without it.
GitHub-flavoured markdown was therefore not parsed in any article: **tables,
strikethrough, task lists and autolinks all rendered as literal characters.** A
tax guide comparing thresholds across countries would have shown raw pipes.
Now wired up.

---

## 3. next.config.ts

| Issue | Detail |
|---|---|
| `images.remotePatterns: hostname: '**'` | Turns `/_next/image` into an **open image proxy for the whole internet**. Anyone can call `/_next/image?url=https://any-host/file` and make your Vercel account fetch, transform and cache it — a bandwidth and cost vector, and a way to serve third-party images off your domain. Now restricted. |
| `removeConsole` in production | Stripped **all** console calls including `console.error`. `app/error.tsx` and `AdSlot` both log there, so production diagnostics vanished silently. Now excludes `error` and `warn`. |
| `'unsafe-eval'` in `script-src` | Needed by the Next dev overlay, not by production. Now dev-only. |
| Missing `base-uri` | Without it an injected `<base>` tag redirects every relative URL on the page. Added, along with `object-src 'none'`, `form-action` and `frame-ancestors`. |
| `X-XSS-Protection: 1; mode=block` | Deprecated, and the filter has itself been a vulnerability source. Set to `0`; CSP does this job. |
| No HSTS | Added at two years with subdomains. `preload` deliberately omitted — it is effectively irreversible. |
| No Permissions-Policy | Added. |
| CSP listed only `ep1.adtrafficquality.google` | AdSense also contacts `ep2`. Those calls were being blocked, which is where your console errors came from. |
| `ads.txt` content type | Now pinned to `text/plain`. Google's crawler can reject it otherwise. |

---

## 4. package.json and vercel.json

`vercel.json` forces `npm install --legacy-peer-deps`. The cause is
`lucide-react@^0.300.0`, which declares peer support for React 16–18 while you
are on React 19. That flag suppresses the error rather than fixing it — and it
suppresses every future conflict too, including real ones.

Upgraded lucide to `^0.469.0`, which supports React 19. Try deleting
`vercel.json` afterwards.

Removed as unused in every file you have sent: `html2canvas`, `framer-motion`
(~110 KB gzipped for an accordion animation now handled by `<details>`),
`canvas-confetti`, `@types/canvas-confetti`, `react-hook-form`, `clsx`,
`tailwind-merge`. Grep before deleting, in case one is used in a file I have not
seen. Details in `DEPENDENCY_NOTES.md`.

Also delete `global.d.ts` — `declare module "*.css"` is unnecessary in Next and
suppresses type errors rather than adding types.

`tsconfig.json` is fine as-is. One optional improvement: `target: "ES2017"`
downlevels optional chaining and nullish coalescing into helper code. `ES2020`
would emit them natively and shave a little bundle size. Not worth a rebuild on
its own.

---

## 5. Claims removed because the code does not support them

| Claim | Where | Reality |
|---|---|---|
| "AES — Encryption Standard" | `/about` values grid | No encryption anywhere. localStorage is plain JSON. |
| "100% — Open Source" | `/about` values grid | No public repo; the GitHub URL 404s. |
| "cutting-edge WebAssembly and WebLLM… powerful analysis engines" | `/about` | Neither is used. The scanner is regex in a `.ts` file. |
| "0ms — Server Latency" | `/about` | Not a real figure. |
| "AI Contract Scanner" | homepage | The scanner's own page says "heuristics engine". |
| "uses automated heuristics **and AI**" | terms | Same. |
| "engineered by professionals who have navigated…" | homepage | One person. Contradicted by your own `/resources/why-freelance-shield-is-free`. |
| "Written by verified engineers" | `/resources` meta description | Served as the search snippet for the whole knowledge base. |
| "E-E-A-T Verified AI Engineer" + blue tick | article byline | Not a credential any body awards. |
| "we'll sync any updates automatically" | `/offline` | There is no sync, no account, no server. |
| "Initializing secure local environment… verifying_local_storage" | `/loading` | Invented technical vocabulary. Nothing was being verified. |
| "The error has been logged locally" | `/error` | It was a `console.error`. |
| "audit-proof invoices" | manifest | No invoice formatter can promise a tax outcome. |

These weren't hedged, they were replaced with narrower statements that are true.
The real claim — the tools genuinely do run in the browser and genuinely do not
transmit your data — is strong on its own and survives scrutiny.

---

## 6. Other defects fixed in batch 2

- **`error.tsx` printed `error.message` to the user.** React error messages can
  contain internal paths and values from the failing render — on the invoice
  route, potentially invoice field contents. Now shows `error.digest` only.
- **`dangerouslySetInnerHTML` in the scanner results**, injecting
  `'<strong className="...">'`. `className` is not a valid HTML attribute, so the
  styling never applied; and the pattern becomes an XSS hole the moment any of
  that text comes from user input. Now structured data rendered as React.
- **Scanner ad placement.** A slot labelled "Freelance Tools" sat directly
  between the Analyze button and the results panel, so pressing Analyze scrolled
  the user into an ad on the way to their answer. Removed.
- **Resources page ad** was the first element under the header, above any
  article. Removed.
- **Article template had three ad slots** on ~250-word bodies, one of them
  between the byline and the first paragraph. Now one slot, after the article,
  and it does not render at all on articles under 700 words.
- **`globals.css` defined only brand-50/100/500/600/900** while components
  referenced brand-200/300/400/700/800. Those classes silently produced no
  colour. Full scale added.
- **No `prefers-reduced-motion` handling** anywhere, despite `fade-in-up` on
  nearly every section, `pulse-slow`, `float` and `animate-bounce`. Global rule
  added.
- **Print styles were dead.** `.no-print` was defined but never used; printing
  the invoice page printed the whole app. Now hides header, footer, nav and ads.
- **Manifest referenced four image files** (`shortcut-invoice.png`,
  `shortcut-scan.png`, two screenshots) whose existence I cannot verify. Missing
  screenshots can suppress the rich install UI entirely. Shortcut icons removed;
  screenshots commented out pending your confirmation. Icon `purpose` values also
  corrected — 192 was maskable-only and 512 was any-only, which crops on one
  platform and letterboxes on the other.
- **`metadataBase` was absent**, so relative OG and canonical URLs could not
  resolve absolutely.
- **`suppressHydrationWarning` on both `<html>` and `<body>`** was silencing real
  hydration bugs. Kept on `<html>` only.
- **`<Suspense>` on the resources page never did anything** — `getAllResources()`
  is synchronous build-time filesystem work, so the skeleton never rendered.

---

## 7. Delete these files

| File | Why |
|---|---|
| `components/ads/StrategicAdSlot.tsx` | Replaced by `AdSlot.tsx`. |
| `components/ui/AITransparencyBadge.tsx` | Replaced by `HeuristicNotice.tsx`. Labelled regex output "AI Generated". |
| `components/core/MarketRateCollector.tsx` | **Delete, do not fix.** Submit handler did nothing; displayed a hardcoded `$45/hr` regardless of role selected; claimed 10,000+ contributors and an "open-source pricing AI" that don't exist. It gated content behind `required` fields and discarded what it collected. |
| `lib/utils/contractScanner.ts` (if you took batch 1) | Moved to `lib/ai/contractScanner.ts` to match your existing import path. |
| `tailwind.config.ts` | Never loaded. See section 1. |
| `global.d.ts` | Unnecessary; suppresses type errors. |
| `vercel.json` | Try removing after the lucide upgrade. |

Also remove `html2canvas` from `package.json` — no longer used.

---

## 8. Install

```bash
npm uninstall html2canvas
grep -rn "framer-motion" app components lib   # FAQSection no longer needs it
```

`.env.local` and Vercel env:

```
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-4557897331416844
```

Without it, no ad script loads and no slot renders. Preview deploys stay clean.

**Your build will fail on first run**, on content frontmatter validation. That is
intentional — the failure list is your pruning worklist across the ~110 articles.
To build while you work through it, empty the `HIGH_STAKES` array at the top of
`lib/utils/markdown.ts`. Put it back before deploying.

Required frontmatter is documented at the top of `lib/utils/markdown.ts`.

---

## 9. Test results

```
--- TAX ORDER (the bug that was fixed) ---
  PASS  taxable base is net of discount        900
  PASS  tax charged on discounted base         162
  PASS  total                                  1062
        (old implementation produced 1080 / tax 180)
--- PRECISION AND EDGE CASES ---
  PASS  10% discount, reverse charge, discount>subtotal clamping
  PASS  0.1*3 + 0.2 === 0.5 exactly (integer minor units)
  PASS  7.5h @ 85 -> 637.50 ; JPY has no fractional yen
  PASS  NaN inputs do not produce NaN totals
        JPY 10,000   INR 1,00,000.00   USD 100,000.00
--- SCANNER ---
  PASS  no safety score field exists
  PASS  160-word contract with no protections -> all 6 missing protections flagged
        (old implementation scored that contract 100 = "safest")
  PASS  short paste -> inconclusive, asserts nothing
  PASS  well-drafted contract -> 0 missing protections
  PASS  bare "satisfaction" no longer triggers payment-terms
  PASS  8 clause types detected on a realistic MSA
  PASS  returns in 0ms (was a hardcoded 2000ms)
--- SITEMAP ---
  PASS  0 malformed URLs (was: every URL but the homepage)
--- CSS BUILD (Tailwind v4.3.3) ---
  PASS  9 .prose rules generated (was: 0)
  PASS  brand-300 / brand-700 present (were: absent)
  PASS  prefers-reduced-motion block present
  PASS  print block present

24 passed, 0 failed
```

---

## 10. Required from you — nothing here was invented

| # | What | Where |
|---|---|---|
| 1 | **Verify publisher ID** `pub-4557897331416844` in AdSense → Account → Settings | `public/ads.txt`, env |
| 2 | **Legal entity name + postal address** (GDPR Art. 13 requires the controller's identity) | `app/legal/privacy/page.tsx` — `OPERATOR_LEGAL_NAME`, `OPERATOR_ADDRESS` |
| 3 | **A consent management platform.** You serve personalised ads to UK/EU visitors with no CMP. Google requires a certified TCF-integrated CMP for that traffic. | new |
| 4 | **Your relationship to DocuFix.in** — owner, affiliate, or unrelated. Determines the disclosure. Until then, pull the promo box from the articles. | `content/resources/*.md` |
| 5 | **Create `/methodology`**, listing the scanner's clause patterns. Three files link to it. | new route |
| 6 | **Confirm `/public/icons/*` and `/public/screenshots/*` exist**, then re-enable the screenshots block. | `app/manifest.ts` |
| 7 | **Real ad slot IDs.** `ARTICLE_AD_SLOT` is a placeholder taken from your old code. | `app/resources/[slug]/page.tsx` |
| 8 | **A lawyer's eye on privacy + terms.** I wrote what the software does; I'm not a lawyer and these have not been reviewed. | both legal pages |

**The gradle files.** `build.gradle`, `gradle.properties` and `gradlew` have now
arrived twice. They are Android build files and have nothing to do with this
Next.js project. Something in how you are selecting files for upload is pulling
them in — worth checking, since it means other files you intend to send may be
getting missed.

---

## 11. Still outstanding

**No service worker exists in the repository.** The manifest declares
`display: standalone`, `InstallPrompt` offers installation, `/offline` exists, and
the homepage said the tools work offline. Without a service worker caching the
tool routes, none of that is true and `/offline` is unreachable. I've toned down
the offline copy rather than delete the page, but this is a real gap: either ship
a service worker or drop the offline promise.

**The content.** ~110 articles, ~100 dated the same day, across 8+ jurisdictions.
Build validation surfaces the mechanical gaps (missing jurisdiction, sources,
applicable year). The editorial work is yours: consolidating six
invoice-by-profession pages into one, ten local-first pages into one, and fixing
the 44ADA page's missing 95%-digital-receipts condition.

**Files I still haven't seen:** any `app/api/**` routes, and
`content/resources/*.md`. Config is now fully covered. If an API route exists
that touches invoice or contract data, the privacy claims need revising before
deploy — that is the last thing standing between the current privacy copy and
being provably accurate.

---

## 12. Is the platform complete?

The **code** is, as far as the files you've shown me go. Every defect I can find
in what you've uploaded is fixed, typechecked, and — where it's logic rather than
markup — tested.

The **platform** is not, and the remaining gap is not code:

1. The content pruning (~110 → ~25–30)
2. A CMP before serving personalised ads to UK/EU traffic
3. A service worker, or dropping the offline claim
4. The items in section 10

Item 1 is the constraint on traffic. Item 2 is the constraint on monetisation.
Neither is blocked on me, and both are worth more than any further code I could
write right now.
