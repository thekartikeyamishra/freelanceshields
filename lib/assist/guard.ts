// lib/assist/guard.ts
// Cost and abuse controls for /api/assist. In-memory, so they hold PER SERVER
// INSTANCE. That bounds spend to (instances × budget), which is why the real
// hard stop is a monthly spend limit set in the AI provider's dashboard.
// Set that limit before enabling the route. See docs/AI_AND_COSTS.md.

export interface GuardConfig {
  perIpPerHour: number;
  dailyTokenBudget: number;
  maxInputChars: number;
}

export function readGuardConfig(env: Record<string, string | undefined> = process.env): GuardConfig {
  const num = (v: string | undefined, d: number, min: number, max: number) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.floor(n))) : d;
  };
  return {
    perIpPerHour: num(env.ASSIST_PER_IP_PER_HOUR, 10, 1, 100),
    dailyTokenBudget: num(env.ASSIST_DAILY_TOKEN_BUDGET, 150_000, 0, 10_000_000),
    maxInputChars: 500,
  };
}

const MAX_TRACKED_IPS = 5_000;
const hits = new Map<string, number[]>();
let budgetDay = "";
let tokensToday = 0;

/** Sliding one-hour window per IP. Returns true if this request is allowed. */
export function allowRequest(ip: string, cfg: GuardConfig, now = Date.now()): boolean {
  const windowStart = now - 3_600_000;
  const recent = (hits.get(ip) ?? []).filter((t) => t > windowStart);
  if (recent.length >= cfg.perIpPerHour) {
    hits.set(ip, recent);
    return false;
  }
  recent.push(now);
  hits.set(ip, recent);
  // Bound memory: evict the oldest IPs when the map grows too large.
  if (hits.size > MAX_TRACKED_IPS) {
    const drop = hits.size - MAX_TRACKED_IPS;
    let i = 0;
    for (const k of hits.keys()) {
      if (i++ >= drop) break;
      hits.delete(k);
    }
  }
  return true;
}

function rollDay(now: number) {
  const day = new Date(now).toISOString().slice(0, 10);
  if (day !== budgetDay) {
    budgetDay = day;
    tokensToday = 0;
  }
}

export function budgetRemaining(cfg: GuardConfig, now = Date.now()): number {
  rollDay(now);
  return Math.max(0, cfg.dailyTokenBudget - tokensToday);
}

export function recordTokens(n: number, now = Date.now()): void {
  rollDay(now);
  tokensToday += Math.max(0, Math.ceil(n));
}

/** Strips control chars and markup-ish content; caps length. */
export function cleanInput(q: unknown, cfg: GuardConfig): string {
  return String(q ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, cfg.maxInputChars);
}

/** Model output is rendered as plain text; strip anything HTML-like and cap. */
export function cleanOutput(text: unknown): string {
  return String(text ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/\u0000/g, "")
    .trim()
    .slice(0, 1_200);
}

/** Test hook. */
export function __resetGuards() {
  hits.clear();
  budgetDay = "";
  tokensToday = 0;
}
