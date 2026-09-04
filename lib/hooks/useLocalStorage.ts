"use client";

// lib/hooks/useLocalStorage.ts
//
// Persists state to localStorage with cross-tab sync.
//
// IMPORTANT CORRECTION TO OUR OWN PRIVACY COPY:
// localStorage is DISK, not RAM. It survives closing the tab and closing the
// browser. The privacy policy previously said data was processed "entirely
// within your browser's Random Access Memory (RAM)", which was inaccurate.
// The accurate claim is: data stays on your device and is never transmitted.
//
// Because the data does persist, the user needs a way to erase it. That is what
// `remove` and `clearNamespace` are for, and the UI must expose a visible
// control that calls them.

import { useCallback, useEffect, useState } from "react";

/**
 * All keys are namespaced so `clearNamespace()` can wipe our data without
 * touching anything else on the origin.
 */
const NAMESPACE = "fs:";

const SYNC_EVENT = "fs:local-storage";

function namespaced(key: string): string {
  return key.startsWith(NAMESPACE) ? key : `${NAMESPACE}${key}`;
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/** Reads and parses a namespaced key, returning the fallback on any failure. */
function readKey<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(namespaced(key));
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    // Corrupt or non-JSON value. Drop it rather than crashing the tool.
    try {
      window.localStorage.removeItem(namespaced(key));
    } catch {
      /* storage unavailable — nothing further to do */
    }
    return fallback;
  }
}

export interface UseLocalStorageResult<T> {
  value: T;
  setValue: (next: T | ((current: T) => T)) => void;
  /** Deletes this key and resets state to the initial value. */
  remove: () => void;
  /**
   * False until the first client-side read completes. Use it to avoid
   * rendering persisted content during hydration, which would mismatch.
   */
  hydrated: boolean;
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): UseLocalStorageResult<T> {
  // Start from initialValue on both server and client so the first client
  // render matches the server HTML. Real values arrive in the effect below.
  const [value, setStoredValue] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!isBrowser()) return;

    setStoredValue(readKey(key, initialValue));
    setHydrated(true);

    const onChange = (event: Event) => {
      // Cross-tab StorageEvent: ignore keys that are not ours.
      if (event instanceof StorageEvent && event.key && event.key !== namespaced(key)) {
        return;
      }
      setStoredValue(readKey(key, initialValue));
    };

    window.addEventListener("storage", onChange);
    window.addEventListener(SYNC_EVENT, onChange);

    return () => {
      window.removeEventListener("storage", onChange);
      window.removeEventListener(SYNC_EVENT, onChange);
    };
    // initialValue is intentionally excluded: callers commonly pass an inline
    // object literal, which would re-subscribe on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const setValue = useCallback(
    (next: T | ((current: T) => T)) => {
      setStoredValue((current) => {
        const resolved =
          typeof next === "function" ? (next as (c: T) => T)(current) : next;

        if (isBrowser()) {
          try {
            window.localStorage.setItem(namespaced(key), JSON.stringify(resolved));
            // Notify other components in this same tab.
            window.dispatchEvent(new Event(SYNC_EVENT));
          } catch {
            // Quota exceeded or storage disabled (private browsing on some
            // platforms). State still updates, so the tool keeps working for
            // this session; it just will not persist.
          }
        }

        return resolved;
      });
    },
    [key],
  );

  const remove = useCallback(() => {
    if (isBrowser()) {
      try {
        window.localStorage.removeItem(namespaced(key));
        window.dispatchEvent(new Event(SYNC_EVENT));
      } catch {
        /* storage unavailable */
      }
    }
    setStoredValue(initialValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { value, setValue, remove, hydrated };
}

/**
 * Erases every value this site has stored on the device.
 * Wire this to a visible "Delete my saved data" control — a privacy claim needs
 * a matching control, not just a sentence in the policy.
 *
 * @returns the number of keys removed
 */
export function clearNamespace(): number {
  if (!isBrowser()) return 0;

  try {
    const doomed: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(NAMESPACE)) doomed.push(key);
    }
    doomed.forEach((key) => window.localStorage.removeItem(key));
    window.dispatchEvent(new Event(SYNC_EVENT));
    return doomed.length;
  } catch {
    return 0;
  }
}

/** Lists what is currently stored, so the UI can show it before erasing. */
export function listStoredKeys(): string[] {
  if (!isBrowser()) return [];
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(NAMESPACE)) keys.push(key.slice(NAMESPACE.length));
    }
    return keys;
  } catch {
    return [];
  }
}
