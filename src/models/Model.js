/**
 * Domain entity for a single model.
 *
 * The raw API record is wide, inconsistent and heavy (a single record can carry
 * a multi-kilobyte chat template). `Model.fromApi` distils it into a small,
 * flat, stable shape that is cheap to hash, cheap to store in IndexedDB and
 * cheap to filter over. Every derived facet the UI can filter by - family,
 * architecture, weight format, safetensor file count - is computed exactly once
 * here rather than on every keystroke.
 *
 * This module is imported by the Web Worker as well as the UI, so it must stay
 * free of any DOM or React dependency.
 */

/** Known model families, longest/most specific prefixes first. */
const FAMILY_PATTERNS = [
  'stable-diffusion', 'stable_diffusion', 'sdxl', 'flux', 'wan', 'hunyuan',
  'qwen', 'llama', 'mistral', 'mixtral', 'gemma', 'phi', 'deepseek', 'yi',
  'falcon', 'bloom', 'gpt-neox', 'gpt_neox', 'gptj', 'gpt2', 'gpt-oss', 'opt',
  'baichuan', 'chatglm', 'glm', 'internlm', 'minicpm', 'olmo', 'granite',
  'command-r', 'cohere', 'starcoder', 'codegen', 'nemotron', 'smollm',
  'whisper', 'wav2vec2', 'hubert', 'bark', 'musicgen', 'parler',
  'bert', 'roberta', 'deberta', 'distilbert', 'albert', 'electra', 'xlm',
  't5', 'mt5', 'flan', 'bart', 'pegasus', 'marian',
  'clip', 'siglip', 'blip', 'llava', 'vit', 'swin', 'dinov2', 'convnext',
  'detr', 'yolos', 'segformer', 'sam', 'resnet', 'efficientnet',
  'e5', 'bge', 'gte', 'minilm', 'mpnet', 'sentence-transformers',
];

/** Weight/serialization formats, keyed by the file extension that proves them. */
const WEIGHT_FORMATS = [
  { tag: 'safetensors', test: (f) => f.endsWith('.safetensors') },
  { tag: 'gguf', test: (f) => f.endsWith('.gguf') },
  { tag: 'pytorch', test: (f) => f.endsWith('.bin') || f.endsWith('.pt') || f.endsWith('.pth') },
  { tag: 'onnx', test: (f) => f.endsWith('.onnx') },
  { tag: 'tensorflow', test: (f) => f.endsWith('.h5') || f.endsWith('.pb') },
  { tag: 'flax', test: (f) => f.endsWith('.msgpack') },
  { tag: 'tflite', test: (f) => f.endsWith('.tflite') },
  { tag: 'coreml', test: (f) => f.endsWith('.mlmodel') || f.endsWith('.mlpackage') },
  { tag: 'keras', test: (f) => f.endsWith('.keras') },
  { tag: 'ggml', test: (f) => f.endsWith('.ggml') || f.endsWith('.bin.ggml') },
];

/** Precision / quantisation markers that appear in the tag list or the id. */
const PRECISION_TAGS = [
  '4-bit', '8-bit', '2-bit', '3-bit', '6-bit', 'fp8', 'fp16', 'bf16', 'int8',
  'int4', 'awq', 'gptq', 'gguf', 'exl2', 'bitsandbytes', 'quantized',
];

export class Model {
  constructor(record) {
    Object.assign(this, record);
  }

