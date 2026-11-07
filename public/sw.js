/* public/sw.js
 *
 * NEW FILE. There was no service worker in the repository, yet:
 *   - app/manifest.ts declares display: "standalone"
 *   - InstallPrompt.tsx offers installation and says "Use offline"
 *   - app/offline/page.tsx exists but was unreachable
 *   - the homepage claimed the tools work without a connection
 *
 * None of that was true. This makes it true for the two tool routes, which are
 * the only pages that can genuinely work offline (they are self-contained: no
 * data fetching, all computation client-side).
 *
 * STRATEGY
 *   - Navigations: network-first, falling back to cache, then to /offline.
 *     Network-first means guides and articles are never served stale.
 *   - Static build assets (/_next/static/*): cache-first. They are
 *     content-hashed, so a cached copy is never wrong.
 *   - Everything else, including ads and any cross-origin request: not
 *     intercepted at all.
 *
 * DELIBERATELY NOT CACHED
 *   - Any Google/AdSense request. Caching ad responses would inflate impression
 *     counts against cached creatives and is a policy problem.
 *   - Anything non-GET.
 *   - Any cross-origin request.
 */

const VERSION = "v3";
const SHELL_CACHE = `fs-shell-${VERSION}`;
const RUNTIME_CACHE = `fs-runtime-${VERSION}`;

const OFFLINE_URL = "/offline";

/* Routes precached so the tools open with no connection. Keep this list short:
   every entry is downloaded on first visit. */
const PRECACHE_URLS = [OFFLINE_URL, "/dashboard", "/invoice-maker", "/contract-scanner", "/project-planner"];

/* Upper bound on runtime-cached entries. Hashed build files accumulate across
   deploys; without a cap the cache grows until the browser evicts the origin. */
const RUNTIME_MAX_ENTRIES = 80;

async function trimCache(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i += 1) await cache.delete(keys[i]);
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      // addAll fails the whole install if any single URL 404s, which would
      // leave the user with no service worker at all. Add individually.
      await Promise.all(
        PRECACHE_URLS.map((url) =>
          cache.add(url).catch(() => {
            /* route not available at install time; runtime caching will pick it up */
          }),
        ),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Drop caches from previous versions so a deploy does not leave users on
      // stale assets indefinitely.
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("fs-") && !key.endsWith(VERSION))
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

/** True for requests we should never touch. */
function isIgnored(request) {
  if (request.method !== "GET") return true;

  const url = new URL(request.url);

  // Cross-origin: ads, fonts, anything third party. Leave entirely alone.
  if (url.origin !== self.location.origin) return true;

  // Never cache these.
  if (url.pathname.startsWith("/api/")) return true;
  if (url.pathname === "/ads.txt") return true;
  if (url.pathname.startsWith("/_next/image")) return true;

  return false;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (isIgnored(request)) return;

  const url = new URL(request.url);

  // 1. Content-hashed build output: cache-first. Safe because the filename
  //    changes whenever the content does.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;

        const response = await fetch(request);
        if (response.ok) {
          const cache = await caches.open(RUNTIME_CACHE);
          await cache.put(request, response.clone());
          event.waitUntil(trimCache(RUNTIME_CACHE, RUNTIME_MAX_ENTRIES));
        }
        return response;
      })(),
    );
    return;
  }

  // 2. Page navigations: network-first so content is never stale, with a cache
  //    fallback and finally the offline page.
  if (request.mode === "navigate") {
    // PRIVACY: text shared into the installed app arrives as a query string
    // (?text=…). Strip every query from navigations to the tool pages before
    // touching the network, so shared contract text never reaches the server
    // or its logs. The page reads the original URL itself.
    const TOOL_PAGES = ["/contract-scanner", "/invoice-maker", "/project-planner", "/dashboard"];
    const stripped = TOOL_PAGES.includes(url.pathname) && url.search;
    const target = stripped ? new Request(url.origin + url.pathname, { credentials: "same-origin" }) : request;

    event.respondWith(
      (async () => {
        try {
          const response = await fetch(target);
          if (response.ok) {
            const cache = await caches.open(RUNTIME_CACHE);
            cache.put(target, response.clone());
          }
          return response;
        } catch {
          const cached = await caches.match(target, { ignoreSearch: Boolean(stripped) });
          if (cached) return cached;

          const offline = await caches.match(OFFLINE_URL);
          if (offline) return offline;

          return new Response(
            "<!doctype html><meta charset=utf-8><title>Offline</title><p>You are offline and this page is not available.",
            { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } },
          );
        }
      })(),
    );
  }
});

/* Lets the page tell a waiting worker to take over immediately. */
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
