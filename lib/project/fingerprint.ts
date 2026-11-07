// lib/project/fingerprint.ts
// SHA-256 over a canonical (key-sorted) JSON form of the plan. Any later edit
// produces a different fingerprint, so a changed copy is easy to spot.
// This is tamper-EVIDENCE between two honest parties, not a signature.

import type { ProjectPlan } from '@/types/project';

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, k) => {
        acc[k] = canonical((value as Record<string, unknown>)[k]);
        return acc;
      }, {});
  }
  return value;
}

export function canonicalJson(plan: ProjectPlan): string {
  return JSON.stringify(canonical(plan));
}

export async function fingerprintPlan(plan: ProjectPlan): Promise<string> {
  const data = new TextEncoder().encode(canonicalJson(plan));
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error('This browser cannot compute a fingerprint (Web Crypto unavailable).');
  }
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Groups a hash for reading aloud or comparing by eye: "3f9a 81c2 …". */
export function formatFingerprint(hash: string, groups = 8): string {
  return (hash.match(/.{1,4}/g) ?? []).slice(0, groups).join(' ');
}
