# Play Store (Android) — the same app, no rewrite

The installable web app is wrapped as a Trusted Web Activity (TWA): a real Play Store listing that opens the PWA full-screen. One codebase, so updates ship on deploy with no store review.

1. Go to https://www.pwabuilder.com, enter `https://freelanceshield.me`, then Package → Android.
2. Package ID: `com.kartikeyamishra.freelanceshield`. Keep the generated signing key safe (it is the app's identity forever).
3. In Play Console ($25 once) create the app, upload the `.aab`, and copy **App signing key certificate SHA-256** from Setup → App integrity.
4. In Vercel set `ANDROID_PACKAGE_NAME` and `ANDROID_SHA256_CERT`, then redeploy. Check `https://freelanceshield.me/.well-known/assetlinks.json` returns your values; without it the app shows a browser bar.
5. Put the Play URL into `APP_STORES.playStore` in `lib/site.ts`. The homepage badge turns into a real link.

iOS: users install from Safari (Share → Add to Home Screen; the app prompts them after first use). A paid App Store wrapper is only worth it once traffic justifies the $99/yr.
