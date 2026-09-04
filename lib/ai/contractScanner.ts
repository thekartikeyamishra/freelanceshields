// lib/utils/contractScanner.ts
//
// Clause spotter for freelance contracts. Runs entirely in the browser on
// pattern matching. No network calls, no model, no upload.
//
// -------------------------------------------------------------------------
// WHAT CHANGED AND WHY
// -------------------------------------------------------------------------
//
// 1. REMOVED THE FAKE DELAY. The previous version contained:
//
//        // Simulated AI Delay (Psychological UX)
//        // Users trust the result more if it "thinks" for a second.
//        await new Promise((resolve) => setTimeout(resolve, 2000));
//
//    A deliberate delay whose stated purpose is to manufacture confidence in
//    an output is deceptive, and it is worse here because the output concerns
//    legal risk. Matching is now immediate, which is also the honest signal:
//    this is fast because it is pattern matching, not deliberation.
//
// 2. REMOVED THE INVERTED SAFETY SCORE. The previous version started at
//    100 ("safest") and only ever subtracted when a pattern matched. So a
//    one-line contract reading "Contractor waives all payment" scored 100,
//    because none of the six regexes fired. Absence of matched keywords is not
//    safety. A confident number that is uncorrelated with the risk it claims to
//    measure is worse than no number.
//
//    Replaced with two honest outputs:
//      - `detected`: clauses we found, explained
//      - `missingProtections`: clauses that protect freelancers and were NOT
//        found, which is the far more useful signal
//
// 3. REDUCED FALSE POSITIVES. The old payment pattern included a bare
//    `satisfaction`, firing on "customer satisfaction survey". The old IP
//    pattern included bare `perpetual|irrevocable`, firing on ordinary benign
//    licence grants. Patterns now require supporting context.
//
// 4. REMOVED DIRECTIVE LEGAL INSTRUCTION. The old messages said things like
//    "This is dangerous" and "Recommendation: Delete this" — definitive legal
//    direction from a regex, with no knowledge of the governing law, the rest
//    of the agreement, or the user's jurisdiction. Findings now explain what a
//    clause type generally does and what to discuss with a lawyer.

export type Severity = 'high' | 'medium' | 'low';

export type ClauseCategory =
  | 'liability'
  | 'intellectual-property'
  | 'payment'
  | 'termination'
  | 'restrictions'
  | 'confidentiality'
  | 'dispute-resolution'
  | 'scope';

export interface ClauseDefinition {
  id: string;
  /** Short human name, e.g. "Indemnification". */
  label: string;
  category: ClauseCategory;
  /**
   * How much attention this clause type typically warrants for a freelancer.
   * This is about the clause TYPE, not a judgement on the specific wording,
   * which we cannot assess.
   */
  attention: Severity;
  patterns: RegExp[];
  /** Plain-language explanation of what this kind of clause generally does. */
  whatItMeans: string;
  /** Concrete things to check in the actual wording. */
  whatToCheck: string[];
}

export interface ProtectionDefinition {
  id: string;
  label: string;
  patterns: RegExp[];
  /** Why a freelancer usually wants this present. */
  whyItMatters: string;
}

export interface DetectedClause {
  id: string;
  label: string;
  category: ClauseCategory;
  attention: Severity;
  whatItMeans: string;
  whatToCheck: string[];
  /** Surrounding text so the user can jump to the clause themselves. */
  excerpts: string[];
}

export interface MissingProtection {
  id: string;
  label: string;
  whyItMatters: string;
}

export interface ScanResult {
  /** Clause types found in the text. */
  detected: DetectedClause[];
  /** Freelancer-protective provisions we could not find. */
  missingProtections: MissingProtection[];
  /** Counts by attention level, for a summary line. */
  counts: Record<Severity, number>;
  /** Approximate word count of the pasted text. */
  wordCount: number;
  /**
   * True when the text is too short to be a meaningful contract, so the caller
   * should present the result as inconclusive rather than reassuring.
   */
  inconclusive: boolean;
  /** Always shown alongside results. Not optional. */
  limitations: string[];
}

/* -------------------------------------------------------------------------- */
/* Clause definitions                                                        */
/* -------------------------------------------------------------------------- */

