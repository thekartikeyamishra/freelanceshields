# Deploying to Vercel and replacing the live site

Assumes freelanceshield.me is already on Vercel (your `vercel.json` and the
Vercel references in the original `markdown.ts` comments both indicate it is). If
it is somewhere else, step 6 changes and nothing else does.

**Do not push this straight to `main`.** The sequence below verifies on a preview
URL first, because several changes affect every page on the site.

---

## Step 0 — Branch and back up

```bash
git checkout -b rebuild
git tag pre-rebuild            # a marker you can roll back to
```

Vercel also keeps every previous deployment, so instant rollback is available
from the dashboard regardless. Note the current production deployment ID before
you start.

---

## Step 1 — Copy the files in

Copy the tree over your repo preserving paths, then:

```bash
rm components/ads/StrategicAdSlot.tsx
rm components/ui/AITransparencyBadge.tsx
rm components/core/MarketRateCollector.tsx
rm lib/utils/contractScanner.ts        # moved to lib/ai/
rm tailwind.config.ts                  # never loaded under Tailwind v4
rm global.d.ts

npm uninstall html2canvas framer-motion canvas-confetti @types/canvas-confetti react-hook-form clsx tailwind-merge
npm install lucide-react@^0.469.0
npm install                            # no --legacy-peer-deps; it should now succeed
```

If `npm install` succeeds without the flag, delete `vercel.json`.

Check nothing else imported the removed packages:

```bash
grep -rn "StrategicAdSlot\|AITransparencyBadge\|MarketRateCollector\|html2canvas\|framer-motion\|canvas-confetti\|react-hook-form" app components lib
```

---

## Step 2 — Migrate the content frontmatter

This is the step that lets the build pass. Commit your content directory first —
it rewrites files in place.

```bash
git add content/ && git commit -m "checkpoint before frontmatter migration"

node scripts/migrate-frontmatter.mjs --dry-run    # read the output
node scripts/migrate-frontmatter.mjs              # apply
node scripts/audit-content.mjs                    # see what remains
```

The migration derives `category` and `jurisdictions` from each slug, renames
`date:` to `published:`, and — importantly — sets `indexable: false` on tax and
contract pages that have no sources.

That last part is deliberate. Those pages stay live for anyone holding a link,
drop out of the sitemap, and get a `noindex`. So the build passes, today's fixes
ship, and your weakest pages stop accumulating impressions while you fix them.
Flip each back to `true` as you source it. If you never get to one, it should
stay noindexed.

Anything the script flags as `CHECK THIS` needs you before you proceed.

---

## Step 3 — Build locally

```bash
npm run typecheck
npm run build
```

Expect this to surface real content errors on the first run. That is the point —
the list is your worklist. Fix or noindex until it builds clean.

Then run it and click through:

```bash
npm run start
```

- `/invoice-maker` — add items, a discount, a tax rate; download the PDF and
  **open it and try to select the text**. If you can, the vector rewrite worked.
- `/contract-scanner` — paste a real contract. Confirm no score appears.
- Any article — confirm it now has proper typography. If it still looks like
  unstyled HTML, the `@plugin` line in `globals.css` did not take.
- `/methodology`, `/about`, `/legal/privacy`, `/legal/terms` — all should load.

---

## Step 4 — Set the environment variable

Vercel dashboard → your project → Settings → Environment Variables:

```
NEXT_PUBLIC_ADSENSE_CLIENT_ID = ca-pub-4557897331416844
```

Set it for **Production only**, not Preview or Development. That keeps ad
requests and the consent banner out of your preview deploys, which is what you
want while testing.

**Verify that ID against AdSense → Account → Settings before you set it.** I took
it from your old `StrategicAdSlot.tsx`; I did not verify it.

Also fill in the two placeholders in `app/legal/privacy/page.tsx`:
`OPERATOR_LEGAL_NAME` and `OPERATOR_ADDRESS`. Your own name and a contactable
address are fine if you trade as an individual.

