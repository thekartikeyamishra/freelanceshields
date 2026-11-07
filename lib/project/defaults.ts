// lib/project/defaults.ts
// Starting points only. Every field stays editable; applying a template never
// silently adds contractual terms — it fills scope and milestones the user
// then reviews, and the protection check flags anything left vague.

import type { Milestone, ProjectPlan, ScopeItem } from '@/types/project';
import { DEFAULT_CURRENCY } from '@/lib/utils/currency';

export function makeId(prefix = 'id'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const today = () => new Date().toISOString().slice(0, 10);
const inDays = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

export function emptyMilestone(partial: Partial<Milestone> = {}): Milestone {
  return {
    id: makeId('ms'),
    title: '',
    amount: 0,
    dueDate: '',
    upfront: false,
    revisions: 2,
    reviewDays: 5,
    ...partial,
  };
}

export function emptyScopeItem(milestoneId: string | null = null): ScopeItem {
  return { id: makeId('sc'), title: '', acceptance: '', milestoneId };
}

export function createDefaultPlan(): ProjectPlan {
  const deposit = emptyMilestone({ title: 'Deposit', upfront: true, revisions: 0, reviewDays: 0, dueDate: today() });
  const delivery = emptyMilestone({ title: 'Final delivery', dueDate: inDays(30) });
  return {
    title: '',
    summary: '',
    currency: DEFAULT_CURRENCY,
    freelancer: { name: '', email: '' },
    client: { name: '', email: '' },
    startDate: today(),
    endDate: inDays(30),
    scope: [emptyScopeItem(delivery.id)],
    milestones: [deposit, delivery],
    terms: {
      paymentDays: 15,
      lateFeePercentMonthly: 1.5,
      ipOnFullPayment: true,
      portfolioUse: true,
      confidentiality: true,
      terminationNoticeDays: 7,
      killFeePercent: 25,
      governingLaw: '',
    },
  };
}

interface TemplateDef {
  id: string;
  label: string;
  milestones: Array<{ title: string; share: number; upfront?: boolean; days: number }>;
  scope: Array<{ title: string; acceptance: string; milestoneIndex: number }>;
}

export const TEMPLATES: TemplateDef[] = [
  {
    id: 'website',
    label: 'Website build',
    milestones: [
      { title: 'Deposit', share: 0.3, upfront: true, days: 0 },
      { title: 'Design approved', share: 0.3, days: 14 },
      { title: 'Site launched', share: 0.4, days: 35 },
    ],
    scope: [
      { title: 'Homepage and up to 4 inner page designs', acceptance: 'Client approves designs in writing, within included revision rounds', milestoneIndex: 1 },
      { title: 'Responsive build of approved designs', acceptance: 'Pages render correctly on current Chrome, Safari and Firefox at 375px and 1440px', milestoneIndex: 2 },
      { title: 'Deployment to client hosting', acceptance: 'Site live on client domain over HTTPS', milestoneIndex: 2 },
    ],
  },
  {
    id: 'design',
    label: 'Brand / graphic design',
    milestones: [
      { title: 'Deposit', share: 0.5, upfront: true, days: 0 },
      { title: 'Final files delivered', share: 0.5, days: 21 },
    ],
    scope: [
      { title: 'Two initial logo concepts', acceptance: 'Two distinct concepts presented as PDF', milestoneIndex: 1 },
      { title: 'Final logo in SVG, PNG and PDF', acceptance: 'Files delivered for the chosen concept in all three formats', milestoneIndex: 1 },
    ],
  },
  {
    id: 'writing',
    label: 'Content writing',
    milestones: [
      { title: 'Deposit', share: 0.25, upfront: true, days: 0 },
      { title: 'First half delivered', share: 0.35, days: 10 },
      { title: 'Second half delivered', share: 0.4, days: 20 },
    ],
    scope: [
      { title: 'Articles 1–4, ~1,200 words each', acceptance: 'Delivered as Google Docs, on agreed topics, original and unpublished', milestoneIndex: 1 },
      { title: 'Articles 5–8, ~1,200 words each', acceptance: 'Delivered as Google Docs, on agreed topics, original and unpublished', milestoneIndex: 2 },
    ],
  },
  {
    id: 'app',
    label: 'Mobile app development',
    milestones: [
      { title: 'Deposit', share: 0.2, upfront: true, days: 0 },
      { title: 'Clickable prototype', share: 0.2, days: 14 },
      { title: 'Beta build', share: 0.3, days: 45 },
      { title: 'Store release', share: 0.3, days: 70 },
    ],
    scope: [
      { title: 'Clickable prototype of agreed screens', acceptance: 'Prototype link covers every screen in the agreed screen list', milestoneIndex: 1 },
      { title: 'Beta build with agreed features', acceptance: 'Installable test build; each agreed feature demonstrable', milestoneIndex: 2 },
      { title: 'Submission to app stores', acceptance: 'Build submitted under the client’s developer accounts', milestoneIndex: 3 },
    ],
  },
];

/** Applies a template to a plan, keeping parties, terms and budget intent. */
export function applyTemplate(plan: ProjectPlan, templateId: string, budget: number): ProjectPlan {
  const t = TEMPLATES.find((x) => x.id === templateId);
  if (!t) return plan;
  const total = Number.isFinite(budget) && budget > 0 ? budget : 0;

  const milestones = t.milestones.map((m) =>
    emptyMilestone({
      title: m.title,
      amount: Math.round(total * m.share * 100) / 100,
      upfront: Boolean(m.upfront),
      dueDate: m.days === 0 ? plan.startDate || today() : inDays(m.days),
      revisions: m.upfront ? 0 : 2,
      reviewDays: m.upfront ? 0 : 5,
    }),
  );

  // Fix rounding so milestone amounts sum exactly to the budget.
  if (total > 0) {
    const sum = milestones.reduce((a, m) => a + m.amount, 0);
    const diff = Math.round((total - sum) * 100) / 100;
    milestones[milestones.length - 1].amount = Math.round((milestones[milestones.length - 1].amount + diff) * 100) / 100;
  }

  const scope = t.scope.map((s) => ({
    id: makeId('sc'),
    title: s.title,
    acceptance: s.acceptance,
    milestoneId: milestones[s.milestoneIndex]?.id ?? null,
  }));

  return { ...plan, milestones, scope };
}
