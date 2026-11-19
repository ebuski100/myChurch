/* VictoryCity Revival Ministry — Stage 1A service worker */
const CACHE_VERSION = "vc-sw-v1";
const PRECACHE = ["/offline.html", "/icons/icon-192.png", "/icons/icon-512.png", "/icons/icon-maskable-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(PRECACHE)).catch(() => {}),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith("vc-sw-") && k !== CACHE_VERSION)
          .map((k) => caches.delete(k)),
      ),
    ),
  );
  self.clients.claim();
});

function isBypassed(url, request) {
  if (request.method !== "GET") return true;
  if (url.origin !== self.location.origin) return true;

  const p = url.pathname;
  if (p.startsWith("/admin/") || p === "/admin") return true;
  if (p.startsWith("/api/admin/")) return true;
  if (p.startsWith("/auth/")) return true;
  if (p.startsWith("/api/cron/")) return true;
  if (p === "/api/supabase/config") return true;
  if (/^\/api\/sermons\/[^/]+\/audio\/?$/.test(p)) return true;

  // signed URLs / external media / tokens
  if (url.search && /token|auth|sig|signature|expires|download/i.test(url.search)) return true;
  if (request.headers.has("authorization") || request.headers.has("cookie")) return true;

  // RSC payloads / router prefetch
  if (request.headers.get("rsc") === "1") return true;
  if (request.headers.get("next-router-prefetch") === "1") return true;
  if (request.headers.get("purpose") === "prefetch") return true;
  if (url.searchParams.has("_rsc")) return true;

  return false;
}

function isSafeResponse(res) {
  if (!res || !res.ok) return false;
  if (res.headers.get("set-cookie")) return false;
  const cc = (res.headers.get("cache-control") || "").toLowerCase();
  if (cc.includes("private") || cc.includes("no-store")) return false;
  return true;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  let url;
  try { url = new URL(request.url); } catch { return; }

  if (isBypassed(url, request)) return; // let browser handle

  // Navigation requests: network-first, cache fallback to offline.html
  const isNav = request.mode === "navigate";
  if (isNav) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (isSafeResponse(res) && (res.headers.get("content-type") || "").includes("text/html")) {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(request, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => caches.match("/offline.html").then((r) => r || new Response("Offline", { status: 503 }))),
    );
    return;
  }

  // Static assets: cache-first
  if (url.pathname.match(/\.(?:js|css|png|jpg|jpeg|svg|webp|ico|woff2?)$/)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          if (isSafeResponse(res)) {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(request, copy)).catch(() => {});
          }
          return res;
        }).catch(() => new Response("", { status: 504 }));
      }),
    );
    return;
  }

  // Everything else: network only
});
