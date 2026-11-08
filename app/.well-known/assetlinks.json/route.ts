// app/.well-known/openai-apps-challenge/route.ts
//
// Domain verification for the ChatGPT app directory submission.
// OpenAI's form gives you a token; set it in Vercel as OPENAI_APPS_CHALLENGE,
// redeploy, then click "Verify" in the form. The response must be the token
// ONLY: plain text, no HTML, no JSON, no trailing newline.

export const dynamic = "force-dynamic";

export function GET(): Response {
  const token = (process.env.OPENAI_APPS_CHALLENGE ?? "").trim();
  if (!token) return new Response("Not configured", { status: 404 });
  return new Response(token, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
