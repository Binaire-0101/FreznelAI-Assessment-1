import { AIModel } from '../types';

/**
 * OOP IndexedDB Cache Storage Manager
 * Guarantees offline access to API model records.
 */
export class ModelCacheStorage {
  private dbName = 'ModelSelectionDB';
  private storeName = 'models_store';
  private dbVersion = 1;

  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  public async saveModels(models: AIModel[]): Promise<void> {
    try {
      const db = await this.openDB();
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);

      models.forEach((model) => {
        store.put(model);
      });

      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.warn('IndexedDB write error:', e);
      localStorage.setItem('cached_models_fallback', JSON.stringify(models));
    }
  }

  public async getModels(): Promise<AIModel[]> {
    try {
      const db = await this.openDB();
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);

      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => {
          if (request.result && request.result.length > 0) {
            resolve(request.result as AIModel[]);
          } else {
            resolve(this.getFallbackLocalStorage());
          }
        };
        request.onerror = () => resolve(this.getFallbackLocalStorage());
      });
    } catch (e) {
      return this.getFallbackLocalStorage();
    }
  }

  private getFallbackLocalStorage(): AIModel[] {
    const raw = localStorage.getItem('cached_models_fallback');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        return [];
      }
    }
    return [];
  }
}
