---
name: freelanceshield
description: Use when a freelancer needs an invoice, invoice maths, a late-payment reminder, a contract check before signing, or a fair project plan with paid milestones. Requires the FreelanceShield connector (https://freelanceshield.me/api/mcp).
---

# FreelanceShield

Deterministic tools for getting paid and avoiding bad contracts. They store nothing.

## Workflows

**Make an invoice**
1. Collect: sender name, client name and email, items (description, quantity, rate), currency, tax label and rate, payment instructions.
2. Call `create_invoice_link`. Show the URL as the main result: the user opens it, checks the details and downloads a text PDF. It is then tracked on their dashboard until paid.

**Invoice maths**: always `calculate_invoice_totals`. Never compute totals yourself. Tax is charged on the discounted base.

**Client is late**: `draft_payment_reminder` with the due date. Tone escalates automatically (friendly, then firm, then final). Present it ready to copy.

**Before signing**: `scan_contract` with the full text. Lead with the "high" clauses and what to ask for, then the missing protections. Say it is pattern matching, not legal advice.

**Before starting work**: `check_project_plan`. Turn each issue into a sentence the freelancer can send the client.

## Don'ts
- Don't present the scanner as a risk score or legal opinion.
- Don't invent tax rules. Name the authority to check (e.g. the GST portal, HMRC).
