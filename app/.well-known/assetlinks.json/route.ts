// app/.well-known/assetlinks.json/route.ts
//
// Digital Asset Links for the Play Store build (a Trusted Web Activity wrapping
// this PWA — see integrations/android/README.md). Returns 404 until both env
// vars are set, because a wrong fingerprint is worse than none.
//   ANDROID_PACKAGE_NAME   e.g. com.kartikeyamishra.freelanceshield
//   ANDROID_SHA256_CERT    the Play App Signing SHA-256 fingerprint(s), comma-separated

export const dynamic = "force-dynamic";

export function GET(): Response {
  const pkg = process.env.ANDROID_PACKAGE_NAME?.trim();
  const certs = (process.env.ANDROID_SHA256_CERT ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!pkg || certs.length === 0) return new Response("Not configured", { status: 404 });
  return Response.json(
    [{ relation: ["delegate_permission/common.handle_all_urls"], target: { namespace: "android_app", package_name: pkg, sha256_cert_fingerprints: certs } }],
    { headers: { "Cache-Control": "public, max-age=3600" } },
  );
}
