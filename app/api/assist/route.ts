// app/api/assist/route.ts
//
// Shieldy's optional AI layer. OFF unless ASSIST_ENABLED=1 and a provider is
// configured. Order of work, cheapest first:
//   1. reject: disabled / wrong origin / too large / rate-limited
//   2. reviewed answer from lib/assist/knowledge.ts (free)
//   3. model call, only if today's token budget remains
//   4. on ANY failure → reviewed fallback text, HTTP 200
// Nothing the user typed is stored or logged. Tool data is never sent here.

import { FALLBACK, matchAnswer, type Lang } from "@/lib/assist/knowledge";
import { allowRequest, budgetRemaining, cleanInput, cleanOutput, readGuardConfig, recordTokens } from "@/lib/assist/guard";
import { askModel, readProviders } from "@/lib/assist/provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Source = "kb" | "ai" | "fallback" | "limited" | "disabled";

function reply(body: { answer: string; source: Source; href?: string; cta?: string }, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "unknown").trim().slice(0, 64);
}

function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  const host = req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(req: Request): Promise<Response> {
  const env = process.env;
  const lang: Lang = "en";

  if (env.ASSIST_ENABLED !== "1") return reply({ answer: FALLBACK.en, source: "disabled" }, 404);
  if (!sameOrigin(req)) return reply({ answer: "Forbidden", source: "disabled" }, 403);

  const len = Number(req.headers.get("content-length") ?? "0");
  if (len > 4_096) return reply({ answer: FALLBACK.en, source: "fallback" }, 413);

  let body: { q?: unknown; lang?: unknown };
  try {
    body = (await req.json()) as { q?: unknown; lang?: unknown };
  } catch {
    return reply({ answer: FALLBACK.en, source: "fallback" }, 400);
  }

  const l: Lang = body.lang === "hi" ? "hi" : lang;
  const cfg = readGuardConfig(env);
  const q = cleanInput(body.q, cfg);
  if (q.length < 2) return reply({ answer: FALLBACK[l], source: "fallback" }, 400);

  // Free layer first — never spend tokens on a question we have answered.
  const kb = matchAnswer(q);
  if (kb) return reply({ answer: kb[l], source: "kb", href: kb.href, cta: kb.cta?.[l] });

  if (!allowRequest(clientIp(req), cfg)) {
    return reply({ answer: l === "hi" ? "थोड़ी देर बाद फिर पूछें।" : "You've asked a lot this hour — please try again later.", source: "limited" }, 429);
  }
  if (budgetRemaining(cfg) <= 0) return reply({ answer: FALLBACK[l], source: "fallback" });

  const providers = readProviders(env);
  if (providers.length === 0) return reply({ answer: FALLBACK[l], source: "fallback" });

  try {
    const r = await askModel(q, providers);
    recordTokens(r.tokens);
    const answer = cleanOutput(r.text);
    return reply({ answer: answer || FALLBACK[l], source: answer ? "ai" : "fallback" });
  } catch {
    return reply({ answer: FALLBACK[l], source: "fallback" });
  }
}

export function GET(): Response {
  return reply({ answer: "Method not allowed", source: "disabled" }, 405);
}
