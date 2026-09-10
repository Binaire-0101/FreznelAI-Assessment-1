import type { Model } from "../models/types";

const DB_NAME = "model-atlas";
const STORE_NAME = "snapshots";
const KEY = "models";

export class OfflineStore {   
  private open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE_NAME)) {
          request.result.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  save(models: Model[]): Promise<void> {
    return this.open().then(
      (db) =>
        new Promise((resolve, reject) => {
          const transaction = db.transaction(STORE_NAME, "readwrite");
          transaction
            .objectStore(STORE_NAME)
            .put({ models, savedAt: Date.now() }, KEY);
          transaction.oncomplete = () => {
            db.close();
            resolve();
          };
          transaction.onerror = () => {
            db.close();
            reject(transaction.error);
          };
        }),
    );
  }

  read(): Promise<{ models: Model[]; savedAt: number } | null> {
    return this.open().then(
      (db) =>
        new Promise((resolve, reject) => {
          const request = db
            .transaction(STORE_NAME)
            .objectStore(STORE_NAME)
            .get(KEY);
          request.onsuccess = () => {
            db.close();
            resolve(request.result ?? null);
          };
          request.onerror = () => {
            db.close();
            reject(request.error);
          };
        }),
    );
  }
}
