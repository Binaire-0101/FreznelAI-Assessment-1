import type { ApiModel, Filters, ModelView } from '../types/model';

const API = import.meta.env.VITE_MODELS_API_URL || 'https://huggingface.co/api/models?limit=500&full=true';
const CACHE_KEY = 'freznel-models';
const MAX_BYTES = 25 * 1024 * 1024;

export class ModelService {
  fetchModels(): Promise<{ models: ApiModel[]; cached: boolean }> {
    return fetch(API)
      .then((response) => {
        if (!response.ok) throw new Error(`API error ${response.status}`);
        const length = Number(response.headers.get('content-length') || 0);
        if (length > MAX_BYTES) throw new Error('Response exceeds safe limit');
        return response.text();
      })
      .then((text) => {
        if (new Blob([text]).size > MAX_BYTES) throw new Error('Response exceeds safe limit');
        const models = JSON.parse(text) as ApiModel[];
        if (!Array.isArray(models) || models.some((model) => typeof model.id !== 'string')) throw new Error('Invalid model data');
        localStorage.setItem(CACHE_KEY, JSON.stringify(models));
        return { models, cached: false };
      })
      .catch((error: Error) => {
        const cached = localStorage.getItem(CACHE_KEY);
        if (!cached) throw error;
        return { models: JSON.parse(cached) as ApiModel[], cached: true };
      });
  }

  normalize(model: ApiModel): ModelView {
    const tags = model.tags || [];
    const config = model.config || {};
    const files = model.siblings || [];
    return {
      id: model.id,
      family: model.author || model.id.split('/')[0] || 'Unknown',
      pipeline: model.pipeline_tag || 'other',
      architecture: config.architectures?.[0] || config.model_type || 'unknown',
      tags,
      safetensors: files.filter((file) => file.rfilename.endsWith('.safetensors')).length,
    };
  }
}

export class ModelSearch {
  constructor(private models: ApiModel[]) {}

  options(key: 'family' | 'pipeline' | 'architecture'): string[] {
    const service = new ModelService();
    return [...new Set(this.models.map((model) => service.normalize(model)[key]))].sort();
  }

  run(filters: Filters): ModelView[] {
    const service = new ModelService();
    const query = filters.query.trim().toLowerCase();
    const min = Number(filters.min || 0);
    const max = filters.max === '' ? Infinity : Number(filters.max);
    const results = this.models.map((model) => service.normalize(model)).filter((model) => {
      const text = [model.id, model.family, model.pipeline, model.architecture, ...model.tags].join(' ').toLowerCase();
      return (!query || text.includes(query))
        && (!filters.pipeline || model.pipeline === filters.pipeline)
        && (!filters.family || model.family === filters.family)
        && (!filters.architecture || model.architecture === filters.architecture)
        && (!filters.weight || model.tags.some((tag) => tag.toLowerCase().includes(filters.weight.toLowerCase())))
        && model.safetensors >= min && model.safetensors <= max;
    });
    return results.sort((a, b) => {
      if (filters.sort === 'za') return b.id.localeCompare(a.id);
      if (filters.sort === 'files-asc') return a.safetensors - b.safetensors;
      if (filters.sort === 'files-desc') return b.safetensors - a.safetensors;
      return a.id.localeCompare(b.id);
    });
  }
}

export class Debouncer {
  private timer?: number;
  run(callback: () => void, delay = 250): void {
    window.clearTimeout(this.timer);
    this.timer = window.setTimeout(callback, delay);
  }
}
