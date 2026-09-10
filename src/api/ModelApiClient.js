import { HttpClient } from '../core/HttpClient.js';
import { Model } from '../models/Model.js';

/**
 * Client for the Hugging Face model index.
 *
 * Responsibilities:
 *  - build request URLs (only the fields we actually render are requested, via
 *    `expand[]`, which keeps a 100-model page around 1.2 MB instead of ~4 MB);
 *  - walk the cursor pagination exposed through the RFC-5988 `Link` header;
 *  - normalize every raw record through `Model.fromApi` as soon as the page
 *    lands, so the heavyweight raw objects are garbage before the next page is
 *    requested and peak memory stays flat.
 *
 * No `async` / `await`: page walking is a recursive promise chain.
 */

export const DEFAULT_API_BASE = 'https://huggingface.co/api/models';

/** Only the fields the UI or a facet actually needs. */
const EXPAND_FIELDS = [
  'author',
  'config',
  'downloads',
  'lastModified',
  'library_name',
  'likes',
  'pipeline_tag',
  'safetensors',
  'siblings',
  'tags',
];

export class ModelApiClient {
  /**
   * @param {object} options
   * @param {string} options.baseUrl    model index endpoint
   * @param {number} options.pageSize   records per request (API caps at 100)
   * @param {HttpClient} options.http   injected for testing
   */
  constructor({ baseUrl = DEFAULT_API_BASE, pageSize = 100, http } = {}) {
    this.baseUrl = baseUrl;
    this.pageSize = Math.min(pageSize, 100);
    this.http = http || new HttpClient({ timeout: 30000, retries: 2 });
  }

  /** URL for the first page of the index, sorted by trending score. */
  buildIndexUrl({ cursor = '', sort = 'trendingScore', direction = -1, search = '' } = {}) {
    const params = new URLSearchParams();
    params.set('limit', String(this.pageSize));
    if (sort) params.set('sort', sort);
    if (direction) params.set('direction', String(direction));
    if (search) params.set('search', search);
    for (const field of EXPAND_FIELDS) params.append('expand[]', field);
    const query = params.toString() + (cursor ? `&cursor=${encodeURIComponent(cursor)}` : '');
    return `${this.baseUrl}?${query}`;
  }

  /** A deliberately tiny request, used by `NetworkMonitor` as a liveness probe. */
  buildProbeUrl() {
    return `${this.baseUrl}?limit=1`;
  }

  /**
   * Fetch `pages` pages and return the normalized, de-duplicated model list.
   *
   * @param {object} options
   * @param {number}   options.pages       how many pages to walk
   * @param {Function} options.onPage      ({page, pages, models, bytes}) per page
   * @param {Function} options.onProgress  byte-level progress within a page
   * @param {AbortSignal} options.signal
   */
  fetchIndex({ pages = 3, onPage, onProgress, signal } = {}) {
    const collected = [];
    const seen = new Set();
    let totalBytes = 0;

    const walk = (cursor, page) => {
      if (page > pages) return Promise.resolve();

      const url = this.buildIndexUrl({ cursor });
      return this.http
        .getJson(url, {
          signal,
          onProgress: onProgress
            ? ({ received, total }) => onProgress({ page, pages, received, total, totalBytes })
            : undefined,
        })
        .then(({ data, bytes, headers }) => {
          if (!Array.isArray(data)) {
            throw new Error('Model index response was not an array');
          }
          totalBytes += bytes;

          for (const raw of data) {
            const model = Model.fromApi(raw);
            if (!model.id || seen.has(model.id)) continue;
            seen.add(model.id);
            collected.push(model);
          }

          if (onPage) onPage({ page, pages, count: collected.length, bytes: totalBytes });

          const next = parseNextCursor(headers && headers.get('link'));
          // Stop early when the server ran out of pages rather than looping.
          if (!next || data.length === 0) return Promise.resolve();
          return walk(next, page + 1);
        });
    };

    return walk('', 1).then(() => ({ models: collected, bytes: totalBytes, source: this.baseUrl }));
  }
}

/**
 * Pull the `cursor` query value out of the `Link: <url>; rel="next"` header.
 * Hugging Face lists `Link` in `Access-Control-Expose-Headers`, so this works
 * from the browser as well as from the worker.
 */
export function parseNextCursor(linkHeader) {
  if (!linkHeader) return '';
  const match = /<([^>]+)>\s*;\s*rel="next"/i.exec(linkHeader);
  if (!match) return '';
  try {
    return new URL(match[1]).searchParams.get('cursor') || '';
  } catch {
    return '';
  }
}
