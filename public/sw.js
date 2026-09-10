/**
 * Offline app shell.
 *
 * The catalogue itself lives in IndexedDB (see `CacheStore`), so this worker
 * only has to guarantee that the *application* still boots with no network.
 *
 * Strategies, by request type:
 *   navigation      network-first, falling back to the cached shell, so a fresh
 *                   deploy is picked up immediately when online but a cold
 *                   offline start still renders;
 *   same-origin GET stale-while-revalidate - Vite emits content-hashed
 *                   filenames, so a cached asset is never stale for its URL and
 *                   serving it instantly is always correct;
 *   cross-origin    passthrough. API traffic must reach the repository's own
 *                   error handling rather than being silently answered from an
 *                   HTTP cache, otherwise "offline" would be undetectable.
 *
 * Every cache interaction is failure-tolerant. `caches.open()` can reject
 * outright - storage disabled, a private window, a corrupt profile - and a
 * rejected promise passed to `event.respondWith()` becomes a hard network
 * error for that request. A caching layer must never be able to take the
 * application down, so every path here ends in a plain `fetch()` fallback.
 */

const VERSION = 'v1';
const SHELL_CACHE = `shell-${VERSION}`;
const ASSET_CACHE = `assets-${VERSION}`;
const SHELL_URL = '/index.html';

/** `caches.open` that resolves to null instead of rejecting. */
function openCache(name) {
  try {
    return caches.open(name).catch(() => null);
  } catch {
    return Promise.resolve(null);
  }
}

function matchCache(name, request) {
  return openCache(name).then((cache) => (cache ? cache.match(request).catch(() => null) : null));
}

function putCache(name, request, response) {
  return openCache(name)
    .then((cache) => (cache ? cache.put(request, response) : null))
    .catch(() => null);
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    openCache(SHELL_CACHE)
      .then((cache) => (cache ? cache.addAll([SHELL_URL, '/']) : null))
      .catch(() => null)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== SHELL_CACHE && key !== ASSET_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .catch(() => null)
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }

  event.respondWith(handleAsset(request));
});

function handleNavigation(request) {
  return fetch(request)
    .then((response) => {
      putCache(SHELL_CACHE, SHELL_URL, response.clone());
      return response;
    })
    .catch(() =>
      matchCache(SHELL_CACHE, SHELL_URL).then(
        (cached) => cached || matchCache(SHELL_CACHE, '/').then((root) => root || fetch(request)),
      ),
    );
}

function handleAsset(request) {
  return matchCache(ASSET_CACHE, request).then((cached) => {
    const network = fetch(request)
      .then((response) => {
        // Only full, successful responses are worth keeping.
        if (response && response.status === 200 && response.type === 'basic') {
          putCache(ASSET_CACHE, request, response.clone());
        }
        return response;
      })
      .catch((error) => {
        // Offline with nothing cached: propagate the real network error so the
        // page sees a failed request rather than an empty response.
        if (cached) return cached;
        throw error;
      });

    // A cached copy wins immediately; the network copy still refreshes the
    // cache in the background for next time.
    return cached || network;
  });
}
