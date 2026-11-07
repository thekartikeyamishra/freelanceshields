// lib/engine/http.ts — shared plumbing for the public API and MCP routes.
//
// Fail-safes that keep cost flat and abuse cheap:
//   - body size cap (no 10 MB payloads)
//   - best-effort per-IP rate limit, bounded memory
//   - no content logging, no storage, no cookies
// Vercel's own firewall / spend cap is the outer layer; this is the inner one.

const WINDOW_MS = 60_000;
const LIMIT = Number(process.env.API_RATE_LIMIT_PER_MIN) || 60;
const MAX_TRACKED = 5_000;
export const MAX_BODY_BYTES = 256_000;

const hits = new Map<string, { n: number; reset: number }>();

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] || req.headers.get("x-real-ip") || "unknown").trim();
}

/** Returns seconds to wait, or 0 when the request may proceed. */
export function rateLimited(ip: string, now = Date.now()): number {
  const h = hits.get(ip);
  if (!h || h.reset <= now) {
    if (hits.size >= MAX_TRACKED) {
      for (const [k, v] of hits) if (v.reset <= now) hits.delete(k);
      if (hits.size >= MAX_TRACKED) hits.clear();
    }
    hits.set(ip, { n: 1, reset: now + WINDOW_MS });
    return 0;
  }
  h.n += 1;
  return h.n > LIMIT ? Math.ceil((h.reset - now) / 1000) : 0;
}

export const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS, DELETE",
  "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization, Mcp-Session-Id, Mcp-Protocol-Version, Last-Event-ID",
  "Access-Control-Expose-Headers": "Mcp-Session-Id, Mcp-Protocol-Version",
  "Access-Control-Max-Age": "86400",
};

export function json(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...CORS, ...extra },
  });
}

/** Reads a JSON body with a hard size cap. Throws a string message on failure. */
export async function readJson(req: Request): Promise<unknown> {
  const len = Number(req.headers.get("content-length") || 0);
  if (len > MAX_BODY_BYTES) throw new Error("Request body too large");
  const text = await req.text();
  if (text.length > MAX_BODY_BYTES) throw new Error("Request body too large");
  if (!text.trim()) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Body is not valid JSON");
  }
}
