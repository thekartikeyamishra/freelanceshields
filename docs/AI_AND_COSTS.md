# AI and running costs — how to never lose money per user

> **Now implemented** (batch 6): `app/api/assist/route.ts` plus `lib/assist/*`.
> OFF by default. Turn on with `ASSIST_ENABLED=1`, `NEXT_PUBLIC_ASSIST_ENABLED=1` and a provider in env.
> Order of work: reviewed answers (free) → rate limit (10/hr per IP) → daily token budget → model (220 max output tokens, 8 s timeout) → backup provider → reviewed fallback. Users always get a 200 answer, never an error.
> **Set a monthly spend cap in the provider dashboard first.** The in-app limits apply per server instance, so the provider cap is the real ceiling.

## What ships now: zero marginal cost

- **Shieldy** answers from a reviewed, fixed knowledge set (English + Hindi). No model, no API, no tokens. It cannot hallucinate, cannot be prompt-injected, works offline, and sends nothing anywhere.
- **Every tool** runs in the browser. Server cost per user is static hosting only (CDN-cached pages on Vercel).
- There is no database, so there are no queries to index, no N+1, no pooling, no load balancer. Those items from your list don't apply to this architecture, and adding them would only add cost.

## If you add a paid model later — the rules

1. **Rules first, model last.** Answer from the knowledge set; call a model only when no rule matches. Log the unmatched questions (anonymously). Turn the frequent ones into new reviewed answers. That way the free layer gets better with use and the paid layer shrinks. This is the only real "moat" an AI feature has.
2. **Never call a model from the browser.** Use a server route holding the key, with per-IP and per-user rate limits, a max input length, and a hard monthly spend cap that switches the feature off, not the site.
3. **Free users get zero or a small daily quota.** AI is a Pro feature.
4. **Price so AI cost stays under ~10% of revenue per user:**

```
cost_per_chat  = in_tokens × in_price + out_tokens × out_price
monthly_ai_cost_per_user = chats_per_user × cost_per_chat
require: monthly_ai_cost_per_user ≤ 0.10 × monthly_price
```

Fill the prices from the provider's current pricing page on the day you build it.
I'm not putting numbers here because they change and invented ones would mislead.

5. **Provider-agnostic.** One interface (`ask(prompt) → text`), two providers configured. If one changes price or terms, switch with an env var. If both fail, fall back to the rule answers. The user never sees an error, only a less detailed answer.

## Abuse and security for any future AI route

- Strip and length-limit input; never pass tool data (invoices, contracts) to a model without explicit opt-in per request.
- System prompt fixed server-side; model output rendered as plain text, never HTML.
- Bot protection on the route (Vercel firewall rules or Turnstile).
- Alert at 50% and 80% of the monthly cap.

## Worked example (fill in real prices on the day you enable it)
```
per_question_tokens  ≈ 350 in (system prompt + question) + 220 out
cost_per_question    = 350 × in_price + 220 × out_price
daily_ceiling_cost   = ASSIST_DAILY_TOKEN_BUDGET × blended_price × instances
```
Free users only ever reach the model for questions the reviewed set can't answer. Add the common ones to `lib/assist/knowledge.ts` every month, and model calls fall. That's the moat: each answer you add removes that question's AI cost permanently.