const CLAUSES: ClauseDefinition[] = [
  {
    id: 'indemnification',
    label: 'Indemnification',
    category: 'liability',
    attention: 'high',
    patterns: [
      /\bindemnif(?:y|ies|ication|ied)\b/i,
      /\bhold\s+(?:\w+\s+){0,3}harmless\b/i,
      /\bdefend[\s,]+(?:and\s+)?(?:indemnif|hold)/i,
    ],
    whatItMeans:
      'An indemnity shifts the cost of certain third-party claims from one party to the other. In a one-sided version, you would cover the client\'s legal costs and damages if someone sues them over your work.',
    whatToCheck: [
      'Is it mutual, or does only one party indemnify the other?',
      'Is it limited to claims caused by your negligence or breach, or does it cover any claim at all?',
      'Is it capped, or is your exposure unlimited?',
      'Does it survive termination, and for how long?',
    ],
  },
  {
    id: 'liability-cap',
    label: 'Limitation of liability',
    category: 'liability',
    attention: 'high',
    patterns: [
      /\blimitation\s+of\s+liability\b/i,
      /\b(?:total|aggregate|maximum)\s+liability\b/i,
      /\bconsequential\s+damages\b/i,
      /\bin\s+no\s+event\s+shall\b/i,
    ],
    whatItMeans:
      'A liability cap sets a ceiling on what each party can be made to pay if things go wrong. Caps are often asymmetric, limiting the client\'s exposure while leaving yours open.',
    whatToCheck: [
      'Does the cap apply to both parties or only to the client?',
      'What is the ceiling — fees paid, a fixed sum, or nothing at all?',
      'Which claims are carved out of the cap?',
    ],
  },
  {
    id: 'ip-assignment',
    label: 'IP assignment or work made for hire',
    category: 'intellectual-property',
    attention: 'high',
    patterns: [
      /\bwork(?:s)?\s+made\s+for\s+hire\b/i,
      /\bwork\s+for\s+hire\b/i,
      /\bassigns?\s+(?:\w+\s+){0,4}(?:all\s+)?(?:right|title|interest|intellectual\s+property)/i,
      /\b(?:perpetual|irrevocable|worldwide)\b[^.]{0,80}\b(?:licen[cs]e|assign|rights?)\b/i,
      /\bmoral\s+rights\b/i,
    ],
    whatItMeans:
      'These provisions determine who owns the work after delivery. Broad assignment language can transfer ownership of everything you produce, and sometimes reaches your pre-existing tools and libraries.',
    whatToCheck: [
      'Does ownership transfer on delivery, or on full payment?',
      'Is your pre-existing or background IP carved out?',
      'Can you show the work in your portfolio?',
      'Are you granting ownership, or a licence — and if a licence, how broad?',
    ],
  },
  {
    id: 'payment-terms',
    label: 'Payment terms',
    category: 'payment',
    attention: 'medium',
    patterns: [
      /\bnet\s*(?:30|45|60|75|90|120)\b/i,
      /\bpaid\s+when\s+paid\b/i,
      /\bpay\s+if\s+paid\b/i,
      /\bwithin\s+(?:sixty|ninety|\d{2,3})\s+(?:\(\d+\)\s+)?days\s+(?:of|after|from)\b/i,
    ],
    whatItMeans:
      'Payment terms set when money is actually due. Long terms move the cash-flow burden onto you. Pay-when-paid clauses make your payment conditional on your client being paid by someone else.',
    whatToCheck: [
      'How many days from invoice, and does the clock start on receipt or on approval?',
      'Is payment conditional on anything outside your control?',
      'Is there interest or a fee on late payment?',
      'Is a deposit or milestone schedule specified?',
    ],
  },
  {
    id: 'acceptance-satisfaction',
    label: 'Subjective acceptance',
    category: 'scope',
    attention: 'medium',
    patterns: [
      /\b(?:sole|absolute)\s+(?:and\s+absolute\s+)?discretion\b/i,
      /\bsatisfactory\s+to\s+(?:the\s+)?client\b/i,
      /\bacceptance\s+(?:criteria|by\s+the\s+client)\b/i,
      /\bto\s+(?:the\s+)?client'?s?\s+satisfaction\b/i,
    ],
    whatItMeans:
      'Acceptance provisions decide when work counts as delivered. When acceptance rests on subjective satisfaction rather than defined criteria, payment can be withheld on taste rather than on whether you met the spec.',
    whatToCheck: [
      'Are there objective, written acceptance criteria?',
      'Is there a deadline after which work is deemed accepted?',
      'What happens to payment during a rejection dispute?',
    ],
  },
  {
    id: 'termination-convenience',
    label: 'Termination for convenience',
    category: 'termination',
    attention: 'medium',
    patterns: [
      /\btermination\s+for\s+convenience\b/i,
      /\bterminate\b[^.]{0,60}\b(?:for\s+any\s+reason|without\s+cause|at\s+any\s+time)\b/i,
      /\bwithout\s+cause\b/i,
      /\bimmediate(?:ly)?\s+terminat/i,
    ],
    whatItMeans:
      'Termination for convenience lets a party end the agreement without the other having done anything wrong. Whether you are paid for work already done, or for work in progress, depends on what the clause says.',
    whatToCheck: [
      'How much notice is required, and is it the same both ways?',
      'Are you paid for work completed and work in progress on termination?',
      'Is there a cancellation or kill fee?',
      'What happens to IP and to unpaid invoices?',
    ],
  },
  {
    id: 'non-compete',
    label: 'Non-compete or exclusivity',
    category: 'restrictions',
    attention: 'high',
    patterns: [
      /\bnon-?compet(?:e|ition)\b/i,
      /\brestrictive\s+covenant\b/i,
      /\bshall\s+not\b[^.]{0,80}\b(?:compet(?:e|ing)|similar\s+services)\b/i,
      /\bexclusiv(?:e|ity)\b[^.]{0,60}\b(?:services|engagement|basis)\b/i,
    ],
    whatItMeans:
      'These provisions restrict who else you can work for, and sometimes for how long after the engagement ends. Their enforceability against an independent contractor varies significantly by jurisdiction.',
    whatToCheck: [
      'How wide is the restriction — named competitors, or an entire industry?',
      'How long does it last after the contract ends?',
      'What geographic area does it cover?',
      'Is it enforceable where you and the client are located? This differs by country and, in the US, by state.',
    ],
  },
  {
    id: 'non-solicit',
    label: 'Non-solicitation',
    category: 'restrictions',
    attention: 'low',
    patterns: [
      /\bnon-?solicit(?:ation)?\b/i,
      /\b(?:shall\s+not|agrees?\s+not\s+to)\s+solicit\b/i,
    ],
    whatItMeans:
      'Non-solicitation clauses restrict approaching the other party\'s clients or staff. They are usually narrower than non-competes.',
    whatToCheck: [
      'Does it cover clients you brought to the relationship yourself?',
      'How long does it run after the engagement?',
    ],
  },
  {
    id: 'confidentiality',
    label: 'Confidentiality',
    category: 'confidentiality',
    attention: 'low',
    patterns: [
      /\bconfidential(?:ity)?\s+(?:information|obligations?)\b/i,
      /\bnon-?disclosure\b/i,
      /\btrade\s+secrets?\b/i,
    ],
    whatItMeans:
      'Confidentiality obligations restrict what you can disclose about the client and the work. Broad versions can prevent you from naming the client at all.',
    whatToCheck: [
      'Is it mutual?',
      'How long do the obligations last?',
      'Are the standard carve-outs present, such as information already public?',
      'Does it prevent you from listing the client or the work in your portfolio?',
    ],
  },
  {
    id: 'governing-law',
    label: 'Governing law and jurisdiction',
    category: 'dispute-resolution',
    attention: 'medium',
    patterns: [
      /\bgoverned\s+by\s+the\s+laws?\s+of\b/i,
      /\b(?:exclusive\s+)?jurisdiction\s+of\b/i,
      /\bvenue\b[^.]{0,40}\bcourts?\b/i,
      /\bchoice\s+of\s+law\b/i,
    ],
    whatItMeans:
      'These clauses set which country or state\'s law applies and where a dispute has to be heard. If that venue is far from you, enforcing a claim over an unpaid invoice can cost more than the invoice.',
    whatToCheck: [
      'Where would you physically have to bring or defend a claim?',
      'Is the cost of doing so proportionate to the contract value?',
      'Is there a cheaper first step, such as mediation?',
    ],
  },
  {
    id: 'arbitration',
    label: 'Arbitration',
    category: 'dispute-resolution',
    attention: 'medium',
    patterns: [
      /\bbinding\s+arbitration\b/i,
      /\barbitration\b[^.]{0,60}\b(?:rules|tribunal|arbitrator)\b/i,
      /\bwaive[sd]?\b[^.]{0,40}\b(?:jury|class\s+action)\b/i,
    ],
    whatItMeans:
      'An arbitration clause sends disputes to a private arbitrator instead of a court. It can be faster, but filing fees and the arbitrator\'s costs are often significant relative to a freelance invoice.',
    whatToCheck: [
      'Who pays the arbitrator, and what are the filing fees?',
      'Where does the arbitration take place?',
      'Are small claims carved out so you can still use a small-claims court?',
    ],
  },
  {
    id: 'unlimited-revisions',
    label: 'Revisions and scope',
    category: 'scope',
    attention: 'medium',
    patterns: [
      /\bunlimited\s+revisions?\b/i,
      /\bas\s+(?:many|often)\s+(?:revisions?|changes?)\s+as\b/i,
      /\brevisions?\b[^.]{0,50}\bat\s+no\s+(?:additional\s+)?(?:cost|charge)\b/i,
    ],
    whatItMeans:
      'Revision terms determine where included work stops and additional paid work begins. Open-ended revision language makes the true scope of the project undefined.',
    whatToCheck: [
      'Is the number of revision rounds capped?',
      'Is a "revision" defined, as distinct from new work?',
      'What is the rate for work beyond the included rounds?',
    ],
  },
];

