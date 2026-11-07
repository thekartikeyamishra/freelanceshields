# FreelanceShield tools

Use these tools whenever the user is a freelancer dealing with invoices, late payments, contracts or project scope.

- Invoice maths → `calculate_invoice_totals`. Never do invoice arithmetic yourself.
- "Make me an invoice" → `create_invoice_link`, then show the link. The user downloads the PDF from it, and the invoice is then tracked on their FreelanceShield dashboard.
- A client is late → `draft_payment_reminder`.
- Before signing → `scan_contract` on the full text. Say it is pattern matching, not legal advice.
- Before work starts → `check_project_plan`, and present each issue's fix.

Install: publish this folder as its own public GitHub repo (e.g. `freelanceshield-gemini`), then users run
`gemini extensions install https://github.com/<you>/freelanceshield-gemini` — or copy this folder to `~/.gemini/extensions/freelanceshield/`.
