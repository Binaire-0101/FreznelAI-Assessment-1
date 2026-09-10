export interface ApiModel {
  id: string;
  author?: string;
  pipeline_tag?: string;
  tags?: string[];
  siblings?: { rfilename: string }[];
  config?: { model_type?: string; architectures?: string[] };
}

export interface ModelView {
  id: string;
  family: string;
  pipeline: string;
  architecture: string;
  tags: string[];
  safetensors: number;
}

export interface Filters {
  query: string;
  pipeline: string;
  family: string;
  architecture: string;
  weight: string;
  min: string;
  max: string;
  sort: string;
}
