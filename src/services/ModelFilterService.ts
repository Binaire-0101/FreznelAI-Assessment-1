/**
 * ModelFilterService Class for filtering collections of AI models.
 * Encapsulates multi-tag queries, weight classification, and safetensor ranges.
 * Binaire Freznel AI Assessment - Requirements #11, #12
 */

import { Model } from '../models/Model';
import { FilterCriteria } from '../types/model';

export class ModelFilterService {
  /**
   * Applies all criteria (search query, family, tags, weight, safetensor count)
   * to a model collection without mutating the input array.
   */
  public applyFilters(models: Model[], criteria: FilterCriteria): Model[] {
    if (!models || models.length === 0) {
      return [];
    }

    return models.filter(model => model.matchesFilters(criteria));
  }

  /**
   * Extracts unique, sorted pipeline tags across all loaded models.
   */
  public extractPipelineTags(models: Model[]): string[] {
    const tags = new Set<string>();
    models.forEach(m => m.pipelineTags.forEach(t => tags.add(t)));
    return Array.from(tags).sort((a, b) => a.localeCompare(b));
  }

  /**
   * Extracts unique, sorted model families across all loaded models.
   */
  public extractFamilyTags(models: Model[]): string[] {
    const families = new Set<string>();
    models.forEach(m => {
      if (m.family) families.add(m.family);
      m.familyTags.forEach(f => families.add(f));
    });
    return Array.from(families).sort((a, b) => a.localeCompare(b));
  }

  /**
   * Extracts unique, sorted architecture tags across all loaded models.
   */
  public extractArchitectureTags(models: Model[]): string[] {
    const archs = new Set<string>();
    models.forEach(m => m.architectureTags.forEach(a => archs.add(a)));
    return Array.from(archs).sort((a, b) => a.localeCompare(b));
  }

  /**
   * Computes the global minimum and maximum safetensor file counts in the dataset.
   */
  public getSafetensorBounds(models: Model[]): { min: number; max: number } {
    if (!models || models.length === 0) {
      return { min: 0, max: 50 };
    }

    let min = Infinity;
    let max = -Infinity;

    for (const m of models) {
      if (m.safetensorFileCount < min) min = m.safetensorFileCount;
      if (m.safetensorFileCount > max) max = m.safetensorFileCount;
    }

    return {
      min: min === Infinity ? 0 : min,
      max: max === -Infinity ? 50 : max,
    };
  }

  /**
   * Default empty filter criteria state.
   */
  public static createDefaultCriteria(): FilterCriteria {
    return {
      searchQuery: '',
      family: 'ALL',
      pipelineTags: [],
      familyTags: [],
      architectureTags: [],
      weightCategories: [],
      minSafetensors: 0,
      maxSafetensors: 0, // 0 indicates no upper ceiling
    };
  }
}
