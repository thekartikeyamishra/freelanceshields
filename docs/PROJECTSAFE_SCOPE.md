# ProjectSafe — what was built, what was not, and why

## Built (shipped in this batch, at `/project-planner`)

| Capability | How |
|---|---|
| Project + parties + dates + currency | Form, saved on-device |
| Templates (website, design, writing, app) | Split budget into milestones; sums are exact (rounding corrected) |
| ScopeGuard | Every deliverable needs a "done when" and a paid milestone, or it is flagged |
| Milestones | Amount, due date, deposit flag, revisions, client review days |
| Terms | Payment days, late fee, IP-on-full-payment, portfolio, confidentiality, notice, kill fee, governing law |
| Protection check | 17 rules, ordered high → low, each with a fix. No score, on purpose |
| Versioning | Lock a version → SHA-256 fingerprint of the canonical plan; up to 20 versions; restore |
| Agreement PDF | Real-text, paginated, fingerprint on every page, signature lines, honest disclaimer |

Tested: 22 assertions — check rules, template totals, fingerprint stability and
sensitivity, 80-item pagination, text present in PDF, size under 100 KB.

## Deliberately NOT built

| Requested | Why not, here |
|---|---|
| Funding, escrow, release, refunds | Holding or routing a client's money for a freelancer is payment aggregation. In India that needs an RBI-authorised payment aggregator or a bank escrow arrangement. A free, ad-funded content site is the wrong vehicle and a regulatory liability. **This is what Vaada is for** — build money movement there, on a licensed rail, and link to it from the planner. |
| Accounts, database, invitations, two-party workspace | Each needs auth, a database, email delivery, and security review. That changes the privacy promise the whole site is built on ("nothing leaves your device") and adds fixed costs before there's any revenue to cover them. Do it once traffic proves demand. |
| E-signatures | Indian law (IT Act 2000, s.3A + Second Schedule) recognises specific eSign methods (e.g. Aadhaar eSign through a licensed provider). A checkbox is not one. The PDF has signature lines; sign it by a valid method. |
| Disputes, reviewers, Trust Passport | Need two-sided accounts and real history. A reputation score with no data behind it would be fabricated. |

## When to build the rest

Trigger: the planner gets steady weekly use (measure PDF downloads), and people
ask to share a plan with their client. Then, in order: accounts → shared plan
link (read-only) → client "I agree" with audit trail → payments via Vaada.
