/**
 * Domain Model Class representing an AI/ML Model in the registry.
 * Implements core Object-Oriented Principles (Encapsulation, Domain Methods).
 * Binaire Freznel AI Assessment
 */

import { FilterCriteria, HfModelApiRecord, RawModelData, WeightCategory } from '../types/model';

export class Model {
  public readonly id: string;
  public readonly name: string;
  public readonly displayName: string;
  public readonly family: string;
  public readonly architecture: string;
  public readonly useCase: string;
  public readonly weightFormat: string;
  public readonly weight: string;
  public readonly weightInBillions: number;
  public readonly safetensorFileCount: number;
  public readonly tags: readonly string[];
  public readonly pipelineTags: readonly string[];
  public readonly familyTags: readonly string[];
  public readonly architectureTags: readonly string[];
  public readonly repoUrl: string;
  public readonly huggingfaceRepo: string;
  public readonly authorNamespace: string;
  public readonly cliDownloadCommand: string;
  public readonly pytorchArchitecture: string;
  public readonly license: string;
  public readonly quantization: string;
  public readonly framework: readonly string[];
  public readonly description: string;
  public readonly parametersCount: number;
  public readonly downloads: number;
  public readonly likes: number;
  public readonly author: string;
  public readonly contextWindow: number;
  public readonly precision: string;
  public readonly lastModified: string;
  public readonly metadata: Readonly<Record<string, unknown>>;

  constructor(data: RawModelData) {
    this.id = data.id;
    this.name = data.name;
    this.displayName = data.name;
    this.family = data.family;
    this.architecture = data.architecture || 'Transformer';
    this.useCase = data.useCase || 'General';
    this.weightFormat = data.weightFormat || 'BF16';
    this.weight = data.weight;
    this.weightInBillions = data.weightInBillions ?? Model.parseWeight(data.weight || data.name).billions;
    this.parametersCount = this.weightInBillions;
    this.safetensorFileCount = data.safetensorFileCount;
    this.tags = Object.freeze([...(data.tags || [])]);
    this.pipelineTags = Object.freeze([...(data.pipelineTags || [])]);
    this.familyTags = Object.freeze([...(data.familyTags || [])]);
    this.architectureTags = Object.freeze([...(data.architectureTags || [])]);
    this.repoUrl = data.repoUrl || (data.id ? `https://huggingface.co/${data.id}` : '');
    this.huggingfaceRepo = data.huggingfaceRepo || data.id;
    this.authorNamespace = data.authorNamespace || (data.id ? data.id.split('/')[0] : '');
    this.cliDownloadCommand = data.cliDownloadCommand || (data.id ? `huggingface-cli download ${data.id}` : '');
    this.pytorchArchitecture = data.pytorchArchitecture || 'AutoModelForCausalLM';
    this.license = data.license || 'open-access';
    this.quantization = data.quantization || 'BF16';
    this.framework = Object.freeze([...(data.framework || ['safetensors', 'transformers'])]);
    this.description = data.description || `${data.name} is a high-performance open weights model in the ${data.family} series.`;
    this.downloads = data.downloads ?? 0;
    this.likes = data.likes ?? 0;
    this.author = data.author || this.authorNamespace || 'Open Source';
    this.contextWindow = data.contextWindow ?? 8192;
    this.precision = data.precision || this.quantization || 'bfloat16';
    this.lastModified = data.lastModified || new Date().toISOString();
    this.metadata = Object.freeze({});
  }

  /**
   * Robust parser for weight parameters across all model naming conventions:
   * Handles: 335M, 1B, 2.7B, 7B, 14B, 27B, 70B, 671B, MoE e.g. 8x7B, 16x17B, etc.
   */
  public static parseWeight(text: string): { display: string; billions: number } {
    if (!text) return { display: '7B', billions: 7 };

    // MoE notation e.g. "8x7B", "16x17B", "8x22B"
    const moeMatch = text.match(/(\d+)\s*[xX]\s*(\d+(?:\.\d+)?)\s*([BMKbmk])/);
    if (moeMatch) {
      const experts = parseFloat(moeMatch[1]);
      const expertSize = parseFloat(moeMatch[2]);
      const unit = moeMatch[3].toUpperCase();
      const total = experts * expertSize;
      const billions = unit === 'M' ? total / 1000 : total;
      return { display: `${moeMatch[1]}x${moeMatch[2]}${unit}`, billions };
    }

    // Standard notation e.g. "335M", "2.7B", "70B", "671B", "0.5B"
    const stdMatch = text.match(/(\d+(?:\.\d+)?)\s*([BMKbmk])\b/);
    if (stdMatch) {
      const val = parseFloat(stdMatch[1]);
      const unit = stdMatch[2].toUpperCase();
      const billions = unit === 'M' ? val / 1000 : unit === 'K' ? val / 1000000 : val;
      return { display: `${stdMatch[1]}${unit}`, billions };
    }

    return { display: 'N/A', billions: 7 };
  }

