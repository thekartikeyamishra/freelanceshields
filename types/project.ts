// types/project.ts
//
// ProjectSafe planner data model. Everything here lives in the browser
// (localStorage) — there is no server, no account and no payment movement.
// Funding, escrow and disputes are deliberately out of scope: those require a
// licensed payment flow and belong in a separate product.

import type { CurrencyCode } from '@/lib/utils/currency';

export interface PlanParty {
  name: string;
  email: string;
}

export interface ScopeItem {
  id: string;
  title: string;
  /** How both sides will know this item is done. The single most protective field. */
  acceptance: string;
  /** Milestone this item is delivered in. null = unassigned (flagged as an error). */
  milestoneId: string | null;
}

export interface Milestone {
  id: string;
  title: string;
  /** Major units. */
  amount: number;
  /** ISO yyyy-mm-dd. Empty = no date (flagged). */
  dueDate: string;
  /** True when payable before work on it starts (a deposit). */
  upfront: boolean;
  /** Rounds of revisions included. */
  revisions: number;
  /** Days the client has to review a submission. 0 = no deadline (flagged). */
  reviewDays: number;
}

export interface ProjectTerms {
  /** Days from invoice to payment due. */
  paymentDays: number;
  /** Monthly late fee, percent. 0 = none (flagged). */
  lateFeePercentMonthly: number;
  /** IP transfers only once paid in full. */
  ipOnFullPayment: boolean;
  /** Freelancer may show the work in a portfolio. */
  portfolioUse: boolean;
  /** Mutual confidentiality. */
  confidentiality: boolean;
  /** Days' written notice either side must give to terminate. */
  terminationNoticeDays: number;
  /** Percent of the unpaid remainder owed if the client cancels. */
  killFeePercent: number;
  /** Free text, e.g. "Laws of India, courts at Bengaluru". */
  governingLaw: string;
}

export interface ProjectPlan {
  title: string;
  summary: string;
  currency: CurrencyCode;
  freelancer: PlanParty;
  client: PlanParty;
  startDate: string;
  endDate: string;
  scope: ScopeItem[];
  milestones: Milestone[];
  terms: ProjectTerms;
}

/**
 * An immutable snapshot. The hash is a SHA-256 fingerprint of the canonical
 * snapshot: if either party edits the plan afterwards, the fingerprint on the
 * new PDF will not match. That makes changes visible — it is NOT an electronic
 * signature and must never be described as one.
 */
export interface LockedVersion {
  version: number;
  lockedAt: string;
  hash: string;
  note: string;
  snapshot: ProjectPlan;
}
