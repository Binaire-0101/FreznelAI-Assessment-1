import { useState } from 'react';
import { Button, Divider, Flex, RangeSlider, Text } from '@adobe/react-spectrum';

/**
 * Facet sidebar.
 *
 * Four multi-select tag facets plus the safetensor range slider, matching the
 * brief. Each option carries the count it *would* yield, computed by
 * `FilterPipeline.facetCounts` with the other facets already applied, so a
 * visible option is never a dead end.
 */

const FACETS = [
  { id: 'pipeline', label: 'Pipeline tags', hint: 'What the model does' },
  { id: 'family', label: 'Family tags', hint: 'Model lineage' },
  { id: 'architecture', label: 'Architecture tags', hint: 'Implementation class' },
  { id: 'weight', label: 'Weight tags', hint: 'Serialization & precision' },
];

export function FilterSidebar({
  facets,
  filterState,
  safetensorBounds,
  safetensorRange,
  activeFilterCount,
  onToggleFacet,
  onSetRange,
  onClearFilters,
}) {
  return (
    <aside className="filters" aria-label="Filters">
      <Flex justifyContent="space-between" alignItems="center" UNSAFE_className="filters__head">
        <Text UNSAFE_className="filters__title">Filters</Text>
        {activeFilterCount > 0 ? (
          <Button variant="secondary" style="outline" onPress={onClearFilters}>
            Clear {activeFilterCount}
          </Button>
        ) : null}
      </Flex>

      {FACETS.map((facet) => (
        <FacetGroup
          key={facet.id}
          facet={facet}
          options={facets.get(facet.id) || []}
          selected={filterState[facet.id] || []}
          onToggle={(value) => onToggleFacet(facet.id, value)}
        />
      ))}

      <Divider size="S" marginTop="size-200" marginBottom="size-200" />

      <SafetensorRange
        bounds={safetensorBounds}
        range={safetensorRange}
        onChange={(min, max) => onSetRange('safetensors', min, max)}
      />
    </aside>
  );
}

const COLLAPSED_LIMIT = 8;

function FacetGroup({ facet, options, selected, onToggle }) {
  const [expanded, setExpanded] = useState(false);
  const [open, setOpen] = useState(true);

  const visible = expanded ? options : options.slice(0, COLLAPSED_LIMIT);
  const hidden = options.length - visible.length;

  return (
    <section className={`facet ${open ? '' : 'facet--closed'}`}>
      <button
        type="button"
        className="facet__head"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="facet__chevron" aria-hidden="true">
          ▾
        </span>
        <span className="facet__label">{facet.label}</span>
        {selected.length ? <span className="facet__badge">{selected.length}</span> : null}
      </button>

      <div className="facet__body">
        <p className="facet__hint">{facet.hint}</p>
        {options.length === 0 ? (
          <p className="facet__empty">No values in the current result set.</p>
        ) : (
          <ul className="facet__options">
            {visible.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  className={`chip ${option.selected ? 'chip--on' : ''}`}
                  aria-pressed={option.selected}
                  onClick={() => onToggle(option.value)}
                >
                  <span className="chip__label">{option.value}</span>
                  <span className="chip__count">{option.count}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {hidden > 0 ? (
          <button type="button" className="facet__more" onClick={() => setExpanded(true)}>
            Show {hidden} more
          </button>
        ) : null}
        {expanded && options.length > COLLAPSED_LIMIT ? (
          <button type="button" className="facet__more" onClick={() => setExpanded(false)}>
            Show fewer
          </button>
        ) : null}
      </div>
    </section>
  );
}

/**
 * Safetensor file count, min to max.
 *
 * Spectrum's `RangeSlider` is controlled, but dragging it emits a value on
 * every animation frame; re-running the whole query pipeline that often would
 * make the drag stutter on a big catalogue. So the slider tracks its own
 * position during the gesture (`onChange`) and only commits to the repository
 * when the handle is released (`onChangeEnd`).
 */
function SafetensorRange({ bounds, range, onChange }) {
  const [draft, setDraft] = useState(null);
  const value = draft || range;
  const disabled = bounds.max <= bounds.min;

  return (
    <div className="range-facet">
      <RangeSlider
        label="Safetensor files"
        minValue={bounds.min}
        maxValue={Math.max(bounds.max, bounds.min + 1)}
        step={1}
        value={{ start: value.min, end: value.max }}
        isDisabled={disabled}
        onChange={(next) => setDraft({ min: next.start, max: next.end })}
        onChangeEnd={(next) => {
          setDraft(null);
          onChange(next.start, next.end);
        }}
        width="100%"
      />
      <Text UNSAFE_className="range-facet__hint">
        {disabled
          ? 'Every model in this snapshot has the same number of safetensor files.'
          : `Showing models with ${value.min} to ${value.max} .safetensors files.`}
      </Text>
    </div>
  );
}
