# Growth and retention: how FreelanceShield gets used every week at ~zero cost

## The problem we fixed
A website of one-off tools gets one visit per need. Invoices, though, are a weekly job and getting paid is a weekly worry. So the product is now **"who owes me money, and who do I chase today"**. Invoicing, contract checks and planning feed that loop.

## The habit loop (on device, no server)
| Step | What happens | Built in |
|---|---|---|
| Trigger | Invoice due or overdue. The installed app's **icon badge** shows the overdue count, and an optional **calendar reminder** (.ics) fires on the due date | `Dashboard.tsx` (Badging API), `dueDateIcs()` |
| Action | Open the app, which starts on the dashboard. **Chase today** lists who to remind, with a one-tap email, WhatsApp or copied message | `start_url: /dashboard`, `draftReminder()` |
| Reward | "It's paid" → **Paid this month** grows | `summarize()` |
| Investment | Every invoice adds history; **Duplicate** makes next month's invoice in one tap with the next number; client details carry over | `upsertInvoice()`, `suggestNextNumber()` |

More invoices make the tracker more valuable, and more value means a higher cost of leaving. That is retention without lock-in: **backup, restore and CSV** are one click, because trust is the moat for a no-account product.

## Cold start: none needed
Every tool is fully useful for one user on day one. There is no marketplace, network or content to seed. Distribution goes through channels where freelancers already are, and each one feeds the dashboard:

| Channel | CAC | How it pulls users in |
|---|---|---|
| Google search (tool + guide pages) | $0 | Existing SEO pages |
| ChatGPT GPT Store + ChatGPT app | $0 | "Make me an invoice" → `create_invoice_link` → user downloads in our app → tracked |
| Claude connector + Gemini extension | $0 | Same link flow |
| Chrome / Edge extension | $5 once | Right-click any contract; links to planner and dashboard |
| Google Docs add-on | $0 | Contracts already live in Docs |
| Play Store (TWA) | $25 once | Store search for "invoice maker" |
| The invoice itself | $0 | Clients see a clean, correct PDF; there is no forced watermark, so no trust cost |

Track `?source=` (pwa, extension, gdocs) in Vercel Analytics or Search Console to see which channel works. No personal data is needed.

## Churn
- **Accidental churn** (lost data) is prevented by backup/restore and a single namespace.
- **Value churn**: the dashboard surfaces money owed, the one number a freelancer always cares about.
- **Annoyance churn**: no forced install prompt (it appears only after real use, with a 60-day snooze), no dark-pattern streaks, and no notifications we would have to pay to send.

## Burn rate
| Cost | Monthly |
|---|---|
| Vercel Hobby / Pro | $0–20 |
| Domain | ~$1 |
| AI model calls | **$0**: none. The assistants run their own models; our tools are deterministic |
| Database / auth / push | **$0**: none needed |
| API + MCP | Milliseconds of CPU per call, capped at 60/min/IP. Set a Vercel spend limit as the outer fuse |

## Monetisation that doesn't break the loop
1. AdSense on guides and tool pages only, never on the dashboard (it's the habit surface, so keep it clean).
2. Later, an optional paid **Pro**: encrypted sync across devices, automatic reminder emails, a client portal and recurring invoices. Charge only for what costs us money to run.

## Weekly metric to watch
**Invoices marked paid per active user per month.** If it rises, the habit is forming.
