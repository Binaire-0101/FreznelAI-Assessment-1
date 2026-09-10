import { describe, expect, it } from 'vitest';
import { ModelCatalog } from './ModelCatalog';
import type { Model, ModelQuery } from '../types/model';

const query: ModelQuery = {
  search: '', family: '', pipelineTags: [], familyTags: [], architectureTags: [], weightTags: [],
  minSafetensors: 0, maxSafetensors: 100, sort: 'name-asc',
};

const models: Model[] = [
  { id: 'org/zeta', displayName: 'Zeta', huggingFaceRepo: '', repoUrl: '', family: 'Alpha', authorNamespace: '', architectureCategory: 'Dense', useCase: 'Coding', pytorchArchitecture: '', weightFormat: 'BF16', safetensorFileCount: 20, hfTags: { pipeline_tag: 'coding', architecture: ['zeta'], all_tags: ['coding', 'zeta'] } },
  { id: 'org/alpha', displayName: 'Alpha', huggingFaceRepo: '', repoUrl: '', family: 'Beta', authorNamespace: '', architectureCategory: 'MoE', useCase: 'Text', pytorchArchitecture: '', weightFormat: 'FP16', safetensorFileCount: null, hfTags: { pipeline_tag: 'text-generation', architecture: ['alpha'], all_tags: ['text-generation', 'alpha'] } },
];

describe('ModelCatalog', () => {
  it('searches substrings and combines tag filters', () => {
    const catalog = new ModelCatalog(models);
    const result = catalog.query({ ...query, search: 'ETA', pipelineTags: ['coding'] });
    expect(result.map((model) => model.id)).toEqual(['org/zeta']);
  });

  it('sorts names in both directions and keeps unknown counts deterministic', () => {
    const catalog = new ModelCatalog(models);
    expect(catalog.query({ ...query, sort: 'name-asc' }).map((model) => model.displayName)).toEqual(['Alpha', 'Zeta']);
    expect(catalog.query({ ...query, sort: 'safetensors-asc' }).map((model) => model.displayName)).toEqual(['Zeta', 'Alpha']);
  });
});
