/**
 * Promise-chain HTTP client. Deliberately contains ZERO `async` / `await`.
 *
 * Everything asynchronous in this file is expressed with explicit Promise
 * composition (`new Promise`, `.then`, `.catch`, recursion over a pump
 * function). See the README section "Question 9.1" for the full reasoning; the
 * short version is that `async`/`await` is only syntax sugar over exactly these
 * primitives, so any awaited program can be rewritten as a chain of
 * continuations.
 *
 * The client also owns the download-integrity guarantees:
 *  - a hard timeout per attempt (AbortController)
 *  - retry with exponential backoff on transport failures
 *  - byte-exact length verification against `Content-Length`
 *  - a SHA-256 digest of the received bytes, returned to the caller so the
 *    cache layer can detect a corrupted record later
 *  - `JSON.parse` guarded so a truncated body surfaces as a typed error rather
 *    than a half-populated object
 */

export class HttpError extends Error {
  constructor(message, { status = 0, url = '', kind = 'network' } = {}) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.url = url;
    this.kind = kind; // 'network' | 'http' | 'timeout' | 'truncated' | 'parse'
  }
}

export class HttpClient {
  /**
   * @param {object} options
   * @param {number} options.timeout    per-attempt timeout in ms
   * @param {number} options.retries    extra attempts after the first failure
   * @param {number} options.backoff    base backoff in ms (doubled per retry)
   */
  constructor({ timeout = 20000, retries = 2, backoff = 600 } = {}) {
    this.timeout = timeout;
    this.retries = retries;
    this.backoff = backoff;
  }

  /**
   * Fetch a JSON document with progress reporting and integrity verification.
   *
   * @returns {Promise<{data: any, bytes: number, checksum: string, headers: Headers}>}
   */
  getJson(url, { signal, onProgress } = {}) {
    return this._attempt(url, { signal, onProgress }, 0);
  }

  _attempt(url, options, attempt) {
    return this._fetchOnce(url, options).catch((error) => {
      const retriable = error.kind === 'network' || error.kind === 'timeout' || error.status >= 500;
      const exhausted = attempt >= this.retries;
      const aborted = options.signal && options.signal.aborted;

      if (!retriable || exhausted || aborted) throw error;

      const wait = this.backoff * Math.pow(2, attempt);
      return delay(wait).then(() => this._attempt(url, options, attempt + 1));
    });
  }

  _fetchOnce(url, { signal, onProgress }) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort('timeout'), this.timeout);
    let timedOut = false;
    const onTimeout = () => {
      timedOut = true;
    };
    controller.signal.addEventListener('abort', onTimeout, { once: true });

    // Forward an externally supplied abort signal into our own controller.
    const forwardAbort = () => controller.abort('caller-abort');
    if (signal) {
      if (signal.aborted) forwardAbort();
      else signal.addEventListener('abort', forwardAbort, { once: true });
    }

    const cleanup = () => {
      clearTimeout(timer);
      if (signal) signal.removeEventListener('abort', forwardAbort);
    };

    return fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } })
      .catch((error) => {
        cleanup();
        if (timedOut) {
          throw new HttpError(`Request timed out after ${this.timeout}ms`, { url, kind: 'timeout' });
        }
        throw new HttpError(error.message || 'Network request failed', { url, kind: 'network' });
      })
      .then((response) => {
        if (!response.ok) {
          cleanup();
          throw new HttpError(`HTTP ${response.status} for ${url}`, {
            url,
            status: response.status,
            kind: 'http',
          });
        }
        const declared = Number(response.headers.get('content-length')) || 0;
        return readBody(response, declared, onProgress).then((bytes) => {
          cleanup();
          return { bytes, response, declared };
        });
      })
      .then(({ bytes, response, declared }) => {
        // Integrity gate #1 — the server told us how many bytes to expect and
        // we counted a different number, so the transfer was cut short.
        if (declared > 0 && bytes.byteLength !== declared) {
          throw new HttpError(
            `Truncated download: expected ${declared} bytes, received ${bytes.byteLength}`,
            { url, kind: 'truncated' },
          );
        }
        return digestSha256(bytes).then((checksum) => ({ bytes, checksum, response }));
      })
      .then(({ bytes, checksum, response }) => {
        const text = new TextDecoder('utf-8').decode(bytes);
        let data;
        try {
          // Integrity gate #2 — a partial JSON body cannot parse, so a
          // silently-corrupted payload can never reach the cache.
          data = JSON.parse(text);
        } catch (error) {
          throw new HttpError(`Malformed JSON from ${url}: ${error.message}`, {
            url,
            kind: 'parse',
          });
        }
        return { data, bytes: bytes.byteLength, checksum, headers: response.headers };
      });
  }
}

/**
 * Drain a response body chunk by chunk using a recursive promise pump, so we
 * can report download progress without `await` and without buffering twice.
 */
function readBody(response, declared, onProgress) {
  if (!response.body || typeof response.body.getReader !== 'function') {
    // Environments without streaming support (older Safari, some test runners).
    return response.arrayBuffer().then((buffer) => new Uint8Array(buffer));
  }

  const reader = response.body.getReader();
  const chunks = [];
  let received = 0;

  const pump = () =>
    reader.read().then(({ done, value }) => {
      if (done) return concatChunks(chunks, received);
      chunks.push(value);
      received += value.byteLength;
      if (onProgress) onProgress({ received, total: declared });
      return pump();
    });

  return pump();
}

function concatChunks(chunks, total) {
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

/** SHA-256 of the raw bytes, hex encoded. Used as the cache integrity tag. */
export function digestSha256(bytes) {
  const subtle = globalThis.crypto && globalThis.crypto.subtle;
  if (!subtle) return Promise.resolve(fallbackChecksum(bytes));
  return subtle
    .digest('SHA-256', bytes)
    .then((buffer) =>
      Array.from(new Uint8Array(buffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join(''),
    )
    .catch(() => fallbackChecksum(bytes));
}

/** FNV-1a, used only when SubtleCrypto is unavailable (e.g. plain-HTTP dev). */
function fallbackChecksum(bytes) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < bytes.length; i += 1) {
    hash ^= bytes[i];
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `fnv1a-${hash.toString(16)}`;
}

export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
