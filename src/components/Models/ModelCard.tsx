import { ExternalLink } from "lucide-react";
import type { Model } from "../../models/types";

type ModelCardProps = {
  model: Model;
  position: number;
};

export function ModelCard({ model, position }: ModelCardProps) {
  const modelName = model.id.split("/").pop();
  const pipeline = model.hf_tags.pipeline_tag || model.use_case;

  return (
    <article
      className="model-card"
      style={{ animationDelay: `${Math.min(position, 8) * 35}ms` }}
    >
      <div className="card-top">
        <span className="model-number">
          {String(position + 1).padStart(2, "0")}
        </span>
        <a
          href={model.repo_url}
          target="_blank"
          rel="noreferrer"
          title="Open Hugging Face repository"
        >
          <ExternalLink size={16} />
        </a>
      </div>
      <h2>{model.display_name}</h2>
      <p className="model-id">
        {model.author_namespace} / {modelName}
      </p>
      <div className="tags">
        <span>{pipeline}</span>
        <span>{model.architecture_category}</span>
      </div>
      <div className="card-meta">
        <div>
          <small>FAMILY</small>
          <strong>{model.family}</strong>
        </div>
        <div>
          <small>SAFE TENSORS</small>
          <strong>{model.safetensor_file_count.toLocaleString()} files</strong>
        </div>
      </div>
    </article>
  );
}
