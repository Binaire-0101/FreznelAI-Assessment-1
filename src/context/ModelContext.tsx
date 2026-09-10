/**
 * ModelContext providing global state, reactive filtering, sorting,
 * selected model persistence, and offline caching.
 *
 * Binaire Freznel AI Assessment - Requirements #9, #10, #11, #12, #13, #16, #17, #18
 */

import React, { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Model } from '../models/Model';
import { ModelRepository } from '../models/ModelRepository';
import { ModelApiService } from '../services/ModelApiService';
import { ModelFilterService } from '../services/ModelFilterService';
import { ModelSortService } from '../services/ModelSortService';
import { CacheMetadata, FilterCriteria, SortOption } from '../types/model';
import { useNetwork } from './NetworkContext';

const SELECTED_MODEL_STORAGE_KEY = 'bf_ai_selected_model_id';
const API_URL_STORAGE_KEY = 'bf_ai_custom_api_url';

// Stable singleton service instances instantiated outside components
const defaultRepository = new ModelRepository();
const defaultFilterService = new ModelFilterService();
const defaultSortService = new ModelSortService();
const defaultApiService = new ModelApiService(undefined, defaultRepository);

interface ModelContextType {
  models: Model[];
  filteredModels: Model[];
  selectedModel: Model | null;
  compareModels: Model[];
  filters: FilterCriteria;
  sortOption: SortOption;
  loading: boolean;
  isBackgroundSyncing: boolean;
  error: string | null;
  cacheMeta: CacheMetadata | null;
  isFromCache: boolean;
  availablePipelines: string[];
  availableFamilies: string[];
  availableArchitectures: string[];
  safetensorBounds: { min: number; max: number };
  apiUrl: string;

  // Actions
  setSearchQuery: (query: string) => void;
  setFamilyFilter: (family: string) => void;
  togglePipelineTag: (tag: string) => void;
  toggleFamilyTag: (tag: string) => void;
  toggleArchitectureTag: (tag: string) => void;
  toggleWeightCategory: (cat: string) => void;
  setSafetensorRange: (min: number, max: number) => void;
  clearFilters: () => void;
  setSortOption: (option: SortOption) => void;
  selectModel: (model: Model | null) => void;
  toggleCompareModel: (model: Model) => void;
  clearCompareModels: () => void;
  refreshModels: (force?: boolean) => Promise<void>;
  refreshInBackground: () => Promise<Model[]>;
  updateApiUrl: (url: string) => void;
  clearError: () => void;
}

const ModelContext = createContext<ModelContextType | undefined>(undefined);

