/*
 * Version this string on any change to the caching rules below. `activate`
 * deletes every cache that is not the current name, so bumping it is what
 * clears whatever the old rules left on a student's phone.
 */
const CACHE_NAME = "campusly-shell-v2";

/*
 * Only the offline page and the icons. "/" used to be in here, which is where
 * the trouble came from — see the fetch handler.
 */
const APP_SHELL = ["/offline", "/manifest.webmanifest", "/icon-192", "/icon-512"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/*
 * Only files whose URL changes when their content changes. Next puts a hash in
 * the path of everything under /_next/static, so a cached copy can never be
 * the wrong version of itself: either the URL is in the cache and correct, or
 * it is not in the cache at all.
 */
function estImmuable(url) {
  return url.pathname.startsWith("/_next/static/");
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  /*
   * Navigations go to the network, and on failure to the offline page. They
   * are deliberately never stored.
   *
   * Storing them is what broke the app after a deploy. A page's HTML names the
   * exact JavaScript chunks of the build that produced it, and those filenames
   * are hashed — so once a new version ships, the old chunks stop existing. A
   * phone that then hit one flaky moment was served last week's HTML out of
   * the cache, which asked for files the server no longer had: a white screen,
   * on a working connection, fixable only by clearing the site data. iPhones
   * saw it most, because that is where service worker updates are slowest to
   * take hold.
   *
   * The pages are server-rendered per student anyway — their promo, their
   * name, their sent papers — so a cached copy was never going to be right
   * for long. An honest "you are offline" is worth more than a stale page
   * pretending to be live.
   */
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/offline")));
    return;
  }

  if (estImmuable(url)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            // Only a real answer is worth keeping: caching a 404 or a 500
            // under an immutable URL would make the failure permanent.
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            }
            return response;
          })
      )
    );
    return;
  }

  /*
   * Everything else — the icons, the manifest, the images — tries the network
   * first and falls back to whatever is in the cache. Fresh when there is a
   * connection, still something when there is not.
   */
  event.respondWith(fetch(request).catch(() => caches.match(request)));
});

self.addEventListener("push", (event) => {
  let data = { title: "Campusly", body: "Nouvelle notification.", url: "/" };
  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      data.body = event.data.text();
    }
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon-192",
      badge: "/icon-192",
      data: { url: data.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const cible = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      /*
       * Compared on the pathname rather than with endsWith. A target of "/"
       * matched any url ending in a slash, so a notification about the
       * timetable could focus a window sitting on /sujets/ instead of going
       * where it pointed.
       */
      for (const client of clients) {
        try {
          if (new URL(client.url).pathname === cible && "focus" in client) return client.focus();
        } catch {
          /* une url de client illisible ne doit pas empecher d'ouvrir */
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(cible);
    })
  );
});
