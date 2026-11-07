// app/openapi.json/route.ts — OpenAPI 3.1 spec generated from the tool
// registry, so it can never drift from the real endpoints. Paste
// https://freelanceshield.me/openapi.json into a Custom GPT's Actions.

import { TOOLS, ENGINE_VERSION, SITE_URL } from "@/lib/engine/tools";
import { json } from "@/lib/engine/http";

export const dynamic = "force-static";

export function GET(): Response {
  const paths: Record<string, unknown> = {};
  for (const t of TOOLS) {
    paths[`/api/v1/${t.name.replace(/_/g, "-")}`] = {
      post: {
        operationId: t.name,
        summary: t.title,
        description: t.description.slice(0, 300),
        "x-openai-isConsequential": false,
        requestBody: { required: true, content: { "application/json": { schema: t.inputSchema } } },
        responses: {
          "200": { description: "Result", content: { "application/json": { schema: { type: "object", additionalProperties: true } } } },
          "422": { description: "Invalid input", content: { "application/json": { schema: { type: "object", properties: { error: { type: "string" } } } } } },
          "429": { description: "Rate limited" },
        },
      },
    };
  }

  return json({
    openapi: "3.1.0",
    info: {
      title: "FreelanceShield",
      version: ENGINE_VERSION,
      description:
        "Free, deterministic tools for freelancers: invoice maths, pre-filled invoice links, payment reminders, contract clause checks and project-plan gap checks. No authentication. Nothing is stored.",
      contact: { url: `${SITE_URL}/contact` },
    },
    servers: [{ url: SITE_URL }],
    paths,
  });
}
