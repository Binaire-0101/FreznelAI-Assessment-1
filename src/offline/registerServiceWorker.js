/**
 * Service worker registration.
 *
 * Only in production builds: in `vite dev` the module graph is served
 * unbundled and HMR rewrites files constantly, so a caching worker there does
 * nothing but confuse. Offline data access still works in dev, because that
 * lives in IndexedDB rather than in the HTTP cache.
 *
 * Registration is deferred to the `load` event so it can never compete with
 * first paint for bandwidth or main-thread time.
 */
export function registerServiceWorker() {
  if (!import.meta.env.PROD) return;
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .then((registration) => {
        console.info('[sw] app shell cached for offline use', registration.scope);
      })
      .catch((error) => {
        console.warn('[sw] registration failed - the app still works online', error);
      });
  });
}
