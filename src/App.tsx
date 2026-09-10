import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  Filter,
  LogOut,
  Search,
  SlidersHorizontal,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { AuthenticationScreen } from "./components/Auth/AuthenticationScreen";
import { FilterSelect } from "./components/Filters/FilterSelect";
import { ModelCard } from "./components/Models/ModelCard";
import { auth, firebaseReady } from "./auth/firebase";
import { LocalAuthService, type LocalUser } from "./auth/localAuth";
import { ModelApi } from "./api/ModelApi";
import type { Model, ModelFilters, SortKey } from "./models/types";
import { ModelSearchEngine } from "./search/ModelSearchEngine";

const modelApi = new ModelApi();
const searchEngine = new ModelSearchEngine();
const localAuth = new LocalAuthService();

const initialFilters: ModelFilters = {
  query: "",
  family: "",
  pipeline: "",
  architecture: "",
  weight: "",
  minFiles: 0,
  maxFiles: 9999,
};

type ApplicationUser =
  | LocalUser
  | {
      email: string;
      isLocalUser: false;
    };

type FilterOptions = {
  families: string[];
  pipelines: string[];
  architectures: string[];
  weights: string[];
  maxFiles: number;
};

function getUniqueValues(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort();
}

function getFilterOptions(models: Model[]): FilterOptions {
  return {
    families: getUniqueValues(models.map((model) => model.family)),
    pipelines: getUniqueValues(
      models.map((model) => model.hf_tags.pipeline_tag ?? ""),
    ),
    architectures: getUniqueValues(
      models.flatMap((model) => [
        model.architecture_category,
        ...(model.hf_tags.architecture ?? []),
      ]),
    ),
    weights: getUniqueValues(models.map((model) => model.weight_format)),
    maxFiles: Math.max(
      ...models.map((model) => model.safetensor_file_count),
      100,
    ),
  };
}

function App() {
  const [user, setUser] = useState<ApplicationUser | null>(() =>
    localAuth.getSavedUser(),
  );
  const [models, setModels] = useState<Model[]>([]);
  const [filters, setFilters] = useState<ModelFilters>(initialFilters);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("name-asc");
  const [dataSource, setDataSource] = useState<"live" | "offline">("live");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    if (!auth || user?.isLocalUser) return undefined;

    return onAuthStateChanged(auth, (firebaseUser) => {
      setUser(
        firebaseUser
          ? {
              email: firebaseUser.email ?? "",
              isLocalUser: false,
            }
          : null,
      );
    });
  }, [user?.isLocalUser]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(filters.query);
    }, 220);

    return () => window.clearTimeout(timer);
  }, [filters.query]);

  useEffect(() => {
    modelApi
      .load()
      .then(({ models: loadedModels, source }) => {
        setModels(loadedModels);
        setDataSource(source);
        setErrorMessage("");
      })
      .catch((error: Error) => setErrorMessage(error.message))
      .finally(() => setIsLoading(false));

    const updateConnectionStatus = () => setIsOffline(!navigator.onLine);
    window.addEventListener("online", updateConnectionStatus);
    window.addEventListener("offline", updateConnectionStatus);

    return () => {
      window.removeEventListener("online", updateConnectionStatus);
      window.removeEventListener("offline", updateConnectionStatus);
    };
  }, []);

  const filterOptions = useMemo(() => getFilterOptions(models), [models]);
  const visibleModels = useMemo(
    () =>
      searchEngine.search(models, { ...filters, query: debouncedQuery }, sort),
    [models, filters, debouncedQuery, sort],
  );

  if (!user) {
    return (
      <AuthenticationScreen onLocalLogin={(localUser) => setUser(localUser)} />
    );
  }

  function updateFilter(key: keyof ModelFilters, value: string | number) {
    setFilters((currentFilters) => ({ ...currentFilters, [key]: value }));
  }

  function handleSignOut() {
    if (!user) return;

    if (user.isLocalUser) {
      localAuth.signOut();
      setUser(null);
      return;
    }

    if (auth) signOut(auth);
  }

  const activeFilterCount = Object.entries(filters).filter(
    ([key, value]) =>
      key !== "query" &&
      value !== "" &&
      value !== 0 &&
      value !== filterOptions.maxFiles,
  ).length;
  const offlineMode = isOffline || dataSource === "offline";

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">M</span>
          <span>Model Atlas</span>
        </div>
        <div className={`connection ${offlineMode ? "is-offline" : ""}`}>
          {offlineMode ? <WifiOff size={15} /> : <Wifi size={15} />}
          {offlineMode ? "Offline mode" : "Live index"}
        </div>
        <div className="user-menu">
          <span>{user.email}</span>
          <button
            className="icon-button"
            onClick={handleSignOut}
            title="Sign out"
          >
            <LogOut size={17} />
          </button>
        </div>
      </header>

      <main className="workspace">
        <section className="intro">
          <div>
            <span className="eyebrow">CURATED MODEL INDEX</span>
            <h1>
              Choose with
              <br />
              <em>context.</em>
            </h1>
            <p>
              Search {models.length.toLocaleString()} Hugging Face models by the
              details that matter to your workload.
            </p>
          </div>
          <div className="intro-note">
            <span className="note-dot" />
            {firebaseReady
              ? "Your shortlist is private"
              : "Firebase setup required"}
            <small>Authenticated workspace</small>
          </div>
        </section>

        {errorMessage && <div className="notice">{errorMessage}</div>}
        <SearchControls
          filters={filters}
          sort={sort}
          filtersOpen={filtersOpen}
          activeFilterCount={activeFilterCount}
          onQueryChange={(query) => updateFilter("query", query)}
          onSortChange={setSort}
          onToggleFilters={() => setFiltersOpen((isOpen) => !isOpen)}
        />

        {filtersOpen && (
          <FilterPanel
            filters={filters}
            options={filterOptions}
            onFilterChange={updateFilter}
            onClear={() => setFilters(initialFilters)}
            onClose={() => setFiltersOpen(false)}
          />
        )}

        <div className="results-head">
          <span>
            {isLoading ? "Loading index..." : `${visibleModels.length} models`}
          </span>
          <span className="results-caption">
            {dataSource === "offline"
              ? "Using last saved snapshot"
              : "Updated from hosted API"}
          </span>
        </div>

        <section className="model-grid">
          {visibleModels.map((model, index) => (
            <ModelCard key={model.id} model={model} position={index} />
          ))}
        </section>

        {!isLoading && visibleModels.length === 0 && (
          <div className="empty">
            <Filter size={25} />
            <h2>No models match these filters</h2>
            <p>Try widening your search or clearing a characteristic.</p>
          </div>
        )}
      </main>
    </div>
  );
}

