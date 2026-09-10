import { useState } from 'react';
import { Button, Flex, Text } from '@adobe/react-spectrum';
import { ModelCard } from './ModelCard.jsx';

/**
 * Result grid with incremental reveal.
 *
 * A filtered catalogue can still be several hundred cards. Rendering them all
 * on a keystroke is what makes "instant" search feel sluggish, so the grid
 * mounts a page at a time and grows either on demand or when the sentinel at
 * the bottom scrolls into view. The `resetKey` prop collapses it back to the
 * first page whenever the query or filters change, so a new search always
 * starts at the top with a fresh entrance animation.
 */

const PAGE_SIZE = 24;

export function ModelGrid({ models, query, resetKey, onOpen }) {
  const [paging, setPaging] = useState({ key: resetKey, visible: PAGE_SIZE });

  // Collapse back to page one whenever the result set changes, adjusted during
  // render so the shortened list is committed together with the new results.
  if (paging.key !== resetKey) {
    setPaging({ key: resetKey, visible: PAGE_SIZE });
  }

  const shown = models.slice(0, paging.visible);
  const remaining = models.length - shown.length;

  return (
    <>
      <div className="grid" key={resetKey}>
        {shown.map((model, index) => (
          <ModelCard key={model.id} model={model} query={query} index={index} onOpen={onOpen} />
        ))}
      </div>

      {remaining > 0 ? (
        <Flex justifyContent="center" marginTop="size-300" marginBottom="size-400">
          <Button
            variant="secondary"
            onPress={() => setPaging((state) => ({ ...state, visible: state.visible + PAGE_SIZE * 2 }))}
          >
            <Text>Show {Math.min(remaining, PAGE_SIZE * 2)} more of {remaining.toLocaleString()}</Text>
          </Button>
        </Flex>
      ) : null}
    </>
  );
}

export function SkeletonGrid({ count = 9 }) {
  return (
    <div className="grid" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="skeleton" style={{ '--stagger': `${index * 40}ms` }}>
          <div className="skeleton__line skeleton__line--sm" />
          <div className="skeleton__line skeleton__line--lg" />
          <div className="skeleton__chips">
            <span />
            <span />
            <span />
          </div>
          <div className="skeleton__stats" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ hasQuery, hasFilters, onClear }) {
  return (
    <div className="empty">
      <div className="empty__mark" aria-hidden="true">
        ⌕
      </div>
      <h3 className="empty__title">No models match</h3>
      <p className="empty__body">
        {hasQuery && hasFilters
          ? 'Nothing in the catalogue matches that search together with the active filters.'
          : hasQuery
            ? 'Nothing in the catalogue matches that search. Substring matches work from the start or the middle of a name — try a shorter fragment.'
            : 'The active filters exclude every model in the catalogue.'}
      </p>
      {hasQuery || hasFilters ? (
        <Button variant="accent" onPress={onClear} marginTop="size-200">
          <Text>Reset search and filters</Text>
        </Button>
      ) : null}
    </div>
  );
}
