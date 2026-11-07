// lib/project/protection.ts
// Plain rules that flag where a plan leaves either side exposed. No score —
// for the same reason the contract scanner has none: a number would imply a
// precision these checks do not have. Every finding says what to change.

import type { ProjectPlan } from '@/types/project';

export type IssueLevel = 'high' | 'medium' | 'low';

export interface PlanIssue {
  id: string;
  level: IssueLevel;
  /** Who the gap mainly exposes. */
  protects: 'freelancer' | 'client' | 'both';
  message: string;
  fix: string;
}

export function checkPlan(plan: ProjectPlan): PlanIssue[] {
  const issues: PlanIssue[] = [];
  const add = (i: PlanIssue) => issues.push(i);

  if (!plan.client.name.trim()) {
    add({ id: 'client-name', level: 'high', protects: 'both', message: 'The client is not named.', fix: 'Add the client’s legal or trading name.' });
  }
  if (!plan.freelancer.name.trim()) {
    add({ id: 'freelancer-name', level: 'high', protects: 'both', message: 'The freelancer is not named.', fix: 'Add your legal or trading name.' });
  }
  if (plan.startDate && plan.endDate && plan.endDate < plan.startDate) {
    add({ id: 'dates', level: 'high', protects: 'both', message: 'The end date is before the start date.', fix: 'Correct the project dates.' });
  }
  if (plan.milestones.length === 0) {
    add({ id: 'no-milestones', level: 'high', protects: 'freelancer', message: 'There are no milestones, so there is no payment schedule.', fix: 'Add at least one paid milestone.' });
  }

  plan.scope.forEach((s, i) => {
    const label = s.title.trim() || `Scope item ${i + 1}`;
    if (!s.title.trim()) {
      add({ id: `scope-title-${s.id}`, level: 'medium', protects: 'both', message: `${label} has no description.`, fix: 'Describe what will be delivered.' });
    }
    if (!s.acceptance.trim()) {
      add({ id: `scope-acc-${s.id}`, level: 'high', protects: 'both', message: `“${label}” has no acceptance criteria.`, fix: 'Write how both sides will know it is done. This prevents most approval disputes.' });
    }
    if (!s.milestoneId || !plan.milestones.some((m) => m.id === s.milestoneId)) {
      add({ id: `scope-ms-${s.id}`, level: 'high', protects: 'freelancer', message: `“${label}” is not attached to a paid milestone.`, fix: 'Assign it to a milestone so it is clear when it gets paid.' });
    }
  });

  if (plan.milestones.length > 0 && !plan.milestones.some((m) => m.upfront && m.amount > 0)) {
    add({ id: 'no-deposit', level: 'medium', protects: 'freelancer', message: 'No upfront deposit.', fix: 'Consider a deposit milestone payable before work begins.' });
  }

  plan.milestones.forEach((m, i) => {
    const label = m.title.trim() || `Milestone ${i + 1}`;
    if (!(m.amount > 0)) {
      add({ id: `ms-amt-${m.id}`, level: 'medium', protects: 'freelancer', message: `“${label}” has no amount.`, fix: 'Set what this milestone pays.' });
    }
    if (!m.dueDate) {
      add({ id: `ms-date-${m.id}`, level: 'medium', protects: 'both', message: `“${label}” has no due date.`, fix: 'Set a date so lateness is unambiguous on both sides.' });
    }
    if (!m.upfront && m.reviewDays <= 0) {
      add({ id: `ms-review-${m.id}`, level: 'medium', protects: 'freelancer', message: `“${label}” has no review deadline.`, fix: 'Give the client a fixed number of days to approve or request revisions.' });
    }
    if (!m.upfront && !plan.scope.some((s) => s.milestoneId === m.id)) {
      add({ id: `ms-empty-${m.id}`, level: 'low', protects: 'client', message: `“${label}” has no scope items.`, fix: 'Attach the deliverables this payment is for.' });
    }
  });

  const t = plan.terms;
  if (!t.ipOnFullPayment) {
    add({ id: 'ip', level: 'high', protects: 'freelancer', message: 'IP transfers before you are paid in full.', fix: 'Tie ownership transfer to payment in full.' });
  }
  if (t.paymentDays > 30) {
    add({ id: 'payment-days', level: 'medium', protects: 'freelancer', message: `Invoices are payable in ${t.paymentDays} days.`, fix: 'Shorter terms (15–30 days) reduce cash-flow risk.' });
  }
  if (!(t.lateFeePercentMonthly > 0)) {
    add({ id: 'late-fee', level: 'low', protects: 'freelancer', message: 'No late-payment fee.', fix: 'A stated late fee gives you something concrete to invoke.' });
  }
  if (!(t.terminationNoticeDays > 0)) {
    add({ id: 'notice', level: 'medium', protects: 'both', message: 'No termination notice period.', fix: 'Agree how many days’ notice either side must give.' });
  }
  if (!(t.killFeePercent > 0)) {
    add({ id: 'kill-fee', level: 'medium', protects: 'freelancer', message: 'No cancellation fee.', fix: 'Agree what is owed for work in progress if the client cancels.' });
  }
  if (!t.governingLaw.trim()) {
    add({ id: 'law', level: 'medium', protects: 'both', message: 'No governing law or venue.', fix: 'Name the country (and city) whose law and courts apply.' });
  }

  const order: Record<IssueLevel, number> = { high: 0, medium: 1, low: 2 };
  return issues.sort((a, b) => order[a.level] - order[b.level]);
}

export function planTotal(plan: ProjectPlan): number {
  const cents = plan.milestones.reduce((a, m) => a + Math.round((Number(m.amount) || 0) * 100), 0);
  return cents / 100;
}
