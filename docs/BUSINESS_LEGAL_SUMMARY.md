# Business, ownership and legal summary — FreelanceShield

Owner: **Kartikeya Mishra**. This is a checklist written by an engineer, not legal
or tax advice. Items marked **⚖︎** need a lawyer or CA.

## 1. Ownership of code and platform

| Asset | Action | Status |
|---|---|---|
| Source code | Keep the GitHub repo private, under your personal account, with no outside collaborators who haven't signed an assignment | Check |
| **Employer IP clause** ⚖︎ | You work at Xobit Technologies. Many Indian employment contracts claim IP in anything created during employment, or using company equipment or time. **Read your contract's IP, moonlighting and non-compete clauses before taking revenue.** If it's ambiguous, get a written no-objection from the employer. This is the single biggest ownership risk on this list | **Do first** |
| Domain | Registrar account in your name, with 2FA and auto-renew | Check |
| Brand | Trademark search, then file "FreelanceShield" with IP India (likely classes 9 and 42) ⚖︎ | Not done |
| AI-assisted code | Under Indian copyright, the author is the person who creates the work. Keep records showing you directed and edited the work | Fine |
| Third-party code | Audited 2026-11-06: 162 production packages, of which 160 are permissive (MIT/Apache/ISC/BSD/0BSD/CC-BY). One is LGPL-3.0: `@img/sharp-libvips`, pulled in by Next.js image optimisation and dynamically linked, which is fine for a hosted service you don't distribute. Re-check before shipping a desktop or mobile app that bundles it. Re-run: `npx license-checker-rseidelsohn --summary --production` | Fine |
| Future contractors | Written IP assignment before they start, every time | Policy |

## 2. Entity

- **Now:** a sole proprietorship is fine at current revenue.
- **Before you take investment, sign B2B deals, or pass roughly ₹20–30 lakh a year in revenue:** form a Private Limited company ⚖︎. Investors fund companies, not individuals. Then assign the code, domain and trademark to the company with a signed IP assignment deed. That deed is what makes "the company owns the platform" true.
- Keep personal and business money in separate bank accounts from day one.

## 3. Tax ⚖︎ (CA)

- AdSense is paid from outside India. That is generally export of services: zero-rated for GST under an LUT once you're registered. Registration is mandatory above the threshold (₹20 lakh for services in most states).
- Website income is business income. Whether presumptive taxation applies depends on how it's classified. Ad publishing is generally *not* a specified profession under s.44AA, so 44ADA may not apply. Ask a CA.
- Keep your FIRC / bank advice for every foreign receipt.

## 4. Privacy and consumer law

| Law | Position |
|---|---|
| DPDP Act 2023 (India) | The tools collect no personal data on a server, which removes most obligations. Ads and cookies are personal data processing: the consent banner and privacy policy cover them. The DPDP Rules were notified in November 2025 with phased commencement ⚖︎ — confirm which dates apply to you. |
| GDPR / UK GDPR | Consent Mode defaults to denied, and the privacy policy discloses Google. A certified CMP is needed for *personalised* EEA/UK ads. |
| IT Act 2000 + Intermediary Rules | No user-generated content is hosted, so most obligations don't arise. Keep a grievance contact on the site (the privacy email covers this). |
| Consumer Protection (E-Commerce) Rules | Only relevant once you sell something. Then publish refund and cancellation terms. |

## 5. Payments (if ProjectSafe ever moves money) ⚖︎

Do not hold client funds yourself. Use an RBI-authorised payment aggregator's
marketplace/route product or a bank escrow, with their KYC. That is Vaada's
domain, not this site's.

## 6. Placeholders still in the code

`OPERATOR_LEGAL_NAME`, `OPERATOR_ADDRESS` in `app/legal/privacy/page.tsx`. The
privacy and terms pages need a lawyer's review before you rely on them in a dispute.

## 7. International

| Market | What applies | Status |
|---|---|---|
| EU / UK | GDPR / UK GDPR, ePrivacy (cookies) | Consent Mode defaults to denied. A certified CMP is needed for personalised ads. Privacy policy covers rights and contact |
| US (California etc.) | CCPA/CPRA thresholds (revenue, or 100k+ consumers) — unlikely to apply yet | Revisit at scale. If you add personalised ads at volume, add a "Do not sell or share" link |
| Everywhere | Consumer law overrides the terms where mandatory | Terms and refund policy already say so |
| Payments abroad | PayPal handles payer-side compliance. You handle income tax and GST (export of services) | §3 |

## 8. Location — confirm one fact
The about page, footer and Terms court venue now all read `CONTACT.city` in `lib/site.ts`, set to **Bengaluru**. Your old site said Prayagraj. Set it to the city where you actually live and can attend court. The Terms venue should be a court you can realistically get to.

## 9. Founder → company IP assignment (template — lawyer to finalise) ⚖︎

Use this the day the Private Limited company is formed. Without it, the code legally stays yours personally, not the company's, and investors will ask for it.

> **IP ASSIGNMENT DEED**
> This deed is made on [DATE] between **Kartikeya Mishra**, [ADDRESS] ("Assignor"), and **[COMPANY NAME] Private Limited**, CIN [ ], [REGISTERED OFFICE] ("Company").
> 1. **Assignment.** For consideration of ₹[ ] (receipt acknowledged), the Assignor assigns to the Company, worldwide and in perpetuity, all rights, title and interest in: (a) the FreelanceShield software, source code, object code, documentation and designs; (b) the domain freelanceshield.me; (c) the name and marks "FreelanceShield" and "Shieldy" and any applications for them; (d) all content published on the website, together with all copyright, moral rights to the extent assignable, and all other intellectual property in them, including works created before this date.
> 2. **Warranties.** The Assignor is the sole author and owner, has not licensed or assigned these rights to anyone else, and no employer or third party has a claim to them.
> 3. **Further assurance.** The Assignor will sign any document needed to record or register the assignment.
> 4. **Governing law.** Indian law; courts at [CITY].
> Signed: ______ (Assignor) ______ (for the Company) | Witnesses: 1. ______ 2. ______
> *Pay stamp duty as applicable in your state.*

The warranty in clause 2 is exactly why the employer IP check in §1 must happen first.