export const ModelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isOnline } = useNetwork();

  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isBackgroundSyncing, setIsBackgroundSyncing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [cacheMeta, setCacheMeta] = useState<CacheMetadata | null>(null);
  const [isFromCache, setIsFromCache] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [compareModels, setCompareModels] = useState<Model[]>([]);
  const [apiUrl, setApiUrlState] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(API_URL_STORAGE_KEY);
      if (stored) {
        defaultApiService.setApiUrl(stored);
        return stored;
      }
      return defaultApiService.getApiUrl();
    } catch {
      return defaultApiService.getApiUrl();
    }
  });

  const [filters, setFilters] = useState<FilterCriteria>(ModelFilterService.createDefaultCriteria());
  const [sortOption, setSortOption] = useState<SortOption>(SortOption.NAME_ASC);

  const prevOnlineRef = useRef<boolean>(isOnline);

  const hydrateSelectedModel = useCallback((modelList: Model[]) => {
    try {
      const savedId = localStorage.getItem(SELECTED_MODEL_STORAGE_KEY);
      if (savedId) {
        const found = modelList.find(m => m.id === savedId);
        if (found) {
          setSelectedModel(found);
        }
      }
    } catch {
      // Ignore
    }
  }, []);

  // Initial models fetch via promise chain (Standard pattern)
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    defaultApiService
      .fetchModels()
      .then((data) => {
        if (!isMounted) return;
        setModels(data);
        setIsFromCache(false);
        hydrateSelectedModel(data);
        defaultRepository.getCacheMetadata().then((meta) => {
          if (isMounted) setCacheMeta(meta);
        });
      })
      .catch(() => {
        if (!isMounted) return;
        defaultRepository.getCachedModels().then((cached) => {
          if (!isMounted) return;
          if (cached.length > 0) {
            setModels(cached);
            setIsFromCache(true);
            hydrateSelectedModel(cached);
            setError('Unable to fetch fresh models. Showing the latest cached data.');
          } else {
            setError('Unable to load models. Please check your internet connection and try again.');
          }
        });
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [hydrateSelectedModel]);

  // Background sync handler using Raw Promises (Requirement #18)
  const refreshInBackground = useCallback((): Promise<Model[]> => {
    setIsBackgroundSyncing(true);

    return defaultApiService.fetchModelsInBackground(
      (freshModels: Model[]) => {
        setModels(freshModels);
        setIsFromCache(false);
        defaultRepository.getCacheMetadata().then(meta => setCacheMeta(meta));
      },
      (err: Error) => {
        console.warn('[ModelContext] Background sync notice:', err.message);
      },
      () => {
        setIsBackgroundSyncing(false);
      }
    );
  }, []);

  // Reconnection detection: Trigger background sync when returning online
  useEffect(() => {
    if (!prevOnlineRef.current && isOnline) {
      console.log('[ModelContext] Connection restored. Triggering background refresh...');
      refreshInBackground();
    }
    prevOnlineRef.current = isOnline;
  }, [isOnline, refreshInBackground]);

  /**
   * User-triggered manual refresh.
   */
  const refreshModels = useCallback(async (force: boolean = false) => {
    if (!isOnline && !force) {
      setError('You are offline. Showing cached model data.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fresh = await defaultApiService.fetchModels({ forceRefresh: force });
      setModels(fresh);
      setIsFromCache(!isOnline);
      const meta = await defaultRepository.getCacheMetadata();
      setCacheMeta(meta);
    } catch {
      const cached = await defaultRepository.getCachedModels();
      if (cached.length > 0) {
        setModels(cached);
        setIsFromCache(true);
        setError('Unable to fetch fresh models. Showing the latest cached data.');
      } else {
        setError('Unable to load models. Please check your internet connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [isOnline]);

  const updateApiUrl = useCallback((url: string) => {
    setApiUrlState(url);
    defaultApiService.setApiUrl(url);
    try {
      localStorage.setItem(API_URL_STORAGE_KEY, url);
    } catch {
      // Ignore
    }
    refreshModels(true);
  }, [refreshModels]);

  // Stable filter handlers with state equality guards
  const setSearchQuery = useCallback((query: string) => {
    setFilters(prev => {
      if (prev.searchQuery === query) return prev;
      return { ...prev, searchQuery: query };
    });
  }, []);

  const setFamilyFilter = useCallback((family: string) => {
    setFilters(prev => {
      if (prev.family === family) return prev;
      return { ...prev, family };
    });
  }, []);

  const togglePipelineTag = useCallback((tag: string) => {
    setFilters(prev => {
      const exists = prev.pipelineTags.includes(tag);
      return {
        ...prev,
        pipelineTags: exists
          ? prev.pipelineTags.filter(t => t !== tag)
          : [...prev.pipelineTags, tag],
      };
    });
  }, []);

  const toggleFamilyTag = useCallback((tag: string) => {
    setFilters(prev => {
      const exists = prev.familyTags.includes(tag);
      return {
        ...prev,
        familyTags: exists
          ? prev.familyTags.filter(t => t !== tag)
          : [...prev.familyTags, tag],
      };
    });
  }, []);

  const toggleArchitectureTag = useCallback((tag: string) => {
    setFilters(prev => {
      const exists = prev.architectureTags.includes(tag);
      return {
        ...prev,
        architectureTags: exists
          ? prev.architectureTags.filter(t => t !== tag)
          : [...prev.architectureTags, tag],
      };
    });
  }, []);

  const toggleWeightCategory = useCallback((cat: string) => {
    setFilters(prev => {
      const exists = prev.weightCategories.includes(cat);
      return {
        ...prev,
        weightCategories: exists
          ? prev.weightCategories.filter(c => c !== cat)
          : [...prev.weightCategories, cat],
      };
    });
  }, []);

  const setSafetensorRange = useCallback((min: number, max: number) => {
    setFilters(prev => {
      if (prev.minSafetensors === min && prev.maxSafetensors === max) return prev;
      return {
        ...prev,
        minSafetensors: min,
        maxSafetensors: max,
      };
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(ModelFilterService.createDefaultCriteria());
  }, []);

  const setSortOptionHandler = useCallback((option: SortOption) => {
    setSortOption(option);
  }, []);

  // Selection handler with persistence
  const selectModel = useCallback((model: Model | null) => {
    setSelectedModel(model);
    try {
      if (model) {
        localStorage.setItem(SELECTED_MODEL_STORAGE_KEY, model.id);
      } else {
        localStorage.removeItem(SELECTED_MODEL_STORAGE_KEY);
      }
    } catch {
      // Ignore
    }
  }, []);

  const toggleCompareModel = useCallback((model: Model) => {
    setCompareModels(prev => {
      const exists = prev.some(m => m.id === model.id);
      if (exists) {
        return prev.filter(m => m.id !== model.id);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), model]; // Cap at 3 for side-by-side readability
      }
      return [...prev, model];
    });
  }, []);

  const clearCompareModels = useCallback(() => {
    setCompareModels([]);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  // Derived metadata from loaded models
  const availablePipelines = useMemo(() => {
    return defaultFilterService.extractPipelineTags(models);
  }, [models]);

  const availableFamilies = useMemo(() => {
    return defaultFilterService.extractFamilyTags(models);
  }, [models]);

  const availableArchitectures = useMemo(() => {
    return defaultFilterService.extractArchitectureTags(models);
  }, [models]);

  const safetensorBounds = useMemo(() => {
    return defaultFilterService.getSafetensorBounds(models);
  }, [models]);

  // Filtered and sorted models derived cleanly using useMemo
  const filteredModels = useMemo(() => {
    const filtered = defaultFilterService.applyFilters(models, filters);
    return defaultSortService.sort(filtered, sortOption);
  }, [models, filters, sortOption]);

  const contextValue = useMemo(
    () => ({
      models,
      filteredModels,
      selectedModel,
      compareModels,
      filters,
      sortOption,
      loading,
      isBackgroundSyncing,
      error,
      cacheMeta,
      isFromCache: isFromCache || !isOnline,
      availablePipelines,
      availableFamilies,
      availableArchitectures,
      safetensorBounds,
      apiUrl,
      setSearchQuery,
      setFamilyFilter,
      togglePipelineTag,
      toggleFamilyTag,
      toggleArchitectureTag,
      toggleWeightCategory,
      setSafetensorRange,
      clearFilters,
      setSortOption: setSortOptionHandler,
      selectModel,
      toggleCompareModel,
      clearCompareModels,
      refreshModels,
      refreshInBackground,
      updateApiUrl,
      clearError,
    }),
    [
      models,
      filteredModels,
      selectedModel,
      compareModels,
      filters,
      sortOption,
      loading,
      isBackgroundSyncing,
      error,
      cacheMeta,
      isFromCache,
      isOnline,
      availablePipelines,
      availableFamilies,
      availableArchitectures,
      safetensorBounds,
      apiUrl,
      setSearchQuery,
      setFamilyFilter,
      togglePipelineTag,
      toggleFamilyTag,
      toggleArchitectureTag,
      toggleWeightCategory,
      setSafetensorRange,
      clearFilters,
      setSortOptionHandler,
      selectModel,
      toggleCompareModel,
      clearCompareModels,
      refreshModels,
      refreshInBackground,
      updateApiUrl,
      clearError,
    ]
  );

  return (
    <ModelContext.Provider value={contextValue}>
      {children}
    </ModelContext.Provider>
  );
};

export function useModels(): ModelContextType {
  const context = useContext(ModelContext);
  if (!context) {
    throw new Error('useModels must be used within a ModelProvider');
  }
  return context;
}
