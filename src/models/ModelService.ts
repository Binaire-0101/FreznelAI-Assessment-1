import { ApiService } from '../api/apiService';
import { FilterEngine } from '../filters/FilterEngine';
import { ModelCacheStorage } from '../offline/cacheStorage';
import { NetworkStatusManager } from '../offline/NetworkStatusManager';
import { SearchEngine } from '../search/SearchEngine';
import { SortEngine } from '../sorting/SortEngine';
import { AIModel, FilterState, SortOption } from '../types';

/**
 * OOP ModelService Facade Class
 * Coordinates data fetching, caching, searching, filtering, and sorting for the model selector.
 */
export class ModelService {
  private apiService: ApiService;
  private cacheStorage: ModelCacheStorage;
  private searchEngine: SearchEngine;
  private filterEngine: FilterEngine;
  private sortEngine: SortEngine;
  private networkManager: NetworkStatusManager;

  private allModels: AIModel[] = [];

  constructor() {
    this.apiService = new ApiService();
    this.cacheStorage = new ModelCacheStorage();
    this.searchEngine = new SearchEngine();
    this.filterEngine = new FilterEngine();
    this.sortEngine = new SortEngine();
    this.networkManager = NetworkStatusManager.getInstance();
  }

  /**
   * Load models from API (online) or IndexedDB Cache (offline)
   */
  public async loadModels(useLiveApi: boolean = false): Promise<{ models: AIModel[]; isOfflineData: boolean }> {
    const netState = this.networkManager.getState();
    
    if (netState.isOnline) {
      try {
        const fetched = await this.apiService.fetchModels(useLiveApi);
        this.allModels = fetched;
        await this.cacheStorage.saveModels(fetched);
        return { models: fetched, isOfflineData: false };
      } catch (err) {
        console.warn('Network request failed, loading from offline cache:', err);
        const cached = await this.cacheStorage.getModels();
        this.allModels = cached;
        return { models: cached, isOfflineData: true };
      }
    } else {
      // Offline mode
      const cached = await this.cacheStorage.getModels();
      this.allModels = cached;
      return { models: cached, isOfflineData: true };
    }
  }

  /**
   * Process search, filter, and sorting options across models
   */
  public processModels(filterState: FilterState, sortOption: SortOption): AIModel[] {
    // 1. Search Query Substring Matching
    const searched = this.searchEngine.search(
      this.allModels,
      filterState.searchQuery,
      filterState.searchMode,
      filterState.matchType
    );

    // 2. Multi-tag & Range Filtering
    const filtered = this.filterEngine.filter(searched, filterState);

    // 3. Multi-key Sorting (Safetensors count, Alphabetical name A-Z / Z-A)
    const sorted = this.sortEngine.sort(filtered, sortOption);

    return sorted;
  }

  public getAvailableTags() {
    return this.filterEngine.extractAvailableTags(this.allModels);
  }

  public getAllModels(): AIModel[] {
    return this.allModels;
  }
}