  /**
   * Normalize one raw API record. Returns a plain object (not a `Model`) so the
   * result can cross the worker boundary via structured clone and be written
   * straight into IndexedDB.
   */
  static fromApi(raw) {
    const id = raw.id || raw.modelId || '';
    const slashIndex = id.indexOf('/');
    const author = raw.author || (slashIndex > 0 ? id.slice(0, slashIndex) : '');
    const name = slashIndex > 0 ? id.slice(slashIndex + 1) : id;
    const tags = Array.isArray(raw.tags) ? raw.tags : [];
    const siblings = Array.isArray(raw.siblings) ? raw.siblings : [];
    const files = siblings.map((s) => String(s.rfilename || '').toLowerCase());

    const config = raw.config || {};
    const architectures = Array.isArray(config.architectures) ? config.architectures : [];
    const modelType = config.model_type || '';

    // NOTE: key order below is fixed on purpose - `CacheStore` hashes the
    // JSON serialization of these records, so a stable order keeps the
    // integrity checksum reproducible across sessions.
    return {
      id,
      name,
      author,
      pipelineTag: raw.pipeline_tag || raw.pipelineTag || '',
      library: raw.library_name || '',
      family: detectFamily({ id, modelType, tags }),
      architecture: architectures[0] || inferArchitecture(modelType, tags),
      modelType,
      weightTags: detectWeightTags(files, tags, id),
      safetensorFiles: files.filter((f) => f.endsWith('.safetensors')).length,
      fileCount: files.length,
      parameters: raw.safetensors && typeof raw.safetensors.total === 'number' ? raw.safetensors.total : 0,
      downloads: typeof raw.downloads === 'number' ? raw.downloads : 0,
      likes: typeof raw.likes === 'number' ? raw.likes : 0,
      lastModified: raw.lastModified || '',
      tags: tags.filter((t) => !t.startsWith('arxiv:') && !t.startsWith('base_model:')).slice(0, 24),
      gated: Boolean(raw.gated),
    };
  }

  /** Human-readable parameter count, e.g. `7.2B`. */
  static formatParameters(value) {
    if (!value) return '-';
    if (value >= 1e12) return `${(value / 1e12).toFixed(1)}T`;
    if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(0)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
    return String(value);
  }

  static formatCount(value) {
    if (!value) return '0';
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
    return String(value);
  }
}

/**
 * Family is the marketing/lineage name ("llama", "qwen"), as opposed to the
 * architecture class name ("LlamaForCausalLM"). We look at the declared
 * `model_type` first because it is authoritative, then the tag list, then fall
 * back to matching the repo id itself.
 */
export function detectFamily({ id, modelType, tags }) {
  const haystacks = [String(modelType || '').toLowerCase()];
  for (const tag of tags) haystacks.push(String(tag).toLowerCase());
  haystacks.push(String(id).toLowerCase());

  for (const haystack of haystacks) {
    for (const family of FAMILY_PATTERNS) {
      if (haystack.includes(family)) return normalizeFamily(family);
    }
  }
  // Unknown lineage: use the declared model_type so the facet is still useful.
  if (modelType) return normalizeFamily(String(modelType).toLowerCase());
  return 'other';
}

function normalizeFamily(family) {
  return family.replace(/_/g, '-').replace(/^gpt-?neox$/, 'gpt-neox');
}

function inferArchitecture(modelType, tags) {
  if (modelType) {
    // "llama" -> "Llama", "gpt_neox" -> "GptNeox"; good enough as a label when
    // the API did not expose `config.architectures`.
    return modelType
      .split(/[_-]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
  }
  const libraryTag = tags.find((t) => ['transformers', 'diffusers', 'sentence-transformers', 'timm', 'gguf'].includes(t));
  return libraryTag ? libraryTag : 'Unknown';
}

/**
 * Weight tags describe *how the weights are stored*: the serialization format
 * (proved by the files actually present in the repo) plus any precision or
 * quantisation marker declared in the tags or the repo name.
 */
export function detectWeightTags(files, tags, id) {
  const found = new Set();

  for (const format of WEIGHT_FORMATS) {
    if (files.some(format.test)) found.add(format.tag);
  }

  const lowerTags = tags.map((t) => String(t).toLowerCase());
  const lowerId = String(id).toLowerCase();
  for (const precision of PRECISION_TAGS) {
    if (lowerTags.includes(precision) || lowerId.includes(precision)) found.add(precision);
  }

  if (found.size === 0) found.add('unknown');
  return Array.from(found).sort();
}
