/**
 * Types and interfaces for the Model Selection Utility.
 * Matches real API specifications from https://binaire.app/hf-models-api.json
 *
 * Binaire Freznel AI Assessment
 */

export interface HfTags {
  pipeline_tag?: string;
  framework?: string[];
  license?: string[];
  quantization?: string[];
  architecture?: string[];
  task_domain?: string[];
  modality?: string[];
  application?: string[];
  adapter_finetune?: string[];
  safety_policy?: string[];
  inference_serving?: string[];
  all_tags?: string[];
}

export interface HfModelApiRecord {
  id: string;
  display_name: string;
  huggingface_repo: string;
  repo_url: string;
  family: string;
  author_namespace: string;
  architecture_category: string;
  use_case: string;
  pytorch_architecture: string;
  weight_format: string;
  safetensor_file_count: string | number;
  cli_download_command?: string;
  hf_tags?: HfTags;
  hf_query_examples?: string[];
}

export interface HfApiResponse {
  models: HfModelApiRecord[];
}

export interface RawModelData {
  id: string;
  name: string;
  family: string;
  architecture?: string;
  useCase?: string;
  weightFormat?: string;
  weight: string; // e.g. "8B", "70B", "335M"
  weightInBillions?: number;
  safetensorFileCount: number;
  tags?: string[];
  pipelineTags: string[];
  familyTags: string[];
  architectureTags: string[];
  repoUrl?: string;
  huggingfaceRepo?: string;
  authorNamespace?: string;
  cliDownloadCommand?: string;
  pytorchArchitecture?: string;
  license?: string;
  quantization?: string;
  framework?: string[];
  description?: string;
  downloads?: number;
  likes?: number;
  author?: string;
  contextWindow?: number;
  precision?: string;
  parametersCount?: number;
  lastModified?: string;
}

export type WeightCategory = 'Small' | 'Medium' | 'Large' | 'All';

export interface FilterCriteria {
  searchQuery: string;
  family: string;
  pipelineTags: string[];
  familyTags: string[];
  architectureTags: string[];
  weightCategories: string[];
  minSafetensors: number;
  maxSafetensors: number;
}

export enum SortOption {
  NAME_ASC = 'NAME_ASC',
  NAME_DESC = 'NAME_DESC',
  PARAMETERS_ASC = 'PARAMETERS_ASC',
  PARAMETERS_DESC = 'PARAMETERS_DESC',
  SAFETENSOR_ASC = 'SAFETENSOR_ASC',
  SAFETENSOR_DESC = 'SAFETENSOR_DESC',
  FAMILY_ASC = 'FAMILY_ASC',
  DOWNLOADS_DESC = 'DOWNLOADS_DESC',
}

export interface CacheMetadata {
  version: number;
  timestamp: number;
  cachedAt: string;
  count: number;
}

export interface CachedModelPayload {
  version: number;
  timestamp: number;
  cachedAt: string;
  models: RawModelData[];
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  isAnonymous?: boolean;
}