type SearchControlsProps = {
  filters: ModelFilters;
  sort: SortKey;
  filtersOpen: boolean;
  activeFilterCount: number;
  onQueryChange: (query: string) => void;
  onSortChange: (sort: SortKey) => void;
  onToggleFilters: () => void;
};

function SearchControls({
  filters,
  sort,
  filtersOpen,
  activeFilterCount,
  onQueryChange,
  onSortChange,
  onToggleFilters,
}: SearchControlsProps) {
  return (
    <section className="control-bar">
      <div className="search-field">
        <Search size={19} />
        <input
          value={filters.query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search by model name, family, or author"
        />
        <kbd>⌘ K</kbd>
      </div>
      <button
        className={`filter-toggle ${filtersOpen ? "active" : ""}`}
        onClick={onToggleFilters}
      >
        <SlidersHorizontal size={17} />
        Filters
        {activeFilterCount > 0 && <b>{activeFilterCount}</b>}
      </button>
      <div className="sort-select">
        <span>Sort</span>
        <select
          value={sort}
          onChange={(event) => onSortChange(event.target.value as SortKey)}
        >
          <option value="name-asc">Name A to Z</option>
          <option value="name-desc">Name Z to A</option>
          <option value="files-desc">Safetensors high to low</option>
          <option value="files-asc">Safetensors low to high</option>
        </select>
        {sort.includes("asc") ? (
          <ArrowDownAZ size={16} />
        ) : (
          <ArrowUpAZ size={16} />
        )}
      </div>
    </section>
  );
}

type FilterPanelProps = {
  filters: ModelFilters;
  options: FilterOptions;
  onFilterChange: (key: keyof ModelFilters, value: string | number) => void;
  onClear: () => void;
  onClose: () => void;
};

function FilterPanel({
  filters,
  options,
  onFilterChange,
  onClear,
  onClose,
}: FilterPanelProps) {
  return (
    <section className="filter-panel">
      <div className="filter-heading">
        <div>
          <span className="eyebrow">REFINE RESULTS</span>
          <h2>Model characteristics</h2>
        </div>
        <button className="icon-button" onClick={onClose} title="Close filters">
          <X size={18} />
        </button>
      </div>
      <div className="filter-grid">
        <FilterSelect
          label="Family"
          value={filters.family}
          options={options.families}
          onChange={(value) => onFilterChange("family", value)}
        />
        <FilterSelect
          label="Pipeline tag"
          value={filters.pipeline}
          options={options.pipelines}
          onChange={(value) => onFilterChange("pipeline", value)}
        />
        <FilterSelect
          label="Architecture"
          value={filters.architecture}
          options={options.architectures}
          onChange={(value) => onFilterChange("architecture", value)}
        />
        <FilterSelect
          label="Weight format"
          value={filters.weight}
          options={options.weights}
          onChange={(value) => onFilterChange("weight", value)}
        />
        <label>
          Safetensor files
          <div className="range-label">
            <span>{filters.minFiles}</span>
            <span>
              {filters.maxFiles === options.maxFiles
                ? `${options.maxFiles}+`
                : filters.maxFiles}
            </span>
          </div>
          <div className="range-row">
            <input
              type="range"
              min="0"
              max={options.maxFiles}
              value={filters.minFiles}
              onChange={(event) =>
                onFilterChange("minFiles", Number(event.target.value))
              }
            />
            <input
              type="range"
              min="0"
              max={options.maxFiles}
              value={filters.maxFiles}
              onChange={(event) =>
                onFilterChange("maxFiles", Number(event.target.value))
              }
            />
          </div>
        </label>
      </div>
      <button className="text-button" onClick={onClear}>
        Clear all filters
      </button>
    </section>
  );
}

export default App;
