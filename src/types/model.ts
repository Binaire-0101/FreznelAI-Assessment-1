export interface HuggingFaceTags {
  pipeline_tag?: string;
  framework?: string[];
  architecture?: string[];
  all_tags?: string[];
  [key: string]: string | string[] | undefined;
}

export interface Model {
  id: string;
  displayName: string;
  huggingFaceRepo: string;
  repoUrl: string;
  family: string;
  authorNamespace: string;
  architectureCategory: string;
  useCase: string;
  pytorchArchitecture: string;
  weightFormat: string;
  safetensorFileCount: number | null;
  hfTags: HuggingFaceTags;
}

export interface ApiResponse {
  models: unknown[];
}

export interface ModelQuery {
  search: string;
  family: string;
  pipelineTags: string[];
  familyTags: string[];
  architectureTags: string[];
  weightTags: string[];
  minSafetensors: number;
  maxSafetensors: number;
  sort: 'name-asc' | 'name-desc' | 'safetensors-asc' | 'safetensors-desc';
}

export interface ModelFacets {
  families: string[];
  pipelineTags: string[];
  familyTags: string[];
  architectureTags: string[];
  weightTags: string[];
  maxSafetensors: number;
}

export interface ModelSnapshot {
  models: Model[];
  savedAt: number;
}
