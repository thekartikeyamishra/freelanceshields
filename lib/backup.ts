// lib/backup.ts
//
// One-file backup and restore of everything FreelanceShield keeps on this
// device. With no accounts, this is how a user moves to a new phone or laptop
// without losing their invoices. It is also an honest answer to "what if the
// site disappears?": the data is a plain JSON file the user owns.

const NAMESPACE = "fs:";
const FORMAT = "freelanceshield-backup";
const MAX_BYTES = 5_000_000;

/** Keys that are UI conveniences, not user data. They are not exported. */
const SKIP = new Set(["fs:consent-v1", "fs:pwa-prompt-dismissed"]);

export interface BackupFile {
  format: typeof FORMAT;
  version: 1;
  exportedAt: string;
  data: Record<string, unknown>;
}

export function createBackup(): BackupFile {
  const data: Record<string, unknown> = {};
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (!key || !key.startsWith(NAMESPACE) || SKIP.has(key)) continue;
    const raw = window.localStorage.getItem(key);
    if (raw === null) continue;
    try {
      data[key] = JSON.parse(raw);
    } catch {
      data[key] = raw;
    }
  }
  return { format: FORMAT, version: 1, exportedAt: new Date().toISOString(), data };
}

export function downloadBackup(): void {
  const blob = new Blob([JSON.stringify(createBackup(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `freelanceshield-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Restores a backup. Only namespaced keys are written, so a crafted file cannot
 * touch anything else on the origin. Returns the number of keys restored.
 */
export async function restoreBackup(file: File): Promise<number> {
  if (file.size > MAX_BYTES) throw new Error("That file is too large to be a FreelanceShield backup.");
  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw new Error("That file is not valid JSON.");
  }
  const b = parsed as Partial<BackupFile>;
  if (!b || b.format !== FORMAT || typeof b.data !== "object" || b.data === null) {
    throw new Error("That is not a FreelanceShield backup file.");
  }
  let count = 0;
  for (const [key, value] of Object.entries(b.data)) {
    if (!key.startsWith(NAMESPACE) || SKIP.has(key) || key.length > 64) continue;
    window.localStorage.setItem(key, typeof value === "string" ? JSON.stringify(value) : JSON.stringify(value));
    count += 1;
  }
  window.dispatchEvent(new Event("fs:local-storage"));
  return count;
}
