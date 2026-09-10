export type Model = {
  id: string;
  display_name: string;
  family: string;
  author_namespace: string;
  architecture_category: string;
  use_case: string;
  weight_format: string;
  safetensor_file_count: number;
  repo_url: string;
  hf_tags: {
    pipeline_tag?: string;
    architecture?: string[];
    quantization?: string[];
    framework?: string[];
    all_tags?: string[];
  };
};

export type ModelFilters = {
  query: string;
  family: string;
  pipeline: string;
  architecture: string;
  weight: string;
  minFiles: number;
  maxFiles: number;
};

export type SortKey = "name-asc" | "name-desc" | "files-asc" | "files-desc";
