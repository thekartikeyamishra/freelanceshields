"use client";

// lib/hooks/useProjectPlan.ts — plan state + locked version history, on-device.

import { useCallback, useMemo } from "react";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";
import { createDefaultPlan, emptyMilestone, emptyScopeItem } from "@/lib/project/defaults";
import { checkPlan, planTotal } from "@/lib/project/protection";
import { fingerprintPlan } from "@/lib/project/fingerprint";
import type { LockedVersion, Milestone, ProjectPlan, ProjectTerms, ScopeItem } from "@/types/project";

const PLAN_KEY = "project-plan-v1";
const VERSIONS_KEY = "project-versions-v1";
/** Bounded so storage cannot grow without limit. */
const MAX_VERSIONS = 20;

export function useProjectPlan() {
  const { value: plan, setValue: setPlan, remove: removePlan, hydrated } =
    useLocalStorage<ProjectPlan>(PLAN_KEY, createDefaultPlan());
  const { value: versions, setValue: setVersions, remove: removeVersions } =
    useLocalStorage<LockedVersion[]>(VERSIONS_KEY, []);

  const set = useCallback(<K extends keyof ProjectPlan>(k: K, v: ProjectPlan[K]) => {
    setPlan((p) => ({ ...p, [k]: v }));
  }, [setPlan]);

  const setParty = useCallback((who: "freelancer" | "client", field: "name" | "email", v: string) => {
    setPlan((p) => ({ ...p, [who]: { ...p[who], [field]: v } }));
  }, [setPlan]);

  const setTerm = useCallback(<K extends keyof ProjectTerms>(k: K, v: ProjectTerms[K]) => {
    setPlan((p) => ({ ...p, terms: { ...p.terms, [k]: v } }));
  }, [setPlan]);

  const updateScope = useCallback((id: string, patch: Partial<ScopeItem>) => {
    setPlan((p) => ({ ...p, scope: p.scope.map((s) => (s.id === id ? { ...s, ...patch } : s)) }));
  }, [setPlan]);

  const addScope = useCallback(() => {
    setPlan((p) => ({ ...p, scope: [...p.scope, emptyScopeItem(p.milestones.find((m) => !m.upfront)?.id ?? null)] }));
  }, [setPlan]);

  const removeScope = useCallback((id: string) => {
    setPlan((p) => ({ ...p, scope: p.scope.filter((s) => s.id !== id) }));
  }, [setPlan]);

  const updateMilestone = useCallback((id: string, patch: Partial<Milestone>) => {
    setPlan((p) => ({ ...p, milestones: p.milestones.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));
  }, [setPlan]);

  const addMilestone = useCallback(() => {
    setPlan((p) => ({ ...p, milestones: [...p.milestones, emptyMilestone()] }));
  }, [setPlan]);

  const removeMilestone = useCallback((id: string) => {
    // Detach scope rather than deleting it; the check then flags it.
    setPlan((p) => ({
      ...p,
      milestones: p.milestones.filter((m) => m.id !== id),
      scope: p.scope.map((s) => (s.milestoneId === id ? { ...s, milestoneId: null } : s)),
    }));
  }, [setPlan]);

  const lockVersion = useCallback(async (note: string): Promise<LockedVersion> => {
    const snapshot: ProjectPlan = JSON.parse(JSON.stringify(plan));
    const hash = await fingerprintPlan(snapshot);
    const latest = versions[versions.length - 1];
    if (latest && latest.hash === hash) return latest; // nothing changed
    const entry: LockedVersion = {
      version: (latest?.version ?? 0) + 1,
      lockedAt: new Date().toISOString(),
      hash,
      note: note.trim().slice(0, 200),
      snapshot,
    };
    setVersions((v) => [...v, entry].slice(-MAX_VERSIONS));
    return entry;
  }, [plan, versions, setVersions]);

  const issues = useMemo(() => checkPlan(plan), [plan]);
  const total = useMemo(() => planTotal(plan), [plan]);

  const reset = useCallback(() => {
    removePlan();
    removeVersions();
  }, [removePlan, removeVersions]);

  return {
    plan, setPlan, hydrated, versions, issues, total,
    set, setParty, setTerm,
    updateScope, addScope, removeScope,
    updateMilestone, addMilestone, removeMilestone,
    lockVersion, reset,
  };
}
