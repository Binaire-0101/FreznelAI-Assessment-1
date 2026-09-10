/**
 * ModelApiService Class managing remote API retrieval, response integrity,
 * and background synchronization without async/await.
 *
 * Connects to REAL API: https://binaire.app/hf-models-api.json
 * Binaire Freznel AI Assessment - Requirements #10, #11, #18, #19
 */

import { FALLBACK_MODELS } from '../data/fallbackModels';
import { Model } from '../models/Model';
import { ModelRepository } from '../models/ModelRepository';
import { RawModelData } from '../types/model';
import { validateModelPayload } from '../utils/validation';

export interface FetchOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
  forceRefresh?: boolean;
}

export class ModelApiService {
  private apiUrl: string;
  private repository: ModelRepository;
  private activeAbortController: AbortController | null = null;

  constructor(apiUrl?: string, repository?: ModelRepository) {
    // Read from provided param or VITE_MODELS_API_URL or real API endpoint fallback
    const envUrl =
      (typeof import.meta !== 'undefined' &&
        import.meta.env &&
        import.meta.env.VITE_MODELS_API_URL) ||
      'https://binaire.app/hf-models-api.json';
    this.apiUrl = apiUrl || envUrl;
    this.repository = repository || new ModelRepository();
  }

  /**
   * Sets or updates remote API URL dynamically.
   */
  public setApiUrl(url: string): void {
    this.apiUrl = url.trim();
  }

  public getApiUrl(): string {
    return this.apiUrl;
  }

  public getRepository(): ModelRepository {
    return this.repository;
  }

  /**
   * Standard fetch method using AbortController, timeout, and schema validation.
   */
  public async fetchModels(options?: FetchOptions): Promise<Model[]> {
    const timeoutMs = options?.timeoutMs || 15000;

    // Cancel prior inflight requests if any
    if (this.activeAbortController) {
      this.activeAbortController.abort();
    }
    const controller = new AbortController();
    this.activeAbortController = controller;

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    try {
      const targetUrl = this.apiUrl || 'https://binaire.app/hf-models-api.json';

      const response = await fetch(targetUrl, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && !contentType.includes('application/json')) {
        throw new Error(`Invalid content-type: Expected application/json but received ${contentType}`);
      }

      const rawJson = await response.json();
      const validation = validateModelPayload(rawJson);

      if (!validation.isValid || validation.models.length === 0) {
        throw new Error(`Corrupted JSON payload: ${validation.errors.join('; ')}`);
      }

      const models = validation.models.map(m => Model.fromRaw(m));

      // Atomic cache update only after successful complete parsing and validation
      await this.repository.save(models);
      return models;
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      console.warn('[ModelApiService] Remote fetch failed, attempting cached recovery:', err);

      // Preserve previous valid cache: check if cached models exist
      const cached = await this.repository.getCachedModels();
      if (cached.length > 0) {
        return cached;
      }

      // If neither remote nor cache available, load authentic fallback models
      const fallback = FALLBACK_MODELS.map(m => Model.fromRaw(m));
      await this.repository.save(fallback);
      return fallback;
    } finally {
      this.activeAbortController = null;
    }
  }

  /**
   * =========================================================================
   * REQUIREMENT: BACKGROUND FETCH WITHOUT ASYNC/AWAIT
   * =========================================================================
   * Question: "How will you solve this problem without using async-await?"
   *
   * Solution:
   * 1. Implemented strictly using Promise chaining (.then, .catch, .finally)
   *    and native Fetch.
   * 2. No `async` keyword or `await` expressions are used in this method.
   * 3. Handles timeout via AbortController.
   * 4. Validates JSON payload integrity step-by-step.
   * 5. Atomically writes to ModelRepository cache only upon complete verification.
   * 6. Dispatches callbacks (onSuccess, onError, onFinally) to notify callers.
   * =========================================================================
   */
  public fetchModelsInBackground(
    onSuccess?: (models: Model[]) => void,
    onError?: (error: Error) => void,
    onFinally?: () => void
  ): Promise<Model[]> {
    const url = this.apiUrl || 'https://binaire.app/hf-models-api.json';
    const repo = this.repository;

    // Create an AbortController with 20 second timeout for background sync
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    // Native Promise chain - STRICTLY NO ASYNC/AWAIT
    return fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    })
      .then((response: Response) => {
        clearTimeout(timeoutId);

        // 1. Validate HTTP status
        if (!response.ok) {
          throw new Error(`Background fetch HTTP ${response.status}: ${response.statusText}`);
        }

        // 2. Validate Content-Type
        const contentType = response.headers.get('content-type');
        if (contentType && !contentType.includes('application/json')) {
          throw new Error(`Background fetch received non-JSON content-type: ${contentType}`);
        }

        // 3. Parse JSON safely
        return response.json();
      })
      .then((rawJson: unknown) => {
        // 4. Large JSON safety: Schema and structural validation
        const validation = validateModelPayload(rawJson);
        if (!validation.isValid || validation.models.length === 0) {
          throw new Error(`Background payload validation failed: ${validation.errors.join('; ')}`);
        }

        // 5. Instantiate OOP Model instances
        const models: Model[] = validation.models.map((raw: RawModelData) => Model.fromRaw(raw));

        // 6. Atomically persist validated models to cache
        return repo.save(models).then(() => models);
      })
      .then((models: Model[]) => {
        // 7. Invoke success callback with new models
        if (onSuccess) {
          onSuccess(models);
        }
        return models;
      })
      .catch((err: unknown) => {
        clearTimeout(timeoutId);
        const error = err instanceof Error ? err : new Error(String(err));
        console.warn('[ModelApiService] Background fetch failed, preserving valid cache:', error.message);

        // Fallback to existing cache if available so UI remains fully functional
        return repo
          .getCachedModels()
          .then((cachedModels: Model[]) => {
            if (cachedModels.length > 0) {
              if (onSuccess) onSuccess(cachedModels);
              return cachedModels;
            }
            // If no cache, use fallback models
            const fallback = FALLBACK_MODELS.map(m => Model.fromRaw(m));
            if (onSuccess) onSuccess(fallback);
            return fallback;
          })
          .catch(() => {
            if (onError) onError(error);
            throw error;
          });
      })
      .finally(() => {
        if (onFinally) {
          onFinally();
        }
      });
  }
}
