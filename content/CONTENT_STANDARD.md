# Content standard

The bar every surviving article has to clear. Written as a checklist because
the pruning decision needs to be fast and repeatable across ~110 pages.

## The keep-or-kill test

For each article, in order:

1. **Is there another page on this site arguing the same thing?**
   If yes, one survives. Merge what is useful and 301 the rest to it.
   Run `node scripts/audit-content.mjs` for the obvious clusters.

2. **What does this page give a reader that the top result already does not?**
   If the honest answer is "nothing except my wording", it does not need to
   exist. Merge it, or build the calculator or worked example that would make
   it worth existing.

3. **Can I source the factual claims to a primary authority?**
   For tax and contracts, if no, the page cannot be published as it stands.

4. **Do I know which jurisdiction this applies to?**
   If the page describes tax or legal rules and cannot name the country, it is
   wrong somewhere, because those rules do not transfer.

5. **Would I be comfortable if a tax professional in that jurisdiction read it
   line by line?**
   That is the actual standard for YMYL content, and it is the standard a
   reviewer applies.

## Specific corrections needed on the India presumptive-tax page

I checked this one against sources. As published it has these problems, and
they are representative of what to look for elsewhere:

- **"if your gross receipts are under ₹75 Lakhs"** — the default limit is
  ₹50 lakh. ₹75 lakh applies only where cash receipts are 5% or less of total
  gross receipts. The condition was omitted entirely. Someone taking cash could
  rely on this and be wrong.
- **"declare only 50% of your total income as profit"** — it is 50% of *gross
  receipts*, not of income, and 50% is a floor: you may declare more.
- **Eligibility is limited to specified professions under Section 44AA(1).**
  The page does not say so. This matters enormously for your audience, because
  freelance writers and most digital creators are generally not specified
  professions and cannot use 44ADA at all. You publish invoice guides aimed at
  exactly those people.
- **Advance tax** under 44ADA is a single instalment by 15 March, not the usual
  four. Not mentioned.
- **GST threshold** stated as ₹20 lakh without noting it is ₹10 lakh in special
  category states.
- **No sources, no assessment year, no revision date** on a page about rules
  that change annually.

One thing to be careful about: sources disagree on whether HUFs are eligible
under 44ADA. Some say individuals, HUFs and partnership firms; others say the
Income Tax Department's own page lists only individuals and partnership firms
excluding LLPs. **Do not resolve that from a blog.** Check the department's
page directly and cite it.

I have deliberately not rewritten this article for you. Publishing tax guidance
under your name that I assembled from search results is precisely the failure
mode your original brief warned about, and it is your name on the byline and
your exposure if it is wrong. The corrections above are checkable facts; the
writing should be yours.

## Phrases to delete on sight

- "In today's digital world"
- "Whether you're a beginner or an expert"
- "Freelancing is becoming increasingly popular"
- Any sentence that could open any article on any topic

## Length

There is no target. A 700-word page that completely answers the question beats
a 2,000-word page padded to look substantial. The thin-content threshold in the
audit script (600 words) is a smell test, not a goal — do not pad to clear it.
Merge instead.

## Dates

`published` never changes. `updated` changes only when the content changes.
Changing a date to signal freshness without changing the content is a
spam-policy issue, and the loader now keeps the two fields separate so the
difference is visible to readers.
