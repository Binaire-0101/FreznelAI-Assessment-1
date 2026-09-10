import { OfflineStore } from "../offline/OfflineStore";
import type { Model } from "../models/types";

const hostedApiUrl = "https://binaire.app/hf-models-api.json";
export const API_URL = import.meta.env.DEV ? "/api/models" : hostedApiUrl;
const MAX_RESPONSE_BYTES = 10 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 15_000;

export class ModelApi {
  private readonly store = new OfflineStore();

  load(): Promise<{ models: Model[]; source: "live" | "offline" }> {
    return this.fetchPayload()
      .then((payload: unknown) => {
        const models = this.validate(payload);
        return this.store
          .save(models)
          .catch(() => undefined)
          .then(() => ({ models, source: "live" as const }));
      })
      .catch(() =>
        this.store.read().then((cached) => {
          if (!cached)
            throw new Error("No live or offline model data is available.");
          return {
            models: this.validate({ models: cached.models }),
            source: "offline" as const,
          };
        }),
      );
  }

  refreshInBackground(): void {
    this.fetchPayload()
      .then((payload: unknown) => this.store.save(this.validate(payload)))
      .catch(() => undefined);
  }

  private fetchPayload(): Promise<unknown> {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(
      () => controller.abort(),
      REQUEST_TIMEOUT_MS,
    );

    return fetch(API_URL, { cache: "no-store", signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`API returned ${response.status}`);

        const contentLength = Number(response.headers.get("content-length"));
        if (Number.isFinite(contentLength) && contentLength > MAX_RESPONSE_BYTES) {
          throw new Error("The model index is larger than the allowed limit.");
        }

        return response.json();
      })
      .finally(() => window.clearTimeout(timeoutId));
  }

  private validate(payload: unknown): Model[] {
    if (
      !payload ||
      typeof payload !== "object" ||
      !Array.isArray((payload as { models?: unknown }).models)
    ) {
      throw new Error("Unexpected model API response.");
    }
    return (payload as { models: unknown[] }).models
      .filter(isRecord)
      .map(normalizeModel)
      .filter((model): model is Model => model !== null);
  }
}

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function readString(record: UnknownRecord, key: string, fallback: string): string {
  return typeof record[key] === "string" && record[key].trim()
    ? record[key].trim()
    : fallback;
}

function readStringArray(record: UnknownRecord, key: string): string[] {
  return Array.isArray(record[key])
    ? record[key].filter((value): value is string => typeof value === "string")
    : [];
}

function normalizeModel(record: UnknownRecord): Model | null {
  const id = readString(record, "id", "");
  const displayName = readString(record, "display_name", "");

  if (!id || !displayName) return null;

  const rawTags = isRecord(record.hf_tags) ? record.hf_tags : {};
  const fileCount = Number(record.safetensor_file_count);
  const repositoryUrl = readString(record, "repo_url", "");

  return {
    id,
    display_name: displayName,
    family: readString(record, "family", "Unknown family"),
    author_namespace: readString(record, "author_namespace", "Unknown author"),
    architecture_category: readString(
      record,
      "architecture_category",
      "Unknown architecture",
    ),
    use_case: readString(record, "use_case", "General purpose"),
    weight_format: readString(record, "weight_format", "Unknown format"),
    safetensor_file_count:
      Number.isFinite(fileCount) && fileCount >= 0 ? fileCount : 0,
    repo_url: isSafeRepositoryUrl(repositoryUrl) ? repositoryUrl : "https://huggingface.co",
    hf_tags: {
      pipeline_tag: readString(rawTags, "pipeline_tag", "") || undefined,
      architecture: readStringArray(rawTags, "architecture"),
      quantization: readStringArray(rawTags, "quantization"),
      framework: readStringArray(rawTags, "framework"),
      all_tags: readStringArray(rawTags, "all_tags"),
    },
  };
}

function isSafeRepositoryUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      (url.hostname === "huggingface.co" || url.hostname === "www.huggingface.co");
  } catch {
    return false;
  }
}
