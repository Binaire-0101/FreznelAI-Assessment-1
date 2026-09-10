/**
 * Background download worker.
 *
 * Everything expensive about loading the catalogue - the multi-megabyte
 * download, JSON parsing, per-record normalization and the SHA-256 integrity
 * digest - happens here, on a thread that is not the one painting the UI. The
 * main thread only ever receives small progress messages and, once, the final
 * compact record array.
 *
 * The protocol is intentionally message-based rather than promise-based, which
 * is the other half of the "no async/await" answer: a worker boundary *is* a
 * continuation-passing interface. Nothing in this file awaits.
 *
 * Messages in:  { type: 'fetch', requestId, baseUrl, pages }
 *               { type: 'cancel', requestId }
 * Messages out: { type: 'progress' | 'page' | 'done' | 'error', requestId, ... }
 */

import { ModelApiClient } from '../api/ModelApiClient.js';
import { checksumOfModels } from '../core/CacheStore.js';

const controllers = new Map();

self.addEventListener('message', (event) => {
  const message = event.data || {};

  if (message.type === 'cancel') {
    const controller = controllers.get(message.requestId);
    if (controller) controller.abort();
    controllers.delete(message.requestId);
    return;
  }

  if (message.type !== 'fetch') return;

  const { requestId, baseUrl, pages } = message;
  const controller = new AbortController();
  controllers.set(requestId, controller);

  const client = new ModelApiClient({ baseUrl });

  client
    .fetchIndex({
      pages,
      signal: controller.signal,
      onProgress: ({ page, pages: total, received, total: pageTotal }) => {
        self.postMessage({
          type: 'progress',
          requestId,
          page,
          pages: total,
          received,
          pageTotal,
        });
      },
      onPage: ({ page, pages: total, count, bytes }) => {
        self.postMessage({ type: 'page', requestId, page, pages: total, count, bytes });
      },
    })
    // The digest is computed over exactly the array that will be persisted, so
    // the cache can later prove that what it reads back is what was downloaded.
    .then(({ models, bytes, source }) =>
      checksumOfModels(models).then((checksum) => {
        controllers.delete(requestId);
        self.postMessage({ type: 'done', requestId, models, checksum, bytes, source });
      }),
    )
    .catch((error) => {
      controllers.delete(requestId);
      self.postMessage({
        type: 'error',
        requestId,
        error: {
          message: error && error.message ? error.message : 'Background fetch failed',
          kind: error && error.kind ? error.kind : 'unknown',
        },
      });
    });
});
