import type { Model, ModelFilters, SortKey } from "../models/types";

export class ModelSearchEngine {
  search(models: Model[], filters: ModelFilters, sort: SortKey): Model[] {
    const query = filters.query.toLowerCase();
    return models
      .filter((model) => {
        const matchesQuery =
          !query ||
          [model.display_name, model.id, model.family].some((value) =>
            value.toLowerCase().includes(query),
          );
        const tags = model.hf_tags;
        return (
          matchesQuery &&
          (!filters.family || model.family === filters.family) &&
          (!filters.pipeline || tags.pipeline_tag === filters.pipeline) &&
          (!filters.architecture ||
            model.architecture_category === filters.architecture ||
            tags.architecture?.includes(filters.architecture)) &&
          (!filters.weight || model.weight_format === filters.weight) &&
          model.safetensor_file_count >= filters.minFiles &&
          model.safetensor_file_count <= filters.maxFiles
        );
      })
      .sort((a, b) =>
        sort === "name-asc"
          ? a.display_name.localeCompare(b.display_name)
          : sort === "name-desc"
            ? b.display_name.localeCompare(a.display_name)
            : sort === "files-asc"
              ? a.safetensor_file_count - b.safetensor_file_count
              : b.safetensor_file_count - a.safetensor_file_count,
      );
  }
}
