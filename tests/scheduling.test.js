import test from 'node:test';
import assert from 'node:assert/strict';
import { setTimeout as wait } from 'node:timers/promises';
import { Debouncer, Throttler, SearchScheduler } from '../src/utils/DebounceThrottle.js';
import { parseNextCursor } from '../src/api/ModelApiClient.js';
import { detectWeightTags, detectFamily, Model } from '../src/models/Model.js';

test('the debouncer collapses a burst into the final value', async () => {
  const seen = [];
  const debouncer = new Debouncer((value) => seen.push(value), 30);

  ['l', 'll', 'lla', 'llam', 'llama'].forEach((value) => debouncer.call(value));
  assert.deepEqual(seen, [], 'nothing may fire while the burst is still going');

  await wait(60);
  assert.deepEqual(seen, ['llama']);
});

test('flush delivers the pending call immediately', () => {
  const seen = [];
  const debouncer = new Debouncer((value) => seen.push(value), 1000);
  debouncer.call('qwen');
  assert.equal(debouncer.pending, true);
  debouncer.flush();
  assert.deepEqual(seen, ['qwen']);
  assert.equal(debouncer.pending, false);
});

test('the throttler fires on the leading edge and replays the trailing call', async () => {
  const seen = [];
  const throttler = new Throttler((value) => seen.push(value), 40);

  throttler.call('a');
  assert.deepEqual(seen, ['a'], 'leading edge fires at once');

  throttler.call('b');
  throttler.call('c');
  assert.deepEqual(seen, ['a'], 'calls inside the window are held');

  await wait(70);
  assert.deepEqual(seen, ['a', 'c'], 'only the newest held call is replayed');
});

test('the search scheduler never delivers the same query twice', async () => {
  const seen = [];
  const scheduler = new SearchScheduler((value) => seen.push(value), { debounce: 20, throttle: 30 });

  scheduler.schedule('lla');
  scheduler.schedule('llam');
  scheduler.schedule('llama');
  await wait(90);

  assert.deepEqual(seen, ['lla', 'llama'], 'throttle leading edge, then the settled value');
});

test('immediate bypasses both timers, even for an unchanged value', () => {
  const seen = [];
  const scheduler = new SearchScheduler((value) => seen.push(value), { debounce: 500, throttle: 500 });
  scheduler.immediate('llama');
  scheduler.immediate('llama');
  assert.deepEqual(seen, ['llama', 'llama']);
});

test('cursor pagination is read from the RFC-5988 Link header', () => {
  const header = '<https://huggingface.co/api/models?limit=100&cursor=abc123>; rel="next"';
  assert.equal(parseNextCursor(header), 'abc123');
  assert.equal(parseNextCursor(''), '');
  assert.equal(parseNextCursor('<https://x/y>; rel="prev"'), '');
});

test('normalization derives the facets the UI filters on', () => {
  const normalized = Model.fromApi({
    id: 'Qwen/Qwen2.5-7B-Instruct-GPTQ',
    tags: ['transformers', 'safetensors', 'qwen2', '4-bit', 'gptq'],
    pipeline_tag: 'text-generation',
    config: { model_type: 'qwen2', architectures: ['Qwen2ForCausalLM'] },
    siblings: [
      { rfilename: 'model-00001-of-00002.safetensors' },
      { rfilename: 'model-00002-of-00002.safetensors' },
      { rfilename: 'config.json' },
    ],
    safetensors: { total: 7_000_000_000 },
    downloads: 1234,
  });

  assert.equal(normalized.name, 'Qwen2.5-7B-Instruct-GPTQ');
  assert.equal(normalized.author, 'Qwen');
  assert.equal(normalized.family, 'qwen');
  assert.equal(normalized.architecture, 'Qwen2ForCausalLM');
  assert.equal(normalized.safetensorFiles, 2);
  assert.equal(normalized.fileCount, 3);
  assert.ok(normalized.weightTags.includes('safetensors'));
  assert.ok(normalized.weightTags.includes('4-bit'));
  assert.equal(Model.formatParameters(normalized.parameters), '7.0B');
});

test('weight tags fall back to "unknown" rather than an empty facet', () => {
  assert.deepEqual(detectWeightTags(['readme.md'], [], 'a/b'), ['unknown']);
});

test('family detection prefers the declared model type over the repo name', () => {
  assert.equal(detectFamily({ id: 'someone/my-model', modelType: 'mistral', tags: [] }), 'mistral');
  assert.equal(detectFamily({ id: 'someone/gemma-tune', modelType: '', tags: [] }), 'gemma');
  assert.equal(detectFamily({ id: 'someone/unknown-thing', modelType: '', tags: [] }), 'other');
});
