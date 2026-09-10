import type { Model, ModelFacets, ModelQuery } from '../types/model';

export class ModelCatalog {
  constructor(private readonly models: Model[]) {}

  get all(): Model[] { return [...this.models]; }

  facets(): ModelFacets {
    const unique = (values: string[]) => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
    const numeric = this.models.map((model) => model.safetensorFileCount).filter((count): count is number => count !== null);
    return {
      families: unique(this.models.map((model) => model.family)),
      pipelineTags: unique(this.models.map((model) => model.hfTags.pipeline_tag || '')),
      familyTags: unique(this.models.flatMap((model) => model.hfTags.all_tags || [])),
      architectureTags: unique(this.models.flatMap((model) => model.hfTags.architecture || [])),
      weightTags: unique(this.models.map((model) => model.weightFormat)),
      maxSafetensors: Math.max(0, ...numeric),
    };
  }

  query(query: ModelQuery): Model[] {
    const search = query.search.trim().toLocaleLowerCase();
    const matches = this.models.filter((model) => {
      const searchable = `${model.displayName} ${model.id} ${model.family}`.toLocaleLowerCase();
      const has = (values: string[], selected: string[]) => selected.length === 0 || selected.some((value) => values.includes(value));
      const count = model.safetensorFileCount;
      return (!search || searchable.includes(search))
        && (!query.family || model.family === query.family)
        && has([model.hfTags.pipeline_tag || ''], query.pipelineTags)
        && has(model.hfTags.all_tags || [], query.familyTags)
        && has(model.hfTags.architecture || [], query.architectureTags)
        && has([model.weightFormat], query.weightTags)
        && (count === null || count >= query.minSafetensors)
        && (count === null || count <= query.maxSafetensors);
    });

    return matches.sort((left, right) => {
      if (query.sort === 'name-asc' || query.sort === 'name-desc') {
        const result = left.displayName.localeCompare(right.displayName);
        return query.sort === 'name-asc' ? result : -result;
      }
      const leftCount = left.safetensorFileCount ?? Number.POSITIVE_INFINITY;
      const rightCount = right.safetensorFileCount ?? Number.POSITIVE_INFINITY;
      const result = leftCount - rightCount;
      return query.sort === 'safetensors-asc' ? result : -result;
    });
  }
}
