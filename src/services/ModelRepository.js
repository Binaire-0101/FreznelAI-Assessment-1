import { EventEmitter } from '../core/EventEmitter.js';
import { CacheStore } from '../core/CacheStore.js';
import { NetworkMonitor } from '../core/NetworkMonitor.js';
import { BackgroundModelLoader } from '../api/BackgroundModelLoader.js';
import { ModelApiClient, DEFAULT_API_BASE } from '../api/ModelApiClient.js';
import { SearchEngine, SearchField } from '../search/SearchEngine.js';
import { FilterPipeline } from '../filters/FilterPipeline.js';
import { Sorter } from '../sorting/Sorter.js';

/**
 * The single façade the UI talks to.
 *
 * It owns the whole data lifecycle and hides the collaborators from React:
 *
 *   load()   cache-first: a verified IndexedDB snapshot is published
 *            immediately (so the app is usable offline, and instantly on a warm
 *            start), then - only if we are online and the snapshot is stale - a
 *            fresh download runs in the background worker and replaces it.
 *   query()  pure, synchronous: search -> filter -> sort, over the in-memory
 *            catalogue. Because it never touches the network it is safe to run
 *            on every keystroke, which is what makes offline mode feel
 *            identical to online mode.
 *
 * Events: `status`, `models`, `progress`, `network`, `error`.
 */

const STALE_AFTER_MS = 1000 * 60 * 30; // 30 minutes

export class ModelRepository extends EventEmitter {
  constructor({ baseUrl = DEFAULT_API_BASE, pages = 3 } = {}) {
    super();
    this.baseUrl = baseUrl;
    this.pages = pages;

    this.cache = new CacheStore();
    this.loader = new BackgroundModelLoader({ baseUrl, pages });
    this.searchEngine = new SearchEngine();
    this.filters = new FilterPipeline();
    this.sorter = new Sorter();
    this.network = new NetworkMonitor({
      probeUrl: new ModelApiClient({ baseUrl }).buildProbeUrl(),
    });

    this.models = [];
    this.pointer = null;
    this.status = 'idle'; // idle | loading | ready | refreshing | error
    this.origin = 'none'; // none | cache | network
    this.lastError = null;

    this._refreshing = false;

    this.loader.on('progress', (payload) => this.emit('progress', payload));
    this.loader.on('page', (payload) => this.emit('progress', { ...payload, phase: 'page' }));
    this.network.on('change', (state) => {
      this.emit('network', state);
      // Coming back online is the natural moment to top the catalogue up.
      if (state.online && this.status !== 'loading') this.refresh({ silent: true });
      if (!state.online) this.loader.cancelAll();
    });
  }

  start() {
    this.network.start();
    return this.load();
  }

  dispose() {
    this.network.stop();
    this.loader.dispose();
    this.removeAllListeners();
  }

  get isOnline() {
    return this.network.online;
  }

  /** Cache first, then refresh in the background if it is worth it. */
  load() {
    this._setStatus('loading');

    return this.cache
      .read()
      .then((cached) => {
        if (cached && cached.models.length) {
          this._publish(cached.models, 'cache', cached.pointer);
          return cached.pointer;
        }
        return null;
      })
      .then((pointer) => {
        const stale = !pointer || Date.now() - Date.parse(pointer.fetchedAt) > STALE_AFTER_MS;

        if (!this.isOnline) {
          // Offline with nothing cached is the only truly failing state.
          if (!pointer) {
            this._fail(new Error('You are offline and no catalogue has been cached yet.'));
          } else {
            this._setStatus('ready');
          }
          return null;
        }

        if (!stale) {
          this._setStatus('ready');
          return null;
        }

        return this.refresh({ silent: Boolean(pointer) });
      })
      .catch((error) => {
        this._fail(error);
        return null;
      });
  }

  /**
   * Download a new snapshot in the worker and commit it atomically.
   * @param {object} options
   * @param {boolean} options.silent  keep serving the current data meanwhile
   */
  refresh({ silent = false } = {}) {
    if (this._refreshing) return Promise.resolve(null);
    if (!this.isOnline) {
      this.emit('error', new Error('Cannot refresh while offline - showing the cached catalogue.'));
      return Promise.resolve(null);
    }

    this._refreshing = true;
    this._setStatus(silent && this.models.length ? 'refreshing' : 'loading');

    return this.loader
      .load({ pages: this.pages })
      .then(({ models, checksum, bytes, source, usedWorker }) => {
        if (!models.length) throw new Error('The API returned an empty catalogue');
        this.emit('progress', { phase: 'verifying', usedWorker });
        // Commit before publishing: if the write is rejected we would rather
        // keep showing the old, provably intact snapshot.
        return this.cache
          .commit({ models, checksum, bytes, source })
          .then((pointer) => {
            this._publish(models, 'network', pointer);
            this._setStatus('ready');
            return pointer;
          })
          .catch((error) => {
            // Persisting failed (quota, private mode, verification mismatch).
            // The data itself is fine, so use it for this session only.
            console.warn('[ModelRepository] cache commit failed', error);
            this._publish(models, 'network', {
              checksum,
              bytes,
              count: models.length,
              fetchedAt: new Date().toISOString(),
              ephemeral: true,
            });
            this._setStatus('ready');
            return null;
          });
      })
      .catch((error) => {
        if (this.models.length) {
          // Degrade rather than break: keep the cached catalogue on screen.
          this._setStatus('ready');
          this.emit('error', error);
        } else {
          this._fail(error);
        }
        return null;
      })
      .then((pointer) => {
        this._refreshing = false;
        return pointer;
      });
  }

  /**
   * Search -> filter -> sort. Synchronous and side-effect free.
   *
   * @param {object} params
   * @param {string} params.query
   * @param {string} params.field   `SearchField` value
   * @param {string} params.sort    strategy id
   * @returns {{models: Array, total: number, matched: number, facets: Map}}
   */
  query({ query = '', field = SearchField.ALL, sort = 'relevance' } = {}) {
    const ranked = this.searchEngine.search(query, { field });
    const searched = ranked.map((result) => result.model);

    // Facet counts are computed against the search result, not the whole
    // catalogue, so the numbers in the sidebar always describe what the user
    // is actually looking at.
    const facets = this.filters.facetCounts(searched);
    const filtered = this.filters.apply(searched);
    const sorted = this.sorter.sort(filtered, sort, { preserveRelevance: Boolean(query) });

    return {
      models: sorted,
      total: this.models.length,
      matched: sorted.length,
      facets,
      scores: new Map(ranked.map((result) => [result.model.id, result.score])),
    };
  }

  clearCache() {
    return this.cache.clear();
  }

  _publish(models, origin, pointer) {
    this.models = models;
    this.origin = origin;
    this.pointer = pointer;
    this.searchEngine.setModels(models);
    this.filters.calibrate(models);
    this.emit('models', { models, origin, pointer });
  }

  _setStatus(status) {
    this.status = status;
    if (status !== 'error') this.lastError = null;
    this.emit('status', { status, origin: this.origin, error: this.lastError });
  }

  _fail(error) {
    this.lastError = error;
    this.status = 'error';
    this.emit('status', { status: 'error', origin: this.origin, error });
    this.emit('error', error);
  }
}
