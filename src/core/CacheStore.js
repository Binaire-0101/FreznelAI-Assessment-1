import { digestSha256 } from './HttpClient.js';

/**
 * Durable snapshot cache backed by IndexedDB.
 *
 * This is the layer that answers "if the JSON file is large, how do you assure
 * its safety and prevent corruption during download?". The answer is a
 * two-phase commit plus an end-to-end checksum:
 *
 *   phase 1  write the freshly downloaded snapshot under a brand-new key and
 *            wait for the transaction to actually commit;
 *   verify   read those bytes back out of the database, re-serialize them and
 *            re-hash them - if the stored copy does not hash to the checksum
 *            computed at download time, the write is discarded;
 *   phase 2  only then flip the single-record `current` pointer to the new key.
 *
 * The pointer flip is one tiny atomic IndexedDB transaction, so a tab that is
 * closed mid-download, a quota error, or a truncated response can never leave a
 * half-written snapshot visible to readers. The worst case is that the app
 * keeps serving the previous good snapshot.
 *
 * Written entirely with event handlers and promise chains - no async/await.
 */

const DB_NAME = 'freznel-model-explorer';
const DB_VERSION = 1;
const STORE_SNAPSHOTS = 'snapshots';
const STORE_META = 'meta';
const POINTER_KEY = 'current';

export class CacheStore {
  constructor() {
    this._dbPromise = null;
  }

  /** Lazily open (and upgrade) the database. */
  open() {
    if (this._dbPromise) return this._dbPromise;

    this._dbPromise = new Promise((resolve, reject) => {
      if (!globalThis.indexedDB) {
        reject(new Error('IndexedDB is unavailable in this environment'));
        return;
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_SNAPSHOTS)) {
          db.createObjectStore(STORE_SNAPSHOTS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_META)) {
          db.createObjectStore(STORE_META, { keyPath: 'key' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
      request.onblocked = () => reject(new Error('IndexedDB upgrade blocked by another tab'));
    });

    return this._dbPromise;
  }

  /**
   * Commit a downloaded snapshot. Resolves with the committed pointer record.
   *
   * @param {object} snapshot
   * @param {Array}  snapshot.models    normalized model records
   * @param {string} snapshot.checksum  SHA-256 computed at download time
   * @param {number} snapshot.bytes     wire size of the original download
   * @param {string} snapshot.source    API base the snapshot came from
   */
  commit({ models, checksum, bytes = 0, source = '' }) {
    const id = `snapshot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const record = {
      id,
      models,
      checksum,
      bytes,
      source,
      count: models.length,
      fetchedAt: new Date().toISOString(),
    };

    return this.open()
      .then((db) => putRecord(db, STORE_SNAPSHOTS, record).then(() => db))
      // Phase 1 has committed. Now prove the bytes survived the round trip.
      .then((db) => this._verifyStored(db, id, checksum).then(() => db))
      .then((db) => {
        const pointer = {
          key: POINTER_KEY,
          snapshotId: id,
          checksum,
          count: record.count,
          bytes,
          source,
          fetchedAt: record.fetchedAt,
        };
        // Phase 2 - the flip. A single-record transaction, so it either lands
        // completely or not at all.
        return putRecord(db, STORE_META, pointer)
          .then(() => this._pruneExcept(db, id))
          .then(() => pointer);
      });
  }

  /**
   * Read the committed snapshot, re-verifying its checksum before handing it
   * back. A snapshot that fails verification is deleted and treated as a miss.
   *
   * @returns {Promise<null | {models: Array, pointer: object, verified: boolean}>}
   */
  read() {
    return this.open()
      .then((db) => getRecord(db, STORE_META, POINTER_KEY).then((pointer) => ({ db, pointer })))
      .then(({ db, pointer }) => {
        if (!pointer) return null;
        return getRecord(db, STORE_SNAPSHOTS, pointer.snapshotId).then((snapshot) => {
          if (!snapshot) return null;
          return checksumOfModels(snapshot.models).then((actual) => {
            if (actual !== pointer.checksum) {
              console.warn('[CacheStore] checksum mismatch, discarding cached snapshot');
              return deleteRecord(db, STORE_SNAPSHOTS, snapshot.id)
                .then(() => deleteRecord(db, STORE_META, POINTER_KEY))
                .then(() => null);
            }
            return { models: snapshot.models, pointer, verified: true };
          });
        });
      })
      .catch((error) => {
        console.warn('[CacheStore] read failed, continuing without cache', error);
        return null;
      });
  }

  /** Pointer metadata only - cheap enough to call on every render pass. */
  readPointer() {
    return this.open()
      .then((db) => getRecord(db, STORE_META, POINTER_KEY))
      .catch(() => null);
  }

  clear() {
    return this.open().then(
      (db) =>
        new Promise((resolve, reject) => {
          const tx = db.transaction([STORE_SNAPSHOTS, STORE_META], 'readwrite');
          tx.objectStore(STORE_SNAPSHOTS).clear();
          tx.objectStore(STORE_META).clear();
          tx.oncomplete = () => resolve(true);
          tx.onerror = () => reject(tx.error);
        }),
    );
  }

  _verifyStored(db, id, expectedChecksum) {
    return getRecord(db, STORE_SNAPSHOTS, id).then((stored) => {
      if (!stored) throw new Error('Snapshot vanished immediately after write');
      return checksumOfModels(stored.models).then((actual) => {
        if (actual !== expectedChecksum) {
          // Roll phase 1 back; the pointer was never moved, so readers are
          // still seeing the previous good snapshot.
          return deleteRecord(db, STORE_SNAPSHOTS, id).then(() => {
            throw new Error('Snapshot failed post-write verification and was rolled back');
          });
        }
        return true;
      });
    });
  }

  /** Keep only the live snapshot; old ones are dead weight in the quota. */
  _pruneExcept(db, keepId) {
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_SNAPSHOTS, 'readwrite');
      const store = tx.objectStore(STORE_SNAPSHOTS);
      const request = store.openCursor();
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) return;
        if (cursor.value.id !== keepId) cursor.delete();
        cursor.continue();
      };
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  }
}

/**
 * Canonical checksum of a normalized model list. `Model.toRecord()` always
 * writes its keys in the same order, so `JSON.stringify` is deterministic here
 * and the hash is stable across reloads.
 */
export function checksumOfModels(models) {
  const bytes = new TextEncoder().encode(JSON.stringify(models));
  return digestSha256(bytes);
}

function putRecord(db, storeName, value) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).put(value);
    // Resolve on `complete`, not on the request's `success`: only `complete`
    // means the transaction was actually durable.
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error || new Error(`Write to ${storeName} failed`));
    tx.onabort = () => reject(tx.error || new Error(`Write to ${storeName} aborted`));
  });
}

function getRecord(db, storeName, key) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const request = tx.objectStore(storeName).get(key);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

function deleteRecord(db, storeName, key) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).delete(key);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}