/* -------------------------------------------------------------------------- */
/* Protective provisions we check for the ABSENCE of                          */
/* -------------------------------------------------------------------------- */

const PROTECTIONS: ProtectionDefinition[] = [
  {
    id: 'payment-schedule',
    label: 'A stated payment deadline',
    patterns: [
      /\bnet\s*\d{1,3}\b/i,
      /\bwithin\s+(?:\w+\s+)?(?:\(\d+\)\s+)?days\b/i,
      /\bdue\s+(?:on|upon|within)\b/i,
      /\bpayment\s+schedule\b/i,
      /\bmilestone\b/i,
    ],
    whyItMatters:
      'Without a stated deadline, there is no clear point at which an invoice is late, which makes late fees and collection much harder to pursue.',
  },
  {
    id: 'liability-cap-present',
    label: 'A cap on your liability',
    patterns: [
      /\blimitation\s+of\s+liability\b/i,
      /\b(?:total|aggregate|maximum)\s+liability\b/i,
      /\bshall\s+not\s+exceed\b/i,
    ],
    whyItMatters:
      'With no cap, your theoretical exposure is unlimited, even where the contract value is small.',
  },
  {
    id: 'termination-rights',
    label: 'A termination clause',
    patterns: [/\bterminat(?:e|ion)\b/i, /\bnotice\s+period\b/i],
    whyItMatters:
      'Without termination terms, how either party exits and what happens to unpaid work is left unresolved.',
  },
  {
    id: 'ip-on-payment',
    label: 'IP transfer tied to payment',
    patterns: [
      /\b(?:upon|after|subject\s+to)\s+(?:full\s+)?payment\b/i,
      /\bpaid\s+in\s+full\b/i,
    ],
    whyItMatters:
      'If ownership transfers on delivery rather than on payment, a client can use the work while an invoice is still outstanding.',
  },
  {
    id: 'late-fee',
    label: 'Interest or a fee on late payment',
    patterns: [
      /\blate\s+(?:fee|charge|payment\s+(?:fee|interest))\b/i,
      /\binterest\b[^.]{0,60}\b(?:overdue|late|unpaid)\b/i,
      /\bper\s+(?:month|annum)\b[^.]{0,40}\boverdue\b/i,
    ],
    whyItMatters:
      'A stated late fee gives you something concrete to invoke when payment slips, rather than relying on goodwill.',
  },
  {
    id: 'scope-definition',
    label: 'A defined scope of work',
    patterns: [
      /\bscope\s+of\s+(?:work|services)\b/i,
      /\bstatement\s+of\s+work\b/i,
      /\bdeliverables?\b/i,
      /\bexhibit\s+[a-z]\b/i,
      /\bschedule\s+\d\b/i,
    ],
    whyItMatters:
      'Without a defined scope or a referenced statement of work, there is no agreed line between the project and additional work.',
  },
];

