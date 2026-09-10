import React, { useEffect, useState, useMemo } from 'react';
import { Header } from './components/Header';
import { SearchBar } from './components/SearchBar';
import { SidebarFilters } from './components/SidebarFilters';
import { ModelCard } from './components/ModelCard';
import { ModelDetailModal } from './components/ModelDetailModal';
import { AuthModal } from './components/AuthModal';
import { BackgroundFetchPanel } from './components/BackgroundFetchPanel';
import { NetworkStatusBanner } from './components/NetworkStatusBanner';
import { ModelService } from './models/ModelService';
import { NetworkStatusManager } from './offline/NetworkStatusManager';
import { AuthService } from './auth/AuthService';
import { Debouncer } from './search/Debouncer';
import { Throttler } from './search/Throttler';
import { AIModel, FilterState, NetworkState, SortOption, UserProfile } from './types';
import './styles/spectrum.css';

const DEFAULT_FILTERS: FilterState = {
  searchQuery: '',
  searchMode: 'all',
  matchType: 'any',
  pipelineTags: [],
  familyTags: [],
  architectureTags: [],
  weightTags: [],
  minSafetensorCount: 1,
  maxSafetensorCount: 50,
  useDebounce: true,
  useThrottle: false,
  debounceMs: 300,
  throttleMs: 500
};

const DEFAULT_SORT: SortOption = {
  field: 'name',
  direction: 'asc'
};

export const App: React.FC = () => {
  // Instantiating OOP Core Services
  const modelService = useMemo(() => new ModelService(), []);
  const debouncer = useMemo(() => new Debouncer(), []);
  const throttler = useMemo(() => new Throttler(), []);
  const networkManager = useMemo(() => NetworkStatusManager.getInstance(), []);
  const authService = useMemo(() => AuthService.getInstance(), []);

  // State
  const [models, setModels] = useState<AIModel[]>([]);
  const [displayedModels, setDisplayedModels] = useState<AIModel[]>([]);
  const [filterState, setFilterState] = useState<FilterState>(DEFAULT_FILTERS);
  const [sortOption, setSortOption] = useState<SortOption>(DEFAULT_SORT);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [isOfflineData, setIsOfflineData] = useState(false);
  const [useLiveApi, setUseLiveApi] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Modals & Panels
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isTechPanelOpen, setIsTechPanelOpen] = useState(false);

  // Auth & Network State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [networkState, setNetworkState] = useState<NetworkState>(networkManager.getState());

  // Initialize Data & Event Listeners
  useEffect(() => {
    // Register Service Worker for offline PWA caching
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((e) => console.log('SW registration fallback:', e));
    }

    // Subscribe to Network status
    const unsubscribeNet = networkManager.subscribe((state) => {
      setNetworkState(state);
      // Reload models when connection status changes
      loadModelData(useLiveApi);
    });

    // Subscribe to Auth status
    const unsubscribeAuth = authService.subscribe((user) => {
      setCurrentUser(user);
    });

    loadModelData(useLiveApi);

    return () => {
      unsubscribeNet();
      unsubscribeAuth();
    };
  }, [useLiveApi]);

  const loadModelData = (liveApi: boolean) => {
    modelService.loadModels(liveApi).then(({ models, isOfflineData }) => {
      setModels(models);
      setIsOfflineData(isOfflineData);
      updateProcessedModels(filterState, sortOption);
    });
  };

  // Process models with Debouncing or Throttling
  const updateProcessedModels = (filters: FilterState, sort: SortOption) => {
    const runProcessing = () => {
      const processed = modelService.processModels(filters, sort);
      setDisplayedModels(processed);
    };

    if (filters.useDebounce && filters.searchQuery) {
      debouncer.execute(runProcessing, filters.debounceMs);
    } else if (filters.useThrottle && filters.searchQuery) {
      throttler.execute(runProcessing, filters.throttleMs);
    } else {
      runProcessing();
    }
  };

  const handleFilterChange = (updates: Partial<FilterState>) => {
    const updatedState = { ...filterState, ...updates };
    setFilterState(updatedState);
    updateProcessedModels(updatedState, sortOption);
  };

  const handleSortChange = (newSort: SortOption) => {
    setSortOption(newSort);
    updateProcessedModels(filterState, newSort);
  };

  const handleResetFilters = () => {
    setFilterState(DEFAULT_FILTERS);
    setSortOption(DEFAULT_SORT);
    updateProcessedModels(DEFAULT_FILTERS, DEFAULT_SORT);
  };

  const availableTags = useMemo(() => {
    return modelService.getAvailableTags();
  }, [models]);

  return (
    <div className={`spectrum ${theme === 'dark' ? 'spectrum--darkest' : 'spectrum--light'}`} style={{ minHeight: '100vh' }}>
      
      {/* Header */}
      <Header
        networkState={networkState}
        onToggleSimulatedOffline={() => networkManager.toggleSimulatedOffline()}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={() => authService.logout()}
        onOpenTechPanel={() => setIsTechPanelOpen(true)}
        isLiveApi={useLiveApi}
        onToggleLiveApi={() => setUseLiveApi(!useLiveApi)}
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      />

      {/* Network Offline Alert Banner */}
      <NetworkStatusBanner
        networkState={networkState}
        onToggleSimulatedOffline={() => networkManager.toggleSimulatedOffline()}
        isOfflineData={isOfflineData}
      />

      {/* Main Body */}
      <main style={{ padding: '28px', maxWidth: '1600px', margin: '0 auto' }}>
        
        {/* Search Bar & Throttle/Debounce Controls */}
        <SearchBar
          filterState={filterState}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
          resultCount={displayedModels.length}
        />

        {/* Sidebar & Model Cards Grid Layout */}
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
          
          {/* Filters Sidebar */}
          <SidebarFilters
            filterState={filterState}
            onFilterChange={handleFilterChange}
            sortOption={sortOption}
            onSortChange={handleSortChange}
            availableTags={availableTags}
          />

          {/* Model Cards Grid View */}
          <div style={{ flex: 1 }}>
            {displayedModels.length === 0 ? (
              <div className="spectrum-Card" style={{ padding: '48px', textAlign: 'center', backgroundColor: 'var(--spectrum-global-color-100)' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>No Matching AI Models Found</h3>
                <p style={{ fontSize: '13px', color: 'var(--spectrum-global-color-600)', marginBottom: '16px' }}>
                  Try adjusting your search query, clearing tag filters, or resetting the Safetensor range filter.
                </p>
                <button className="spectrum-Button spectrum-Button--accent" onClick={handleResetFilters}>
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '20px'
              }}>
                {displayedModels.map((model) => (
                  <ModelCard
                    key={model.id}
                    model={model}
                    onSelectModel={(m) => setSelectedModel(m)}
                  />
                ))}
              </div>
            )}
          </div>

        </div>

      </main>

      {/* Modals */}
      <ModelDetailModal
        model={selectedModel}
        onClose={() => setSelectedModel(null)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
        }}
      />

      <BackgroundFetchPanel
        isOpen={isTechPanelOpen}
        onClose={() => setIsTechPanelOpen(false)}
      />

    </div>
  );
};

export default App;
