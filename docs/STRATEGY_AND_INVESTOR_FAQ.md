# Strategy, retention and investor questions

## The honest answer on "moats no AI can copy"

No feature is uncopyable. What can't be copied quickly:

1. **Ranking and brand built on genuinely useful tools.** Search trust takes years to earn. A model can write a page, but it can't make that page rank.
2. **Local compliance depth** — Indian GST/LUT/FIRC invoicing done correctly, in Hindi as well as English. Large US tools underserve this.
3. **Two-sided trust data** (later, via Vaada): verified payment and delivery history between real freelancers and clients. A network effect, not a feature.

## The aha moment (target: under 20 seconds)

- Invoice: a template-free form plus a live preview. The first PDF downloads in under a minute, with no sign-up.
- Planner: pick a template and type a budget. A full milestone plan appears instantly, with the gaps flagged.
- Scanner: paste text and get results in under a second (the fake 2-second delay is gone).

## Retention without email or tracking (shipped)

- Drafts persist on the device. Shieldy shows an amber dot and a "your invoice for Acme is unfinished — continue" link on return visits. This uses on-device data only, nothing tracked.
- Locked plan versions bring people back for amendments.
- The PWA install prompt appears only after real use.

Next step: optional "email me a reminder when my milestone is due". That requires
an email provider and storing an email address. Add it only with explicit opt-in,
and update the privacy policy first.

## Why users come (cold start)

The tools are free, need no account, keep data private, and have no watermark. The
distribution channels are search (tool pages are the landing pages), Indian
freelancer communities (Reddit r/developersIndia, LinkedIn), and word of mouth from the PDFs.
(Not added: a "Prepared with FreelanceShield" line on invoices. It's the user's document. If you
want it, make it an opt-in checkbox, never a default.)

## Backlinks — legitimate only

- Get listed on the tool directories you already run or know of (LaunchLayer).
- Answer real questions in freelancer communities, linking to the tool only where it actually solves the question.
- Publish one original data piece a quarter, e.g. "what the scanner finds most often in freelance contracts", from anonymous aggregate counts *only if you add opt-in counting*.
- Never buy links, swap links in bulk, or use PBNs.

## Investor FAQ

| Question | Answer |
|---|---|
| Revenue today? | Ads only. Report the real numbers; don't project. |
| Unit economics? | Static hosting. Marginal cost per user is about zero; no AI spend. |
| Defensibility? | See the three items above. Be candid that it's early. |
| Regulatory risk? | Low: no funds are held and no personal data stored. Payments are kept separate (Vaada). |
| IP clean? | Yes, once the employer clause is checked and IP is assigned to the company (see BUSINESS_LEGAL_SUMMARY.md). |
| Why you? | You have lived the problem (invoicing international clients from India) and ship fast. |
| Biggest risk? | Content quality and traffic. The ~110 thin articles must be pruned before AdSense reapplication. |

## Blind spots found and fixed in batch 6
| Found | Fix |
|---|---|
| About, footer and Terms said Prayagraj; site config said Bengaluru | All read `CONTACT.city` — confirm the value |
| Sitemap gave static pages `lastModified = build time` (looks like fake freshness) | Removed for static routes |
| Service-worker runtime cache grew without limit across deploys | Capped at 80 entries; cache version bumped |
| Mascot's answers lived only in the client | Moved to `lib/assist/knowledge.ts`, shared by client and server |
| No way to answer questions outside the reviewed set | Honest fallback that links to the guides and contact page. No AI model, so zero running cost and no data leaves the device |

## Investor data room — have these ready
1. IP assignment deed (template in BUSINESS_LEGAL_SUMMARY §9), signed and stamped
2. Employer no-objection letter, if your contract needs one
3. Trademark application receipt
4. AdSense, Search Console and analytics exports: real numbers, monthly
5. Cost sheet: hosting, domain, AI spend, each per month
6. TEST_REPORT.md plus a fresh Lighthouse report
7. One page on the Vaada relationship: separate product or same company?
