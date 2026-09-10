/**
 * Ranked substring search over the model catalogue.
 *
 * The brief asks for two query fields - model name and model family - and for
 * matches "from the start or the middle" of a value. Both are handled by the
 * same scorer, which does not just answer yes/no but grades *where* the match
 * landed, so `llama` puts `meta-llama/Llama-3-8B` above `foo/my-llama-tune`.
 *
 * Ranking, best first:
 *   exact         the field equals the query
 *   prefix        the field starts with the query
 *   boundary      the query starts a word inside the field ("-", "_", ".", "/")
 *   infix         the query appears somewhere in the middle
 *
 * Performance: every model is indexed once into a small record of pre-lowered
 * strings (`SearchIndex`), so a keystroke costs one pass of `indexOf` per
 * indexed field rather than repeated `toLowerCase()` allocation over the whole
 * catalogue.
 */

export const SearchField = Object.freeze({
  ALL: 'all',
  NAME: 'name',
  FAMILY: 'family',
});

const MATCH_KIND_SCORE = {
  exact: 1000,
  prefix: 600,
  boundary: 420,
  infix: 260,
};

/** Field weights, so a name hit outranks an equally-placed family hit. */
const FIELD_WEIGHT = {
  name: 1,
  id: 0.95,
  author: 0.6,
  family: 0.85,
  architecture: 0.5,
};

/** Pre-lowered projection of a model, built once per catalogue load. */
export class SearchIndex {
  constructor(models = []) {
    this.build(models);
  }

  build(models) {
    this.models = models;
    this.entries = models.map((model) => ({
      model,
      name: String(model.name || '').toLowerCase(),
      id: String(model.id || '').toLowerCase(),
      author: String(model.author || '').toLowerCase(),
      family: String(model.family || '').toLowerCase(),
      architecture: String(model.architecture || '').toLowerCase(),
      // Popularity is folded into the score as a tie-breaker between equally
      // good textual matches; log-scaled so a 10M-download model cannot
      // outrank a genuinely better text match.
      popularity: Math.log10((model.downloads || 0) + (model.likes || 0) * 10 + 1),
    }));
    return this;
  }

  get size() {
    return this.entries.length;
  }
}

export class SearchEngine {
  constructor(models = []) {
    this.index = new SearchIndex(models);
  }

  setModels(models) {
    this.index.build(models);
    return this;
  }

  get size() {
    return this.index.size;
  }

  /**
   * @param {string} rawQuery
   * @param {object} options
   * @param {string} options.field   one of `SearchField`
   * @returns {Array<{model: object, score: number, matches: object}>}
   */
  search(rawQuery, { field = SearchField.ALL } = {}) {
    const query = String(rawQuery || '').trim().toLowerCase();
    if (!query) {
      return this.index.entries.map((entry) => ({ model: entry.model, score: 0, matches: {} }));
    }

    const fields = fieldsFor(field);
    const results = [];

    for (const entry of this.index.entries) {
      let best = 0;
      let total = 0;
      const matches = {};

      for (const name of fields) {
        const value = entry[name];
        if (!value) continue;
        const kind = classifyMatch(value, query);
        if (!kind) continue;
        matches[name] = { kind, at: value.indexOf(query), length: query.length };
        const score = MATCH_KIND_SCORE[kind] * (FIELD_WEIGHT[name] || 0.5);
        total += score;
        if (score > best) best = score;
      }

      if (best > 0) {
        // The strongest single field decides the rank; the remaining fields
        // contribute a small amount so that two models whose best match is
        // identical (say, both are family `llama`) are still separated by how
        // well their *names* match. Popularity only breaks what is left.
        const secondary = (total - best) * 0.05;
        results.push({ model: entry.model, score: best + secondary + entry.popularity, matches });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results;
  }

  /** Convenience wrapper returning bare models, used by non-ranked call sites. */
  searchModels(query, options) {
    return this.search(query, options).map((result) => result.model);
  }
}

function fieldsFor(field) {
  if (field === SearchField.NAME) return ['name', 'id'];
  if (field === SearchField.FAMILY) return ['family', 'architecture'];
  return ['name', 'id', 'family', 'architecture', 'author'];
}

/**
 * Where does `query` sit inside `value`? Returns null when it is absent.
 * Exported so the highlighter and the unit tests can share the definition.
 */
export function classifyMatch(value, query) {
  if (value === query) return 'exact';
  const at = value.indexOf(query);
  if (at === -1) return null;
  if (at === 0) return 'prefix';
  const previous = value.charAt(at - 1);
  if (previous === '-' || previous === '_' || previous === '.' || previous === '/' || previous === ' ') {
    return 'boundary';
  }
  return 'infix';
}

/**
 * Split a display string into `{ text, hit }` segments so the UI can bold the
 * matched run without resorting to `dangerouslySetInnerHTML`.
 */
export function highlightSegments(text, query) {
  const source = String(text || '');
  const needle = String(query || '').trim().toLowerCase();
  if (!needle) return [{ text: source, hit: false }];

  const segments = [];
  const haystack = source.toLowerCase();
  let cursor = 0;

  for (;;) {
    const at = haystack.indexOf(needle, cursor);
    if (at === -1) break;
    if (at > cursor) segments.push({ text: source.slice(cursor, at), hit: false });
    segments.push({ text: source.slice(at, at + needle.length), hit: true });
    cursor = at + needle.length;
  }

  if (cursor < source.length) segments.push({ text: source.slice(cursor), hit: false });
  return segments.length ? segments : [{ text: source, hit: false }];
}
