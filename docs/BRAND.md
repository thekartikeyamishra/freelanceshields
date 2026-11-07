# Brand

## Promise
**Get paid. Stay protected. Keep your data.**

## Values, and what each means in the product
| Value | In practice |
|---|---|
| Honest | No fake scores, badges, counts, testimonials, or "AI" claims. Limits are stated next to results. |
| Private | Tools run in the browser. We say exactly where data lives, including that drafts sit unencrypted on the device. |
| Useful first | Every page has to work with all ads removed. Tools come before text. |
| Fair to both sides | Plans and checks protect the client as well as the freelancer. |

## Voice
Plain, warm, specific. Short sentences. Say what the thing does, not how amazing it is.
- ✅ "Tax is charged on the discounted amount."  ❌ "Enterprise-grade compliance engine."
- ✅ "This checks 12 clause types."  ❌ "AI-powered legal protection."
- Never: "ultimate", "revolutionary", "#1", "guaranteed", "bulletproof".

## Colour
| Token | Hex | Use |
|---|---|---|
| brand-900 navy | #0c4a6e | Headings, dark surfaces |
| brand-600 action | #0284c7 | Primary buttons, links |
| brand-400 sky | #38bdf8 | Highlights, Shieldy |
| emerald-500 | #10b981 | Success, "safe" |
| amber-500 | #f59e0b | Attention (never red for routine warnings) |
| slate-900 / 600 | #0f172a / #475569 | Text / secondary text |

Contrast: body text on white ≥ 4.5:1. Never put essential text on brand-400.

## Type and motion
Inter, via `next/font` (self-hosted, no layout shift). Motion is CSS only: a cursor spotlight, a 4° card tilt, scroll reveals and Shieldy. It's off on touch screens where it adds nothing, and off entirely under reduced motion. There's no 3D or animation library: each would cost 50–150 KB of JavaScript and hurt LCP/INP, which matters more for ranking and ad revenue than visual flourish.

## Mascot
Shieldy is helpful and a little playful, never pushy. It doesn't open by itself, never blocks content, and admits what it doesn't know.
