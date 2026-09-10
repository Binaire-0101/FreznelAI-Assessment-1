# Model Finder — Binaire / Freznel AI Assessment (Task 2)

A model-selection utility over the [Hugging Face model index](https://huggingface.co/api/models):
ranked substring search, five live filter facets, two sort axes, Firebase authentication, animated
screen transitions, and a catalogue that keeps working with the network unplugged.

Built with **React + Vite**, **Adobe Spectrum** for the UI, and a framework-free domain layer written
with **classes and OOP** — the search engine, filters, sorter, HTTP client, cache and background
loader contain no React and could be lifted into any other frontend unchanged.

---

## Quick start

```bash
npm install
cp .env.example .env.local     # add your Firebase web-app config
npm run dev                    # http://localhost:5173
```

| Command           | What it does                                                   |
| ----------------- | -------------------------------------------------------------- |
| `npm run dev`     | Vite dev server with HMR                                        |
| `npm run build`   | Production build into `dist/`                                   |
| `npm run preview` | Serve the production build (needed to exercise the service worker) |
| `npm run lint`    | ESLint over the whole project                                   |
| `npm test`        | 23 unit tests over the domain layer (`node --test`, no deps)    |
| `npm run deploy`  | Build and deploy to Firebase Hosting                            |

**Without Firebase configured** the app still runs: `AuthService` falls back to a clearly-labelled
local demo session so the rest of the app can be reviewed. Add the `VITE_FIREBASE_*` values and real
Firebase Authentication takes over.

---

## How the requirements are met

| # | Requirement | Where |
| - | ----------- | ----- |
| 1 | Search query parameters — model name, model family | [`SearchEngine.js`](src/search/SearchEngine.js) `SearchField.NAME` / `.FAMILY`, exposed as the "Search in" picker |
| 2.1 | Substring from start **or middle** | `classifyMatch()` grades `exact > prefix > boundary > infix` and ranks accordingly |
| 2.2 | Throttling **and** debouncing | [`SearchScheduler`](src/utils/DebounceThrottle.js) — 220 ms debounce with a 600 ms throttled floor |
| 3.1–3.4 | Pipeline / family / architecture / weight tag filters | [`Filters.js`](src/filters/Filters.js) `TagSetFilter`, four instances |
| 3.5 | Safetensor min-to-max | `RangeFilter`, auto-calibrated to the loaded catalogue |
| 4.1 | Sort by safetensor file count | [`SafetensorSortStrategy`](src/sorting/Sorter.js), both directions |
| 4.2 | Sort by model name A→Z / Z→A | `NameSortStrategy`, numeric-aware collation |
| 5 | Firebase sign-up screen | [`AuthService.js`](src/auth/AuthService.js) + [`AuthScreen.jsx`](src/components/Auth/AuthScreen.jsx) |
| 6 | Animations and screen transitions | [`ScreenTransition.jsx`](src/components/Layout/ScreenTransition.jsx) + [`app.css`](src/styles/app.css) |
| 7 | Hosted API | `VITE_MODEL_API_BASE`, default `https://huggingface.co/api/models` |
| 8 | Full offline operation + connection status | [`CacheStore.js`](src/core/CacheStore.js), [`NetworkMonitor.js`](src/core/NetworkMonitor.js), [`sw.js`](public/sw.js) |
| 9 | Background fetch, no async/await, large-JSON safety | [`modelFetch.worker.js`](src/workers/modelFetch.worker.js), [`HttpClient.js`](src/core/HttpClient.js) — see below |

---

## Architecture

```
src/
├─ core/            framework-free infrastructure
│  ├─ EventEmitter.js       tiny observable base class
│  ├─ HttpClient.js         promise-chain fetch: timeout, retry, progress, SHA-256, length check
│  ├─ CacheStore.js         IndexedDB snapshot store with two-phase commit
│  └─ NetworkMonitor.js     online/offline events + reachability probe
├─ api/
│  ├─ ModelApiClient.js     URL building, cursor pagination, normalization
│  └─ BackgroundModelLoader.js  worker orchestration (+ main-thread fallback)
├─ workers/
│  └─ modelFetch.worker.js  the download, off the UI thread
├─ models/Model.js          domain entity; derives every facet exactly once
├─ search/SearchEngine.js   ranked substring search + highlighting
├─ filters/                 Filter / TagSetFilter / RangeFilter + FilterPipeline
├─ sorting/Sorter.js        SortStrategy implementations
├─ services/
│  ├─ ModelRepository.js    the façade the UI talks to
│  └─ container.js          long-lived service instances
├─ auth/                    AuthService + credential validation
├─ hooks/                   thin React bindings over the services
├─ components/ · pages/     Adobe Spectrum UI
└─ offline/                 service-worker registration
```

The dependency direction is one-way: **UI → hooks → services → domain**. Nothing in `core/`,
`models/`, `search/`, `filters/` or `sorting/` imports React, which is why all of it is unit-testable
with plain `node --test`.

### OOP decisions worth pointing at

- **Strategy pattern for sorting.** Each sort axis is a `SortStrategy` subclass. Adding one is a new
  class, not another branch in a `switch`.
- **Uniform filter contract.** Every facet implements `active` / `matches()` / `valuesOf()`, so
  `FilterPipeline` holds a heterogeneous list without knowing what any facet means — and can compute
  *faceted counts* generically.
- **Façade.** `ModelRepository` is the only object the UI knows. Cache, worker, network monitor,
  search engine, filters and sorter are its private collaborators.
- **Observer.** `EventEmitter` lets React subscribe to services without the services importing React.
- **Value normalization once.** `Model.fromApi()` converts a wide, inconsistent API record into a
  flat one with `family`, `architecture`, `weightTags` and `safetensorFiles` precomputed, so a
  keystroke never re-derives them.

---

## Search: ranking, debouncing, throttling

A match is graded by *where* it lands, not just whether it exists:

| Kind | Meaning | Score |
| ---- | ------- | ----- |
| `exact` | the field equals the query | 1000 |
| `prefix` | field starts with the query | 600 |
| `boundary` | query starts a word inside the field (`-`, `_`, `.`, `/`) | 420 |
| `infix` | query appears mid-word | 260 |

The best-matching field decides the rank; the remaining fields contribute 5 % each, so two models
whose strongest match is identical are still separated by how well their *names* match. Popularity
breaks what is left.

**Why both debounce and throttle.** Debouncing alone feels dead during sustained typing — nothing
updates until you stop. Throttling alone fires far too often for a fast typist. `SearchScheduler`
runs both: the debouncer delivers the settled query (220 ms), the throttler guarantees a refresh at
least every 600 ms while keys keep coming, and a duplicate query is dropped so the pipeline never
runs twice for the same input. `Enter` bypasses both.

---

## Question 9.1 — background fetch *without* async/await

`async`/`await` is syntax sugar over promises; anything awaited can be written as explicit
continuations. Three techniques are used here, in increasing order of decoupling:

**1. Promise chains.** [`HttpClient`](src/core/HttpClient.js) contains no `async` or `await` at all.
Sequencing is `.then()`, error handling is `.catch()`, and *iteration* is recursion over a promise —
the streaming body reader is a `pump()` that calls itself until `done`:

```js
const pump = () =>
  reader.read().then(({ done, value }) => {
    if (done) return concatChunks(chunks, received);
    chunks.push(value);
    received += value.byteLength;
    onProgress({ received, total: declared });
    return pump();          // recursion replaces `while (true) await`
  });
```

Retry-with-backoff is the same idea: `_attempt(url, options, n)` catches, waits, and calls itself
with `n + 1`.

**2. Event-driven callbacks.** IndexedDB has no promise API at all, so
[`CacheStore`](src/core/CacheStore.js) is written against `onsuccess` / `oncomplete` / `onerror`
handlers, wrapped once at the boundary. Note it resolves on the transaction's `complete` event, not
the request's `success` — only `complete` means the write was durable.

**3. Message passing.** [`modelFetch.worker.js`](src/workers/modelFetch.worker.js) communicates
purely through `postMessage`. A worker boundary *is* a continuation-passing interface: the caller
posts `{type:'fetch'}` and continues; results arrive later as `progress` / `page` / `done` / `error`
messages. `BackgroundModelLoader` hands the UI a promise built by hand around those events.

The practical payoff is real: the ~3 MB download, `JSON.parse`, 300 record normalizations and the
SHA-256 digest all run off the main thread, so the sign-in animation and the first paint never
stutter. If `Worker` is unavailable the loader silently runs the identical `ModelApiClient` on the
main thread.

---

## Question 9.2 — keeping a large JSON download safe from corruption

Five layers, each catching a different failure:

1. **Timeout + abort per attempt.** A stalled connection is aborted rather than left hanging, then
   retried with exponential backoff. Going offline cancels in-flight work outright.
2. **Byte-length verification.** The received byte count is compared against `Content-Length`. A
   connection cut at 90 % is rejected as `truncated` instead of being parsed.
3. **Guarded parse.** `JSON.parse` runs inside `try/catch` and a failure becomes a typed `parse`
   error. A partial JSON body cannot parse, so a half-written payload can never reach the cache.
4. **End-to-end checksum.** SHA-256 is computed over the received bytes at download time
   (`crypto.subtle`, with an FNV-1a fallback), travels with the snapshot, and is stored beside it.
5. **Two-phase commit into IndexedDB.** This is the important one:

   ```
   phase 1   write the snapshot under a brand-new key; wait for the transaction to COMMIT
   verify    read it back, re-serialize, re-hash — mismatch ⇒ delete and abort
   phase 2   flip the single-record `current` pointer to the new key (one tiny atomic transaction)
   ```

   The pointer flip is atomic and happens *last*, so a tab closed mid-download, a quota error, or a
   failed verification can never leave a half-written snapshot visible. The worst case is that the
   app keeps serving the previous, provably intact snapshot. Reads re-verify the checksum too — a
   snapshot corrupted at rest is deleted and treated as a cache miss.

Pagination helps as well: the catalogue is fetched as 100-record pages rather than one enormous
document, and each page is normalized down to compact records immediately, so a failure costs one
page and peak memory stays flat. The live checksum is shown in the app footer.

---

## Offline behaviour

The brief says the app will be switched between online and offline at random, so offline is treated
as a normal operating mode, not an error:

- **The app shell** is cached by [`sw.js`](public/sw.js) — network-first for navigations,
  stale-while-revalidate for hashed assets. A cold start with no network still boots. Every cache
  interaction is failure-tolerant: `caches.open()` can reject outright (storage disabled, private
  window), and a caching layer must never be able to take the application down.
- **The catalogue** is served from the verified IndexedDB snapshot.
- **Search, filters, sorting and the detail view are pure in-memory operations**, so they behave
  identically offline. Only *refresh* and the outbound model link need a connection, and both are
  disabled rather than hidden.
- **Status is always visible**: a permanent pill in the header, plus a banner on every transition
  ("you are offline, showing the last verified snapshot" / "back online, refreshing"). Reconnecting
  automatically triggers a background refresh.
- `navigator.onLine` alone is not trusted — it only reports whether an interface exists. A periodic
  lightweight probe against the API confirms actual reachability, polling faster while offline.

To try it: `npm run build && npm run preview`, load the app once, then toggle **Offline** in DevTools
→ Network and reload. The app boots and stays fully searchable.

---

## Animations

All motion uses `transform` and `opacity` only, so it stays on the compositor, and everything
collapses under `prefers-reduced-motion`.

- Screen cross-fade between boot → auth → explorer, with the outgoing screen genuinely animating out
- Sliding pill indicator on the sign-up / sign-in tabs; sign-up fields animate in and out
- Staggered card entrance (capped at 16 cards so a large result set does not cascade forever)
- Shimmer skeletons during the first load, animated indeterminate download bar
- Facet chips with hover-lift and press-scale; accordion sections that animate via `grid-template-rows`
- Breathing dot when online, blinking dot when offline; banner drops in from the top
- Drifting gradient on the auth panel, animated logo bars

---

## Testing

```bash
npm test     # 23 tests, no test framework needed
```

Covers match classification and ranking, scoped search, highlighting, facet OR/AND semantics, weight
tag derivation from actual repo files, range calibration, faceted counts, both sort axes in both
directions, sort stability and non-mutation, debounce/throttle/scheduler timing, `Link`-header cursor
parsing, and API record normalization.

Beyond the unit tests, the build was verified end to end in headless Chrome: sign-up → catalogue
download in the worker (300 models, 3.1 MB, checksum committed) → search → facet → detail dialog →
offline toggle → **reload while offline**, which still renders the full app from the cached shell and
the verified snapshot.

---

## Deployment

```bash
npm run build
firebase deploy --only hosting     # or: npm run deploy
```

[`firebase.json`](firebase.json) is configured for SPA rewrites, an immutable cache policy for hashed
assets, and `no-cache` for `sw.js` so a new service worker is always picked up.

---

## Notes

- The API base is configurable (`VITE_MODEL_API_BASE`); anything returning the Hugging Face
  model-index shape works. `VITE_MODEL_PAGES` controls how many 100-record pages are fetched
  (default 3 ≈ 300 models ≈ 3 MB).
- Firebase web API keys are not secrets, but they live in env rather than in the repo so a fork
  cannot accidentally write into someone else's project.
- The assessment brief asks for the repository to be named `Binaire_Freznel_Assessment`; this fork is
  currently `Binaire-FreznelAI-Assessment` and can be renamed in GitHub settings.
