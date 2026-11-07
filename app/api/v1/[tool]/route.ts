// app/api/v1/[tool]/route.ts — REST face of the same tools.
// POST /api/v1/scan-contract  {"text": "..."}
// Used by Custom GPT actions (via /openapi.json), scripts and agent frameworks.

import { TOOL_MAP, ToolInputError, runTool } from "@/lib/engine/tools";
import { CORS, clientIp, json, rateLimited, readJson } from "@/lib/engine/http";

export const dynamic = "force-dynamic";

const toolName = (slug: string) => slug.replace(/-/g, "_");

export async function POST(req: Request, ctx: { params: Promise<{ tool: string }> }): Promise<Response> {
  const { tool } = await ctx.params;
  const name = toolName(tool);
  if (!TOOL_MAP.has(name)) return json({ error: `Unknown tool: ${tool}` }, 404);

  const wait = rateLimited(clientIp(req));
  if (wait) return json({ error: "Rate limit exceeded" }, 429, { "Retry-After": String(wait) });

  let body: unknown;
  try {
    body = await readJson(req);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Bad request" }, 400);
  }

  try {
    return json(await runTool(name, body));
  } catch (err) {
    if (err instanceof ToolInputError) return json({ error: err.message }, 422);
    return json({ error: "Unexpected error" }, 500);
  }
}

export async function GET(_req: Request, ctx: { params: Promise<{ tool: string }> }): Promise<Response> {
  const { tool } = await ctx.params;
  const def = TOOL_MAP.get(toolName(tool));
  if (!def) return json({ error: `Unknown tool: ${tool}` }, 404);
  return json({ name: def.name, title: def.title, description: def.description, method: "POST", inputSchema: def.inputSchema });
}

export function OPTIONS(): Response {
  return new Response(null, { status: 204, headers: CORS });
}
