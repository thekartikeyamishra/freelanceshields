# Test report — 6 November 2026

All run in Node against the real source, with network mocked. Nothing here is claimed without being executed.

| Suite | Result |
|---|---|
| Invoice tax maths + contract scanner, combined (run in batch 2) | 24 pass |
| Sitemap URL construction | pass (0 malformed) |
| Content loader: missing dir, YAML dates, noindexed tax pages | pass |
| Project planner: rules, templates, rounding, fingerprint, 80-item PDF, text extraction (batch 5) | 22 pass |
| Shieldy: KB matching EN+HI, walkthroughs, fallback (AI route removed in batch 7) | pass |
| Real `next build` (Next 16, Turbopack) | 21/21 static routes, 0 warnings |
| `next start` smoke: every page, 404s, robots, sitemap, ads.txt, manifest, icons, OG, sw.js, security headers | pass |
| Playwright e2e: invoice ₹63,720 total + PDF, draft persistence, scanner, planner lock + PDF, Shieldy, mobile overflow at 390px, menu | 20/20 |
| Lighthouse mobile (Perf/A11y/BP/SEO) | / 97/100/96/100 · invoice 93/100/100/100 · scanner 100/100/100/100 · planner 94/100/96/100 · CLS ≤ 0.009 |
| `tsc --noEmit` strict, whole app | clean |
| One H1 per page | pass |
| Dependency licences | 160/162 permissive; 1 LGPL (dynamic, hosted — OK) |

## Batch 8 (7 November 2026)
| Suite | Result |
|---|---|
| `next build`: 25 routes incl. `/api/mcp`, `/api/v1/[tool]`, `/openapi.json`, `/llms.txt`, `/apps`, `/dashboard` | clean, 0 warnings |
| MCP: initialize, notification → 202, tools/list (6), tools/call ×3, input error → isError, unknown method, bad JSON | pass |
| REST: scan, unknown tool 404, invalid 422, 300 KB body 400, rate limit 60/min | pass |
| E2E: AI invoice link → prefill → PDF → tracked → overdue → reminder copied → cool-off → paid → duplicate (INV-101) → backup → restore → CSV → share target + fragment handover → 390px layout | 20/20 |
| Chrome extension loaded unpacked in Chromium: popup scan, context-menu results page, session text cleared | 4/4 |
| Google Docs sidebar (mocked Apps Script API) | pass |
| Regression e2e (earlier suite) | 20/20 |
| Lighthouse mobile: home 97/100/100/100, apps 98/100/100/100, invoice 93/100/100/100, dashboard 95/100/100/66 (SEO 66 = intentional noindex) | CLS ≤ 0.009 |

## Not yet tested — do before launch
- Lighthouse on the live Vercel URL (scores vary with network and CDN)
- Live connection from ChatGPT, Claude and Gemini to the deployed `/api/mcp` (needs the public URL)
- Apps Script deployment inside a real Google Doc
- Real devices: iPhone Safari, Android Chrome, one low-end Android, for the PDF download and the share sheet
- Screen-reader pass (NVDA on Windows) over the invoice form and Shieldy
