import type { Model, ModelSnapshot } from '../types/model';

const DB_NAME = 'model-atlas-cache';
const STORE_NAME = 'snapshots';
const VERSION = 1;

export class ModelCache {
  private open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, VERSION);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  read(): Promise<ModelSnapshot | null> {
    return this.open().then((db) => new Promise((resolve, reject) => {
      const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get('latest');
      request.onsuccess = () => resolve((request.result as ModelSnapshot | undefined) || null);
      request.onerror = () => reject(request.error);
    }));
  }

  write(models: Model[]): Promise<void> {
    const snapshot: ModelSnapshot = { models, savedAt: Date.now() };
    return this.open().then((db) => new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).put(snapshot, 'latest');
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error || new Error('Cache write aborted.'));
    }));
  }
}
