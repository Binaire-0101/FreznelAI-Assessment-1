/**
 * Filter classes.
 *
 * Every facet in the UI is an object implementing the same tiny contract, so
 * `FilterPipeline` can hold a heterogeneous list of them and stay ignorant of
 * what any individual facet means:
 *
 *   get active()        is this facet constraining anything right now?
 *   matches(model)      does this one model survive the facet?
 *   valuesOf(model)     which facet values does this model contribute? (for counts)
 *   reset() / clone()   state management
 *
 * Adding a new facet is therefore a new subclass and one line in the pipeline -
 * no `if` chain anywhere has to learn about it.
 */

export class Filter {
  constructor({ id, label }) {
    if (new.target === Filter) throw new TypeError('Filter is abstract');
    this.id = id;
    this.label = label;
  }

  get active() {
    return false;
  }

  // eslint-disable-next-line no-unused-vars
  matches(model) {
    return true;
  }

  // eslint-disable-next-line no-unused-vars
  valuesOf(model) {
    return [];
  }

  reset() {}
}

/**
 * Multi-select over a set of discrete tag values.
 *
 * Selecting several values inside one facet is an OR (a model tagged either
 * `text-generation` or `translation` passes), which is what users expect;
 * combining facets is an AND, handled by the pipeline.
 */
export class TagSetFilter extends Filter {
  /**
   * @param {object} options
   * @param {Function} options.extract  model -> string | string[] of values
   */
  constructor({ id, label, extract, selected = [] }) {
    super({ id, label });
    this.extract = extract;
    this.selected = new Set(selected);
  }

  get active() {
    return this.selected.size > 0;
  }

  valuesOf(model) {
    const value = this.extract(model);
    if (Array.isArray(value)) return value.filter(Boolean);
    return value ? [value] : [];
  }

  matches(model) {
    if (!this.active) return true;
    const values = this.valuesOf(model);
    for (const value of values) {
      if (this.selected.has(value)) return true;
    }
    return false;
  }

  toggle(value) {
    if (this.selected.has(value)) this.selected.delete(value);
    else this.selected.add(value);
    return this;
  }

  set(values) {
    this.selected = new Set(values);
    return this;
  }

  reset() {
    this.selected.clear();
    return this;
  }
}

/**
 * Inclusive numeric range, used for the safetensor file count slider.
 *
 * `bounds` are the real min/max present in the catalogue and are recomputed on
 * every catalogue load; `min`/`max` are the user's current selection. When the
 * selection equals the bounds the facet reports itself inactive so it does not
 * pointlessly narrow the faceted counts.
 */
export class RangeFilter extends Filter {
  constructor({ id, label, extract, min = 0, max = Infinity }) {
    super({ id, label });
    this.extract = extract;
    this.bounds = { min, max };
    this.min = min;
    this.max = max;
  }

  get active() {
    return this.min > this.bounds.min || this.max < this.bounds.max;
  }

  valuesOf(model) {
    return [this.extract(model)];
  }

  matches(model) {
    const value = this.extract(model);
    return value >= this.min && value <= this.max;
  }

  /** Recompute the achievable range from the data and clamp the selection. */
  calibrate(models) {
    let min = Infinity;
    let max = -Infinity;
    for (const model of models) {
      const value = this.extract(model);
      if (value < min) min = value;
      if (value > max) max = value;
    }
    if (!Number.isFinite(min)) {
      min = 0;
      max = 0;
    }
    const wasFullRange = !this.active;
    this.bounds = { min, max };
    if (wasFullRange) {
      this.min = min;
      this.max = max;
    } else {
      this.min = Math.max(min, Math.min(this.min, max));
      this.max = Math.min(max, Math.max(this.max, min));
    }
    return this;
  }

  set(min, max) {
    this.min = min;
    this.max = max;
    return this;
  }

  reset() {
    this.min = this.bounds.min;
    this.max = this.bounds.max;
    return this;
  }
}

/** The four tag facets plus the range facet required by the brief. */
export function createDefaultFilters() {
  return [
    new TagSetFilter({
      id: 'pipeline',
      label: 'Pipeline tag',
      extract: (model) => model.pipelineTag,
    }),
    new TagSetFilter({
      id: 'family',
      label: 'Family tag',
      extract: (model) => model.family,
    }),
    new TagSetFilter({
      id: 'architecture',
      label: 'Architecture tag',
      extract: (model) => model.architecture,
    }),
    new TagSetFilter({
      id: 'weight',
      label: 'Weight tag',
      extract: (model) => model.weightTags,
    }),
    new RangeFilter({
      id: 'safetensors',
      label: 'Safetensor files',
      extract: (model) => model.safetensorFiles || 0,
      min: 0,
      max: 0,
    }),
  ];
}
