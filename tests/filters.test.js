import test from 'node:test';
import assert from 'node:assert/strict';
import { FilterPipeline } from '../src/filters/FilterPipeline.js';
import { Sorter } from '../src/sorting/Sorter.js';
import { Model } from '../src/models/Model.js';

const model = (id, { pipeline, family, safetensors = 1, files = [], tags = [] }) =>
  Model.fromApi({
    id,
    pipeline_tag: pipeline,
    tags,
    config: { model_type: family, architectures: [`${family}ForCausalLM`] },
    siblings: [
      ...Array.from({ length: safetensors }, (_, i) => ({ rfilename: `model-${i}.safetensors` })),
      ...files.map((name) => ({ rfilename: name })),
    ],
  });

const catalogue = [
  model('a/llama-big', { pipeline: 'text-generation', family: 'llama', safetensors: 8 }),
  model('b/llama-small', { pipeline: 'text-generation', family: 'llama', safetensors: 1 }),
  model('c/qwen-vision', { pipeline: 'image-text-to-text', family: 'qwen', safetensors: 4 }),
  model('d/whisper', {
    pipeline: 'automatic-speech-recognition',
    family: 'whisper',
    safetensors: 0,
    files: ['model.gguf'],
  }),
];

test('tag facets OR inside a facet and AND across facets', () => {
  const pipeline = new FilterPipeline();
  pipeline.calibrate(catalogue);

  pipeline.get('pipeline').toggle('text-generation');
  assert.equal(pipeline.apply(catalogue).length, 2);

  // Second value in the same facet widens the result (OR).
  pipeline.get('pipeline').toggle('image-text-to-text');
  assert.equal(pipeline.apply(catalogue).length, 3);

  // A different facet narrows it (AND).
  pipeline.get('family').toggle('qwen');
  const result = pipeline.apply(catalogue);
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 'c/qwen-vision');
});

test('weight tags come from the files that are actually present', () => {
  const pipeline = new FilterPipeline();
  pipeline.calibrate(catalogue);
  pipeline.get('weight').toggle('gguf');
  const result = pipeline.apply(catalogue);
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 'd/whisper');
});

test('the safetensor range calibrates to the catalogue and filters inclusively', () => {
  const pipeline = new FilterPipeline();
  pipeline.calibrate(catalogue);

  const range = pipeline.get('safetensors');
  assert.deepEqual(range.bounds, { min: 0, max: 8 });
  assert.equal(range.active, false, 'the full range must not count as a filter');

  range.set(1, 4);
  assert.equal(range.active, true);
  assert.deepEqual(
    pipeline.apply(catalogue).map((m) => m.id).sort(),
    ['b/llama-small', 'c/qwen-vision'],
  );
});

test('facet counts exclude the facet being counted but honour the others', () => {
  const pipeline = new FilterPipeline();
  pipeline.calibrate(catalogue);
  pipeline.get('family').toggle('llama');

  const counts = pipeline.facetCounts(catalogue);

  // The family facet still shows every family, so the user can switch choice.
  const families = counts.get('family').map((o) => o.value).sort();
  assert.deepEqual(families, ['llama', 'qwen', 'whisper']);

  // The pipeline facet is narrowed by the llama selection.
  const pipelines = counts.get('pipeline');
  assert.deepEqual(pipelines, [{ value: 'text-generation', count: 2, selected: false }]);
});

test('resetAll clears every facet', () => {
  const pipeline = new FilterPipeline();
  pipeline.calibrate(catalogue);
  pipeline.get('family').toggle('llama');
  pipeline.get('safetensors').set(2, 3);
  assert.equal(pipeline.activeCount, 2);

  pipeline.resetAll();
  assert.equal(pipeline.activeCount, 0);
  assert.equal(pipeline.apply(catalogue).length, catalogue.length);
});

test('sorting covers both axes in both directions and is stable', () => {
  const sorter = new Sorter();

  const azNames = sorter.sort(catalogue, 'name-asc').map((m) => m.name);
  assert.deepEqual(azNames, ['llama-big', 'llama-small', 'qwen-vision', 'whisper']);

  const zaNames = sorter.sort(catalogue, 'name-desc').map((m) => m.name);
  assert.deepEqual(zaNames, azNames.slice().reverse());

  const most = sorter.sort(catalogue, 'safetensors-desc').map((m) => m.safetensorFiles);
  assert.deepEqual(most, [8, 4, 1, 0]);

  const fewest = sorter.sort(catalogue, 'safetensors-asc').map((m) => m.safetensorFiles);
  assert.deepEqual(fewest, [0, 1, 4, 8]);
});

test('name sorting is numeric-aware, so 10B sorts after 9B', () => {
  const sorter = new Sorter();
  const versions = [
    model('x/Llama-9B', { pipeline: 'text-generation', family: 'llama' }),
    model('x/Llama-10B', { pipeline: 'text-generation', family: 'llama' }),
  ];
  assert.deepEqual(
    sorter.sort(versions, 'name-asc').map((m) => m.name),
    ['Llama-9B', 'Llama-10B'],
  );
});

test('sorting does not mutate the input array', () => {
  const sorter = new Sorter();
  const before = catalogue.map((m) => m.id);
  sorter.sort(catalogue, 'name-desc');
  assert.deepEqual(catalogue.map((m) => m.id), before);
});
