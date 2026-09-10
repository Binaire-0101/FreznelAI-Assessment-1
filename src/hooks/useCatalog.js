import { useCallback, useEffect, useMemo, useState } from 'react';
import { services } from '../services/container.js';
import { SearchField } from '../search/SearchEngine.js';
import { SearchScheduler } from '../utils/DebounceThrottle.js';

/**
 * React binding for `ModelRepository`.
 *
 * The split that makes the search box feel instant:
 *
 *   `queryInput`    updates on every keystroke and only drives the text field;
 *   `appliedQuery`  updates through a `SearchScheduler` (debounce 220ms with a
 *                   600ms throttled floor) and is the value the engine runs on.
 *
 * Results are derived with `useMemo`, so filter and sort changes re-run the
 * pipeline without touching the network - which is exactly why the app behaves
 * the same offline as online.
 */
export function useCatalog() {
  const { repository } = services;

  const [catalogVersion, setCatalogVersion] = useState(0);
  const [status, setStatus] = useState(repository.status);
  const [origin, setOrigin] = useState(repository.origin);
  const [pointer, setPointer] = useState(repository.pointer);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(null);
  const [online, setOnline] = useState(repository.isOnline);

  const [queryInput, setQueryInput] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [field, setField] = useState(SearchField.ALL);
  const [sort, setSort] = useState('relevance');
  const [filterVersion, setFilterVersion] = useState(0);

  // Lazy `useState` initialiser rather than a ref: the scheduler is created
  // exactly once per hook instance, and `setAppliedQuery` is guaranteed stable
  // by React, so the closure never goes stale.
  const [scheduler] = useState(
    () => new SearchScheduler((value) => setAppliedQuery(value), { debounce: 220, throttle: 600 }),
  );

  useEffect(() => {
    services.start();

    const offModels = repository.on('models', ({ origin: nextOrigin, pointer: nextPointer }) => {
      setOrigin(nextOrigin);
      setPointer(nextPointer);
      setCatalogVersion((version) => version + 1);
      setProgress(null);
    });
    const offStatus = repository.on('status', ({ status: nextStatus, error: nextError }) => {
      setStatus(nextStatus);
      if (nextError) setError(nextError);
      if (nextStatus === 'ready') setProgress(null);
    });
    const offProgress = repository.on('progress', setProgress);
    const offError = repository.on('error', setError);
    const offNetwork = repository.on('network', ({ online: nextOnline }) => setOnline(nextOnline));

    return () => {
      offModels();
      offStatus();
      offProgress();
      offError();
      offNetwork();
    };
  }, [repository]);

  useEffect(() => () => scheduler.cancel(), [scheduler]);

  const onQueryChange = useCallback(
    (value) => {
      setQueryInput(value);
      scheduler.schedule(value);
    },
    [scheduler],
  );

  /** Enter / clear should not wait out the debounce. */
  const onQuerySubmit = useCallback(
    (value) => {
      const next = value === undefined ? queryInput : value;
      setQueryInput(next);
      scheduler.immediate(next);
    },
    [queryInput, scheduler],
  );

  const toggleFacet = useCallback(
    (facetId, value) => {
      const facet = repository.filters.get(facetId);
      if (!facet) return;
      facet.toggle(value);
      setFilterVersion((version) => version + 1);
    },
    [repository],
  );

  const setRange = useCallback(
    (facetId, min, max) => {
      const facet = repository.filters.get(facetId);
      if (!facet) return;
      facet.set(min, max);
      setFilterVersion((version) => version + 1);
    },
    [repository],
  );

  const clearFilters = useCallback(() => {
    repository.filters.resetAll();
    setFilterVersion((version) => version + 1);
  }, [repository]);

  const clearAll = useCallback(() => {
    repository.filters.resetAll();
    setField(SearchField.ALL);
    setSort('relevance');
    onQuerySubmit('');
    setFilterVersion((version) => version + 1);
  }, [repository, onQuerySubmit]);

  const refresh = useCallback(() => repository.refresh({ silent: true }), [repository]);

  const results = useMemo(
    () => repository.query({ query: appliedQuery, field, sort }),
    // `catalogVersion` and `filterVersion` stand in for the mutable objects the
    // repository owns; bumping them is what tells React the derived data moved.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [repository, appliedQuery, field, sort, catalogVersion, filterVersion],
  );

  const safetensorFilter = repository.filters.get('safetensors');

  return {
    // data
    results,
    facets: results.facets,
    total: results.total,
    matched: results.matched,
    // status
    status,
    origin,
    pointer,
    error,
    progress,
    online,
    // query state
    queryInput,
    appliedQuery,
    field,
    sort,
    sortOptions: repository.sorter.options,
    activeFilterCount: repository.filters.activeCount,
    filterState: repository.filters.toJSON(),
    safetensorBounds: safetensorFilter ? safetensorFilter.bounds : { min: 0, max: 0 },
    safetensorRange: safetensorFilter
      ? { min: safetensorFilter.min, max: safetensorFilter.max }
      : { min: 0, max: 0 },
    // actions
    onQueryChange,
    onQuerySubmit,
    setField,
    setSort,
    toggleFacet,
    setRange,
    clearFilters,
    clearAll,
    refresh,
    dismissError: useCallback(() => setError(null), []),
  };
}
