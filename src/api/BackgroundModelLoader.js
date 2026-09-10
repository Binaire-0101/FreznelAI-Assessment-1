import { EventEmitter } from '../core/EventEmitter.js';
import { ModelApiClient, DEFAULT_API_BASE } from './ModelApiClient.js';
import { checksumOfModels } from '../core/CacheStore.js';

/**
 * Main-thread handle on the background download worker.
 *
 * Spawns `modelFetch.worker.js`, relays its progress events to the UI as
 * `progress` / `page` events, and resolves a promise when the snapshot lands.
 * If the environment has no `Worker` (or the worker fails to boot), it degrades
 * transparently to running the very same `ModelApiClient` on the main thread -
 * the caller cannot tell the difference apart from the `usedWorker` flag.
 *
 * No async/await: the public `load()` returns a promise built by hand around
 * the worker's message events.
 */
export class BackgroundModelLoader extends EventEmitter {
  constructor({ baseUrl = DEFAULT_API_BASE, pages = 3 } = {}) {
    super();
    this.baseUrl = baseUrl;
    this.pages = pages;
    this._worker = null;
    this._pending = new Map();
    this._nextId = 1;
  }

  get usesWorker() {
    return Boolean(this._worker);
  }

  /**
   * Download a fresh snapshot.
   * @returns {Promise<{models: Array, checksum: string, bytes: number, source: string, usedWorker: boolean}>}
   */
  load({ pages } = {}) {
    const pageCount = pages || this.pages;
    const worker = this._ensureWorker();
    if (!worker) return this._loadOnMainThread(pageCount);

    const requestId = this._nextId++;
    return new Promise((resolve, reject) => {
      this._pending.set(requestId, { resolve, reject });
      worker.postMessage({ type: 'fetch', requestId, baseUrl: this.baseUrl, pages: pageCount });
    }).then((result) => ({ ...result, usedWorker: true }));
  }

  /** Abort every in-flight download (called when the app goes offline). */
  cancelAll() {
    if (!this._worker) return;
    for (const requestId of this._pending.keys()) {
      this._worker.postMessage({ type: 'cancel', requestId });
    }
  }

  dispose() {
    this.cancelAll();
    if (this._worker) this._worker.terminate();
    this._worker = null;
    this._pending.clear();
    this.removeAllListeners();
  }

  _ensureWorker() {
    if (this._worker) return this._worker;
    if (typeof Worker === 'undefined') return null;

    try {
      this._worker = new Worker(new URL('../workers/modelFetch.worker.js', import.meta.url), {
        type: 'module',
        name: 'model-fetch',
      });
    } catch (error) {
      console.warn('[BackgroundModelLoader] worker unavailable, using main thread', error);
      return null;
    }

    this._worker.addEventListener('message', (event) => this._handleMessage(event.data || {}));
    this._worker.addEventListener('error', (event) => {
      // A worker-level failure rejects every request it was carrying; the next
      // call re-enters through the main-thread fallback path.
      const error = new Error(event.message || 'Background worker crashed');
      for (const { reject } of this._pending.values()) reject(error);
      this._pending.clear();
      this._worker = null;
    });

    return this._worker;
  }

  _handleMessage(message) {
    const entry = this._pending.get(message.requestId);

    switch (message.type) {
      case 'progress':
        this.emit('progress', message);
        break;
      case 'page':
        this.emit('page', message);
        break;
      case 'done':
        this._pending.delete(message.requestId);
        if (entry) {
          entry.resolve({
            models: message.models,
            checksum: message.checksum,
            bytes: message.bytes,
            source: message.source,
          });
        }
        break;
      case 'error': {
        this._pending.delete(message.requestId);
        const error = new Error(message.error ? message.error.message : 'Background fetch failed');
        error.kind = message.error ? message.error.kind : 'unknown';
        if (entry) entry.reject(error);
        break;
      }
      default:
        break;
    }
  }

  /** Fallback path - identical logic, just without the extra thread. */
  _loadOnMainThread(pages) {
    const client = new ModelApiClient({ baseUrl: this.baseUrl });
    return client
      .fetchIndex({
        pages,
        onProgress: (payload) => this.emit('progress', payload),
        onPage: (payload) => this.emit('page', payload),
      })
      .then(({ models, bytes, source }) =>
        checksumOfModels(models).then((checksum) => ({
          models,
          checksum,
          bytes,
          source,
          usedWorker: false,
        })),
      );
  }
}
