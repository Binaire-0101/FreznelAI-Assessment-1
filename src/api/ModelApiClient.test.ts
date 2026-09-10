import { describe, expect, it } from 'vitest';
import { ModelApiClient } from './ModelApiClient';

describe('ModelApiClient', () => {
  it('normalizes API fields and preserves unknown safetensor counts', () => {
    const client = new ModelApiClient('https://example.test/models.json');
    const models = client.normalize({ models: [{
      id: 'org/alpha', display_name: 'Alpha', family: 'Alpha family',
      huggingface_repo: 'org/alpha', repo_url: 'https://huggingface.co/org/alpha',
      author_namespace: 'org', architecture_category: 'Dense', use_case: 'Coding',
      pytorch_architecture: 'AlphaForCausalLM', weight_format: 'BF16',
      safetensor_file_count: 'TBD', hf_tags: {
        pipeline_tag: 'coding', architecture: ['alpha'], all_tags: ['coding', 'alpha'],
      },
    }] });

    expect(models[0]).toMatchObject({ displayName: 'Alpha', safetensorFileCount: null });
    expect(models[0].hfTags.pipeline_tag).toBe('coding');
  });

  it('rejects malformed payloads before they reach the cache', () => {
    expect(() => new ModelApiClient().normalize({ items: [] })).toThrow('invalid response');
  });
});
