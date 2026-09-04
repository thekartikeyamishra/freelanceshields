"use client";

// lib/hooks/useInvoice.ts
//
// Owns invoice state, persistence and item mutation so the page and the form
// components stay presentational. Previously this logic lived in the page,
// which is why the form and preview had to share a hand-passed prop soup.

import { useCallback, useMemo } from "react";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";
import { DEFAULT_CURRENCY } from "@/lib/utils/currency";
import { calculateTotals } from "@/lib/utils/invoiceMath";
import type { InvoiceData, InvoiceItem, InvoiceTotals } from "@/types/invoice";

const STORAGE_KEY = "invoice-draft-v2";

/** Stable id generator that works without crypto.randomUUID on older Safari. */
function makeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function isoInDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function createEmptyItem(): InvoiceItem {
  return { id: makeId(), description: "", quantity: 1, rate: 0 };
}

/**
 * Fresh invoice. Dates are computed at call time, not module load, so a
 * long-lived tab does not hand out a stale "today".
 */
export function createDefaultInvoice(): InvoiceData {
  return {
    invoiceNumber: "INV-001",
    issueDate: isoToday(),
    dueDate: isoInDays(14),
    currency: DEFAULT_CURRENCY,
    sender: { name: "", email: "", address: "", taxId: "" },
    client: { name: "", email: "", address: "", taxId: "" },
    items: [createEmptyItem()],
    taxLabel: "Tax",
    taxRate: 0,
    reverseCharge: false,
    discountMode: "amount",
    discountValue: 0,
    placeOfSupply: "",
    notes: "",
    paymentInstructions: "",
  };
}

export interface UseInvoiceResult {
  data: InvoiceData;
  totals: InvoiceTotals;
  hydrated: boolean;
  setField: <K extends keyof InvoiceData>(field: K, value: InvoiceData[K]) => void;
  setParty: (
    party: "sender" | "client",
    field: keyof InvoiceData["sender"],
    value: string,
  ) => void;
  updateItem: (
    id: string,
    field: keyof Omit<InvoiceItem, "id">,
    value: string | number,
  ) => void;
  addItem: () => void;
  removeItem: (id: string) => void;
  reset: () => void;
}

export function useInvoice(): UseInvoiceResult {
  const { value, setValue, remove, hydrated } = useLocalStorage<InvoiceData>(
    STORAGE_KEY,
    createDefaultInvoice(),
  );

  const setField = useCallback(
    <K extends keyof InvoiceData>(field: K, next: InvoiceData[K]) => {
      setValue((current) => ({ ...current, [field]: next }));
    },
    [setValue],
  );

  const setParty = useCallback(
    (party: "sender" | "client", field: keyof InvoiceData["sender"], next: string) => {
      setValue((current) => ({
        ...current,
        [party]: { ...current[party], [field]: next },
      }));
    },
    [setValue],
  );

  const updateItem = useCallback(
    (id: string, field: keyof Omit<InvoiceItem, "id">, next: string | number) => {
      setValue((current) => ({
        ...current,
        items: current.items.map((item) =>
          item.id === id ? { ...item, [field]: next } : item,
        ),
      }));
    },
    [setValue],
  );

  const addItem = useCallback(() => {
    setValue((current) => ({ ...current, items: [...current.items, createEmptyItem()] }));
  }, [setValue]);

  const removeItem = useCallback(
    (id: string) => {
      setValue((current) => {
        const remaining = current.items.filter((item) => item.id !== id);
        // Never leave the table with zero rows; an empty table is a dead end.
        return {
          ...current,
          items: remaining.length > 0 ? remaining : [createEmptyItem()],
        };
      });
    },
    [setValue],
  );

  const totals = useMemo(() => calculateTotals(value), [value]);

  return {
    data: value,
    totals,
    hydrated,
    setField,
    setParty,
    updateItem,
    addItem,
    removeItem,
    reset: remove,
  };
}
