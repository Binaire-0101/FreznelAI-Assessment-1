/**
 * ModelRepository Class implementing persistence & caching layer.
 * Uses IndexedDB for production-scale model datasets with transparent
 * fallback to localStorage when IndexedDB is unavailable or restricted.
 * Binaire Freznel AI Assessment - Requirements #11, #19, #20
 */

import { CachedModelPayload, CacheMetadata, RawModelData } from '../types/model';
import { Model } from './Model';

export class ModelRepository {
  private static readonly DB_NAME = 'binaire_freznel_ai_db';
  private static readonly STORE_NAME = 'models_cache';
  private static readonly CACHE_KEY = 'latest_models_payload';
  private static readonly FALLBACK_LOCALSTORAGE_KEY = 'bf_ai_models_cache_v1';
  private static readonly CURRENT_VERSION = 1;

  private dbPromise: Promise<IDBDatabase> | null = null;

  constructor() {
    this.initIndexedDB();
  }

  /**
   * Initializes or returns connection to IndexedDB.
   */
  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) {
      return this.dbPromise;
    }

    if (typeof window === 'undefined' || !window.indexedDB) {
      return Promise.reject(new Error('IndexedDB is not supported in this environment'));
    }

    this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      try {
        const request = window.indexedDB.open(ModelRepository.DB_NAME, 1);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(ModelRepository.STORE_NAME)) {
            db.createObjectStore(ModelRepository.STORE_NAME);
          }
        };

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = () => {
          console.warn('[ModelRepository] IndexedDB failed to open, fallback to localStorage', request.error);
          reject(request.error || new Error('IndexedDB open failed'));
        };
      } catch (err) {
        reject(err);
      }
    });

    return this.dbPromise;
  }

  private initIndexedDB(): void {
    if (typeof window !== 'undefined' && window.indexedDB) {
      this.getDB().catch(() => {
        // Fallback handled seamlessly
      });
    }
  }

  /**
   * Saves validated models to persistent cache atomically.
   * Ensures corrupt or empty datasets never overwrite valid prior cache.
   */
  public async save(models: Model[]): Promise<void> {
    if (!models || models.length === 0) {
      console.warn('[ModelRepository] Refusing to overwrite cache with empty model list.');
      return;
    }

    const rawList: RawModelData[] = models.map(m => m.toPlainObject());
    const payload: CachedModelPayload = {
      version: ModelRepository.CURRENT_VERSION,
      timestamp: Date.now(),
      cachedAt: new Date().toISOString(),
      models: rawList,
    };

    // 1. Try IndexedDB
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(ModelRepository.STORE_NAME, 'readwrite');
        const store = tx.objectStore(ModelRepository.STORE_NAME);
        const req = store.put(payload, ModelRepository.CACHE_KEY);

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
        tx.onabort = () => reject(tx.error);
      });
    } catch (err) {
      console.warn('[ModelRepository] IndexedDB save failed, persisting to localStorage:', err);
    }

    // 2. Also keep a mirrored copy in localStorage for immediate sync hydration
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(ModelRepository.FALLBACK_LOCALSTORAGE_KEY, JSON.stringify(payload));
      }
    } catch (e) {
      console.warn('[ModelRepository] LocalStorage write quota or restriction:', e);
    }
  }

  /**
   * Retrieves cached models from IndexedDB, falling back to localStorage.
   */
  public async getCachedModels(): Promise<Model[]> {
    let payload: CachedModelPayload | null = null;

    // 1. Try IndexedDB first
    try {
      const db = await this.getDB();
      payload = await new Promise<CachedModelPayload | null>((resolve, reject) => {
        const tx = db.transaction(ModelRepository.STORE_NAME, 'readonly');
        const store = tx.objectStore(ModelRepository.STORE_NAME);
        const req = store.get(ModelRepository.CACHE_KEY);

        req.onsuccess = () => {
          resolve(req.result || null);
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      payload = null;
    }

    // 2. Fallback to localStorage if IndexedDB had no entry
    if (!payload) {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const raw = window.localStorage.getItem(ModelRepository.FALLBACK_LOCALSTORAGE_KEY);
          if (raw) {
            payload = JSON.parse(raw);
          }
        }
      } catch (err) {
        console.warn('[ModelRepository] LocalStorage parse failed:', err);
        payload = null;
      }
    }

    if (payload && Array.isArray(payload.models) && payload.models.length > 0) {
      return payload.models.map(m => Model.fromRaw(m));
    }

    return [];
  }

  /**
   * Checks if valid cached data exists.
   */
  public async hasCachedModels(): Promise<boolean> {
    const models = await this.getCachedModels();
    return models.length > 0;
  }

  /**
   * Retrieves cache timestamp and metadata for UI indicators.
   */
  public async getCacheMetadata(): Promise<CacheMetadata | null> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(ModelRepository.FALLBACK_LOCALSTORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as CachedModelPayload;
          return {
            version: parsed.version,
            timestamp: parsed.timestamp,
            cachedAt: parsed.cachedAt,
            count: parsed.models.length,
          };
        }
      }
    } catch {
      // Ignore
    }
    return null;
  }

  /**
   * Clears cached models in both stores.
   */
  public async clearCache(): Promise<void> {
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(ModelRepository.STORE_NAME, 'readwrite');
        const store = tx.objectStore(ModelRepository.STORE_NAME);
        const req = store.delete(ModelRepository.CACHE_KEY);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // Ignore
    }

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(ModelRepository.FALLBACK_LOCALSTORAGE_KEY);
      }
    } catch {
      // Ignore
    }
  }
}
