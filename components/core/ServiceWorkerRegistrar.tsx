"use client";

// components/core/ServiceWorkerRegistrar.tsx
//
// NEW FILE. Registers public/sw.js, which did not exist until now. Without it
// the manifest's standalone display mode, the install prompt's "Use offline"
// promise, and the /offline page were all claims with nothing behind them.
//
// Registration is deferred until after load so it never competes with first
// paint. Development is excluded, because a service worker caching a dev build
// causes confusing stale-asset behaviour during local work.

import { useEffect } from "react";

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.warn("[sw] registration failed:", error);
      });
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
