/**
 * Validation utilities for large JSON payload integrity and model schema verification.
 * Prevents application corruption when downloading or parsing remote model files.
 * Accurately parses schema from https://binaire.app/hf-models-api.json
 */

import { HfModelApiRecord, RawModelData } from '../types/model';
import { Model } from '../models/Model';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  models: RawModelData[];
}

export function validateModelPayload(data: unknown): ValidationResult {
  const errors: string[] = [];
  const normalizedModels: RawModelData[] = [];

  if (!data) {
    return { isValid: false, errors: ['Payload is null or undefined.'], models: [] };
  }

  let candidates: unknown[] = [];

  if (Array.isArray(data)) {
    candidates = data;
  } else if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.models)) {
      candidates = obj.models;
    } else if (Array.isArray(obj.data)) {
      candidates = obj.data;
    } else if (Array.isArray(obj.items)) {
      candidates = obj.items;
    } else {
      return {
        isValid: false,
        errors: ['Payload is an object but contains no recognizable models array (models/data/items).'],
        models: [],
      };
    }
  } else {
    return {
      isValid: false,
      errors: ['Payload is not a valid JSON array or object.'],
      models: [],
    };
  }

  if (candidates.length === 0) {
    return {
      isValid: true,
      errors: [],
      models: [],
    };
  }

  // Validate and normalize each model candidate
  for (let i = 0; i < candidates.length; i++) {
    const item = candidates[i];
    if (!item || typeof item !== 'object') {
      errors.push(`Item at index ${i} is not an object.`);
      continue;
    }

    const rec = item as Record<string, unknown>;
    const id = String(rec.id || rec.modelId || rec._id || '').trim();
    const displayName = String(rec.display_name || rec.name || rec.modelName || id).trim();

    if (!id) {
      errors.push(`Item at index ${i} missing mandatory id.`);
      continue;
    }

    // Extract tags from hf_tags object if present
    const hfTags = (typeof rec.hf_tags === 'object' && rec.hf_tags !== null ? rec.hf_tags : {}) as Record<string, unknown>;

    const family = String(rec.family || rec.modelFamily || (hfTags.architecture && Array.isArray(hfTags.architecture) ? hfTags.architecture[0] : 'Open Weights')).trim();
    const architecture = String(rec.architecture_category || rec.architecture || (hfTags.architecture && Array.isArray(hfTags.architecture) ? hfTags.architecture[0] : 'Transformer')).trim();
    const useCase = String(rec.use_case || (typeof hfTags.pipeline_tag === 'string' ? hfTags.pipeline_tag : 'General')).trim();
    const weightFormat = String(rec.weight_format || rec.weightFormat || 'BF16').trim();

    // Safetensor count can be string e.g. "201" or number
    const safetensorCount = Model.parseSafetensorCount(
      (rec.safetensor_file_count as string | number | undefined) ?? (rec.safetensorFileCount as string | number | undefined)
    );

    // Parse weight
    const weightParsed = Model.parseWeight(
      `${displayName} ${id} ${weightFormat} ${rec.weight || ''}`
    );

    const pipelineTags: string[] = [];
    if (typeof hfTags.pipeline_tag === 'string' && hfTags.pipeline_tag) {
      pipelineTags.push(hfTags.pipeline_tag);
    }
    if (Array.isArray(rec.pipelineTags)) {
      pipelineTags.push(...(rec.pipelineTags as string[]));
    }
    if (pipelineTags.length === 0 && useCase) {
      pipelineTags.push(useCase.toLowerCase().replace(/\s+/g, '-'));
    }

    const familyTags = Array.isArray(rec.familyTags)
      ? (rec.familyTags as string[]).map(String)
      : [family];

    const architectureTags: string[] = [];
    if (rec.architecture_category) architectureTags.push(String(rec.architecture_category));
    if (Array.isArray(hfTags.architecture)) architectureTags.push(...(hfTags.architecture as string[]));
    if (rec.pytorch_architecture) architectureTags.push(String(rec.pytorch_architecture));
    if (Array.isArray(rec.architectureTags)) architectureTags.push(...(rec.architectureTags as string[]));

    const allTags = Array.from(
      new Set([
        ...pipelineTags,
        ...familyTags,
        ...architectureTags,
        ...(Array.isArray(hfTags.task_domain) ? (hfTags.task_domain as string[]) : []),
        ...(Array.isArray(hfTags.framework) ? (hfTags.framework as string[]) : []),
        ...(Array.isArray(hfTags.all_tags) ? (hfTags.all_tags as string[]) : []),
        ...(Array.isArray(rec.tags) ? (rec.tags as string[]) : []),
      ])
    );

    const licenseList = Array.isArray(hfTags.license) ? (hfTags.license as string[]) : [];
    const license = licenseList.length > 0 ? licenseList[0].replace(/^license:/, '') : String(rec.license || 'open-access');

    const quantList = Array.isArray(hfTags.quantization) ? (hfTags.quantization as string[]) : [];
    const quantization = quantList.length > 0 ? quantList[0] : String(rec.quantization || weightFormat || 'BF16');

    const frameworkList = Array.isArray(hfTags.framework) ? (hfTags.framework as string[]) : Array.isArray(rec.framework) ? (rec.framework as string[]) : ['safetensors', 'transformers'];

    const repoUrl = String(rec.repo_url || (id ? `https://huggingface.co/${id}` : ''));
    const huggingfaceRepo = String(rec.huggingface_repo || id);
    const authorNamespace = String(rec.author_namespace || (id.includes('/') ? id.split('/')[0] : 'Open Source'));
    const cliDownloadCommand = String(rec.cli_download_command || `huggingface-cli download ${id}`);
    const pytorchArchitecture = String(rec.pytorch_architecture || 'AutoModelForCausalLM');
    const description = String(rec.description || `${displayName} is an open-weights model in the ${family} family.`);

    normalizedModels.push({
      id,
      name: displayName,
      family,
      architecture,
      useCase,
      weightFormat,
      weight: weightParsed.display,
      weightInBillions: weightParsed.billions,
      safetensorFileCount: safetensorCount,
      tags: allTags,
      pipelineTags,
      familyTags,
      architectureTags,
      repoUrl,
      huggingfaceRepo,
      authorNamespace,
      cliDownloadCommand,
      pytorchArchitecture,
      license,
      quantization,
      framework: frameworkList,
      description,
      downloads: typeof rec.downloads === 'number' ? rec.downloads : 12500,
      likes: typeof rec.likes === 'number' ? rec.likes : 380,
      author: authorNamespace,
      contextWindow: typeof rec.contextWindow === 'number' ? rec.contextWindow : 128000,
      precision: quantization,
      lastModified: typeof rec.lastModified === 'string' ? rec.lastModified : new Date().toISOString(),
    });
  }

  // Integrity threshold
  if (candidates.length > 5 && normalizedModels.length < candidates.length * 0.5) {
    return {
      isValid: false,
      errors: [`Corrupted payload: Only ${normalizedModels.length}/${candidates.length} items met schema integrity.`, ...errors],
      models: [],
    };
  }

  return {
    isValid: true,
    errors,
    models: normalizedModels,
  };
}
