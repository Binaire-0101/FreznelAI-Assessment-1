import test from 'node:test';
import assert from 'node:assert/strict';
import { SearchEngine, SearchField, classifyMatch, highlightSegments } from '../src/search/SearchEngine.js';
import { Model } from '../src/models/Model.js';

const raw = (id, extra = {}) => {
  const modelType = extra.modelType || 'llama';
  return {
    id,
    tags: extra.tags || ['transformers', 'safetensors'],
    siblings: extra.siblings || [{ rfilename: 'model.safetensors' }],
    config: { model_type: modelType, architectures: [`${capitalize(modelType)}ForCausalLM`] },
    pipeline_tag: extra.pipeline || 'text-generation',
    downloads: extra.downloads || 0,
    likes: extra.likes || 0,
  };
};

const capitalize = (value) => value.charAt(0).toUpperCase() + value.slice(1);

const catalogue = [
  Model.fromApi(raw('meta-llama/Llama-3-8B')),
  Model.fromApi(raw('someone/my-llama-finetune')),
  Model.fromApi(raw('Qwen/Qwen2.5-7B', { modelType: 'qwen' })),
  Model.fromApi(raw('openai/whisper-large', { modelType: 'whisper', pipeline: 'automatic-speech-recognition' })),
];

test('classifyMatch grades where the match landed', () => {
  assert.equal(classifyMatch('llama', 'llama'), 'exact');
  assert.equal(classifyMatch('llama-3-8b', 'llama'), 'prefix');
  assert.equal(classifyMatch('my-llama-tune', 'llama'), 'boundary');
  assert.equal(classifyMatch('xxllamaxx', 'llama'), 'infix');
  assert.equal(classifyMatch('qwen', 'llama'), null);
});

test('search matches substrings from the start and the middle', () => {
  const engine = new SearchEngine(catalogue);
  const ids = engine.searchModels('llama').map((model) => model.id);
  assert.deepEqual(ids, ['meta-llama/Llama-3-8B', 'someone/my-llama-finetune']);

  // Mid-string only.
  assert.equal(engine.searchModels('isper')[0].id, 'openai/whisper-large');
});

test('prefix matches outrank mid-word matches', () => {
  const engine = new SearchEngine(catalogue);
  const results = engine.search('llama');
  assert.equal(results[0].model.id, 'meta-llama/Llama-3-8B');
  assert.ok(results[0].score > results[1].score);
});

test('the family scope ignores the model name', () => {
  const engine = new SearchEngine(catalogue);
  const byFamily = engine.searchModels('qwen', { field: SearchField.FAMILY });
  assert.equal(byFamily.length, 1);
  assert.equal(byFamily[0].family, 'qwen');

  // "whisper-large" matches by name but its family is `whisper` too, so scope
  // it to something that only exists in the name.
  assert.equal(engine.searchModels('large', { field: SearchField.FAMILY }).length, 0);
  assert.equal(engine.searchModels('large', { field: SearchField.NAME }).length, 1);
});

test('an empty query returns the whole catalogue', () => {
  const engine = new SearchEngine(catalogue);
  assert.equal(engine.searchModels('').length, catalogue.length);
  assert.equal(engine.searchModels('   ').length, catalogue.length);
});

test('highlightSegments marks every occurrence without losing text', () => {
  const segments = highlightSegments('my-llama-llama', 'llama');
  assert.equal(segments.map((s) => s.text).join(''), 'my-llama-llama');
  assert.equal(segments.filter((s) => s.hit).length, 2);
});
