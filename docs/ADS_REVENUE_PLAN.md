# AdSense: approval checklist and the honest revenue maths

## What nobody can promise
Not approval on the first review, not "immediate green flags", and not $2,500–3,500 a month. Approval is a human and automated quality judgement; revenue is traffic × value. Anyone promising either is selling something.

## What the code now guarantees
- Placements: **one** per tool page (after the supporting content), **one** per article (after the sources, and only on articles of 700+ words), **one** on the guides index. None inside a tool, none near buttons or navigation, none above the H1. All in `lib/ads.ts`.
- Every ad is labelled "Advertisement" and visually distinct from tool panels. No ad renders unless its slot ID is set.
- ads.txt, privacy policy with the Google disclosures, Consent Mode v2, contact, about, terms and refund pages, plus sitemap, canonicals, one H1 per page, structured data and an OG image.
- **Auto ads: leave OFF.** They can place ads inside tools and next to buttons, undoing all of the above.

## Before you click "Request review"
1. Prune content: run `node scripts/audit-content.mjs`. Thin, duplicate and unsourced pages are the main reason "low-value content" rejections happen. Fewer, better pages beat 110 thin ones.
2. Real traffic for 4–8 weeks after the relaunch: Search Console showing impressions growing, and people actually using the tools.
3. Fill `lib/site.ts` → `CONTACT.address` (and phone if you have one).
4. Every link works: no 404s in the Search Console Pages report.
5. Wait at least 2–4 weeks after the last rejection, then resubmit once. Repeated rapid resubmission doesn't help.

## The revenue maths
```
monthly_revenue = monthly_pageviews × RPM / 1000
pageviews_needed = target × 1000 / RPM
```
RPM (revenue per 1,000 pageviews) varies enormously by country, niche and season. Read your real figure from AdSense after the first month. Illustrative arithmetic only:

| If your RPM were | Pageviews/month for $2,500 | for $3,500 |
|---|---|---|
| $3 | 833,000 | 1,167,000 |
| $8 | 313,000 | 438,000 |
| $15 | 167,000 | 233,000 |

So the target needs a few hundred thousand pageviews a month from good markets. That comes from search traffic to genuinely useful tool pages, not from more ad units.

## The legitimate "system that learns"
1. Monthly: AdSense → Reports → by page and by country. Find the pages with the best RPM × traffic.
2. Build more of what earns. For example, if the US/UK invoice pages earn most, improve them and write the 2–3 supporting guides searchers in those countries need, with sources.
3. Use AdSense **Experiments** (in AdSense itself) to test ad *styles*, not ad *count*.
4. Add revenue that doesn't depend on ad density: premium templates and a Pro plan through Razorpay/PayPal (`lib/site.ts → PAYMENTS`). Diversified revenue reaches the target with far less traffic.

Never: add ads until the number goes up, use pop-ups or interstitials, ask for clicks, or place ads near download buttons. That is the path to a policy strike that zeroes revenue.
