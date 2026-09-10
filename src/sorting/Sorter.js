/**
 * Sorting as a strategy pattern.
 *
 * The brief requires two axes - safetensor file count and alphabetical model
 * name, each in both directions. Rather than a `switch` inside the query path,
 * each axis is a `SortStrategy` object that knows how to compare two models and
 * how to describe itself to the UI; `Sorter` just looks one up by id.
 *
 * Two details worth calling out:
 *  - name comparison uses `Intl.Collator`, so `Llama-10B` sorts after
 *    `Llama-9B` (numeric collation) and case never affects the order;
 *  - every strategy falls back to the model id as a final tie-break, which
 *    makes the sort *stable and deterministic* - without it, two models with
 *    the same safetensor count could swap places between renders.
 */

const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true });

export class SortStrategy {
  constructor({ id, label, group, direction }) {
    this.id = id;
    this.label = label;
    this.group = group;
    this.direction = direction;
  }

  // eslint-disable-next-line no-unused-vars
  compare(a, b) {
    return 0;
  }
}

export class NameSortStrategy extends SortStrategy {
  constructor(direction) {
    super({
      id: direction === 'asc' ? 'name-asc' : 'name-desc',
      label: direction === 'asc' ? 'Model name: A to Z' : 'Model name: Z to A',
      group: 'Model name',
      direction,
    });
    this._sign = direction === 'asc' ? 1 : -1;
  }

  compare(a, b) {
    const result = collator.compare(a.name || a.id, b.name || b.id);
    if (result !== 0) return result * this._sign;
    return collator.compare(a.id, b.id);
  }
}

export class SafetensorSortStrategy extends SortStrategy {
  constructor(direction) {
    super({
      id: direction === 'asc' ? 'safetensors-asc' : 'safetensors-desc',
      label: direction === 'asc' ? 'Safetensor files: fewest first' : 'Safetensor files: most first',
      group: 'Safetensor files',
      direction,
    });
    this._sign = direction === 'asc' ? 1 : -1;
  }

  compare(a, b) {
    const diff = (a.safetensorFiles || 0) - (b.safetensorFiles || 0);
    if (diff !== 0) return diff * this._sign;
    return collator.compare(a.id, b.id);
  }
}

/** Default ordering: whatever the search scored highest, then popularity. */
export class RelevanceSortStrategy extends SortStrategy {
  constructor() {
    super({ id: 'relevance', label: 'Best match', group: 'Relevance', direction: 'desc' });
  }

  compare(a, b) {
    const diff = (b.downloads || 0) - (a.downloads || 0);
    if (diff !== 0) return diff;
    return collator.compare(a.id, b.id);
  }
}

export class Sorter {
  constructor(strategies = Sorter.defaultStrategies()) {
    this.strategies = strategies;
    this._byId = new Map(strategies.map((strategy) => [strategy.id, strategy]));
  }

  static defaultStrategies() {
    return [
      new RelevanceSortStrategy(),
      new NameSortStrategy('asc'),
      new NameSortStrategy('desc'),
      new SafetensorSortStrategy('desc'),
      new SafetensorSortStrategy('asc'),
    ];
  }

  get(id) {
    return this._byId.get(id) || this.strategies[0];
  }

  get options() {
    return this.strategies.map(({ id, label, group }) => ({ id, label, group }));
  }

  /**
   * `relevance` is special: the search engine has already ordered the list by
   * score, so re-sorting would throw that ranking away. Every other strategy
   * sorts a copy, leaving the caller's array untouched.
   */
  sort(models, sortId, { preserveRelevance = false } = {}) {
    if (sortId === 'relevance' && preserveRelevance) return models;
    const strategy = this.get(sortId);
    return models.slice().sort((a, b) => strategy.compare(a, b));
  }
}
