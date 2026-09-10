import { useCallback, useState } from 'react';
import { Button, Content, Flex, Heading, InlineAlert, Text } from '@adobe/react-spectrum';
import { AppHeader } from '../components/Layout/AppHeader.jsx';
import { NetworkBanner } from '../components/Layout/NetworkStatus.jsx';
import { SearchToolbar } from '../components/Search/SearchToolbar.jsx';
import { FilterSidebar } from '../components/Filters/FilterSidebar.jsx';
import { EmptyState, ModelGrid, SkeletonGrid } from '../components/Models/ModelGrid.jsx';
import { ModelDetailDialog } from '../components/Models/ModelDetailDialog.jsx';
import { useCatalog } from '../hooks/useCatalog.js';
import { formatBytes } from '../utils/format.js';

/**
 * The main screen: header, toolbar, facet sidebar, result grid.
 *
 * All of the interesting behaviour lives in `useCatalog` / `ModelRepository`;
 * this component is deliberately just composition and layout.
 */
export function ExplorerScreen({ user, onSignOut, colorScheme, onToggleTheme }) {
  const catalog = useCatalog();
  const [selected, setSelected] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const {
    results,
    facets,
    matched,
    total,
    status,
    origin,
    pointer,
    error,
    progress,
    online,
    queryInput,
    appliedQuery,
    field,
    sort,
    sortOptions,
    activeFilterCount,
    filterState,
    safetensorBounds,
    safetensorRange,
    onQueryChange,
    onQuerySubmit,
    setField,
    setSort,
    toggleFacet,
    setRange,
    clearFilters,
    clearAll,
    refresh,
    dismissError,
  } = catalog;

  const openModel = useCallback((model) => setSelected(model), []);
  const closeModel = useCallback(() => setSelected(null), []);

  const firstLoad = status === 'loading' && total === 0;
  const isFiltered = Boolean(appliedQuery) || activeFilterCount > 0;
  // Changing any of these three restarts the grid's paging and entrance
  // animation, which is the visual cue that the result set is new.
  const resetKey = `${appliedQuery}|${sort}|${field}|${activeFilterCount}|${JSON.stringify(filterState)}`;

  return (
    <div className="explorer">
      <AppHeader
        user={user}
        online={online}
        status={status}
        pointer={pointer}
        colorScheme={colorScheme}
        onToggleTheme={onToggleTheme}
        onRefresh={refresh}
        onSignOut={onSignOut}
      />

      <NetworkBanner online={online} origin={origin} onRetry={refresh} />

      <DownloadProgress status={status} progress={progress} />

      {error && !firstLoad ? (
        <InlineAlert variant="notice" UNSAFE_className="explorer__alert" width="100%">
          <Heading>Could not reach the API</Heading>
          <Content>
            <Text>{error.message}</Text>
            <Flex gap="size-100" marginTop="size-150">
              <Button variant="secondary" style="outline" onPress={dismissError}>
                <Text>Dismiss</Text>
              </Button>
              {online ? (
                <Button variant="primary" style="outline" onPress={refresh}>
                  <Text>Try again</Text>
                </Button>
              ) : null}
            </Flex>
          </Content>
        </InlineAlert>
      ) : null}

      <div className="explorer__body">
        <button
          type="button"
          className="filters-toggle"
          onClick={() => setFiltersOpen((open) => !open)}
          aria-expanded={filtersOpen}
        >
          {filtersOpen ? 'Hide filters' : 'Show filters'}
          {activeFilterCount ? <span className="filters-toggle__badge">{activeFilterCount}</span> : null}
        </button>

        <div className={`explorer__sidebar ${filtersOpen ? 'is-open' : ''}`}>
          <FilterSidebar
            facets={facets}
            filterState={filterState}
            safetensorBounds={safetensorBounds}
            safetensorRange={safetensorRange}
            activeFilterCount={activeFilterCount}
            onToggleFacet={toggleFacet}
            onSetRange={setRange}
            onClearFilters={clearFilters}
          />
        </div>

        <main className="explorer__main">
          <SearchToolbar
            value={queryInput}
            field={field}
            sort={sort}
            sortOptions={sortOptions}
            matched={matched}
            total={total}
            isFiltered={isFiltered}
            onQueryChange={onQueryChange}
            onQuerySubmit={onQuerySubmit}
            onFieldChange={setField}
            onSortChange={setSort}
          />

          {firstLoad ? (
            <SkeletonGrid />
          ) : matched === 0 ? (
            <EmptyState
              hasQuery={Boolean(appliedQuery)}
              hasFilters={activeFilterCount > 0}
              onClear={clearAll}
            />
          ) : (
            <ModelGrid
              models={results.models}
              query={appliedQuery}
              resetKey={resetKey}
              onOpen={openModel}
            />
          )}

          <SnapshotFooter pointer={pointer} origin={origin} />
        </main>
      </div>

      <ModelDetailDialog model={selected} online={online} onClose={closeModel} />
    </div>
  );
}

/** Byte-level feedback from the background worker. */
function DownloadProgress({ status, progress }) {
  if (status !== 'loading' && status !== 'refreshing') return null;

  const isVerifying = progress && progress.phase === 'verifying';
  const received = progress && progress.received ? progress.received : 0;
  const pageTotal = progress && progress.pageTotal ? progress.pageTotal : 0;
  const percent = pageTotal ? Math.min(100, Math.round((received / pageTotal) * 100)) : 0;
  const page = progress && progress.page ? progress.page : 1;
  const pages = progress && progress.pages ? progress.pages : 1;

  return (
    <div className="download" role="status" aria-live="polite">
      <div className="download__bar">
        <span
          className={`download__fill ${percent ? '' : 'download__fill--indeterminate'}`}
          style={percent ? { width: `${percent}%` } : undefined}
        />
      </div>
      <span className="download__label">
        {isVerifying
          ? 'Verifying checksum and committing the snapshot…'
          : `Downloading catalogue in the background — page ${page} of ${pages}${
              received ? ` · ${formatBytes(received)}` : ''
            }`}
      </span>
    </div>
  );
}

function SnapshotFooter({ pointer, origin }) {
  if (!pointer) return null;
  return (
    <footer className="snapshot">
      <span className={`snapshot__dot snapshot__dot--${origin}`} aria-hidden="true" />
      <span>
        {origin === 'cache' ? 'Verified offline snapshot' : 'Fresh from the API'} ·{' '}
        {pointer.count ? pointer.count.toLocaleString() : 0} models ·{' '}
        {pointer.bytes ? formatBytes(pointer.bytes) : '—'} downloaded ·{' '}
        {pointer.fetchedAt ? new Date(pointer.fetchedAt).toLocaleString() : ''}
      </span>
      {pointer.checksum ? (
        <span className="snapshot__hash" title="SHA-256 of the stored catalogue">
          sha256:{String(pointer.checksum).slice(0, 12)}
        </span>
      ) : null}
      {pointer.ephemeral ? <span className="snapshot__warn">not persisted</span> : null}
    </footer>
  );
}
