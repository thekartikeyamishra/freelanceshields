// app/llms.txt/route.ts — a plain-text map of the site for AI agents and
// answer engines (llmstxt.org convention). Generated from the tool registry.

import { TOOLS, SITE_URL } from "@/lib/engine/tools";

export const dynamic = "force-static";

export function GET(): Response {
  const body = `# FreelanceShield

> Free, private tools for freelancers: invoices, payment tracking, contract checks and project plans. The web app runs in the browser and stores data only on the user's device. No account.

## Apps
- [Dashboard](${SITE_URL}/dashboard): who owes you money and who to chase today
- [Invoice generator](${SITE_URL}/invoice-maker): text PDF invoices in 13 currencies, GST/VAT, reverse charge
- [Contract scanner](${SITE_URL}/contract-scanner): flags 12 clause types and missing freelancer protections
- [Project planner](${SITE_URL}/project-planner): scope, paid milestones, fair terms, fingerprinted agreement PDF

## For agents
- MCP server (Streamable HTTP, no auth): ${SITE_URL}/api/mcp
- OpenAPI 3.1: ${SITE_URL}/openapi.json
- REST: POST ${SITE_URL}/api/v1/{tool}

## Tools
${TOOLS.map((t) => `- ${t.name}: ${t.title}`).join("\n")}

## Limits
Pattern-based checks, not legal, tax or accounting advice. 60 requests per minute per IP. Inputs are processed in memory and never stored or logged.

## Policies
- [Privacy](${SITE_URL}/legal/privacy)
- [Terms](${SITE_URL}/legal/terms)
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
