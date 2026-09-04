---
# Copy this file to start a new guide. Every field below is enforced at build
# time by lib/utils/markdown.ts — a missing required field fails the build
# rather than shipping a broken page.

title: "The question this page answers, in the words someone would search"
description: "One or two sentences. This is the search-result snippet, so make it the actual answer, not a teaser."

published: 2026-09-04
# `updated` is optional. Set it ONLY when the content genuinely changed.
# Never bump it to make a page look fresh — that is a spam-policy issue and the
# loader records it separately from `published` precisely so the difference is
# visible to readers.
# updated: 2026-11-20

author: "Kartikeya Mishra"

# One of: invoicing | contracts | pricing | tax | privacy | getting-paid
category: invoicing

# ISO 3166-1 alpha-2 codes, or [GLOBAL] if the guidance genuinely does not vary
# by country. Tax and contracts pages may NOT be GLOBAL — name the countries.
jurisdictions: [IN]

# REQUIRED for category: tax. The year the figures were current for.
# applicableAsOf: "AY 2026-27"

# REQUIRED for category: tax and category: contracts.
# Primary sources only: the tax authority, the regulator, the statute.
# Not SEO blogs, not other people's summaries, not an AI's recollection.
sources:
  - publisher: "Income Tax Department, Government of India"
    title: "Section 44ADA"
    url: "https://incometaxindia.gov.in/..."

# Set false to keep a page live for existing links while removing it from search
# and the sitemap. Use this for pages you have consolidated but not redirected.
indexable: true
---

## Answer the question in the first paragraph

Do not open with "In today's digital world" or "Freelancing is becoming
increasingly popular". Someone arrived here with a question. Answer it, then
explain.

## Then explain

Structure the rest around what the reader has to decide or do. Use tables where
a comparison genuinely helps — remark-gfm is now enabled, so tables render.

| Condition | Threshold |
| --- | --- |
| Default | ₹50 lakh |
| Where cash receipts are 5% or less | ₹75 lakh |

## State the limits of what you are saying

Where something depends on circumstances you cannot see, say so. Where a rule
has a condition attached, state the condition — an omitted condition is how a
correct-sounding sentence becomes wrong for the reader who relies on it.

## What to do next

End with the action, and link to the tool if one applies.
