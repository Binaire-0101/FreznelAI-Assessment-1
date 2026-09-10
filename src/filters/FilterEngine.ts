import { AIModel, FilterState } from '../types';

/**
 * OOP FilterEngine Class
 * Filters model list based on Pipeline, Family, Architecture, Weight tags, and Safetensor count ranges.
 */
export class FilterEngine {
  /**
   * Filter models based on active filter state
   */
  public filter(models: AIModel[], state: FilterState): AIModel[] {
    return models.filter((model) => {
      // 1. Pipeline tags filter
      if (state.pipelineTags.length > 0) {
        if (!state.pipelineTags.includes(model.pipelineTag)) {
          return false;
        }
      }

      // 2. Family tags filter
      if (state.familyTags.length > 0) {
        if (!state.familyTags.includes(model.family.toLowerCase())) {
          return false;
        }
      }

      // 3. Architecture tags filter
      if (state.architectureTags.length > 0) {
        if (!state.architectureTags.includes(model.architectureTag)) {
          return false;
        }
      }

      // 4. Weight tags filter
      if (state.weightTags.length > 0) {
        if (!state.weightTags.includes(model.weightTag)) {
          return false;
        }
      }

      // 5. Safetensor count range filter (min to max values)
      if (
        model.safetensorCount < state.minSafetensorCount ||
        model.safetensorCount > state.maxSafetensorCount
      ) {
        return false;
      }

      return true;
    });
  }

  /**
   * Extract distinct available tags from model dataset for dynamic UI filter checkboxes
   */
  public extractAvailableTags(models: AIModel[]) {
    const pipelines = new Set<string>();
    const families = new Set<string>();
    const architectures = new Set<string>();
    const weights = new Set<string>();
    let maxSafetensors = 1;

    models.forEach((m) => {
      if (m.pipelineTag) pipelines.add(m.pipelineTag);
      if (m.family) families.add(m.family.toLowerCase());
      if (m.architectureTag) architectures.add(m.architectureTag);
      if (m.weightTag) weights.add(m.weightTag);
      if (m.safetensorCount > maxSafetensors) maxSafetensors = m.safetensorCount;
    });

    return {
      pipelines: Array.from(pipelines).sort(),
      families: Array.from(families).sort(),
      architectures: Array.from(architectures).sort(),
      weights: Array.from(weights).sort(),
      maxSafetensors
    };
  }
}