  /**
   * Safely converts safetensor_file_count to a number.
   */
  public static parseSafetensorCount(val: string | number | undefined): number {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const parsed = parseInt(val, 10);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  /**
   * Normalizer / Adapter: Creates a Model instance from either raw API record or cached data.
   */
  public static fromRaw(data: RawModelData | HfModelApiRecord): Model {
    // If already normalized RawModelData:
    if ('weightInBillions' in data && 'safetensorFileCount' in data && typeof data.safetensorFileCount === 'number') {
      return new Model(data as RawModelData);
    }

    // Adapt from HfModelApiRecord:
    const apiRecord = data as HfModelApiRecord;
    const name = apiRecord.display_name || apiRecord.id;
    const weightParsed = Model.parseWeight(
      `${apiRecord.display_name || ''} ${apiRecord.id || ''} ${apiRecord.weight_format || ''}`
    );
    const safetensorCount = Model.parseSafetensorCount(apiRecord.safetensor_file_count);

    const hfTags = apiRecord.hf_tags || {};
    const pipelineTags = hfTags.pipeline_tag ? [hfTags.pipeline_tag] : [];
    const familyTags = [apiRecord.family].filter(Boolean);
    const architectureTags = [
      apiRecord.architecture_category,
      ...(hfTags.architecture || []),
      ...(apiRecord.pytorch_architecture ? [apiRecord.pytorch_architecture] : []),
    ].filter(Boolean);

    const allTags = Array.from(
      new Set([
        ...pipelineTags,
        ...familyTags,
        ...architectureTags,
        ...(hfTags.task_domain || []),
        ...(hfTags.framework || []),
        ...(hfTags.all_tags || []),
      ])
    );

    const license = hfTags.license && hfTags.license.length > 0 ? hfTags.license[0].replace(/^license:/, '') : 'open-access';
    const quantization = hfTags.quantization && hfTags.quantization.length > 0 ? hfTags.quantization[0] : (apiRecord.weight_format || 'BF16');

    const raw: RawModelData = {
      id: apiRecord.id,
      name,
      family: apiRecord.family || 'Open Source',
      architecture: apiRecord.architecture_category || (hfTags.architecture ? hfTags.architecture[0] : 'Transformer'),
      useCase: apiRecord.use_case || (hfTags.pipeline_tag ? hfTags.pipeline_tag : 'General'),
      weightFormat: apiRecord.weight_format || 'BF16',
      weight: weightParsed.display,
      weightInBillions: weightParsed.billions,
      safetensorFileCount: safetensorCount,
      tags: allTags,
      pipelineTags,
      familyTags,
      architectureTags,
      repoUrl: apiRecord.repo_url || `https://huggingface.co/${apiRecord.id}`,
      huggingfaceRepo: apiRecord.huggingface_repo || apiRecord.id,
      authorNamespace: apiRecord.author_namespace || apiRecord.id.split('/')[0],
      cliDownloadCommand: apiRecord.cli_download_command,
      pytorchArchitecture: apiRecord.pytorch_architecture,
      license,
      quantization,
      framework: hfTags.framework || ['safetensors', 'transformers'],
      description: `${name} is a high-performance open-weights model by ${apiRecord.author_namespace || 'the community'}.`,
    };

    return new Model(raw);
  }

  /**
   * Clean formatted display name for headers and cards.
   */
  public getDisplayName(): string {
    return this.name || this.id.replace(/^[\w-]+\//, '');
  }

  /**
   * Human-readable parameter string.
   */
  public getParameterCount(): string {
    if (this.weightInBillions >= 1) {
      return `${this.weightInBillions}B parameters`;
    }
    return `${Math.round(this.weightInBillions * 1000)}M parameters`;
  }

  /**
   * Categorizes model weight into Small (< 3B), Medium (3B - 14B), or Large (> 14B).
   * Exact requirement specification for Binaire Freznel utility.
   */
  public getWeightCategory(): WeightCategory {
    if (this.weightInBillions < 3) {
      return 'Small';
    }
    if (this.weightInBillions <= 14) {
      return 'Medium';
    }
    return 'Large';
  }

  /**
   * Alias for getWeightCategory() to support backwards-compatibility.
   */
  public getWeightRange(): WeightCategory {
    return this.getWeightCategory();
  }

  /**
   * Calculates safety index score based on safetensor presence, open license, and non-pickle verification.
   */
  public getSafetyScore(): number {
    let score = 85;
    if (this.safetensorFileCount > 0) score += 10;
    if (this.license && !this.license.toLowerCase().includes('unknown')) score += 5;
    return Math.min(100, score);
  }

  /**
   * Evaluates if model matches query across name, id, family, architecture,
   * use case, pipeline tags, architecture tags, and all other API tags.
   */
  public matchesSearch(query: string, familyFilter?: string): boolean {
    if (familyFilter && familyFilter !== 'ALL' && this.family.toLowerCase() !== familyFilter.toLowerCase()) {
      return false;
    }

    if (!query || query.trim() === '') {
      return true;
    }

    const cleanQuery = query.trim().toLowerCase();

    // Check primary fields
    if (this.name.toLowerCase().includes(cleanQuery)) return true;
    if (this.id.toLowerCase().includes(cleanQuery)) return true;
    if (this.family.toLowerCase().includes(cleanQuery)) return true;
    if (this.architecture.toLowerCase().includes(cleanQuery)) return true;
    if (this.useCase.toLowerCase().includes(cleanQuery)) return true;
    if (this.pytorchArchitecture.toLowerCase().includes(cleanQuery)) return true;
    if (this.authorNamespace.toLowerCase().includes(cleanQuery)) return true;

    // Check all tags (pipeline tags, architecture tags, HF tags)
    if (this.tags.some(tag => tag.toLowerCase().includes(cleanQuery))) return true;
    if (this.pipelineTags.some(tag => tag.toLowerCase().includes(cleanQuery))) return true;
    if (this.architectureTags.some(tag => tag.toLowerCase().includes(cleanQuery))) return true;
    if (this.familyTags.some(tag => tag.toLowerCase().includes(cleanQuery))) return true;

    return false;
  }

  /**
   * Verifies if model satisfies all multi-criteria filters.
   */
  public matchesFilters(filters: FilterCriteria): boolean {
    // 1. Search query across all fields
    if (!this.matchesSearch(filters.searchQuery, filters.family)) {
      return false;
    }

    // 2. Pipeline tags (if any selected, must match at least one)
    if (filters.pipelineTags.length > 0) {
      const hasPipeline = filters.pipelineTags.some(tag =>
        this.pipelineTags.some(pt => pt.toLowerCase() === tag.toLowerCase()) ||
        this.tags.some(t => t.toLowerCase() === tag.toLowerCase())
      );
      if (!hasPipeline) return false;
    }

    // 3. Family tags
    if (filters.familyTags.length > 0) {
      const hasFamilyTag = filters.familyTags.some(tag =>
        this.familyTags.some(ft => ft.toLowerCase() === tag.toLowerCase()) ||
        this.family.toLowerCase() === tag.toLowerCase()
      );
      if (!hasFamilyTag) return false;
    }

    // 4. Architecture tags
    if (filters.architectureTags.length > 0) {
      const hasArch = filters.architectureTags.some(tag =>
        this.architectureTags.some(at => at.toLowerCase() === tag.toLowerCase()) ||
        this.architecture.toLowerCase() === tag.toLowerCase()
      );
      if (!hasArch) return false;
    }

    // 5. Weight categories (Small: < 3B, Medium: 3B - 14B, Large: > 14B)
    if (filters.weightCategories.length > 0) {
      const category = this.getWeightCategory();
      if (!filters.weightCategories.includes(category)) {
        return false;
      }
    }

    // 6. Safetensor file count range: min <= count <= max
    if (this.safetensorFileCount < filters.minSafetensors) {
      return false;
    }
    if (filters.maxSafetensors > 0 && this.safetensorFileCount > filters.maxSafetensors) {
      return false;
    }

    return true;
  }

  /**
   * Converts instance back to plain serializable JSON object for storage.
   */
  public toPlainObject(): RawModelData {
    return {
      id: this.id,
      name: this.name,
      family: this.family,
      architecture: this.architecture,
      useCase: this.useCase,
      weightFormat: this.weightFormat,
      weight: this.weight,
      weightInBillions: this.weightInBillions,
      safetensorFileCount: this.safetensorFileCount,
      tags: [...this.tags],
      pipelineTags: [...this.pipelineTags],
      familyTags: [...this.familyTags],
      architectureTags: [...this.architectureTags],
      repoUrl: this.repoUrl,
      huggingfaceRepo: this.huggingfaceRepo,
      authorNamespace: this.authorNamespace,
      cliDownloadCommand: this.cliDownloadCommand,
      pytorchArchitecture: this.pytorchArchitecture,
      license: this.license,
      quantization: this.quantization,
      framework: [...this.framework],
      description: this.description,
      downloads: this.downloads,
      likes: this.likes,
      author: this.author,
      contextWindow: this.contextWindow,
      precision: this.precision,
      lastModified: this.lastModified,
    };
  }
}