/* -------------------------------------------------------------------------- */
/* Scanning                                                                   */
/* -------------------------------------------------------------------------- */

const MIN_WORDS = 120;
const MAX_CHARS = 400_000; // ~60k words; guards against pathological input

const LIMITATIONS: string[] = [
  'This tool matches text patterns. It does not read or interpret your contract, and it has no knowledge of the law that governs it.',
  'It can miss clauses written in unusual wording, and it can flag ordinary provisions that are not a problem in context.',
  'A clause being flagged does not mean it is unfair, and a clause not being flagged does not mean the contract is safe.',
  'Nothing here is legal advice. For an agreement that matters, have a qualified lawyer in the relevant jurisdiction review it.',
];

/** Pulls a readable snippet of context around a match. */
function extractExcerpt(text: string, index: number, matchLength: number): string {
  const before = 90;
  const after = 130;
  const start = Math.max(0, index - before);
  const end = Math.min(text.length, index + matchLength + after);

  let snippet = text.slice(start, end).replace(/\s+/g, ' ').trim();
  if (start > 0) snippet = `…${snippet}`;
  if (end < text.length) snippet = `${snippet}…`;
  return snippet;
}

function findExcerpts(text: string, patterns: RegExp[], limit = 2): string[] {
  const excerpts: string[] = [];

  for (const pattern of patterns) {
    // Clone with the global flag so we can walk every occurrence.
    const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
    const rx = new RegExp(pattern.source, flags);

    let match: RegExpExecArray | null;
    while ((match = rx.exec(text)) !== null) {
      excerpts.push(extractExcerpt(text, match.index, match[0].length));
      if (excerpts.length >= limit) return excerpts;
      // Guard against zero-length matches looping forever.
      if (match.index === rx.lastIndex) rx.lastIndex += 1;
    }
  }

  return excerpts;
}

function matchesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

/**
 * Scans contract text for known clause types and for missing protections.
 *
 * Synchronous work, async signature: kept as a Promise so a future WebLLM or
 * WASM-backed analyser can be swapped in without changing every call site.
 * There is no artificial delay.
 */
export async function analyzeContract(rawText: string): Promise<ScanResult> {
  const text = String(rawText ?? '').slice(0, MAX_CHARS);
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  const detected: DetectedClause[] = CLAUSES.flatMap((clause) => {
    const excerpts = findExcerpts(text, clause.patterns);
    if (excerpts.length === 0) return [];

    return [
      {
        id: clause.id,
        label: clause.label,
        category: clause.category,
        attention: clause.attention,
        whatItMeans: clause.whatItMeans,
        whatToCheck: clause.whatToCheck,
        excerpts,
      },
    ];
  });

  const counts: Record<Severity, number> = { high: 0, medium: 0, low: 0 };
  for (const clause of detected) counts[clause.attention] += 1;

  // Only report missing protections when there is enough text for their absence
  // to mean anything. On a 20-word paste, everything is "missing".
  const inconclusive = wordCount < MIN_WORDS;

  const missingProtections: MissingProtection[] = inconclusive
    ? []
    : PROTECTIONS.filter((p) => !matchesAny(text, p.patterns)).map((p) => ({
        id: p.id,
        label: p.label,
        whyItMatters: p.whyItMatters,
      }));

  return {
    detected,
    missingProtections,
    counts,
    wordCount,
    inconclusive,
    limitations: LIMITATIONS,
  };
}

/** Number of clause types the scanner knows about. Shown in the UI for honesty. */
export const CLAUSE_COVERAGE_COUNT = CLAUSES.length;

/** Labels of everything checked, so users can see the scope of the check. */
export const CLAUSE_COVERAGE_LABELS = CLAUSES.map((c) => c.label);
