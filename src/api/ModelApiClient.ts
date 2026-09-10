import type { ApiResponse, Model } from '../types/model';

const DEFAULT_API_URL = 'https://binaire.app/hf-models-api.json';

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function numberValue(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().toLowerCase() !== 'tbd') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

export class ModelApiClient {
  public readonly url: string;

  constructor(url = import.meta.env.VITE_MODEL_API_URL || DEFAULT_API_URL) {
    this.url = url;
  }

  fetchModels(signal?: AbortSignal): Promise<Model[]> {
    return fetch(this.url, { signal, cache: 'no-cache' })
      .then((response) => {
        if (!response.ok) throw new Error(`Model API returned ${response.status}`);
        return response.json() as Promise<ApiResponse>;
      })
      .then((payload) => this.normalize(payload));
  }

  normalize(payload: unknown): Model[] {
    if (!payload || typeof payload !== 'object' || !Array.isArray((payload as ApiResponse).models)) {
      throw new Error('The model API returned an invalid response.');
    }

    return (payload as ApiResponse).models.map((raw, index) => {
      if (!raw || typeof raw !== 'object') throw new Error(`Model ${index + 1} is invalid.`);
      const item = raw as Record<string, unknown>;
      const tags = item.hf_tags && typeof item.hf_tags === 'object' ? item.hf_tags as Record<string, unknown> : {};
      const id = stringValue(item.id);
      const displayName = stringValue(item.display_name) || id;
      if (!id || !displayName) throw new Error(`Model ${index + 1} has no identity.`);

      return {
        id,
        displayName,
        huggingFaceRepo: stringValue(item.huggingface_repo),
        repoUrl: stringValue(item.repo_url),
        family: stringValue(item.family) || 'Unknown family',
        authorNamespace: stringValue(item.author_namespace),
        architectureCategory: stringValue(item.architecture_category) || 'Unknown',
        useCase: stringValue(item.use_case) || 'General purpose',
        pytorchArchitecture: stringValue(item.pytorch_architecture) || 'Unknown',
        weightFormat: stringValue(item.weight_format) || 'Unknown',
        safetensorFileCount: numberValue(item.safetensor_file_count),
        hfTags: {
          pipeline_tag: stringValue(tags.pipeline_tag),
          framework: stringArray(tags.framework),
          architecture: stringArray(tags.architecture),
          all_tags: stringArray(tags.all_tags),
        },
      };
    });
  }
}
