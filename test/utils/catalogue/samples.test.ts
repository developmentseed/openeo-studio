jest.mock('$config/sample-scenes', () => ({
  SAMPLE_SCENES: [
    {
      id: 'rgb',
      name: 'Sunny Naples',
      description: 'True color',
      collectionId: 'sentinel-2-l2a',
      suggestedAlgorithm: 'print("rgb")',
      bands: ['b04'],
      temporalRange: ['2025-11-01', '2026-02-28'],
      thumbnail: 'rgb.png'
    },
    {
      id: 'lava',
      name: 'Lava flows',
      description: 'Etna',
      collectionId: 'sentinel-2-l2a',
      suggestedAlgorithm: 'print("lava")',
      bands: ['b12'],
      temporalRange: ['2025-01-01', '2025-01-31'],
      cloudCover: 30
    }
  ]
}));

import {
  sampleToEntry,
  samplesLoader,
  samplesSource
} from '$utils/catalogue/sources/samples';
import { NotFound } from '$utils/errors';

describe('samplesSource', () => {
  it('lists every sample in one page', async () => {
    const result = await samplesSource.listEntries({}, {});
    expect(result.items.map((e) => e.id)).toEqual(['rgb', 'lava']);
    expect(result.nextCursor).toBeUndefined();
  });

  it('filters by text', async () => {
    const result = await samplesSource.listEntries({ text: 'etna' }, {});
    expect(result.items.map((e) => e.id)).toEqual(['lava']);
  });

  it('maps a sample to an entry opened by the samples loader', async () => {
    const [rgb] = (await samplesSource.listEntries({}, {})).items;
    expect(rgb).toEqual({
      id: 'rgb',
      name: 'Sunny Naples',
      description: 'True color',
      thumbnail: 'rgb.png',
      collectionId: 'sentinel-2-l2a',
      bands: ['b04'],
      open: { loader: 'samples', ref: 'rgb' }
    });
  });
});

describe('samplesLoader', () => {
  it('loads a sample that auto-runs and has no project id', async () => {
    const result = await samplesLoader.load('lava', {});
    expect(result).toEqual({
      autoRun: true,
      seed: {
        name: 'Lava flows',
        collectionId: 'sentinel-2-l2a',
        temporalRange: ['2025-01-01', '2025-01-31'],
        cloudCover: 30,
        bands: ['b12'],
        boundingBox: undefined,
        suggestedAlgorithm: 'print("lava")'
      }
    });
  });

  it('defaults cloud cover to 100', async () => {
    const result = await samplesLoader.load('rgb', {});
    expect(result.seed.cloudCover).toBe(100);
  });

  it('rejects an unknown sample', async () => {
    await expect(samplesLoader.load('nope', {})).rejects.toBeInstanceOf(
      NotFound
    );
  });
});

describe('sampleToEntry', () => {
  it('matches what the source lists', async () => {
    const [rgb] = (await samplesSource.listEntries({}, {})).items;
    expect(
      sampleToEntry({
        id: 'rgb',
        name: 'Sunny Naples',
        description: 'True color',
        collectionId: 'sentinel-2-l2a',
        suggestedAlgorithm: '',
        bands: ['b04'],
        temporalRange: ['2025-11-01', '2026-02-28'],
        thumbnail: 'rgb.png'
      })
    ).toEqual(rgb);
  });
});
