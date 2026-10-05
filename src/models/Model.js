export class Model {
  constructor(data) {
    this.id = data.id || "";

    this.name = data.display_name || data.id || "Unnamed model";

    this.family = data.family || "Unknown";

    this.architectureCategory = data.architecture_category || "Unknown";

    this.weightFormat = data.weight_format || "Unknown";

    this.safetensorFileCount = Number(data.safetensor_file_count) || 0;

    this.repositoryUrl = data.repo_url || `https://huggingface.co/${data.id}`;

    this.pipelineTag = data.hf_tags?.pipeline_tag || "Unknown";

    this.architectureTags = data.hf_tags?.architecture || [];

    this.familyTags = data.hf_tags?.all_tags || [];

    this.weightTags = data.hf_tags?.quantization || [];

    this.allTags = data.hf_tags?.all_tags || [];
  }
}
