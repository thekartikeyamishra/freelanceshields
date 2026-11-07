// app/api/mcp/route.ts
//
// Remote MCP server (Streamable HTTP transport, stateless, JSON responses).
// One URL works as:
//   - a ChatGPT app / connector         (Settings → Apps & Connectors)
//   - a Claude custom connector          (Settings → Connectors → Add custom)
//   - a Gemini CLI extension             (integrations/gemini-extension)
//   - any MCP client or agent framework
//
// No SDK dependency: the protocol surface we need (initialize, ping,
// tools/list, tools/call) is small, and owning it means no third-party upgrade
// can break the endpoint. No auth is needed because every tool is read-only,
// deterministic and stores nothing.

import { TOOLS, ToolInputError, runTool, ENGINE_VERSION, SITE_URL } from "@/lib/engine/tools";
import { CORS, clientIp, json, rateLimited, readJson } from "@/lib/engine/http";

export const dynamic = "force-dynamic";

const SUPPORTED = ["2025-06-18", "2025-03-26", "2024-11-05"];

const INSTRUCTIONS =
  "FreelanceShield helps freelancers get paid and avoid bad contracts. " +
  "Use calculate_invoice_totals for any invoice maths, create_invoice_link when the user wants an invoice they can download, " +
  "draft_payment_reminder when a client is late, scan_contract before the user signs anything, and check_project_plan before work starts. " +
  "The tools are pattern-based and are not legal or tax advice; say so when it matters. Always show links returned by tools.";

type RpcId = string | number | null;
interface RpcRequest {
  jsonrpc?: string;
  id?: RpcId;
  method?: string;
  params?: Record<string, unknown>;
}

const ok = (id: RpcId, result: unknown) => ({ jsonrpc: "2.0", id, result });
const fail = (id: RpcId, code: number, message: string) => ({ jsonrpc: "2.0", id, error: { code, message } });

async function handle(msg: RpcRequest): Promise<object | null> {
  const id = msg.id ?? null;
  const isNotification = msg.id === undefined;

  if (msg.jsonrpc !== "2.0" || typeof msg.method !== "string") {
    return isNotification ? null : fail(id, -32600, "Invalid Request");
  }

  switch (msg.method) {
    case "initialize": {
      const asked = String(msg.params?.protocolVersion ?? "");
      return ok(id, {
        protocolVersion: SUPPORTED.includes(asked) ? asked : SUPPORTED[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "freelanceshield", title: "FreelanceShield", version: ENGINE_VERSION, websiteUrl: SITE_URL },
        instructions: INSTRUCTIONS,
      });
    }
    case "ping":
      return ok(id, {});
    case "tools/list":
      return ok(id, {
        tools: TOOLS.map((t) => ({
          name: t.name,
          title: t.title,
          description: t.description,
          inputSchema: t.inputSchema,
          annotations: { title: t.title, readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
        })),
      });
    case "tools/call": {
      const name = String(msg.params?.name ?? "");
      try {
        const result = await runTool(name, msg.params?.arguments);
        return ok(id, { content: [{ type: "text", text: JSON.stringify(result, null, 2) }], structuredContent: result, isError: false });
      } catch (err) {
        if (err instanceof ToolInputError) {
          // Input problems are tool results, so the model can read and correct them.
          if (err.message.startsWith("Unknown tool")) return fail(id, -32602, err.message);
          return ok(id, { content: [{ type: "text", text: `Input error: ${err.message}` }], isError: true });
        }
        return ok(id, { content: [{ type: "text", text: "The tool failed unexpectedly. Try again." }], isError: true });
      }
    }
    case "resources/list":
      return ok(id, { resources: [] });
    case "prompts/list":
      return ok(id, { prompts: [] });
    default:
      if (msg.method.startsWith("notifications/")) return null;
      return isNotification ? null : fail(id, -32601, `Method not found: ${msg.method}`);
  }
}

export async function POST(req: Request): Promise<Response> {
  const wait = rateLimited(clientIp(req));
  if (wait) return json(fail(null, -32000, "Rate limit exceeded"), 429, { "Retry-After": String(wait) });

  let body: unknown;
  try {
    body = await readJson(req);
  } catch (e) {
    return json(fail(null, -32700, e instanceof Error ? e.message : "Parse error"), 400);
  }

  const version = { "Mcp-Protocol-Version": SUPPORTED[0] };

  if (Array.isArray(body)) {
    if (body.length === 0 || body.length > 20) return json(fail(null, -32600, "Batch must contain 1–20 messages"), 400);
    const out = (await Promise.all(body.map((m) => handle(m as RpcRequest)))).filter(Boolean);
    return out.length ? json(out, 200, version) : new Response(null, { status: 202, headers: CORS });
  }

  const res = await handle((body ?? {}) as RpcRequest);
  return res ? json(res, 200, version) : new Response(null, { status: 202, headers: CORS });
}

/** Stateless server: no server-initiated SSE stream. Spec-compliant 405. */
export function GET(): Response {
  return new Response("This MCP endpoint accepts POST (Streamable HTTP, stateless).", {
    status: 405,
    headers: { Allow: "POST, OPTIONS", ...CORS },
  });
}

export function DELETE(): Response {
  return new Response(null, { status: 405, headers: { Allow: "POST, OPTIONS", ...CORS } });
}

export function OPTIONS(): Response {
  return new Response(null, { status: 204, headers: CORS });
}