---

## Step 5 — Push the branch and check the preview

```bash
git add -A && git commit -m "Rebuild: infrastructure, tools, content validation"
git push -u origin rebuild
```

Vercel builds a preview automatically. On the preview URL, check:

- `/sitemap.xml` — **every URL must have a single slash.** This is the main
  thing to verify. Your live sitemap has `//invoice-maker` on all ~115 entries.
- `/robots.txt` — points at the sitemap, does not block `/ads.txt`.
- Every page has a nav bar and a footer with privacy/terms/about links. Your
  live site renders both as empty.
- View source on `/invoice-maker` — you should see the `<h1>` and body copy in
  the HTML. On production today it is an empty shell.
- Titles differ between `/`, `/invoice-maker` and `/contract-scanner`. They are
  currently identical.
- Lighthouse on mobile, for a before/after number.

Ads will not render on the preview because the env var is production-only. That
is expected.

---

## Step 6 — Merge and go live

```bash
git checkout main && git merge rebuild && git push
```

Vercel promotes it. Zero-downtime — the old deployment serves until the new one
is ready, so there is no window where the site is down.

**There is nothing to "replace".** You are not migrating hosts; you are pushing a
new deployment of the same project to the same domain. DNS does not change.

If something is wrong: Vercel dashboard → Deployments → the previous production
deployment → Promote to Production. Live again in seconds.

---

## Step 7 — Immediately after going live

```bash
curl -sI https://freelanceshield.me/ads.txt | head -5
curl -sI https://www.freelanceshield.me/ads.txt | head -5
```

Both must reach a 200 with `content-type: text/plain` (a redirect from www to
apex is fine). Then:

```bash
curl -s https://freelanceshield.me/sitemap.xml | grep -c "me//"
```

Must return `0`.

---

## Step 8 — Search Console

This matters more than usual, because your sitemap has been feeding Google
malformed URLs.

1. Resubmit `https://freelanceshield.me/sitemap.xml`. Google will re-crawl and
   the double-slash URLs will drop out as they 404 or redirect.
2. Use URL Inspection → Request Indexing on `/`, `/invoice-maker`,
   `/contract-scanner` and `/methodology`. Four manual requests is fine; do not
   bulk-submit.
3. Watch **Pages → Not indexed** over the next fortnight. The `//` URLs should
   fall away. Pages you noindexed in step 2 will appear under "Excluded by
   noindex tag" — that is correct, not a problem.
4. Do not expect movement in under a month. Recrawling ~115 URLs takes time, and
   the noindexed pages will make your indexed count drop before it rises. That
   drop is the intended outcome, not a regression.

---

## Step 9 — AdSense

Only after the site is live and you have clicked through it yourself.

Check in AdSense → Sites that `freelanceshield.me` still shows as Ready. Then
place real ad unit IDs — `ARTICLE_AD_SLOT` in `app/resources/[slug]/page.tsx` is
a placeholder taken from your old code.

On the consent banner: with defaults denied, you are serving non-personalised
ads to everyone until they accept. That is compliant today and it is why you can
ship without a certified CMP. Revenue per visitor will be lower in the EEA and UK
than it would be with personalised ads. That is the trade, and it is the correct
one until you have a certified CMP.

---

## What deploying does not fix

Three things ship in a knowingly incomplete state, and you should know which:

1. **The content.** Roughly 110 articles, most of them thin, with the unsourced
   tax and contract pages noindexed by the migration. The site will be
   structurally sound and honest, with a smaller indexed footprint than before.
   That is the right position to be in, but the traffic work starts after this
   deploy, not before it.

2. **No certified CMP.** Non-personalised ads in the EEA and UK.

3. **The service worker is new and untested against real traffic.** If offline
   behaviour is wrong for anyone, it is safe to delete `public/sw.js` and the
   `<ServiceWorkerRegistrar />` line in `app/layout.tsx`; the site works normally
   without them. Existing installs will unregister on their next visit.
