import { createDefaultFilters, RangeFilter } from './Filters.js';

/**
 * Holds the active facets and applies them as a conjunction.
 *
 * It also produces *faceted counts*: for each facet, the number of models that
 * would remain if the user picked a given value. The count for facet F is
 * computed with every facet **except F** applied, which is the behaviour people
 * expect from a real filter sidebar - after choosing `text-generation` you
 * still see how many `llama` vs `qwen` models are available inside that choice,
 * and the options you did not pick in the *same* facet do not disappear.
 */
export class FilterPipeline {
  constructor(filters = createDefaultFilters()) {
    this.filters = filters;
    this._byId = new Map(filters.map((filter) => [filter.id, filter]));
  }

  get(id) {
    return this._byId.get(id);
  }

  get activeCount() {
    return this.filters.reduce((total, filter) => total + (filter.active ? 1 : 0), 0);
  }

  /** Re-derive numeric bounds whenever a new catalogue snapshot arrives. */
  calibrate(models) {
    for (const filter of this.filters) {
      if (filter instanceof RangeFilter) filter.calibrate(models);
    }
    return this;
  }

  apply(models) {
    if (this.activeCount === 0) return models;
    return models.filter((model) => this.filters.every((filter) => filter.matches(model)));
  }

  resetAll() {
    for (const filter of this.filters) filter.reset();
    return this;
  }

  /**
   * @returns {Map<string, Array<{value: string, count: number, selected: boolean}>>}
   */
  facetCounts(models, { limitPerFacet = 40 } = {}) {
    const result = new Map();

    for (const facet of this.filters) {
      if (facet instanceof RangeFilter) continue;

      const others = this.filters.filter((filter) => filter !== facet);
      const counts = new Map();

      for (const model of models) {
        // Every *other* facet must already accept this model, otherwise the
        // count would advertise options that lead to an empty result set.
        let allowed = true;
        for (const other of others) {
          if (!other.matches(model)) {
            allowed = false;
            break;
          }
        }
        if (!allowed) continue;

        for (const value of facet.valuesOf(model)) {
          counts.set(value, (counts.get(value) || 0) + 1);
        }
      }

      const options = Array.from(counts.entries())
        .map(([value, count]) => ({ value, count, selected: facet.selected.has(value) }))
        // Selected values stay pinned to the top so a choice never scrolls out
        // of view when the counts shuffle around it.
        .sort((a, b) => {
          if (a.selected !== b.selected) return a.selected ? -1 : 1;
          if (b.count !== a.count) return b.count - a.count;
          return a.value.localeCompare(b.value);
        })
        .slice(0, limitPerFacet);

      result.set(facet.id, options);
    }

    return result;
  }

  /** Serializable view of the current state, used for the URL/session restore. */
  toJSON() {
    const state = {};
    for (const filter of this.filters) {
      if (filter instanceof RangeFilter) {
        state[filter.id] = { min: filter.min, max: filter.max };
      } else {
        state[filter.id] = Array.from(filter.selected);
      }
    }
    return state;
  }

  fromJSON(state = {}) {
    for (const filter of this.filters) {
      const value = state[filter.id];
      if (value === undefined) continue;
      if (filter instanceof RangeFilter) filter.set(value.min, value.max);
      else filter.set(value);
    }
    return this;
  }
}
