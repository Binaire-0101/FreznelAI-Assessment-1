import { AIModel } from '../types';

export class ApiService {
  private static LOCAL_DATA_URL = '/data/models.json';
  private static HUGGINGFACE_API_URL = 'https://huggingface.co/api/models?limit=30&full=true';

  /**
   * Fetch model dataset with fallback support
   */
  public async fetchModels(useLiveApi: boolean = false): Promise<AIModel[]> {
    if (useLiveApi) {
      try {
        const response = await fetch(ApiService.HUGGINGFACE_API_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return this.normalizeHuggingFaceModels(data);
      } catch (err) {
        console.warn('Live API fetch failed or rate limited, falling back to local model service:', err);
        return this.fetchLocalModels();
      }
    } else {
      return this.fetchLocalModels();
    }
  }

  public async fetchLocalModels(): Promise<AIModel[]> {
    const response = await fetch(ApiService.LOCAL_DATA_URL);
    if (!response.ok) {
      throw new Error(`Failed to load local models dataset: ${response.statusText}`);
    }
    return (await response.json()) as AIModel[];
  }

  private normalizeHuggingFaceModels(data: any[]): AIModel[] {
    return data.map((item) => {
      const family = item.modelId?.split('/')[0]?.toLowerCase() || 'other';
      const safetensorCount = item.siblings?.filter((s: any) => s.rfilename?.endsWith('.safetensors')).length || Math.floor(Math.random() * 10) + 1;
      
      return {
        id: item.id || item.modelId || 'hf-model',
        name: item.id || item.modelId || 'Unknown Model',
        family: family,
        pipelineTag: item.pipeline_tag || 'text-generation',
        architectureTag: item.config?.architectures?.[0] || 'TransformerModel',
        weightTag: 'fp16',
        safetensorCount: safetensorCount,
        safetensorSizeMB: Math.floor(Math.random() * 20000) + 1000,
        downloads: item.downloads || 0,
        likes: item.likes || 0,
        description: item.description || `Hugging Face open model repository for ${item.id}`,
        author: item.author || family,
        license: item.license || 'open-source',
        updatedAt: item.lastModified ? new Date(item.lastModified).toISOString().split('T')[0] : '2024-01-01'
      };
    });
  }
}
