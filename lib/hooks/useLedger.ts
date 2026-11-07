"use client";

// lib/hooks/useLedger.ts — the invoice ledger, persisted on this device only.

import { useCallback, useMemo } from "react";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";
import {
  upsertInvoice,
  summarize,
  isoDate,
  type LedgerEntry,
  type LedgerStatus,
} from "@/lib/ledger/ledger";
import type { InvoiceData } from "@/types/invoice";

export const LEDGER_KEY = "ledger-v1";

/** Writes outside React (e.g. from the PDF handler) use the same key and event. */
export function saveInvoiceToLedger(invoice: InvoiceData): void {
  try {
    const key = `fs:${LEDGER_KEY}`;
    const raw = window.localStorage.getItem(key);
    const current = raw ? (JSON.parse(raw) as LedgerEntry[]) : [];
    const next = upsertInvoice(Array.isArray(current) ? current : [], invoice);
    window.localStorage.setItem(key, JSON.stringify(next));
    window.dispatchEvent(new Event("fs:local-storage"));
  } catch {
    /* storage unavailable — the PDF still downloaded */
  }
}

export function useLedger() {
  const { value: entries, setValue, hydrated } = useLocalStorage<LedgerEntry[]>(LEDGER_KEY, []);

  const list = Array.isArray(entries) ? entries : [];
  const summary = useMemo(() => summarize(list), [list]);

  const setStatus = useCallback(
    (id: string, status: LedgerStatus) =>
      setValue((cur) =>
        cur.map((e) =>
          e.id === id
            ? { ...e, status, paidAt: status === "paid" ? new Date().toISOString() : null, updatedAt: new Date().toISOString() }
            : e,
        ),
      ),
    [setValue],
  );

  const logReminder = useCallback(
    (id: string) =>
      setValue((cur) =>
        cur.map((e) => (e.id === id ? { ...e, reminders: [...e.reminders, isoDate()], updatedAt: new Date().toISOString() } : e)),
      ),
    [setValue],
  );

  const remove = useCallback((id: string) => setValue((cur) => cur.filter((e) => e.id !== id)), [setValue]);

  return { entries: list, summary, hydrated, setStatus, logReminder, remove };
}
